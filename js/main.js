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

  var airportDb = null;
  var airportDbPromise = null;
  function loadAirportDb() {
    if (!airportDbPromise) {
      airportDbPromise = fetch('assets/data/airports.json')
        .then(function (resp) { return resp.json(); })
        .then(function (data) { airportDb = Array.isArray(data) ? data : []; return airportDb; })
        .catch(function () { airportDb = []; return airportDb; });
    }
    return airportDbPromise;
  }

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

    function airportMatches(query, limit) {
      if (!query || !airportDb) return [];

      var q = query.toLowerCase();
      var out = [];

      for (var i = 0; i < airportDb.length && out.length < limit; i++) {
        var a = airportDb[i];
        if (a.n.toLowerCase().indexOf(q) === -1 && a.c.toLowerCase().indexOf(q) === -1 && a.i.toLowerCase().indexOf(q) === -1) continue;
        var main = a.n + ' (' + a.i + ')';
        out.push({ main: main, sub: a.c, fill: main + ', ' + a.c, isAirport: true });
      }

      return out;
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

      list.forEach(function (item) {
        var el = document.createElement('div');
        el.className = 'autocomplete-item';
        el.setAttribute('role', 'option');

        var row = document.createElement('div');
        row.className = 'ac-row';

        var mainEl = document.createElement('span');
        mainEl.className = 'ac-main';
        mainEl.textContent = item.main;
        row.appendChild(mainEl);

        if (item.isAirport) {
          var badge = document.createElement('span');
          badge.className = 'ac-badge';
          badge.textContent = 'Airport';
          row.appendChild(badge);
        }

        el.appendChild(row);

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

      var url = 'https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=8&q=' + encodeURIComponent(query);

      fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
          if (input.value.trim() !== query) return;
          var general = (Array.isArray(data) ? data : []).map(function (raw) {
            var parts = raw.display_name.split(',');
            var main = parts[0].trim();
            var sub = parts.slice(1).join(',').trim();
            return { main: main, sub: sub, fill: raw.display_name };
          });
          renderResults(airportMatches(query, 4).concat(general));
        })
        .catch(function (err) {
          if (err.name !== 'AbortError') closeResults();
        });
    }

    function refreshResults(query) {
      if (!query) {
        closeResults();
        return;
      }
      renderResults(airportMatches(query, 8));
    }

    input.addEventListener('focus', function () {
      refreshResults(input.value.trim());
      loadAirportDb().then(function () {
        if (document.activeElement === input) refreshResults(input.value.trim());
      });
    });

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(debounceTimer);
      refreshResults(query);

      if (query.length >= 3) {
        debounceTimer = setTimeout(function () {
          search(query);
        }, 350);
      }
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
