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
      console.log("[ATS Tailor] Stored extracted JD, length:", extractedText.length);

      // Open or switch to the frontend app and inject text
      await openOrFocusFrontend(FRONTEND_URL, extractedText.trim());
    } else {
      console.warn("[ATS Tailor] No job description text found on this page.");
      await openOrFocusFrontend(FRONTEND_URL);
    }
  } catch (error) {
    console.error("[ATS Tailor] Error extracting job description:", error);
    await openOrFocusFrontend(FRONTEND_URL);
  }
});

// Function executed in LinkedIn's tab context
async function extractJobDescriptionFromDOM() {
  function showTabBanner(message, isError = false) {
    try {
      const bannerId = '__tailorcraft_banner__';
      let banner = document.getElementById(bannerId);
      if (!banner) {
        banner = document.createElement('div');
        banner.id = bannerId;
        banner.style.position = 'fixed';
        banner.style.top = '24px';
        banner.style.right = '24px';
        banner.style.zIndex = '99999999';
        banner.style.padding = '14px 22px';
        banner.style.borderRadius = '10px';
        banner.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = '600';
        banner.style.boxShadow = '0 12px 30px rgba(0,0,0,0.35)';
        banner.style.transition = 'all 0.3s ease';
        banner.style.maxWidth = '380px';
        banner.style.lineHeight = '1.4';
        banner.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        document.body.appendChild(banner);
      }
      banner.style.backgroundColor = isError ? '#dc2626' : '#059669';
      banner.style.color = '#ffffff';
      banner.innerText = message;
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';

      setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-10px)';
        setTimeout(() => banner.remove(), 400);
      }, 3500);
    } catch (e) {}
  }

  // 1. Extract Job Title cleanly
  const titleSelectors = [
    'h1.top-card-layout__title',
    'h1.topcard__title',
    'h1.job-details-jobs-unified-top-card__job-title',
    '.job-details-jobs-unified-top-card__title-container h1',
    'h1.jobs-unified-top-card__job-title',
    'h1.t-24',
    'h2.top-card-layout__title',
    '.top-card-layout__entity-info h1',
    'h1[class*="job-title"]'
  ];

  let titleText = "";
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim()) {
      titleText = el.innerText.split('\n')[0].trim();
      if (titleText) break;
    }
  }

  // 2. Extract Company Name cleanly
  const companySelectors = [
    'a.topcard__org-name-link',
    '.top-card-layout__company-info a',
    '.top-card-layout__first-subline a',
    '.job-details-jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__company-name',
    '.topcard__flavor',
    '[data-tracking-control-name="public_jobs_topcard-org-name"]',
    'a[href*="/company/"]'
  ];

  let companyText = "";
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText && el.innerText.trim()) {
      companyText = el.innerText.split('\n')[0].replace(/·.*$/, '').trim();
      if (companyText) break;
    }
  }

  let descriptionText = "";

  // Strategy A: Parse schema.org JSON-LD (Standard on LinkedIn job postings)
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      const content = script.innerText?.trim();
      if (!content) continue;
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
      for (const item of items) {
        if (item && (item['@type'] === 'JobPosting' || item.description)) {
          if (!titleText && item.title) titleText = item.title;
          if (!companyText && item.hiringOrganization?.name) companyText = item.hiringOrganization.name;
          if (item.description && item.description.length > 50) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = item.description;
            descriptionText = tempDiv.innerText || tempDiv.textContent || "";
            if (descriptionText.trim().length > 50) {
              console.log("[ATS Tailor] Extracted JD from JSON-LD schema.");
              break;
            }
          }
        }
      }
      if (descriptionText && descriptionText.trim().length > 50) break;
    }
  } catch (e) {
    console.warn("[ATS Tailor] JSON-LD parse error:", e);
  }

  // Strategy B: DOM Extraction if JSON-LD was empty
  if (!descriptionText || descriptionText.trim().length < 50) {
    // Attempt expansion of clipped content ("Show more" / "Mostra altro")
    const expandButtons = document.querySelectorAll(
      'button.jobs-description__footer-button, ' +
      'button[data-tracking-control-name="public_jobs_show-more-html-btn"], ' +
      'button.inline-show-more-less__button, ' +
      'button.show-more-less-html__button, ' +
      'button.show-more-less-button, ' +
      'button[aria-label*="Show more" i], ' +
      'button[aria-label*="Mostra altro" i], ' +
      'button[aria-label*="Visualizza altro" i], ' +
      'button[aria-label*="Vedi altro" i], ' +
      '.jobs-description button.artdeco-button, ' +
      'button[data-control-name="jobdetails_show_more"]'
    );

    expandButtons.forEach(btn => {
      try { btn.click(); } catch (e) {}
    });

    // Wait briefly for DOM to unclamp
    await new Promise(resolve => setTimeout(resolve, 350));

    // Force removal of clipping classes and CSS styles
    document.querySelectorAll(
      '.jobs-description__content--clipped, .show-more-less-html__markup--clamp-after-5, .show-more-less-html--less'
    ).forEach(el => {
      el.classList.remove('jobs-description__content--clipped');
      el.classList.remove('show-more-less-html__markup--clamp-after-5');
      el.classList.remove('show-more-less-html--less');
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
      el.style.webkitLineClamp = 'unset';
    });

    const detailsScope = document.querySelector(
      '.jobs-search__job-details--container, .job-view-layout, .jobs-details__main-content, .job-details-module, .decoratedJobPosting, main'
    ) || document;

    const selectors = [
      'div.show-more-less-html__markup',
      '#job-details',
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      'section.show-more-less-html',
      '.description__text',
      'article.jobs-description',
      'div.jobs-description',
      '.core-section-container__content',
      'div[class*="jobs-description"]',
      'div[class*="job-details"]'
    ];

    let container = null;
    for (const selector of selectors) {
      const el = detailsScope.querySelector(selector) || document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 50) {
        container = el;
        break;
      }
    }

    if (!container) {
      const allHeadings = Array.from(detailsScope.querySelectorAll('h2, h3, h4, strong, span, p') || []);
      const jdHeaderEl = allHeadings.find(el => 
        /^(Informazioni sull['’]offerta di lavoro|Informazioni sulla posizione|Descrizione del lavoro|Descrizione della posizione|About the job|About the role|Job description)$/i.test(el.innerText?.trim())
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

    if (container) {
      descriptionText = container.innerText.trim();
    }
  }

  // 3. Multi-layer Boundary Sanitization
  if (descriptionText && descriptionText.trim().length > 30) {
    let bodyText = descriptionText.trim();

    // Strip redundant leading heading text
    const headerMatch = bodyText.match(
      /(?:Informazioni sull['’]offerta di lavoro|Informazioni sulla posizione|Descrizione della posizione|Descrizione del lavoro|About the job|About the role|Job description)\s*/i
    );
    if (headerMatch && headerMatch.index <= 60) {
      bodyText = bodyText.slice(headerMatch.index + headerMatch[0].length).trim();
    }

    // Strip trailing platform noise
    const endMatch = bodyText.match(
      /(?:Informazioni sull['’]azienda|About the company|Cerca lavoro in modo pi[uù] veloce con Premium|Vorresti lavorare con noi in futuro\?|Segnala quest['’]offerta|Report this job|Visualizza altro)/i
    );
    if (endMatch) {
      bodyText = bodyText.slice(0, endMatch.index).trim();
    }

    bodyText = bodyText
      .replace(/\s*(Show less|Mostra meno)[\s\S]*$/i, "")
      .replace(/…\s*altro\s*$/i, "")
      .trim();

    let headerInfo = "";
    if (titleText) headerInfo += `Job Title: ${titleText}\n`;
    if (companyText) headerInfo += `Company: ${companyText}\n`;

    const finalText = headerInfo ? `${headerInfo}---\n\n${bodyText}` : bodyText;

    showTabBanner("✓ Job Description catturata! Reindirizzamento...", false);
    return finalText;
  }

  showTabBanner("⚠️ Nessuna descrizione trovata su questa pagina.", true);
  return null;
}

// Helper to open or focus frontend tab and notify it
async function openOrFocusFrontend(url, extractedText = null) {
  try {
    const tabs = await chrome.tabs.query({});
    const frontendTab = tabs.find(t => 
      t.url && (
        t.url.includes("localhost:5173") || 
        t.url.includes("127.0.0.1:5173") || 
        t.url.includes("localhost:3000") || 
        t.url.includes("127.0.0.1:3000")
      )
    );

    if (frontendTab) {
      await chrome.tabs.update(frontendTab.id, { active: true });
      if (frontendTab.windowId) {
        await chrome.windows.update(frontendTab.windowId, { focused: true });
      }

      if (extractedText) {
        try {
          await chrome.tabs.sendMessage(frontendTab.id, {
            type: "INJECT_JD",
            text: extractedText
          });
        } catch (e) {
          // Tab may not have listener attached yet, storage will handle it
          console.log("[ATS Tailor] tabs.sendMessage fallback to storage:", e);
        }
      }
    } else {
      await chrome.tabs.create({ url: url });
    }
  } catch (err) {
    console.error("[ATS Tailor] openOrFocusFrontend error:", err);
  }
}
