(function () {
  "use strict";
  var WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/ZxT1vLFYvKhS8heC1yPX/webhook-trigger/edf11371-b408-47e7-b37e-08973a9c68ea";
  var FALLBACK_EMAIL = "pierre@themartellexperience.com";
  var THANK_YOU_URL = "/thank-you.html";

  function uuidv4() {
    // RFC 4122 v4, crypto-strong when available
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    // Fallback
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function collectPayload(form) {
    var fd = new FormData(form);
    var obj = {};
    fd.forEach(function (v, k) { obj[k] = v; });
    // Coerce booleans
    obj.email_consent = form.querySelector('input[name="email_consent"]').checked;
    obj.sms_consent = form.querySelector('input[name="sms_consent"]') && form.querySelector('input[name="sms_consent"]').checked || false;
    obj.test_lead = obj.test_lead === "true";
    return obj;
  }

  function postJson(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  }

  function fallbackMailto(payload) {
    var body = "Lead POST to webhook failed. Payload:%0D%0A%0D%0A" + encodeURIComponent(JSON.stringify(payload, null, 2));
    window.location.href = "mailto:" + FALLBACK_EMAIL + "?subject=FTHB%20LP%20lead%20(webhook%20fallback)&body=" + body;
  }

  function showError(msg) {
    var el = document.getElementById("form-error");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function setSubmitting(btn, submitting) {
    if (submitting) {
      btn.dataset.originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalLabel || "Start my custom home";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var btn = document.getElementById("submit-btn");

    // Honeypot check
    var honey = form.querySelector('input[name="website_url"]');
    if (honey && honey.value.trim().length > 0) return; // silent reject

    // Ensure Turnstile token present
    var tokenInput = form.querySelector('input[name="turnstile_token"]');
    if (!tokenInput || !tokenInput.value) {
      showError("Please complete the security check and try again.");
      return;
    }

    // Assign event_id
    var eventIdInput = form.querySelector('input[name="event_id"]');
    var eventId = uuidv4();
    eventIdInput.value = eventId;

    var payload = collectPayload(form);
    setSubmitting(btn, true);

    var res;
    try {
      res = await postJson(WEBHOOK_URL, payload);
      if (!res.ok) throw new Error("non-2xx: " + res.status);
    } catch (err1) {
      // Retry once
      try {
        await new Promise(function (r) { setTimeout(r, 800); });
        res = await postJson(WEBHOOK_URL, payload);
        if (!res.ok) throw new Error("retry non-2xx: " + res.status);
      } catch (err2) {
        if (window.MartellTracking) window.MartellTracking.dispatch("form_submit_error", { reason: String(err2) });
        setSubmitting(btn, false);
        showError("Something went wrong. Call us at (506) 871-5237 or try again.");
        fallbackMailto(payload);
        return;
      }
    }

    // Success — fire tracking, redirect
    if (window.MartellTracking) window.MartellTracking.leadSuccess(eventId, payload);
    window.location.href = THANK_YOU_URL;
  }

  function init() {
    var form = document.getElementById("lead-form");
    if (!form) return;

    var emailConsent = document.getElementById("consent-email");
    var submit = document.getElementById("submit-btn");
    var phone = form.querySelector('input[name="phone"]');
    var smsWrap = document.getElementById("sms-consent-wrap");
    if (emailConsent && submit) {
      emailConsent.addEventListener("change", function () { submit.disabled = !emailConsent.checked; });
    }
    if (phone && smsWrap) {
      phone.addEventListener("input", function () { smsWrap.hidden = phone.value.trim().length === 0; });
    }

    form.addEventListener("submit", handleSubmit);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { uuidv4: uuidv4, collectPayload: collectPayload };
  } else {
    window.MartellForm = { uuidv4: uuidv4 };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
