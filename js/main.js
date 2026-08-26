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

  var CITY_JET_ALIASES = {
    'san francisco': ['SQL', 'OAK', 'HWD', 'PAO'],
    'silicon valley': ['SQL', 'PAO', 'RHV'],
    'new york': ['TEB', 'HPN', 'FRG'],
    'nyc': ['TEB', 'HPN', 'FRG'],
    'manhattan': ['TEB', 'HPN'],
    'los angeles': ['VNY', 'BUR', 'SMO'],
    'la': ['VNY', 'BUR'],
    'chicago': ['PWK', 'DPA'],
    'dallas': ['DAL', 'ADS'],
    'houston': ['HOU', 'DWH'],
    'miami': ['OPF', 'TMB', 'FXE'],
    'fort lauderdale': ['FXE'],
    'palm beach': ['PBI', 'LNA'],
    'las vegas': ['LAS', 'VGT'],
    'denver': ['APA', 'BJC'],
    'aspen': ['ASE'],
    'phoenix': ['SDL', 'DVT'],
    'scottsdale': ['SDL'],
    'seattle': ['BFI', 'RNT'],
    'boston': ['BED', 'OWD'],
    'washington': ['IAD', 'DCA'],
    'atlanta': ['PDK', 'FTY'],
    'london': ['EGLF', 'EGKB', 'EGGW', 'EGSS'],
    'paris': ['LBG'],
    'geneva': ['GVA'],
    'zurich': ['ZRH'],
    'nice': ['NCE'],
    'cannes': ['CEQ'],
    'milan': ['LIN'],
    'rome': ['CIA'],
    'monaco': ['MCM'],
    'dubai': ['DWC', 'SHJ'],
    'abu dhabi': ['AZI'],
    'doha': ['DOH'],
    'riyadh': ['RUH'],
    'hong kong': ['HKG'],
    'singapore': ['XSP'],
    'tokyo': ['HND'],
    'mumbai': ['BOM'],
    'sydney': ['BWU'],
    'melbourne': ['MEB'],
    'sao paulo': ['CGH', 'SDU'],
    'são paulo': ['CGH', 'SDU'],
    'buenos aires': ['AEP'],
    'johannesburg': ['HLA'],
    'cape town': ['CPT']
  };

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

    function toItem(a) {
      var main = a.n + ' (' + a.i + ')';
      var isMajor = a.t === 'l' && a.s === 1;
      return { main: main, sub: a.c, fill: main + ', ' + a.c, badge: isMajor ? 'Airport' : 'Private Terminal' };
    }

    function airportMatches(query, limit) {
      if (!query || !airportDb) return [];

      var q = query.toLowerCase();
      var out = [];
      var seen = {};

      for (var city in CITY_JET_ALIASES) {
        if (q.indexOf(city) === -1) continue;
        CITY_JET_ALIASES[city].forEach(function (code) {
          if (out.length >= limit || seen[code]) return;
          for (var j = 0; j < airportDb.length; j++) {
            if (airportDb[j].i === code) {
              seen[code] = true;
              out.push(toItem(airportDb[j]));
              break;
            }
          }
        });
      }

      for (var i = 0; i < airportDb.length && out.length < limit; i++) {
        var a = airportDb[i];
        if (seen[a.i]) continue;
        if (a.n.toLowerCase().indexOf(q) === -1 && a.c.toLowerCase().indexOf(q) === -1 && a.i.toLowerCase().indexOf(q) === -1) continue;
        seen[a.i] = true;
        out.push(toItem(a));
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

        if (item.badge) {
          var badge = document.createElement('span');
          badge.className = 'ac-badge' + (item.badge === 'Private Terminal' ? ' ac-badge--jet' : '');
          badge.textContent = item.badge;
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

      var url = '/api/places-autocomplete?q=' + encodeURIComponent(query);

      fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
          if (input.value.trim() !== query) return;
          var general = Array.isArray(data.results) ? data.results : [];
          renderResults(airportMatches(query, 5).concat(general));
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
      renderResults(airportMatches(query, 10));
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

      if (query.length >= 2) {
        debounceTimer = setTimeout(function () {
          search(query);
        }, 300);
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
