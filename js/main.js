/**
 * ========================================================
 * Hunor Madaras - CV & Portfolio Modern Interactive Script
 * Features:
 *  - Theme Toggle (Dark / Light Mode) with LocalStorage
 *  - Contact Form with Invisible Captcha (_honey + timing/interaction)
 *  - Dual-Notification (FormSubmit standard POST with _autoresponse)
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
     3. Invisible Captcha & Contact Form Handling
  ---------------------------------------------------- */
  let formInitTime = Date.now();
  let userInteracted = false;

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const statusMsg = document.getElementById('form-status-msg');
    const nextUrlInput = document.getElementById('form-next-url');
    const subjectInput = document.getElementById('form-subject');
    const autoresponseInput = document.getElementById('form-autoresponse');

    // Dynamically set the _next return URL to the current hosted page
    if (nextUrlInput && (window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      const baseUrl = window.location.origin + window.location.pathname;
      nextUrlInput.value = `${baseUrl}?sent=1#kapcsolat`;
    }

    // Check if returning from a successful FormSubmit submission (?sent=1)
    if (window.location.search.includes('sent=1')) {
      showStatus('✅ Köszönjük! Az üzenet sikeresen elküldve! Egy automatikus visszaigazoló másolatot küldtünk a megadott e-mail címre is.', 'success');
      window.trackEvent('contact_form_success');
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // Detect human interaction for invisible anti-bot verification
    ['mousemove', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => {
        userInteracted = true;
      }, { once: true, passive: true });
    });

    form.addEventListener('submit', function (e) {
      const submitBtn = form.querySelector('.submit_btn');
      const honeypot = form.querySelector('input[name="_honey"]') || form.querySelector('input[name="_honeypot"]');

      // 0. Check if opened directly via file:// protocol (FormSubmit blocks file://)
      if (window.location.protocol === 'file:') {
        e.preventDefault();
        showStatus(
          '⚠️ A FormSubmit e-mail küldés biztonsági okokból nem működik közvetlenül fájlrendszerből (<code>file://</code>). Kérjük, nyisd meg az oldalt webszerveren keresztül (pl. <strong>VS Code Live Server</strong> vagy <strong>GitHub Pages</strong>: <a href="https://huni98.github.io/CV/" target="_blank" style="text-decoration:underline;">huni98.github.io/CV</a>)!',
          'error'
        );
        return;
      }

      // 1. Invisible Honeypot check
      if (honeypot && honeypot.value.trim() !== '') {
        e.preventDefault();
        console.warn('Spam bot detected via honeypot.');
        showStatus('Spam gyanúja miatt az üzenet nem lett elküldve.', 'error');
        return;
      }

      // 2. Invisible Timestamp & Interaction check (must be human: > 1.2s or had interaction)
      const submitDuration = Date.now() - formInitTime;
      if (submitDuration < 1200 && !userInteracted) {
        e.preventDefault();
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
        e.preventDefault();
        showStatus('Kérjük, töltsön ki minden kötelező mezőt!', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        e.preventDefault();
        showStatus('Kérjük, érvényes e-mail címet adjon meg!', 'error');
        return;
      }

      // 4. Customize subject and autoresponse message with sender's name
      if (subjectInput) {
        subjectInput.value = `Új kapcsolatfelvétel a CV weboldalról: ${name}`;
      }
      if (autoresponseInput) {
        autoresponseInput.value = `Kedves ${name}!\n\nKöszönöm szépen a megkeresést! Üzenetedet sikeresen megkaptam, és a lehető leghamarabb válaszolni fogok.\n\nBeérkezett üzeneted:\n"${message}"\n\nÜdvözlettel:\nMadaras Hunor\nWebfejlesztő & Informatikus hallgató\nhttps://huni98.github.io/CV/`;
      }

      // 5. UI Sending State & allow native POST so FormSubmit sends BOTH emails (_autoresponse requires standard POST + reCAPTCHA)
      if (submitBtn) {
        submitBtn.innerHTML = `<span>⏳</span> Küldés folyamatban...`;
      }
      hideStatus();
      window.trackEvent('contact_form_submit', { sender: name });
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
