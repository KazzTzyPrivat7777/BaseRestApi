(function () {
  'use strict';

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var icon = document.getElementById('themeIcon');
    if (icon) icon.className = t === 'dark' ? 'fa fa-moon' : 'fa fa-sun';
    localStorage.setItem('kzz-theme', t);
  }

  var savedTheme = localStorage.getItem('kzz-theme') || 'dark';
  setTheme(savedTheme);

  document.getElementById('themeBtn').addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme');
    setTheme(cur === 'dark' ? 'light' : 'dark');
  });

  var hamburger = document.getElementById('hamburgerBtn');
  var dropMenu = document.getElementById('dropMenu');

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    dropMenu.classList.toggle('open');
  });

  document.addEventListener('click', function () {
    dropMenu.classList.remove('open');
  });

  function toast(msg) {
    var el = document.getElementById('toast');
    var msgEl = document.getElementById('toast-msg');
    if (!el || !msgEl) return;
    msgEl.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 2000);
  }

  function copyText(text, btn) {
    var orig = btn.textContent;
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = 'Copied!';
      toast('Copied to clipboard');
      setTimeout(function () { btn.textContent = orig; }, 1500);
    }).catch(function () {
      btn.textContent = 'Failed';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  window.copyText = copyText;

  window.toggleCat = function (ci) {
    var body = document.getElementById('cb-' + ci);
    var chev = document.getElementById('cc-' + ci);
    if (!body) return;
    var open = body.classList.toggle('open');
    if (chev) chev.classList.toggle('open', open);
  };

  window.toggleEp = function (ci, ei) {
    var body = document.getElementById('eb-' + ci + '-' + ei);
    var chev = document.getElementById('ec-' + ci + '-' + ei);
    if (!body) return;
    var open = body.classList.toggle('open');
    if (chev) chev.classList.toggle('open', open);
  };

  window.clearRes = function (ci, ei) {
    var wrap = document.getElementById('rd-' + ci + '-' + ei);
    var btn = document.getElementById('clrbtn-' + ci + '-' + ei);
    if (!wrap) return;
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    if (btn) btn.style.display = 'none';
  };

  function syntaxJSON(json) {
    return json
      .replace(/(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'tk-jnum';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'tk-jkey' : 'tk-jstr';
        } else if (/true|false/.test(match)) {
          cls = 'tk-jbool';
        } else if (/null/.test(match)) {
          cls = 'tk-jnull';
        }
        return '<span class="' + cls + '">' + esc(match) + '</span>';
      });
  }

  function buildCurlHtml(endpoint, params, method) {
    var base = window.location.origin;
    method = method || 'GET';

    var paramParts = '';
    if (params && params.length) {
      paramParts = params.map(function (p) {
        return '<span class="tk-pkey">' + esc(p.name) + '</span><span class="tk-punct">=</span><span class="tk-pval">' + (p.required ? 'VALUE' : 'opt') + '</span>';
      }).join('<span class="tk-punct">&amp;</span>');
    }

    var urlHtml = '<span class="tk-url">' + esc(base + endpoint) + '</span>';
    if (paramParts) urlHtml += '<span class="tk-punct">?</span>' + paramParts;

    return '<span class="tk-dollar">$</span> <span class="tk-cmd">curl</span> <span class="tk-method">' + esc(method) + '</span> ' + urlHtml;
  }

  function buildCurlRaw(endpoint, params, method) {
    var base = window.location.origin;
    method = method || 'GET';
    var qs = '';
    if (params && params.length) {
      qs = '?' + params.map(function (p) {
        return p.name + '=' + (p.required ? 'VALUE' : 'opt');
      }).join('&');
    }
    return 'curl ' + method + ' "' + base + endpoint + qs + '"';
  }

  window.execReq = function (e, ci, ei, method, endpoint) {
    e.preventDefault();
    var form = document.getElementById('frm-' + ci + '-' + ei);
    var wrap = document.getElementById('rd-' + ci + '-' + ei);
    var clrBtn = document.getElementById('clrbtn-' + ci + '-' + ei);
    if (!form || !wrap) return;

    var fd = new FormData(form);
    var opts = { method: method.toUpperCase() };
    var fullPath = endpoint;

    if (opts.method === 'GET') {
      var ps = new URLSearchParams();
      for (var pair of fd.entries()) {
        if (pair[1]) ps.append(pair[0], pair[1]);
      }
      var qs2 = ps.toString();
      if (qs2) fullPath += (endpoint.includes('?') ? '&' : '?') + qs2;
    } else {
      opts.headers = { 'Content-Type': 'application/json' };
      var obj = {};
      for (var p of fd.entries()) { obj[p[0]] = p[1]; }
      opts.body = JSON.stringify(obj);
    }

    var copyUrl = window.location.origin + fullPath;

    wrap.style.display = 'block';
    wrap.innerHTML =
      '<div class="res-section">' +
        '<div class="res-block-head">' +
          '<span class="res-block-title">Request URL</span>' +
          '<button class="copy-btn" id="cpurl-' + ci + '-' + ei + '">Copy</button>' +
        '</div>' +
        '<div class="code-box">' +
          '<div class="res-code-content">' + esc(copyUrl) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="res-section">' +
        '<div class="res-block-head">' +
          '<span class="res-block-title">Response</span>' +
          '<button class="copy-btn" id="cpres-' + ci + '-' + ei + '">Copy</button>' +
        '</div>' +
        '<div class="code-box">' +
          '<div id="rsbody-' + ci + '-' + ei + '">' +
            '<div class="res-loader"><span class="spin-ring"></span>Processing...</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var cpUrl = document.getElementById('cpurl-' + ci + '-' + ei);
    var cpRes = document.getElementById('cpres-' + ci + '-' + ei);
    var body = document.getElementById('rsbody-' + ci + '-' + ei);

    if (cpUrl) cpUrl.addEventListener('click', function () { copyText(copyUrl, cpUrl); });

    fetch(fullPath, opts).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (ct.startsWith('image/')) {
        return r.blob().then(function (b) {
          body.innerHTML = '<img class="res-img" src="' + URL.createObjectURL(b) + '">';
          if (cpRes) cpRes.addEventListener('click', function () { toast('Cannot copy image'); });
        });
      }
      return r.text().then(function (t) {
        var pretty = t;
        try {
          pretty = JSON.stringify(JSON.parse(t), null, 2);
        } catch (err) {}
        body.innerHTML = '<div class="res-code-content">' + syntaxJSON(esc(pretty)) + '</div>';
        if (cpRes) cpRes.addEventListener('click', function () { copyText(pretty, cpRes); });
      });
    }).catch(function (err) {
      body.innerHTML = '<div class="res-code-content" style="color:#f87171">' + esc(String(err)) + '</div>';
    }).finally(function () {
      if (clrBtn) clrBtn.style.display = 'inline-flex';
    });
  };

  async function loadApis() {
    var list = document.getElementById('apiList');
    try {
      var res = await fetch('/config');
      var cfg = await res.json();
      var s = cfg.settings || {};
      var tags = cfg.tags || {};

      if (s.apiName) {
        document.getElementById('api-name').textContent = s.apiName;
        document.getElementById('hero-name').textContent = s.apiName;
        document.title = s.apiName;
      }
      if (s.description) document.getElementById('hero-desc').textContent = s.description;
      if (s.github) document.getElementById('link-github').href = s.github;
      if (s.youtube) document.getElementById('link-youtube').href = s.youtube;
      if (s.whatsapp) document.getElementById('link-whatsapp').href = s.whatsapp;

      var html = '';
      var ci = 0;

      for (var catName in tags) {
        var routes = tags[catName];
        var catIcon = 'fa-folder';

        html += '<div class="cat-group" data-category="' + esc(catName) + '" data-ci="' + ci + '">' +
          '<div class="cat-card">' +
            '<button class="cat-btn" onclick="toggleCat(' + ci + ')">' +
              '<div class="cat-btn-left">' +
                '<div class="cat-icon"><i class="fa ' + catIcon + '"></i></div>' +
                '<span class="cat-name">' + esc(catName) + '</span>' +
                '<span class="cat-count">' + routes.length + '</span>' +
              '</div>' +
              '<i class="fa fa-chevron-down cat-chev" id="cc-' + ci + '"></i>' +
            '</button>' +
            '<div class="cat-body" id="cb-' + ci + '">';

        routes.forEach(function (item, ei) {
          var fields = '';
          if (item.params && item.params.length) {
            item.params.forEach(function (param) {
              fields += '<div class="field">' +
                '<div class="flabel">' + esc(param.name.toUpperCase()) + (param.required ? '<span class="req">*</span>' : '') + '</div>' +
                '<input class="fi" type="text" name="' + esc(param.name) + '" placeholder="' + esc(param.description || '') + '"' + (param.required ? ' required' : '') + '>' +
                (param.description ? '<div class="fhint">' + esc(param.description) + '</div>' : '') +
              '</div>';
            });
          }

          var curlHtml = buildCurlHtml(item.endpoint, item.params, item.method);
          var curlRaw = buildCurlRaw(item.endpoint, item.params, item.method);
          var curlId = 'curlcopy-' + ci + '-' + ei;

          html += '<div class="ep-item" data-path="' + esc(item.endpoint) + '" data-name="' + esc(item.name) + '">' +
            '<button class="ep-btn" onclick="toggleEp(' + ci + ',' + ei + ')">' +
              '<div class="ep-btn-left">' +
                '<span class="mbadge m' + esc(item.method || 'GET') + '">' + esc(item.method || 'GET') + '</span>' +
                '<div class="ep-info">' +
                  '<span class="ep-path">' + esc(item.endpoint) + '</span>' +
                  '<span class="ep-sub">' + esc(item.name) + '</span>' +
                '</div>' +
              '</div>' +
              '<i class="fa fa-chevron-down ep-chev" id="ec-' + ci + '-' + ei + '"></i>' +
            '</button>' +
            '<div class="ep-body" id="eb-' + ci + '-' + ei + '">' +
              (item.description ? '<p class="ep-desc">' + esc(item.description) + '</p>' : '') +
              '<div class="try-panel">' +
                '<div class="try-head"><i class="fa fa-terminal"></i>Try it out</div>' +
                '<form id="frm-' + ci + '-' + ei + '" onsubmit="execReq(event,' + ci + ',' + ei + ',\'' + esc(item.method || 'GET') + '\',\'' + esc(item.endpoint) + '\')">' +
                  fields +
                  '<div class="form-acts">' +
                    '<button class="btn-exec" type="submit">Execute</button>' +
                    '<button class="btn-clr" type="button" id="clrbtn-' + ci + '-' + ei + '" style="display:none" onclick="clearRes(' + ci + ',' + ei + ')">Clear</button>' +
                  '</div>' +
                '</form>' +
              '</div>' +
              '<div class="curl-section">' +
                '<div class="section-label">cURL</div>' +
                '<div class="code-box">' +
                  '<div class="code-topbar">' +
                    '<div class="code-dots"><div class="dot dot-r"></div><div class="dot dot-y"></div><div class="dot dot-g"></div></div>' +
                    '<span class="code-lang">bash</span>' +
                    '<button class="copy-btn" id="' + curlId + '" onclick="copyText(\`' + curlRaw.replace(/`/g, '\\`') + '\`, document.getElementById(\'' + curlId + '\'))">Copy</button>' +
                  '</div>' +
                  '<div class="code-content">' + curlHtml + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="res-wrap" id="rd-' + ci + '-' + ei + '" style="display:none"></div>' +
            '</div>' +
          '</div>';
        });

        html += '</div></div></div>';
        ci++;
      }

      list.innerHTML = html;

    } catch (err) {
      list.innerHTML = '<div style="padding:24px;text-align:center;color:#f87171;font-size:13px">Failed to load API data.</div>';
    }
  }

  document.getElementById('searchInput').addEventListener('input', function () {
    var q = this.value.toLowerCase();
    var items = document.querySelectorAll('.ep-item');
    var groups = document.querySelectorAll('.cat-group');
    var vis = 0;

    items.forEach(function (item) {
      var path = (item.dataset.path || '').toLowerCase();
      var name = (item.dataset.name || '').toLowerCase();
      var match = !q || path.includes(q) || name.includes(q);
      item.style.display = match ? '' : 'none';
      if (match) vis++;
    });

    groups.forEach(function (g) {
      var any = Array.from(g.querySelectorAll('.ep-item')).some(function (i) {
        return i.style.display !== 'none';
      });
      g.style.display = any ? '' : 'none';
      if (q && any) {
        var idx = g.dataset.ci;
        var body = document.getElementById('cb-' + idx);
        var chev = document.getElementById('cc-' + idx);
        if (body && !body.classList.contains('open')) {
          body.classList.add('open');
          if (chev) chev.classList.add('open');
        }
      }
    });

    document.getElementById('noResults').style.display = (!q || vis > 0) ? 'none' : 'block';
  });

  loadApis();
})();
