(function () {
  "use strict";
  window.dataLayer = window.dataLayer || [];

  function dispatch(name, data) {
    var evt = Object.assign({ event: name }, data || {});
    if (evt.page_variant === undefined) evt.page_variant = window.__pageVariant || "lifestyle";
    window.dataLayer.push(evt);
  }

  function leadSuccess(eventId, payload) {
    // GTM
    dispatch("generate_lead", { event_id: eventId });
    // Meta Pixel — single fire, dedupe via eventID
    if (window.fbq) {
      window.fbq("track", "Lead", {}, { eventID: eventId });
    }
  }

  // Bind data-track anchors + accordions
  function bindTrackers() {
    document.querySelectorAll("[data-track]").forEach(function (el) {
      var eventName = el.getAttribute("data-track");
      if (el.tagName === "DETAILS") {
        el.addEventListener("toggle", function () {
          if (el.open) dispatch(eventName, { faq_id: el.getAttribute("data-faq-id") });
        });
      } else {
        el.addEventListener("click", function () {
          var data = {};
          var community = el.getAttribute("data-community");
          if (community) data.community = community;
          dispatch(eventName, data);
        });
      }
    });
  }

  // Form-start (first field focus)
  function bindFormStart() {
    var form = document.getElementById("lead-form");
    if (!form) return;
    var fired = false;
    form.addEventListener("focusin", function () {
      if (fired) return;
      fired = true;
      dispatch("form_start");
    }, { once: false });
  }

  // Scroll depth 25/50/75/100
  function bindScrollDepth() {
    var thresholds = [25, 50, 75, 100];
    var fired = {};
    window.addEventListener("scroll", function () {
      var scrolled = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
      thresholds.forEach(function (t) {
        if (!fired[t] && scrolled >= t) {
          fired[t] = true;
          dispatch("scroll_depth", { depth: t });
        }
      });
    }, { passive: true });
  }

  // Hero video 50% played
  function bindVideoPlayed() {
    var v = document.getElementById("hero-video");
    if (!v) return;
    var fired = false;
    v.addEventListener("timeupdate", function () {
      if (!fired && v.duration && v.currentTime / v.duration >= 0.5) {
        fired = true;
        dispatch("hero_video_played");
      }
    });
  }

  function init() {
    bindTrackers();
    bindFormStart();
    bindScrollDepth();
    bindVideoPlayed();
    // Thank-you page emits lead_thankyou_view (internal only, NOT a Meta Lead)
    if (location.pathname.endsWith("/thank-you.html")) {
      dispatch("lead_thankyou_view");
    }
  }

  window.MartellTracking = { dispatch: dispatch, leadSuccess: leadSuccess };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
