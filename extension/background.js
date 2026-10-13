// background.js - Service Worker for ATS CV Tailor Extension

chrome.action.onClicked.addListener(async (tab) => {
  const isLinkedIn = tab.url && (tab.url.includes("linkedin.com/jobs") || tab.url.includes("linkedin.com"));
  const storedConfig = await chrome.storage.local.get(["customFrontendUrl"]);
  const FRONTEND_URL = storedConfig?.customFrontendUrl || "http://localhost:5173";

  if (!isLinkedIn) {
    // If user clicked while not on LinkedIn, just open or focus the frontend app
    await openOrFocusFrontend(FRONTEND_URL);
    return;
  }

  try {
    // Execute extractor script directly in active LinkedIn tab
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJobDescriptionFromDOM
    });

    const extractedText = result?.result;

    if (extractedText && extractedText.trim().length > 0) {
      // Save extracted text to local storage
      await chrome.storage.local.set({
        extractedJD: extractedText.trim(),
        extractedAt: new Date().toISOString()
      });
      console.log("[ATS Tailor] Successfully stored extracted JD, length:", extractedText.length);
    } else {
      console.warn("[ATS Tailor] No job description text found on this page.");
    }

    // Open or switch to the frontend app
    await openOrFocusFrontend(FRONTEND_URL);
  } catch (error) {
    console.error("[ATS Tailor] Error extracting job description:", error);
    // Still open frontend
    await openOrFocusFrontend(FRONTEND_URL);
  }
});

// Function executed in LinkedIn's tab context
async function extractJobDescriptionFromDOM() {
  // 1. Attempt to expand description ("Show more" / "Mostra altro" / "Visualizza altro")
  const expandButtons = document.querySelectorAll(
    'button.jobs-description__footer-button, ' +
    'button[data-tracking-control-name="public_jobs_show-more-html-btn"], ' +
    'button.inline-show-more-less__button, ' +
    'button.show-more-less-html__button, ' +
    'button[aria-label*="Show more" i], ' +
    'button[aria-label*="Mostra altro" i], ' +
    'button[aria-label*="Visualizza altro" i], ' +
    'button[aria-label*="Vedi altro" i], ' +
    '.jobs-description button.artdeco-button'
  );
  
  expandButtons.forEach(btn => {
    try { 
      btn.click(); 
    } catch (e) {}
  });

  // Wait briefly for LinkedIn DOM to finish async expansion and remove clip
  await new Promise(resolve => setTimeout(resolve, 350));

  // Force removal of clipping classes if still present
  document.querySelectorAll('.jobs-description__content--clipped').forEach(el => {
    el.classList.remove('jobs-description__content--clipped');
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
  });

  // 2. Locate right-side details container in split search view or fallback to document
  const detailsScope = document.querySelector(
    '.jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content, .job-details-module'
  ) || document;

  // Potential selectors specifically for the Job Description body (NOT the whole page/feed)
  const selectors = [
    '#job-details',
    '.jobs-description__content',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.show-more-less-html__markup',
    '.description__text',
    'article.jobs-description',
    'div.jobs-description'
  ];

  let container = null;
  for (const selector of selectors) {
    const el = detailsScope.querySelector(selector) || document.querySelector(selector);
    if (el && el.innerText && el.innerText.trim().length > 50) {
      container = el;
      break;
    }
  }

  // Heuristic fallback: search specifically for the heading "Informazioni sull'offerta di lavoro" or "About the job"
  if (!container) {
    const allHeadings = Array.from(detailsScope.querySelectorAll('h2, h3, h4, strong, span, p') || []);
    const jdHeaderEl = allHeadings.find(el => 
      /^(Informazioni sull['’]offerta di lavoro|About the job)$/i.test(el.innerText?.trim())
    );
    if (jdHeaderEl) {
      let parent = jdHeaderEl.parentElement;
      while (parent && parent !== document.body && parent.innerText.length < 200) {
        parent = parent.parentElement;
      }
      if (parent && parent !== document.body) {
        container = parent;
      }
    }
  }

  // 3. Extract Job Title and Company cleanly from the top card
  const titleEl = detailsScope.querySelector(
    '.job-details-jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__title-container h1, h1.t-24, .top-card-layout__title, h1.job-details-jobs-unified-top-card__job-title'
  ) || document.querySelector(
    '.job-details-jobs-unified-top-card__job-title, .top-card-layout__title'
  );

  const companyEl = detailsScope.querySelector(
    '.job-details-jobs-unified-top-card__company-name, .topcard__flavor, .jobs-unified-top-card__company-name'
  ) || document.querySelector(
    '.job-details-jobs-unified-top-card__company-name, .topcard__flavor'
  );

  let headerInfo = "";
  if (titleEl && titleEl.innerText) {
    const cleanTitle = titleEl.innerText.split('\n')[0].trim();
    if (cleanTitle) {
      headerInfo += `Job Title: ${cleanTitle}\n`;
    }
  }
  if (companyEl && companyEl.innerText) {
    const cleanCompany = companyEl.innerText.split('\n')[0].replace(/·.*$/, '').trim();
    if (cleanCompany) {
      headerInfo += `Company: ${cleanCompany}\n`;
    }
  }

  if (container) {
    let bodyText = container.innerText.trim();

    // 4. Multi-layer Boundary Sanitization:
    // Strip everything before "Informazioni sull'offerta di lavoro" / "About the job" if extra noise was captured
    const headerMatch = bodyText.match(/(?:Informazioni sull['’]offerta di lavoro|About the job)/i);
    if (headerMatch && headerMatch.index > 30) {
      bodyText = bodyText.slice(headerMatch.index + headerMatch[0].length).trim();
    } else {
      bodyText = bodyText.replace(/^(About the job|Informazioni sull'offerta di lavoro)\s*/i, "").trim();
    }

    // Strip everything after the job description (Company info, LinkedIn Premium, related jobs, report button)
    const endMatch = bodyText.match(
      /(?:Informazioni sull['’]azienda|About the company|Cerca lavoro in modo pi[uù] veloce con Premium|Vorresti lavorare con noi in futuro\?|Segnala quest['’]offerta|Report this job)/i
    );
    if (endMatch) {
      bodyText = bodyText.slice(0, endMatch.index).trim();
    }

    bodyText = bodyText
      .replace(/\s*(Show less|Mostra meno)[\s\S]*$/i, "")
      .replace(/…\s*altro\s*$/i, "")
      .trim();

    return headerInfo ? `${headerInfo}\n---\n\n${bodyText}` : bodyText;
  }

  return null;
}

// Helper to open or focus frontend tab
async function openOrFocusFrontend(url) {
  const tabs = await chrome.tabs.query({ url: "*://localhost:5173/*" });
  if (tabs && tabs.length > 0) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: url });
  }
}
