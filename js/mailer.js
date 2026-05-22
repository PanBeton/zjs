/**
 * mailer.js — integracja z EmailJS dla formularza kontaktowego JZS Nieruchomości
 *
 * Konfiguracja:
 *   EMAILJS_PUBLIC_KEY  — klucz publiczny z zakładki "Account" w EmailJS
 *   EMAILJS_SERVICE_ID  — ID usługi e-mail (zakładka "Email Services")
 *   EMAILJS_TEMPLATE_ID — ID szablonu wiadomości (zakładka "Email Templates")
 *
 * Parametry szablonu EmailJS (użyj ich w treści szablonu jako {{...}}):
 *
 *   Dane kontaktowe (wszystkie wersje):
 *   {{from_name}}        — imię i nazwisko nadawcy
 *   {{from_phone}}       — numer telefonu nadawcy
 *   {{from_email}}       — adres e-mail nadawcy
 *   {{message}}          — dodatkowe informacje / opis
 *   {{send_time}}        — data i godzina wysłania
 *   {{reply_to}}         — adres e-mail (do odpowiedzi)
 *
 *   Dane nieruchomości (wersja1) są wbudowane w {{message}} jako sformatowany tekst:
 *     Adres: ...
 *     Metraż: ... m²
 *     Piętro: ...
 *     Balkon — Tak/Nie
 *     Garaż — Tak/Nie
 *     Piwnica — Tak/Nie
 *     (opcjonalnie) dodatkowy opis klienta
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

    /* Pola podstawowe — szukamy po atrybucie name, fallback na typ */
    var nameInput    = form.querySelector('[name="from_name"]')    || form.querySelector('input[type="text"]');
    var phoneInput   = form.querySelector('[name="from_phone"]')   || form.querySelector('input[type="tel"]');
    var emailInput   = form.querySelector('[name="from_email"]')   || form.querySelector('input[type="email"]');
    var messageInput = form.querySelector('[name="message"]')      || form.querySelector('textarea');
    var submitBtn    = form.querySelector("button[type='submit'], button:not([type]), button[type='button']");

    /* Pola nieruchomości (wersja1 — opcjonalne) */
    var addressInput = form.querySelector('[name="property_address"]');
    var areaInput    = form.querySelector('[name="property_area"]');
    var floorInput   = form.querySelector('[name="property_floor"]');
    var balkonInput  = form.querySelector('[name="balkon"]');
    var garazInput   = form.querySelector('[name="garaz"]');
    var piwnicaInput = form.querySelector('[name="piwnica"]');

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

      /* Zbuduj treść wiadomości — dane kontaktowe + nieruchomości + opis */
      var propertyLines = [];

      /* Dane kontaktowe zawsze na górze */
      propertyLines.push("── Dane kontaktowe ──");
      propertyLines.push("Imię i Nazwisko: " + (name  || "—"));
      propertyLines.push("Telefon: "         + (phone || "—"));
      propertyLines.push("E-mail: "          + (email || "—"));

      /* Dane nieruchomości (wersja1) */
      if (addressInput || areaInput || floorInput || balkonInput || garazInput || piwnicaInput) {
        propertyLines.push("");
        propertyLines.push("── Dane nieruchomości ──");
        if (addressInput) propertyLines.push("Adres: "   + (addressInput.value.trim() || "—"));
        if (areaInput)    propertyLines.push("Metraż: "  + (areaInput.value.trim()    || "—") + " m²");
        if (floorInput)   propertyLines.push("Piętro: "  + (floorInput.value.trim()   || "—"));
        if (balkonInput)  propertyLines.push("Balkon — " + (balkonInput.checked  ? "Tak" : "Nie"));
        if (garazInput)   propertyLines.push("Garaż — "  + (garazInput.checked   ? "Tak" : "Nie"));
        if (piwnicaInput) propertyLines.push("Piwnica — "+ (piwnicaInput.checked ? "Tak" : "Nie"));
      }
      if (message) { propertyLines.push(""); propertyLines.push(message); }

      var now = new Date();
      var templateParams = {
        from_name:  name,
        from_phone: phone,
        from_email: email,
        message:    propertyLines.length ? propertyLines.join("\n") : "Brak opisu.",
        send_time:  now.toLocaleString("pl-PL"),
        reply_to:   email,
      };

      window.emailjs
        .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function () {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          if (nameInput)    nameInput.value    = "";
          if (phoneInput)   phoneInput.value   = "";
          if (emailInput)   emailInput.value   = "";
          if (messageInput) messageInput.value = "";
          if (addressInput) addressInput.value = "";
          if (areaInput)    areaInput.value    = "";
          if (floorInput)   floorInput.value   = "";
          if (balkonInput)  balkonInput.checked  = false;
          if (garazInput)   garazInput.checked   = false;
          if (piwnicaInput) piwnicaInput.checked = false;
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
