/* =====================================================
   DEEKSHIT HOME SERVICES — main.js
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── NAVBAR SCROLL ───────────────────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  // ── MOBILE NAV TOGGLE ───────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const spans = navToggle.querySelectorAll('span');
      const isOpen = navLinks.classList.contains('open');
      spans[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
      spans[1].style.opacity   = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
    });
    // Close nav on link click
    navLinks.querySelectorAll('.nav-link, .nav-book-btn, .nav-register-btn').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // ── BACK TO TOP ─────────────────────────────────
  const btt = document.getElementById('backToTop');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 400);
    });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // ── COUNTER ANIMATION ───────────────────────────
  const counters = document.querySelectorAll('.stat-num[data-target]');
  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target);
          let current  = 0;
          const step   = Math.max(1, Math.floor(target / 60));
          const timer  = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(timer);
          }, 20);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => counterObserver.observe(c));
  }

  // ── SCROLL REVEAL ───────────────────────────────
  const revealEls = document.querySelectorAll('.service-card, .why-card, .step-card, .testi-card, .sac, .cic, .cred-card');
  if (revealEls.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity   = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 60);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      revealObserver.observe(el);
    });
  }

  // ── SERVICE CATEGORY FILTER (Home page) ─────────
  const scatTabs = document.querySelectorAll('.scat-tab');
  const scCards  = document.querySelectorAll('.service-card[data-cat]');
  scatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      scatTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      scCards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.style.display = show ? '' : 'none';
        if (show) {
          card.style.animation = 'fadeUp 0.4s ease forwards';
        }
      });
    });
  });

  // ── SERVICE FILTER (Services page) ──────────────
  const sfbBtns = document.querySelectorAll('.sfb-btn');
  const sacs    = document.querySelectorAll('.sac[data-cat]');
  const sstTitles = document.querySelectorAll('.services-section-title');
  sfbBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sfbBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      sacs.forEach(card => {
        const cats = card.dataset.cat.split(' ');
        card.style.display = (filter === 'all' || cats.includes(filter)) ? '' : 'none';
      });
      sstTitles.forEach(title => {
        const section = title.dataset.section;
        if (filter === 'all') {
          title.style.display = '';
        } else {
          title.style.display = (section === filter || filter === 'emergency') ? '' : 'none';
        }
      });
    });
  });

  // ── SERVICE ACCORDION ────────────────────────────
  document.querySelectorAll('.sac-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const isOpen = card.classList.contains('open');
      // Close all
      document.querySelectorAll('.sac.open').forEach(c => c.classList.remove('open'));
      // Open clicked if it was closed
      if (!isOpen) card.classList.add('open');
    });
  });

  // ── TESTIMONIALS SLIDER ──────────────────────────
  const track  = document.getElementById('testiTrack');
  const dotsEl = document.getElementById('testiDots');
  const prevBtn = document.getElementById('testiPrev');
  const nextBtn = document.getElementById('testiNext');
  if (track && dotsEl) {
    const cards  = track.querySelectorAll('.testi-card');
    let idx = 0;
    let perView = getPerView();
    const total  = Math.ceil(cards.length / perView);

    function getPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 640)  return 2;
      return 1;
    }

    // Build dots
    function buildDots() {
      dotsEl.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === idx ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      }
    }

    function goTo(i) {
      idx = Math.max(0, Math.min(i, total - 1));
      const cardW = cards[0].offsetWidth + 24; // 24 = gap
      track.style.transform = `translateX(-${idx * perView * cardW}px)`;
      dotsEl.querySelectorAll('.testi-dot').forEach((d, di) => {
        d.classList.toggle('active', di === idx);
      });
    }

    buildDots();
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(idx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goTo(idx + 1));

    // Auto-rotate
    let autoTimer = setInterval(() => goTo((idx + 1) % total), 4500);
    track.addEventListener('mouseenter', () => clearInterval(autoTimer));
    track.addEventListener('mouseleave', () => {
      autoTimer = setInterval(() => goTo((idx + 1) % total), 4500);
    });

    window.addEventListener('resize', () => {
      perView = getPerView();
      goTo(0);
      buildDots();
    });
  }

  // ── FLASH AUTO-DISMISS ───────────────────────────
  document.querySelectorAll('.flash').forEach(f => {
    setTimeout(() => {
      f.style.opacity = '0';
      f.style.transform = 'translateX(30px)';
      f.style.transition = 'all 0.4s ease';
      setTimeout(() => f.remove(), 400);
    }, 5000);
  });

  // ── URL PARAM SERVICE PRE-FILL ───────────────────
  // (handled inline in book.html)

  // ── SMOOTH ANCHOR SCROLL ─────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── HERO PARTICLES ───────────────────────────────
  const particlesEl = document.getElementById('particles');
  if (particlesEl) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position:absolute;
        width:${Math.random()*4+2}px;
        height:${Math.random()*4+2}px;
        border-radius:50%;
        background:rgba(245,166,35,${Math.random()*0.4+0.1});
        top:${Math.random()*100}%;
        left:${Math.random()*100}%;
        animation:scrollDot ${Math.random()*4+3}s ease-in-out ${Math.random()*3}s infinite alternate;
      `;
      particlesEl.appendChild(p);
    }
  }

  // ── MODAL OVERLAY CLOSE ──────────────────────────
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  console.log('%c✅ Deekshit Home Services — Ready!', 'color:#1a3a6b;font-weight:bold;font-size:14px');
});
