document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var industrySelect = document.getElementById('industry');
  if (industrySelect) {
    var params = new URLSearchParams(window.location.search);
    var preselect = params.get('industry');
    if (preselect) {
      Array.from(industrySelect.options).forEach(function (opt) {
        if (opt.value.toLowerCase() === preselect.toLowerCase() || opt.text.toLowerCase() === preselect.toLowerCase()) {
          industrySelect.value = opt.value;
        }
      });
    }
  }

  var quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    var statusEl = document.getElementById('formStatus');
    var submitBtn = quoteForm.querySelector('button[type="submit"]');

    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
      }

      var payload = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        industry: document.getElementById('industry').value,
        pickup: document.getElementById('pickup').value.trim(),
        dropoff: document.getElementById('dropoff').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        luggage: document.getElementById('luggage').value.trim(),
        message: document.getElementById('message').value.trim(),
        company: document.getElementById('company') ? document.getElementById('company').value : ''
      };

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }

      fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (resp) {
          return resp.json().then(function (data) {
            return { ok: resp.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success) {
            quoteForm.reset();
            if (statusEl) {
              statusEl.textContent = "Thanks! We've received your request and will follow up shortly. Check your email for confirmation.";
              statusEl.className = 'form-status form-status--success';
            }
          } else {
            throw new Error((result.data && result.data.error) || 'Failed to send');
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'Something went wrong sending your request. Please call us at +1 (877) 903-5946 or try again.';
            statusEl.className = 'form-status form-status--error';
          }
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  var PRIVATE_JET_TERMINALS = [
    { name: 'Teterboro Airport (KTEB)', sub: 'Teterboro, New Jersey, USA' },
    { name: 'Van Nuys Airport (KVNY)', sub: 'Los Angeles, California, USA' },
    { name: 'Westchester County Airport (KHPN)', sub: 'White Plains, New York, USA' },
    { name: 'Republic Airport (KFRG)', sub: 'Farmingdale, New York, USA' },
    { name: 'Miami Opa-locka Executive Airport (KOPF)', sub: 'Opa-locka, Florida, USA' },
    { name: 'Palm Beach International Airport FBO (KPBI)', sub: 'West Palm Beach, Florida, USA' },
    { name: 'Fort Lauderdale Executive Airport (KFXE)', sub: 'Fort Lauderdale, Florida, USA' },
    { name: 'Scottsdale Airport (KSDL)', sub: 'Scottsdale, Arizona, USA' },
    { name: 'Centennial Airport (KAPA)', sub: 'Denver, Colorado, USA' },
    { name: 'Naples Airport (KAPF)', sub: 'Naples, Florida, USA' },
    { name: 'Aspen/Pitkin County Airport (KASE)', sub: 'Aspen, Colorado, USA' },
    { name: 'Hollywood Burbank Airport (KBUR)', sub: 'Burbank, California, USA' },
    { name: 'Chicago Executive Airport (KPWK)', sub: 'Wheeling, Illinois, USA' },
    { name: 'Dallas Love Field FBO (KDAL)', sub: 'Dallas, Texas, USA' },
    { name: 'Addison Airport (KADS)', sub: 'Dallas, Texas, USA' },
    { name: 'Las Vegas Signature Aviation (KLAS)', sub: 'Las Vegas, Nevada, USA' },
    { name: 'San Francisco Jet Center', sub: 'San Carlos, California, USA' },
    { name: 'Oakland North Field FBO (KOAK)', sub: 'Oakland, California, USA' },
    { name: 'Toronto Pearson Business Aviation Centre (CYYZ)', sub: 'Toronto, Ontario, Canada' },
    { name: 'Toronto Buttonville Municipal Airport (CYKZ)', sub: 'Toronto, Ontario, Canada' },
    { name: 'Vancouver International Airport South Terminal (CYVR)', sub: 'Vancouver, British Columbia, Canada' },
    { name: 'Toluca International Airport (MMTO)', sub: 'Toluca, Mexico' },
    { name: 'Nassau Lynden Pindling International FBO (MYNN)', sub: 'Nassau, Bahamas' },
    { name: 'London Luton Airport (EGGW)', sub: 'Luton, United Kingdom' },
    { name: 'London Biggin Hill Airport (EGKB)', sub: 'Biggin Hill, United Kingdom' },
    { name: 'London Farnborough Airport (EGLF)', sub: 'Farnborough, United Kingdom' },
    { name: 'London Stansted Business Aviation Centre (EGSS)', sub: 'Stansted, United Kingdom' },
    { name: 'Paris–Le Bourget Airport (LFPB)', sub: 'Le Bourget, France' },
    { name: 'Nice Côte d\'Azur Airport (LFMN)', sub: 'Nice, France' },
    { name: 'Cannes–Mandelieu Airport (LFMD)', sub: 'Cannes, France' },
    { name: 'Geneva Airport Business Aviation Centre (LSGG)', sub: 'Geneva, Switzerland' },
    { name: 'Zurich Airport General Aviation Centre (LSZH)', sub: 'Zurich, Switzerland' },
    { name: 'Milan Linate Airport (LIML)', sub: 'Milan, Italy' },
    { name: 'Rome Ciampino Airport (LIRA)', sub: 'Rome, Italy' },
    { name: 'Amsterdam Schiphol Business Aviation (EHAM)', sub: 'Amsterdam, Netherlands' },
    { name: 'Frankfurt Egelsbach Airport (EDFE)', sub: 'Egelsbach, Germany' },
    { name: 'Munich Airport General Aviation Centre (EDDM)', sub: 'Munich, Germany' },
    { name: 'Vienna International Airport GAT (LOWW)', sub: 'Vienna, Austria' },
    { name: 'Moscow Vnukovo-3 Business Aviation Centre (UUWW)', sub: 'Moscow, Russia' },
    { name: 'Dubai World Central – Al Maktoum International (OMDW)', sub: 'Dubai, UAE' },
    { name: 'Dubai International Jet Centre (OMDB)', sub: 'Dubai, UAE' },
    { name: 'Sharjah Executive Jet Centre (OMSJ)', sub: 'Sharjah, UAE' },
    { name: 'Abu Dhabi Al Bateen Executive Airport (OMAD)', sub: 'Abu Dhabi, UAE' },
    { name: 'Doha Hamad International Executive Aviation (OTHH)', sub: 'Doha, Qatar' },
    { name: 'Riyadh King Khalid International Private Aviation (OERK)', sub: 'Riyadh, Saudi Arabia' },
    { name: 'Jeddah King Abdulaziz International FBO (OEJN)', sub: 'Jeddah, Saudi Arabia' },
    { name: 'Hong Kong Business Aviation Centre (VHHH)', sub: 'Hong Kong' },
    { name: 'Singapore Seletar Airport (WSSL)', sub: 'Singapore' },
    { name: 'Tokyo Haneda Airport GA Terminal (RJTT)', sub: 'Tokyo, Japan' },
    { name: 'Beijing Capital Airport Business Aviation (ZBAA)', sub: 'Beijing, China' },
    { name: 'Shanghai Hongqiao Business Aviation Centre (ZSSS)', sub: 'Shanghai, China' },
    { name: 'Mumbai Chhatrapati Shivaji GA Terminal (VABB)', sub: 'Mumbai, India' },
    { name: 'New Delhi Indira Gandhi GA Terminal (VIDP)', sub: 'New Delhi, India' },
    { name: 'Sydney Bankstown Airport (YSBK)', sub: 'Sydney, Australia' },
    { name: 'Melbourne Essendon Fields Airport (YMEN)', sub: 'Melbourne, Australia' },
    { name: 'São Paulo Congonhas Airport (SBSP)', sub: 'São Paulo, Brazil' },
    { name: 'São Paulo Catarina Executive Airport (SDCO)', sub: 'São Paulo, Brazil' },
    { name: 'Buenos Aires Aeroparque Jorge Newbery (SABE)', sub: 'Buenos Aires, Argentina' },
    { name: 'Johannesburg Lanseria International Airport (FALA)', sub: 'Johannesburg, South Africa' },
    { name: 'Cape Town International GA Terminal (FACT)', sub: 'Cape Town, South Africa' }
  ];

  function setupLocationAutocomplete(inputId, resultsId) {
    var input = document.getElementById(inputId);
    var results = document.getElementById(resultsId);
    if (!input || !results) return;

    var debounceTimer;
    var controller;
    var items = [];
    var activeIndex = -1;

    function closeResults() {
      results.classList.remove('is-open');
      results.innerHTML = '';
      items = [];
      activeIndex = -1;
    }

    function highlight(index) {
      var els = Array.from(results.querySelectorAll('.autocomplete-item'));
      els.forEach(function (el) { el.classList.remove('is-active'); });
      if (index >= 0 && els[index]) {
        els[index].classList.add('is-active');
        els[index].scrollIntoView({ block: 'nearest' });
      }
      activeIndex = index;
    }

    function selectItem(item) {
      input.value = item.fill;
      closeResults();
    }

    function jetMatches(query) {
      var q = query.toLowerCase();
      var list = query ? PRIVATE_JET_TERMINALS.filter(function (t) {
        return t.name.toLowerCase().indexOf(q) !== -1 || t.sub.toLowerCase().indexOf(q) !== -1;
      }) : PRIVATE_JET_TERMINALS.slice();
      return list.map(function (t) {
        return { main: t.name, sub: t.sub, fill: t.name + ', ' + t.sub, isJet: true };
      });
    }

    function renderResults(list) {
      results.innerHTML = '';
      items = list;
      activeIndex = -1;

      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'autocomplete-empty';
        empty.textContent = 'No matching places found';
        results.appendChild(empty);
        results.classList.add('is-open');
        return;
      }

      var lastSection = null;
      list.forEach(function (item, idx) {
        var section = item.isJet ? 'jet' : 'other';
        if (section !== lastSection) {
          var sLabel = document.createElement('div');
          sLabel.className = 'autocomplete-section-label';
          sLabel.textContent = item.isJet ? 'Private Jet Terminals Worldwide' : 'Other Locations';
          results.appendChild(sLabel);
          lastSection = section;
        }

        var el = document.createElement('div');
        el.className = 'autocomplete-item';
        el.setAttribute('role', 'option');

        var mainEl = document.createElement('span');
        mainEl.className = 'ac-main';
        mainEl.textContent = item.main;
        el.appendChild(mainEl);

        if (item.sub) {
          var subEl = document.createElement('span');
          subEl.className = 'ac-sub';
          subEl.textContent = item.sub;
          el.appendChild(subEl);
        }

        el.addEventListener('mousedown', function (e) {
          e.preventDefault();
          selectItem(item);
        });

        results.appendChild(el);
      });

      results.classList.add('is-open');
    }

    function search(query) {
      if (controller) controller.abort();
      controller = new AbortController();

      var url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=6&q=' + encodeURIComponent(query);

      fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
          if (input.value.trim() !== query) return;
          var general = (Array.isArray(data) ? data : []).map(function (raw) {
            var parts = raw.display_name.split(',');
            var main = parts[0].trim();
            var sub = parts.slice(1).join(',').trim();
            return { main: main, sub: sub, fill: raw.display_name, isJet: false };
          });
          renderResults(jetMatches(query).slice(0, 6).concat(general));
        })
        .catch(function (err) {
          if (err.name !== 'AbortError') closeResults();
        });
    }

    input.addEventListener('focus', function () {
      var query = input.value.trim();
      if (!query) {
        renderResults(jetMatches('').slice(0, 60));
      }
    });

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(debounceTimer);

      if (!query) {
        renderResults(jetMatches('').slice(0, 60));
        return;
      }

      if (query.length < 3) {
        renderResults(jetMatches(query).slice(0, 8));
        return;
      }

      renderResults(jetMatches(query).slice(0, 6));

      debounceTimer = setTimeout(function () {
        search(query);
      }, 350);
    });

    input.addEventListener('keydown', function (e) {
      if (!results.classList.contains('is-open') || !items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlight(Math.min(activeIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlight(Math.max(activeIndex - 1, 0));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0) {
          e.preventDefault();
          selectItem(items[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        closeResults();
      }
    });

    input.addEventListener('blur', function () {
      setTimeout(closeResults, 150);
    });
  }

  setupLocationAutocomplete('pickup', 'pickupResults');
  setupLocationAutocomplete('dropoff', 'dropoffResults');

  var carousel = document.querySelector('.testimonial-carousel');
  if (carousel) {
    var slides = Array.from(carousel.querySelectorAll('.tc-slide'));
    var dotsWrap = carousel.querySelector('.tc-dots');
    var current = 0;
    var timer;

    slides.forEach(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      if (i === 0) dot.classList.add('is-active');
      dot.addEventListener('click', function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.from(dotsWrap.querySelectorAll('button'));

    function goTo(i) {
      slides[current].classList.remove('is-active');
      dots[current].classList.remove('is-active');
      current = i;
      slides[current].classList.add('is-active');
      dots[current].classList.add('is-active');
    }
    function next() { goTo((current + 1) % slides.length); }
    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(next, 6000);
    }
    if (slides.length > 1) resetTimer();
  }

  var header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.3)' : 'none';
    });
  }

  var revealEls = Array.from(document.querySelectorAll(
    '.section-head, .process-step, .service-card, .fleet-card, .testimonial-card, .area-list li, .contact-info, .quote-form, .blog-card'
  ));

  var groups = new Map();
  revealEls.forEach(function (el) {
    el.classList.add('reveal');
    var parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach(function (children) {
    children.forEach(function (el, idx) {
      el.style.transitionDelay = Math.min(idx * 70, 280) + 'ms';
    });
  });

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
});
