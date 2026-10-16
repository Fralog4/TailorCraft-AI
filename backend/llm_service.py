import json
import re
import asyncio
from typing import Optional
from models import TailoredCV

SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) resume optimizer and executive career coach.
Your mandate is to tailor the candidate's provided CV to match the target Job Description (JD) perfectly while maintaining 100% honesty.

STRICT CONSTRAINTS:
1. NO HALLUCINATIONS: Never invent skills, certifications, degrees, metrics or job experiences that the candidate does not possess. All claims must be authentically grounded in the original CV.
2. KEYWORD OPTIMIZATION: Identify critical keywords, competencies, and tools mentioned in the Job Description, and naturally infuse them into the candidate's existing achievements, summary, and skills.
3. GOOGLE XYZ IMPACT FORMULA: Format achievements using Google's XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]" (in Italian: "Raggiunto [X] misurato da [Y], realizzando [Z]"). Lead with strong past-tense action verbs (e.g., 'Architected', 'Spearheaded', 'Engineered', 'Optimized', 'Automated'). Connect candidate contributions directly to business impact, efficiency gains, and scalability.
4. ATS STRUCTURE: Output exclusively valid JSON matching the required schema. Ensure contact info is preserved cleanly (Email, Phone, LinkedIn, Location).
5. LANGUAGE CONSISTENCY: Ensure the output CV is written fluently in the language of the target Job Description or requested language (Italian or English).
"""

def extract_json_from_text(text: str) -> dict:
    """Extracts JSON object from response string, stripping code blocks if present."""
    text = text.strip()
    # Match markdown json fence
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except Exception:
        # Fallback: find first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end+1])
        raise ValueError(f"Could not parse valid JSON from LLM response: {text[:200]}...")


async def tailor_cv_with_llm(
    cv_raw_text: str,
    job_description: str,
    llm_provider: str,
    api_key: str,
    model_name: Optional[str] = None,
    language: str = "en"
) -> TailoredCV:
    """
    Coordinates LLM call according to user's selected provider and API key.
    """
    provider = (llm_provider or "gemini").lower().strip()
    target_lang_str = "Italian (Italiano)" if language.lower() in ["it", "italian", "italiano"] else "English"
    user_prompt = f"""Target Job Description:
{job_description}

Original Candidate CV:
{cv_raw_text}

TARGET LANGUAGE: {target_lang_str.upper()}
MANDATORY: Write ALL output content (Professional Summary, Experience bullet points, Skills, Job Titles where appropriate, Degree names) completely and fluently in {target_lang_str}.

