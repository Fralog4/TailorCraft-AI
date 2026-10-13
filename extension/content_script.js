// content_script.js - Injected into the React Frontend (http://localhost:5173)

(function () {
  // Execute on local frontend instances or any page with jd-input
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocalHost && !document.getElementById("jd-input")) {
    return;
  }
  console.log("[ATS Tailor Extension] Content script initialized on frontend app.");

  // Check for stored extracted JD
  chrome.storage.local.get(["extractedJD"], (result) => {
    const jdText = result?.extractedJD;
    if (!jdText) {
      console.log("[ATS Tailor Extension] No pending JD found in storage.");
      return;
    }

    console.log("[ATS Tailor Extension] Found extracted JD in storage (" + jdText.length + " chars). Waiting for #jd-input...");

    // Function to populate the textarea
    const injectText = (textarea) => {
      // Set value using native property descriptor to trigger React's synthetic event handlers
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;
      nativeTextAreaValueSetter.call(textarea, jdText);

      // Dispatch both input and change events
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));

      console.log("[ATS Tailor Extension] Successfully populated #jd-input with JD text!");

      // Clean up storage so subsequent page reloads don't overwrite user edits
      chrome.storage.local.remove(["extractedJD"], () => {
        console.log("[ATS Tailor Extension] Cleared extractedJD from storage.");
      });

      // Show temporary notification badge on page
      showNotificationBadge("Job Description imported from LinkedIn!");
    };

    // Try immediately
    const existingInput = document.getElementById("jd-input");
    if (existingInput) {
      injectText(existingInput);
      return;
    }

    // If not mounted yet, observe DOM for up to 10 seconds
    const maxWaitTime = 10000;
    const startTime = Date.now();

    const observer = new MutationObserver(() => {
      const input = document.getElementById("jd-input");
      if (input) {
        observer.disconnect();
        injectText(input);
      } else if (Date.now() - startTime > maxWaitTime) {
        observer.disconnect();
        console.warn("[ATS Tailor Extension] Timed out waiting for #jd-input element.");
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  });

  function showNotificationBadge(message) {
    const badge = document.createElement("div");
    badge.innerText = `✓ ${message}`;
    badge.style.position = "fixed";
    badge.style.bottom = "24px";
    badge.style.right = "24px";
    badge.style.backgroundColor = "#10b981";
    badge.style.color = "#ffffff";
    badge.style.padding = "12px 20px";
    badge.style.borderRadius = "8px";
    badge.style.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.2)";
    badge.style.fontFamily = "system-ui, -apple-system, sans-serif";
    badge.style.fontWeight = "600";
    badge.style.fontSize = "14px";
    badge.style.zIndex = "999999";
    badge.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    badge.style.opacity = "0";
    badge.style.transform = "translateY(10px)";

    document.body.appendChild(badge);

    requestAnimationFrame(() => {
      badge.style.opacity = "1";
      badge.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      badge.style.opacity = "0";
      badge.style.transform = "translateY(10px)";
      setTimeout(() => badge.remove(), 400);
    }, 4000);
  }
})();
