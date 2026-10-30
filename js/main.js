/**
 * ========================================================
 * Hunor Madaras - CV & Portfolio Modern Interactive Script
 * Features:
 *  - Theme Toggle (Dark / Light Mode) with LocalStorage
 *  - Contact Form via Google Apps Script (Dual Email + Invisible Captcha)
 *  - IntersectionObserver Animated Skill Progress Bars
 *  - Interactive Portfolio Category Filter
 *  - Modern Keyboard-Accessible Lightbox Modal
 *  - Quick Copy to Clipboard for Contact Details
 *  - Smooth Scroll-to-Top with Scroll Listener
 *  - Custom Analytics Event Tracker
 * ========================================================
 */

(function () {
  'use strict';

  /* ====================================================
     FONTOS: Ide illeszd be a Google Apps Script Web App URL-edet!
     (Pl.: 'https://script.google.com/macros/s/AKfycb.../exec')
     Lásd: js/google_apps_script.gs
  ==================================================== */
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwXMgNjZbiQ8_RiDj5etrdG7y6TMLBjLh0aWqKukJ0MlC8KKH83HyIKX-nU5_SXwrPFw/exec';

  /* ----------------------------------------------------
     1. Analytics Event Tracking Helper
  ---------------------------------------------------- */
  window.trackEvent = function (eventName, eventParams = {}) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, eventParams);
      }
      console.log(`[CV Analytics] Event: ${eventName}`, eventParams);
    } catch (e) {
      console.warn('Analytics tracking error:', e);
    }
  };

  /* ----------------------------------------------------
     2. Theme Toggle (Dark / Light Mode)
  ---------------------------------------------------- */
  const THEME_KEY = 'hunor_cv_theme';

  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', function () {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        window.trackEvent('theme_change', { theme: newTheme });
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('.icon');
      const text = toggleBtn.querySelector('.theme-text');
      if (theme === 'dark') {
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Világos mód';
      } else {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Sötét mód';
      }
    }
  }

  /* ----------------------------------------------------
     3. Invisible Captcha & Contact Form Handling (Google Apps Script)
  ---------------------------------------------------- */
  let formInitTime = Date.now();
  let userInteracted = false;

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const statusMsg = document.getElementById('form-status-msg');

    // Detect human interaction for invisible anti-bot verification
    ['mousemove', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => {
        userInteracted = true;
      }, { once: true, passive: true });
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = form.querySelector('.submit_btn');
      const honeypot = form.querySelector('input[name="_honey"]') || form.querySelector('input[name="_honeypot"]');

      // 1. Invisible Honeypot check
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Spam bot detected via honeypot.');
        showStatus('Spam gyanúja miatt az üzenet nem lett elküldve.', 'error');
        return;
      }

      // 2. Invisible Timestamp & Interaction check (must be human: > 1.2s or had interaction)
      const submitDuration = Date.now() - formInitTime;
      if (submitDuration < 1200 && !userInteracted) {
        console.warn('Bot detected via instant submission.');
        showStatus('Kérjük, várjon egy pillanatot az elküldés előtt!', 'error');
        return;
      }

      // 3. Form input validation
      const nameInput = form.querySelector('#nev') || form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('#email') || form.querySelector('input[name="email"]');
      const messageInput = form.querySelector('#uzenet') || form.querySelector('textarea[name="message"]');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) {
        showStatus('Kérjük, töltsön ki minden kötelező mezőt!', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showStatus('Kérjük, érvényes e-mail címet adjon meg!', 'error');
        return;
      }

      // Determine Google Script endpoint (from constant or form action)
      const formAction = (form.getAttribute('action') || '').trim();
      const endpoint = GOOGLE_SCRIPT_URL || (formAction.includes('script.google.com') ? formAction : '');

      if (!endpoint) {
        showStatus(
          '⚠️ A Google Apps Script Web App URL még nincs beállítva! Kövesd a <code>js/google_apps_script.gs</code> fájlban lévő lépéseket, és másold be a kapott <code>https://script.google.com/macros/s/.../exec</code> linket!',
          'error'
        );
        return;
      }

      // 4. UI Sending State
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Üzenet Küldése';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳</span> Küldés folyamatban...`;
      }
      hideStatus();

      try {
        // Send via URLSearchParams (CORS simple request, works seamlessly with Google Apps Script doPost)
        const payload = new URLSearchParams();
        payload.append('name', name);
        payload.append('email', email);
        payload.append('message', message);
        payload.append('_honey', honeypot ? honeypot.value : '');

        const response = await fetch(endpoint, {
          method: 'POST',
          body: payload
        });

        const data = await response.json().catch(() => ({ result: 'success' }));

        if (response.ok && data.result !== 'error') {
          showStatus(
            '✅ Köszönjük! Az üzenet sikeresen elküldve! Egy automatikus visszaigazoló másolatot küldtünk a megadott e-mail címre (' + email + ') is.',
            'success'
          );
          form.reset();
          formInitTime = Date.now();
          window.trackEvent('contact_form_success', { sender: name });
        } else {
          throw new Error(data.message || 'Ismeretlen szerverhiba');
        }
      } catch (err) {
        console.error('Google Script küldési hiba:', err);
        showStatus(
          `⚠️ Hiba történt az üzenet küldésekor (${err.message || 'Hálózati hiba'}). Kérjük, írj közvetlenül a <a href="mailto:hunormadaras@yahoo.com?subject=Kapcsolatfelvétel CV-ről&body=${encodeURIComponent(message)}" style="text-decoration:underline; font-weight:bold;">hunormadaras@yahoo.com</a> címre!`,
          'error'
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });

    function showStatus(text, type) {
      if (!statusMsg) return;
      statusMsg.innerHTML = text;
      statusMsg.className = `form_status_msg ${type}`;
    }

    function hideStatus() {
      if (!statusMsg) return;
      statusMsg.className = 'form_status_msg';
      statusMsg.innerHTML = '';
    }
  }

  /* ----------------------------------------------------
     4. IntersectionObserver Animated Skill Bars
  ---------------------------------------------------- */
  function initSkillBars() {
    const skillBars = document.querySelectorAll('.progress_fill');
    if (!skillBars.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const bar = entry.target;
            const targetWidth = bar.getAttribute('data-percent') || bar.getAttribute('title') || '0%';
            bar.style.width = targetWidth;
            obs.unobserve(bar);
          }
        });
      }, { threshold: 0.2 });

      skillBars.forEach(bar => observer.observe(bar));
    } else {
      skillBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-percent') || bar.getAttribute('title') || '0%';
        bar.style.width = targetWidth;
      });
    }
  }

  /* ----------------------------------------------------
     5. Portfolio Category Filter
  ---------------------------------------------------- */
  function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.gallery_filter_bar .filter_btn');
    const cards = document.querySelectorAll('.portfolio_card');

    if (!filterBtns.length || !cards.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const category = this.getAttribute('data-filter') || 'all';
        window.trackEvent('portfolio_filter', { category });

        cards.forEach(card => {
          const cardCategory = card.getAttribute('data-category') || '';
          if (category === 'all' || cardCategory.includes(category)) {
            card.style.display = 'flex';
            card.style.animation = 'fadeIn 0.3s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* ----------------------------------------------------
     6. Modern Keyboard-Accessible Lightbox Modal
  ---------------------------------------------------- */
  function initLightbox() {
    const modal = document.getElementById('modern-lightbox-modal');
    if (!modal) return;

    const modalImg = modal.querySelector('.lightbox_img_container img');
    const modalTitle = modal.querySelector('.lightbox_meta h3');
    const modalDesc = modal.querySelector('.lightbox_meta p');
    const closeBtn = modal.querySelector('.lightbox_close_btn');

    const triggerLinks = document.querySelectorAll('[data-lightbox="gallery"]');

    triggerLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const imgSrc = this.getAttribute('href') || this.querySelector('img')?.getAttribute('src');
        const title = this.getAttribute('data-title') || this.getAttribute('title') || 'Kép előnézet';
        const desc = this.getAttribute('data-desc') || '';

        if (modalImg) modalImg.src = imgSrc;
        if (modalTitle) modalTitle.textContent = title;
        if (modalDesc) modalDesc.textContent = desc;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        window.trackEvent('lightbox_view', { title });
      });
    });

    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /* ----------------------------------------------------
     7. Quick Copy to Clipboard
  ---------------------------------------------------- */
  function initCopyButtons() {
    const copyBtns = document.querySelectorAll('.copy_btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const textToCopy = this.getAttribute('data-copy') || '';
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = this.textContent;
          this.textContent = '✓ Másolva!';
          this.style.backgroundColor = '#10b981';
          this.style.color = '#ffffff';

          setTimeout(() => {
            this.textContent = originalText;
            this.style.backgroundColor = '';
            this.style.color = '';
          }, 2000);

          window.trackEvent('copy_clipboard', { item: textToCopy });
        }).catch(err => {
          console.error('Clipboard copy error:', err);
        });
      });
    });
  }

  /* ----------------------------------------------------
     8. Scroll-to-Top Button
  ---------------------------------------------------- */
  function initScrollToTop() {
    const navUp = document.getElementById('nav_up');
    if (!navUp) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 250) {
        navUp.classList.add('visible');
      } else {
        navUp.classList.remove('visible');
      }
    }, { passive: true });

    navUp.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /* ----------------------------------------------------
     Initialize Everything on DOM Ready
  ---------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initContactForm();
    initSkillBars();
    initPortfolioFilter();
    initLightbox();
    initCopyButtons();
    initScrollToTop();
  });

})();