Transform the CV above to maximize ATS relevance for the job description. Return JSON strictly matching the TailoredCV schema."""

    if provider == "gemini":
        return await _call_gemini(user_prompt, api_key, model_name)
    elif provider == "openai":
        return await _call_openai(user_prompt, api_key, model_name)
    elif provider == "anthropic":
        return await _call_anthropic(user_prompt, api_key, model_name)
    elif provider in ["groq", "openrouter"]:
        return await _call_openai_compatible(user_prompt, api_key, provider, model_name)
    else:
        # Default try gemini or openai
        return await _call_gemini(user_prompt, api_key, model_name)


async def _call_gemini(prompt: str, api_key: str, model_name: Optional[str]) -> TailoredCV:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    # 1. Discover valid models dynamically from user's API key
    discovered_models = []
    try:
        for model_item in client.models.list():
            actions = getattr(model_item, 'supported_actions', None) or []
            # Check for generateContent support
            if not actions or any("generateContent" in str(a) for a in actions):
                raw_id = model_item.name.replace("models/", "").strip()
                if "gemini" in raw_id.lower() and not any(x in raw_id.lower() for x in ["embedding", "imagen", "veo", "aqa", "bison"]):
                    discovered_models.append(raw_id)
        if discovered_models:
            print(f"[Gemini API] Available models on key: {discovered_models[:8]}", flush=True)
    except Exception as e:
        print(f"[Gemini API] Could not dynamically list models: {e}", flush=True)

    # 2. Build prioritized candidate list
    candidate_models = []
    if model_name and model_name.strip():
        req_model = model_name.strip().replace("models/", "")
        # Normalize deprecated or non-existent identifiers to verified gemini-3.8-flash
        if any(x in req_model.lower() for x in ["gemini-2.0", "gemini-1.5", "3.8-pro", "gemini-pro"]):
            req_model = "gemini-3.8-flash"
        if not discovered_models or req_model in discovered_models or req_model == "gemini-3.8-flash":
            candidate_models.append(req_model)

    preferred_defaults = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"]
    for p in preferred_defaults:
        if (not discovered_models or p in discovered_models) and p not in candidate_models:
            candidate_models.append(p)

    # If any discovered models remain, add them as last fallbacks
    for d in discovered_models:
        if d not in candidate_models and not any(x in d.lower() for x in ["3.8-pro", "embedding", "imagen"]):
            candidate_models.append(d)

    if not candidate_models:
        candidate_models = ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite"]

    print(f"[Gemini API] Final candidate models sequence: {candidate_models}", flush=True)

    last_error = None
    response = None

    for m in candidate_models:
        # Retry up to 3 times per model on 503 (high demand) or 429 (rate-limited)
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=TailoredCV,
                        temperature=0.2,
                    ),
                )
                if response and response.text:
                    print(f"[Gemini API] Successfully generated response using model: {m}", flush=True)
                    break
            except Exception as e:
                last_error = e
                err_str = str(e).lower()
                # If 404 (model not found / unsupported), don't retry, immediately advance to next candidate
                if any(x in err_str for x in ["404", "not found", "not supported for generatecontent"]):
                    print(f"[Gemini API] Candidate model '{m}' returned 404/Not Found. Moving to next candidate...", flush=True)
                    break
                # If 503 (service unavailable / high demand) or 429, wait briefly and retry
                if any(x in err_str for x in ["503", "unavailable", "high demand", "429", "resource_exhausted", "quota"]) and attempt < 2:
                    wait_time = (attempt + 1) * 2.0
                    print(f"[Gemini API] Model {m} busy/high demand. Retrying in {wait_time}s (attempt {attempt + 1}/3)...", flush=True)
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    break
        if response and response.text:
            break
        # If switching models due to 503 / 429, pause briefly to let Google free tier quota token bucket replenish
        if last_error and any(x in str(last_error).lower() for x in ["503", "unavailable", "high demand", "429"]):
            await asyncio.sleep(1.0)

    if not response or not response.text:
        err_msg = str(last_error) if last_error else "Empty response"
        if api_key and len(api_key) > 4:
            err_msg = err_msg.replace(api_key, "[REDACTED]")
        raise ValueError(f"Gemini API call failed with candidate models: {err_msg}")

    data = json.loads(response.text)
    return TailoredCV.model_validate(data)


async def _call_openai(prompt: str, api_key: str, model_name: Optional[str]) -> TailoredCV:
    from openai import OpenAI

    selected_model = model_name or "gpt-4o-mini"
    client = OpenAI(api_key=api_key)

    completion = client.beta.chat.completions.parse(
        model=selected_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        response_format=TailoredCV,
        temperature=0.2,
    )

    result = completion.choices[0].message.parsed
    if not result:
        raw_content = completion.choices[0].message.content or "{}"
        data = extract_json_from_text(raw_content)
        return TailoredCV.model_validate(data)

    return result


async def _call_anthropic(prompt: str, api_key: str, model_name: Optional[str]) -> TailoredCV:
    import anthropic

    selected_model = model_name or "claude-3-5-sonnet-20241022"
    client = anthropic.Anthropic(api_key=api_key)

    schema_instruction = (
        "\nYou must output ONLY valid JSON matching this schema:\n"
        + json.dumps(TailoredCV.model_json_schema(), indent=2)
    )

    message = client.messages.create(
        model=selected_model,
        max_tokens=4096,
        temperature=0.2,
        system=SYSTEM_PROMPT + schema_instruction,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    text_resp = message.content[0].text
    data = extract_json_from_text(text_resp)
    return TailoredCV.model_validate(data)


async def _call_openai_compatible(prompt: str, api_key: str, provider: str, model_name: Optional[str]) -> TailoredCV:
    from openai import OpenAI

    base_urls = {
        "groq": "https://api.groq.com/openai/v1",
        "openrouter": "https://openrouter.ai/api/v1",
    }
    default_models = {
        "groq": "llama-3.3-70b-versatile",
        "openrouter": "google/gemini-2.5-flash",
    }

    client = OpenAI(
        api_key=api_key,
        base_url=base_urls.get(provider, "https://api.groq.com/openai/v1")
    )

    schema_json = json.dumps(TailoredCV.model_json_schema())
    sys_content = f"{SYSTEM_PROMPT}\nYou must strictly respond with a valid JSON object matching this schema:\n{schema_json}"

    completion = client.chat.completions.create(
        model=model_name or default_models.get(provider, "llama-3.3-70b-versatile"),
        messages=[
            {"role": "system", "content": sys_content},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw_text = completion.choices[0].message.content or "{}"
    data = extract_json_from_text(raw_text)
    return TailoredCV.model_validate(data)


async def boost_cv_with_keywords(
    current_cv: TailoredCV,
    job_description: str,
    target_keywords: list[str],
    llm_provider: str,
    api_key: str,
    model_name: Optional[str] = None,
    language: str = "en"
) -> TailoredCV:
    """
    Reformulates the CV to organically weave in missing target keywords
    to boost the ATS match score, using Google XYZ formula.
    """
    provider = (llm_provider or "gemini").lower().strip()
    target_lang_str = "Italian (Italiano)" if language.lower() in ["it", "italian", "italiano"] else "English"
    keywords_list_str = ", ".join(f"'{k}'" for k in target_keywords if k.strip())

    user_prompt = f"""Target Job Description:
{job_description}

Current Candidate CV Data:
{current_cv.model_dump_json(indent=2)}

MISSING TARGET KEYWORDS TO INFUSE FOR HIGHER ATS MATCH SCORE:
[{keywords_list_str}]

TARGET LANGUAGE: {target_lang_str.upper()}

MANDATORY OPTIMIZATION INSTRUCTIONS:
1. Seamlessly infuse and integrate the MISSING TARGET KEYWORDS into the CV:
   - Add them to 'skills' where they represent key competencies, tools, frameworks or methodologies.
   - Weave them organically into 'professional_summary' and 'experiences' bullet points.
   - For experience bullet points, rewrite/augment achievements using Google's XYZ formula:
     "Accomplished [X] as measured by [Y], by doing [Z]" (or Italian equivalent) to demonstrate hands-on mastery of these keywords.
2. Authenticity Constraint: Maintain the candidate's authentic roles, companies, degrees and dates. Do not invent completely fake companies or degrees.
3. LANGUAGE: All output text must be written entirely and fluently in {target_lang_str}.
4. Return strictly valid JSON matching the TailoredCV schema."""

    if provider == "gemini":
        return await _call_gemini(user_prompt, api_key, model_name)
    elif provider == "openai":
        return await _call_openai(user_prompt, api_key, model_name)
    elif provider == "anthropic":
        return await _call_anthropic(user_prompt, api_key, model_name)
    elif provider in ["groq", "openrouter"]:
        return await _call_openai_compatible(user_prompt, api_key, provider, model_name)
    else:
        return await _call_gemini(user_prompt, api_key, model_name)

