(function () {
  "use strict";
  var COOKIE = "_mfa";
  var TTL_DAYS = 90;
  var CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid", "fbclid"];
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  var SOCIAL_HOSTS = ["instagram.com", "l.instagram.com", "tiktok.com", "facebook.com", "l.facebook.com", "m.facebook.com", "t.co"];

  function readCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    if (!m) return null;
    try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) { return null; }
  }
  function writeCookie(name, obj, days) {
    var d = new Date(); d.setTime(d.getTime() + days * 864e5);
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(obj))
      + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax";
  }
  function referrerHost() {
    if (!document.referrer) return "";
    try { return new URL(document.referrer).hostname.toLowerCase(); } catch (e) { return ""; }
  }
  function hostMatchesSocial(host) {
    if (!host) return false;
    return SOCIAL_HOSTS.some(function (h) { return host === h || host.endsWith("." + h); });
  }

  function capture(searchStr, referrer, existing) {
    // Pure function for testability. Takes inputs, returns new blob.
    var params = new URLSearchParams(searchStr || "");
    var blob = existing ? Object.assign({}, existing) : {};

    CLICK_ID_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) blob[k] = v;
    });
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) blob[k] = v;
    });

    // Social-referrer fallback: only when all UTMs empty AND no gclid/fbclid
    var utmsEmpty = UTM_KEYS.every(function (k) { return !blob[k]; });
    var noPaidClickId = !blob.gclid && !blob.fbclid;
    if (utmsEmpty && noPaidClickId) {
      var host = "";
      try { host = referrer ? new URL(referrer).hostname.toLowerCase() : ""; } catch (e) {}
      if (hostMatchesSocial(host)) {
        blob.utm_source = "organic_social";
      }
    }
    return blob;
  }

  function populateForm(blob) {
    var form = document.getElementById("lead-form");
    if (!form) return;
    Object.keys(blob).forEach(function (k) {
      var input = form.querySelector('input[name="' + k + '"]');
      if (input) input.value = blob[k];
    });
    var pageUrlInput = form.querySelector('input[name="page_url"]');
    if (pageUrlInput) pageUrlInput.value = location.href;
    var pageVariantInput = form.querySelector('input[name="page_variant"]');
    if (pageVariantInput) pageVariantInput.value = window.__pageVariant || "lifestyle";
  }

  function init() {
    var existing = readCookie(COOKIE) || {};
    var blob = capture(location.search, document.referrer, existing);
    writeCookie(COOKIE, blob, TTL_DAYS);
    populateForm(blob);
    window.MartellAttribution = { get: function () { return blob; } };
  }

  // Export pure fn for tests (node) via export-when-module pattern
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { capture: capture, hostMatchesSocial: hostMatchesSocial };
  } else {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})();
