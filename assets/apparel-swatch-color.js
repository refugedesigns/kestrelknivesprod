;(function () {
  if (window.__kkApparelSwatchColor) return
  window.__kkApparelSwatchColor = true

  var CACHE_KEY = 'kk_apparel_swatch_hex_v2'
  var NAME_HEX = {
    black: '#1a1a1a',
    charcoal: '#36454f',
    white: '#f4f4f4',
    wht: '#f4f4f4',
    ivory: '#f8f4ec',
    cream: '#f3ead6',
    natural: '#e8dcc8',
    oatmeal: '#d9cbb3',
    grey: '#8a8a8a',
    gray: '#8a8a8a',
    heather: '#9aa0a6',
    silver: '#c0c0c0',
    navy: '#1b2a4a',
    blue: '#2b4c7e',
    orange: '#e85d04',
    red: '#b91c1c',
    maroon: '#7f1d1d',
    burgundy: '#6b1d2a',
    green: '#3f6212',
    olive: '#556b2f',
    forest: '#1f3d2b',
    khaki: '#c3b091',
    tan: '#d2b48c',
    beige: '#d8c3a5',
    sand: '#d6c4a8',
    stone: '#b7b2a8',
    brown: '#6b4423',
    rust: '#b7410e',
    camo: '#5c6b4a',
    camouflage: '#5c6b4a',
  }

  function hexFromName(label) {
    var s = String(label || '').toLowerCase()
    var keys = Object.keys(NAME_HEX)
    for (var i = 0; i < keys.length; i++) {
      if (s.indexOf(keys[i]) !== -1) return NAME_HEX[keys[i]]
    }
    return ''
  }

  function luminance(hex) {
    var h = String(hex || '').replace('#', '')
    if (h.length === 3) {
      h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2)
    }
    if (h.length !== 6) return -1
    var r = parseInt(h.slice(0, 2), 16)
    var g = parseInt(h.slice(2, 4), 16)
    var b = parseInt(h.slice(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return -1
    return (r + g + b) / 3
  }

  function readCache() {
    try {
      return JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}')
    } catch (e) {
      return {}
    }
  }

  function writeCache(map) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(map))
    } catch (e) {}
  }

  function loadImage(url) {
    return new Promise(function (resolve, reject) {
      var img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = function () {
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  }

  function sampleRegion(fac, img, box) {
    try {
      return fac.getColor(img, {
        algorithm: 'dominant',
        mode: 'precision',
        silent: true,
        ignoredColor: [[255, 255, 255, 255, 48]],
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      })
    } catch (e) {
      return null
    }
  }

  function colorFromImage(url, label) {
    var named = hexFromName(label)
    if (named) return Promise.resolve(named)

    var cache = readCache()
    if (cache[url]) return Promise.resolve(cache[url])
    if (!window.FastAverageColor) return Promise.resolve('')

    var fac = new window.FastAverageColor()
    return loadImage(url)
      .then(function (img) {
        var w = img.naturalWidth || img.width || 1
        var h = img.naturalHeight || img.height || 1
        var side = sampleRegion(fac, img, {
          left: Math.round(w * 0.08),
          top: Math.round(h * 0.28),
          width: Math.max(1, Math.round(w * 0.16)),
          height: Math.max(1, Math.round(h * 0.42)),
        })
        var body = sampleRegion(fac, img, {
          left: Math.round(w * 0.2),
          top: Math.round(h * 0.55),
          width: Math.max(1, Math.round(w * 0.6)),
          height: Math.max(1, Math.round(h * 0.32)),
        })
        fac.destroy()

        var sideHex = side && side.hex
        var bodyHex = body && body.hex
        var sideLum = luminance(sideHex)
        var bodyLum = luminance(bodyHex)
        var hex = bodyHex || sideHex || ''
        if (bodyLum > 210 && sideLum >= 0 && sideLum < 100) hex = sideHex
        if (sideLum > 210 && bodyLum >= 0 && bodyLum < 100) hex = bodyHex

        var labelLc = String(label || '').toLowerCase()
        if (hex && luminance(hex) < 40 && /white|wht|ivory|cream|natural/.test(labelLc)) {
          hex = '#f4f4f4'
        }
        if (hex && luminance(hex) > 210 && /black|charcoal|navy/.test(labelLc)) {
          hex = hexFromName(label) || '#1a1a1a'
        }
        if (hex) {
          cache[url] = hex
          writeCache(cache)
          return hex
        }
        return ''
      })
      .catch(function () {
        try {
          fac.destroy()
        } catch (e) {}
        return ''
      })
  }

  function paint(btn, hex) {
    var fill = btn.querySelector('[data-swatch-fill]')
    if (fill && hex) fill.style.backgroundColor = hex
  }

  function process(root) {
    var buttons = (root || document).querySelectorAll(
      '[data-swatch-src]:not([data-swatch-done])'
    )
    if (!buttons.length) return Promise.resolve()

    var chain = Promise.resolve()
    buttons.forEach(function (btn) {
      btn.setAttribute('data-swatch-done', '1')
      var url = btn.getAttribute('data-swatch-src') || ''
      var label =
        btn.getAttribute('title') || btn.getAttribute('data-color-lc') || ''
      var named = hexFromName(label)
      if (named || !url) {
        paint(btn, named || '#d1d5db')
        return
      }
      chain = chain.then(function () {
        return colorFromImage(url, label).then(function (hex) {
          paint(btn, hex || '#d1d5db')
        })
      })
    })
    return chain
  }

  function boot() {
    process(document)
    if (!window.MutationObserver || !document.body) return
    var scheduled = false
    var mo = new MutationObserver(function () {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(function () {
        scheduled = false
        process(document)
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
