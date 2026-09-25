;(function () {
  if (window.__kkApparelSwatchColor) return
  window.__kkApparelSwatchColor = true

  var FAC_SRC =
    'https://cdn.jsdelivr.net/npm/fast-average-color@9.4.0/dist/index.browser.min.js'
  var CACHE_KEY = 'kk_apparel_swatch_hex_v1'
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

  function isVeryDark(hex) {
    var h = String(hex || '').replace('#', '')
    if (h.length !== 6) return false
    var r = parseInt(h.slice(0, 2), 16)
    var g = parseInt(h.slice(2, 4), 16)
    var b = parseInt(h.slice(4, 6), 16)
    return (r + g + b) / 3 < 40
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

  function loadFac() {
    if (window.FastAverageColor) return Promise.resolve()
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-kk-fac]')
      if (existing) {
        existing.addEventListener('load', function () {
          resolve()
        })
        existing.addEventListener('error', reject)
        return
      }
      var s = document.createElement('script')
      s.src = FAC_SRC
      s.async = true
      s.setAttribute('data-kk-fac', '1')
      s.onload = function () {
        resolve()
      }
      s.onerror = reject
      document.head.appendChild(s)
    })
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

  function colorFromImage(url, label) {
    var cache = readCache()
    if (cache[url]) return Promise.resolve(cache[url])
    if (!window.FastAverageColor) {
      return Promise.resolve(hexFromName(label))
    }

    var fac = new window.FastAverageColor()
    return loadImage(url)
      .then(function (img) {
        var color = fac.getColor(img, {
          algorithm: 'dominant',
          mode: 'precision',
          silent: true,
          left: Math.round(img.naturalWidth * 0.22),
          top: Math.round(img.naturalHeight * 0.22),
          width: Math.round(img.naturalWidth * 0.56),
          height: Math.round(img.naturalHeight * 0.56),
          ignoredColor: [
            [255, 255, 255, 255, 40],
            [0, 0, 0, 0, 0],
          ],
        })
        fac.destroy()
        var hex = color && color.hex
        var labelLc = String(label || '').toLowerCase()
        if (
          hex &&
          isVeryDark(hex) &&
          /white|wht|ivory|cream|natural/.test(labelLc)
        ) {
          hex = '#f4f4f4'
        }
        if (hex) {
          cache[url] = hex
          writeCache(cache)
          return hex
        }
        return hexFromName(label)
      })
      .catch(function () {
        try {
          fac.destroy()
        } catch (e) {}
        return hexFromName(label)
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

    return loadFac()
      .catch(function () {})
      .then(function () {
        var chain = Promise.resolve()
        buttons.forEach(function (btn) {
          btn.setAttribute('data-swatch-done', '1')
          var url = btn.getAttribute('data-swatch-src') || ''
          var label =
            btn.getAttribute('title') || btn.getAttribute('data-color-lc') || ''
          chain = chain.then(function () {
            var named = hexFromName(label)
            if (!url) {
              paint(btn, named || '#d1d5db')
              return
            }
            return colorFromImage(url, label).then(function (hex) {
              paint(btn, hex || named || '#d1d5db')
            })
          })
        })
        return chain
      })
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
