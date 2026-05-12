/**
 * mailer.js — integracja z EmailJS dla formularza kontaktowego JZS Nieruchomości
 *
 * Konfiguracja:
 *   EMAILJS_PUBLIC_KEY  — klucz publiczny z zakładki "Account" w EmailJS
 *   EMAILJS_SERVICE_ID  — ID usługi e-mail (zakładka "Email Services")
 *   EMAILJS_TEMPLATE_ID — ID szablonu wiadomości (zakładka "Email Templates")
 *
 * Parametry szablonu EmailJS (użyj ich w treści szablonu jako {{...}}):
 *   {{from_name}}   — imię i nazwisko nadawcy
 *   {{from_phone}}  — numer telefonu nadawcy
 *   {{email}}       — adres e-mail nadawcy
 *   {{message}}     — treść wiadomości
 *   {{reply_to}}    — adres e-mail nadawcy (do odpowiedzi)
 */

(function () {
  "use strict";

  /* ── Konfiguracja ─────────────────────────────────────────────────── */
  var EMAILJS_PUBLIC_KEY  = "uy6SDlhVlaRPl1vDg";   // ← wpisz swój klucz
  var EMAILJS_SERVICE_ID  = "service_06fl2ll";        // ← wpisz ID usługi
  var EMAILJS_TEMPLATE_ID = "template_gl8mwcq";       // ← wpisz ID szablonu

  /* ── Wstrzyknięcie SDK EmailJS (jeśli jeszcze nie załadowany) ────── */
  function loadEmailJS(callback) {
    if (window.emailjs) {
      callback();
      return;
    }
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = callback;
    document.head.appendChild(script);
  }

  /* ── Pomocnicze: komunikat zwrotny ──────────────────────────────── */
  function showFeedback(btn, type, text) {
    var existing = btn.parentElement.querySelector(".mailer-feedback");
    if (existing) existing.remove();

    var msg = document.createElement("p");
    msg.className = "mailer-feedback";
    msg.textContent = text;
    msg.style.cssText =
      "margin-top:12px;font-size:13px;font-weight:700;text-align:center;letter-spacing:0.05em;" +
      (type === "success" ? "color:#5B7051;" : "color:#c0392b;");

    btn.parentElement.insertBefore(msg, btn.nextSibling);

    if (type === "success") {
      setTimeout(function () {
        if (msg.parentElement) msg.remove();
      }, 6000);
    }
  }

  /* ── Inicjalizacja formularza ────────────────────────────────────── */
  function initForm() {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

    /* Szukamy formularza w sekcji #kontakt (wspólne dla wszystkich wersji) */
    var section = document.getElementById("kontakt");
    if (!section) return;

    var form = section.querySelector("form");
    if (!form) return;

    /* Pobieramy pola przez typ/tag (brak id/name w HTML) */
    var nameInput    = form.querySelector('input[type="text"]');
    var phoneInput   = form.querySelector('input[type="tel"]');
    var emailInput   = form.querySelector('input[type="email"]');
    var messageInput = form.querySelector("textarea");
    var submitBtn    = form.querySelector("button[type='submit'], button:not([type]), button[type='button']");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name    = nameInput    ? nameInput.value.trim()    : "";
      var phone   = phoneInput   ? phoneInput.value.trim()   : "";
      var email   = emailInput   ? emailInput.value.trim()   : "";
      var message = messageInput ? messageInput.value.trim() : "";

      /* Prosta walidacja */
      if (!name || !phone || !email) {
        showFeedback(submitBtn, "error", "Proszę wypełnić imię, numer telefonu i adres e-mail.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFeedback(submitBtn, "error", "Podaj poprawny adres e-mail.");
        return;
      }

      /* Stan ładowania */
      var originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = "WYSYŁANIE…";

      var now = new Date();
      var templateParams = {
        name:     name,
        phone:    phone,
        email:    email,
        message:  message || "Brak opisu.",
        time:     now.toLocaleString("pl-PL"),
        reply_to: email,
      };

      window.emailjs
        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function () {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          if (nameInput)    nameInput.value    = "";
          if (phoneInput)   phoneInput.value   = "";
          if (messageInput) messageInput.value = "";
          showFeedback(submitBtn, "success", "Wiadomość wysłana! Skontaktujemy się wkrótce.");
        })
        .catch(function (err) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          console.error("EmailJS error:", err);
          showFeedback(submitBtn, "error", "Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.");
        });
    });
  }

  /* ── Start ───────────────────────────────────────────────────────── */
  loadEmailJS(function () {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initForm);
    } else {
      initForm();
    }
  });
})();
