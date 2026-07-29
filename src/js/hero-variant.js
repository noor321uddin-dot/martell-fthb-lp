(function () {
  "use strict";
  function init() {
    var v = new URLSearchParams(location.search).get("v");
    var showB = v === "search";
    var a = document.getElementById("hero-a");
    var b = document.getElementById("hero-b");
    if (a) a.hidden = showB;
    if (b) b.hidden = !showB;
    window.__pageVariant = showB ? "search" : "lifestyle";

    // iOS Low Power / autoplay-blocked play button
    var video = document.getElementById("hero-video");
    var btn = document.getElementById("hero-play-btn");
    if (!video || !btn) return;
    video.addEventListener("loadeddata", function () {
      if (video.paused) {
        btn.hidden = false;
        btn.addEventListener("click", function () {
          video.play().then(function () { btn.hidden = true; }).catch(function () {});
        });
      }
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  var emailConsent = document.getElementById("consent-email");
  var submit = document.getElementById("submit-btn");
  var phone = document.querySelector('input[name="phone"]');
  var smsWrap = document.getElementById("sms-consent-wrap");
  if (emailConsent && submit) {
    emailConsent.addEventListener("change", function () { submit.disabled = !emailConsent.checked; });
  }
  if (phone && smsWrap) {
    phone.addEventListener("input", function () { smsWrap.hidden = phone.value.trim().length === 0; });
  }
});
