// content_script.js - Injected into the React Frontend (http://localhost:5173)

(function () {
  // Execute on local frontend instances or any page with jd-input
  const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (!isLocalHost && !document.getElementById("jd-input")) {
    return;
  }
  console.log("[ATS Tailor Extension] Content script initialized on frontend app.");

  // Function to populate the textarea
  function injectText(jdText) {
    if (!jdText || typeof jdText !== "string" || !jdText.trim()) return;

    const doInject = (textarea) => {
      // Use native property descriptor so React synthetic events detect the change
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      ).set;
      nativeTextAreaValueSetter.call(textarea, jdText.trim());

      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      textarea.dispatchEvent(new Event("change", { bubbles: true }));

      console.log("[ATS Tailor Extension] Successfully populated #jd-input with JD text (" + jdText.length + " chars)!");

      // Clean up storage so subsequent page reloads don't overwrite user edits
      chrome.storage.local.remove(["extractedJD"], () => {
        console.log("[ATS Tailor Extension] Cleared extractedJD from storage.");
      });

      // Show temporary notification badge on page
      showNotificationBadge("Job Description importata da LinkedIn!");
    };

    const existingInput = document.getElementById("jd-input");
    if (existingInput) {
      doInject(existingInput);
      return;
    }

    // If textarea not mounted yet, observe DOM for up to 10 seconds
    const maxWaitTime = 10000;
    const startTime = Date.now();

    const observer = new MutationObserver(() => {
      const input = document.getElementById("jd-input");
      if (input) {
        observer.disconnect();
        doInject(input);
      } else if (Date.now() - startTime > maxWaitTime) {
        observer.disconnect();
        console.warn("[ATS Tailor Extension] Timed out waiting for #jd-input element.");
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function checkStorageAndInject() {
    chrome.storage.local.get(["extractedJD"], (result) => {
      const jdText = result?.extractedJD;
      if (jdText && jdText.trim().length > 0) {
        console.log("[ATS Tailor Extension] Found extracted JD in storage (" + jdText.length + " chars).");
        injectText(jdText);
      }
    });
  }

  // 1. Initial check on script load
  checkStorageAndInject();

  // 2. Listen to storage changes (triggered immediately when background.js sets extractedJD)
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.extractedJD && changes.extractedJD.newValue) {
      console.log("[ATS Tailor Extension] Detected storage change with new JD!");
      injectText(changes.extractedJD.newValue);
    }
  });

  // 3. Listen to direct runtime messages from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === "INJECT_JD" && message.text) {
      console.log("[ATS Tailor Extension] Received direct INJECT_JD message!");
      injectText(message.text);
      sendResponse({ status: "success" });
    }
  });

  // 4. Re-check storage when tab is focused or becomes visible
  window.addEventListener("focus", checkStorageAndInject);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkStorageAndInject();
    }
  });

  function showNotificationBadge(message) {
    const existing = document.getElementById("__ats_notif_badge__");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "__ats_notif_badge__";
    badge.innerText = `✓ ${message}`;
    badge.style.position = "fixed";
    badge.style.bottom = "24px";
    badge.style.right = "24px";
    badge.style.backgroundColor = "#10b981";
    badge.style.color = "#ffffff";
    badge.style.padding = "14px 22px";
    badge.style.borderRadius = "10px";
    badge.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
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
