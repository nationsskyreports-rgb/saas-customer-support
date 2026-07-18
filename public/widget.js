
(function () {
  'use strict'
  if (window.__NOS_WIDGET_LOADED__) return
  window.__NOS_WIDGET_LOADED__ = true

  // ── Config from the <script> tag ──
  var script = document.currentScript
  var color = (script && script.getAttribute('data-color')) || '#00B69B'
  var position = (script && script.getAttribute('data-position')) === 'left' ? 'left' : 'right'
  var title = (script && script.getAttribute('data-title')) || 'Nations Of Sky'
  // Smart auto-open: seconds before the widget opens by itself with a teaser
  // prompt (lead capture). data-auto-open="off" disables it. Default: 15s.
  var autoOpenRaw = (script && script.getAttribute('data-auto-open')) || '15'
  var autoOpenSec = autoOpenRaw === 'off' ? 0 : Math.max(0, parseInt(autoOpenRaw, 10) || 0)
  var promptText = (script && script.getAttribute('data-prompt')) || ''

  // Origin = wherever widget.js was served from
  var origin = ''
  try {
    origin = new URL(script.src).origin
  } catch (e) {
    origin = window.location.origin
  }
  var frameUrl =
    origin + '/widget?title=' + encodeURIComponent(title) + '&color=' + encodeURIComponent(color) +
    '&page=' + encodeURIComponent(document.title || '') +
    '&pageurl=' + encodeURIComponent(window.location.href) +
    (promptText ? '&prompt=' + encodeURIComponent(promptText) : '')

  // ── Styles ──
  var css = [
    '.nosw-btn{position:fixed;bottom:20px;' + position + ':20px;width:58px;height:58px;border-radius:50%;',
    'background:' + color + ';border:none;cursor:pointer;z-index:2147483000;display:flex;align-items:center;',
    'justify-content:center;box-shadow:0 6px 24px rgba(0,0,0,.22);transition:transform .18s ease, box-shadow .18s ease;}',
    '.nosw-btn:hover{transform:scale(1.07);box-shadow:0 10px 30px rgba(0,0,0,.28);}',
    '.nosw-btn svg{width:27px;height:27px;fill:#fff;transition:opacity .15s;}',
    '.nosw-badge{position:absolute;top:-4px;' + position + ':-4px;min-width:20px;height:20px;border-radius:10px;',
    'background:#EF4444;color:#fff;font:700 11px/20px -apple-system,Segoe UI,Roboto,sans-serif;text-align:center;',
    'padding:0 5px;box-shadow:0 2px 6px rgba(0,0,0,.25);display:none;}',
    '.nosw-frame-wrap{position:fixed;bottom:92px;' + position + ':20px;width:380px;height:600px;max-height:calc(100vh - 110px);',
    'z-index:2147483000;border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(13,35,67,.30);',
    'opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .22s ease, transform .22s ease;background:#fff;}',
    '.nosw-frame-wrap.nosw-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}',
    '.nosw-frame-wrap iframe{width:100%;height:100%;border:0;display:block;}',
    '@media (max-width:480px){.nosw-frame-wrap{bottom:0;' + position + ':0;width:100%;height:100%;max-height:100%;border-radius:0;}}',
  ].join('')
  var style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  // ── Floating button ──
  var chatIcon =
    '<svg viewBox="0 0 24 24"><path d="M12 3C6.5 3 2 6.9 2 11.7c0 2.7 1.4 5.1 3.6 6.7-.1.9-.5 2.3-1.5 3.4 0 0 2.4-.3 4.3-1.6 1.1.3 2.3.5 3.6.5 5.5 0 10-3.9 10-8.9S17.5 3 12 3z"/></svg>'
  var closeIcon =
    '<svg viewBox="0 0 24 24"><path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 0 0 5.7 7.1l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/></svg>'

  var btn = document.createElement('button')
  btn.className = 'nosw-btn'
  btn.setAttribute('aria-label', 'Open live chat')
  btn.innerHTML = chatIcon
  var badge = document.createElement('span')
  badge.className = 'nosw-badge'
  btn.appendChild(badge)
  document.body.appendChild(btn)

  // ── Iframe (created lazily on first open for page-speed) ──
  var wrap = document.createElement('div')
  wrap.className = 'nosw-frame-wrap'
  document.body.appendChild(wrap)
  var frame = null
  var open = false
  var unread = 0

  function ensureFrame() {
    if (frame) return
    frame = document.createElement('iframe')
    frame.src = frameUrl
    frame.setAttribute('title', title + ' live chat')
    frame.setAttribute('allow', 'clipboard-write')
    wrap.appendChild(frame)
  }

  function setUnread(n) {
    unread = n
    badge.textContent = n > 9 ? '9+' : String(n)
    badge.style.display = n > 0 ? 'block' : 'none'
  }

  function toggle(force) {
    open = typeof force === 'boolean' ? force : !open
    if (open) {
      ensureFrame()
      wrap.classList.add('nosw-open')
      btn.innerHTML = closeIcon
      btn.appendChild(badge)
      setUnread(0)
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'nos-widget:opened' }, origin)
      }
    } else {
      wrap.classList.remove('nosw-open')
      btn.innerHTML = chatIcon
      btn.appendChild(badge)
    }
  }

  btn.addEventListener('click', function () { toggle() })

  // ── Messages from the chat iframe ──
  window.addEventListener('message', function (e) {
    if (e.origin !== origin || !e.data || typeof e.data !== 'object') return
    if (e.data.type === 'nos-widget:unread' && !open) setUnread(unread + 1)
    if (e.data.type === 'nos-widget:close') toggle(false)
  })

  // ── Smart auto-open (lead capture) ──
  // Opens the widget by itself after N seconds — once per 24h per browser,
  // and never if the visitor already opened it themselves.
  if (autoOpenSec > 0) {
    var KEY = 'nosw_auto_shown'
    var last = 0
    try { last = parseInt(localStorage.getItem(KEY) || '0', 10) } catch (e) {}
    if (Date.now() - last > 24 * 60 * 60 * 1000) {
      setTimeout(function () {
        if (open) return // visitor already opened it — don't interfere
        try { localStorage.setItem(KEY, String(Date.now())) } catch (e) {}
        toggle(true)
      }, autoOpenSec * 1000)
    }
  }
})()
