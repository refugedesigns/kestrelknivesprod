;(function () {
  if (window.__kkApparelSwatchColor) return
  window.__kkApparelSwatchColor = true

  var CACHE_KEY = 'kk_apparel_swatch_hex_v4'
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

  function isHeadwear(btn) {
    var card = btn.closest('[data-product]') || btn.closest('.product-card')
    var title = ''
    if (card) {
      try {
        var data = JSON.parse(card.getAttribute('data-product') || '{}')
        title = String(data.title || data.handle || '')
      } catch (e) {}
      if (!title) {
        var heading = card.querySelector('h2')
        title = heading ? heading.textContent : ''
      }
    }
    return /hat|beanie|cap\b|trucker/.test(String(title).toLowerCase())
  }

  function sampleRegion(fac, img, box) {
    try {
      var options = {
        algorithm: 'dominant',
        mode: 'precision',
        silent: true,
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }
      if (box.ignoredColor) options.ignoredColor = box.ignoredColor
      return fac.getColor(img, options)
    } catch (e) {
      return null
    }
  }

  function colorFromImage(url, label, lower) {
    var cache = readCache()
    var cacheId = (lower ? 'low:' : 'mid:') + url
    if (cache[cacheId]) return Promise.resolve(cache[cacheId])
    if (!window.FastAverageColor) return Promise.resolve(hexFromName(label))

    var fac = new window.FastAverageColor()
    return loadImage(url)
      .then(function (img) {
        var w = img.naturalWidth || img.width || 1
        var h = img.naturalHeight || img.height || 1
        var color = sampleRegion(
          fac,
          img,
          lower
            ? {
                left: Math.round(w * 0.32),
                top: Math.round(h * 0.62),
                width: Math.max(1, Math.round(w * 0.36)),
                height: Math.max(1, Math.round(h * 0.22)),
              }
            : {
                left: Math.round(w * 0.22),
                top: Math.round(h * 0.22),
                width: Math.max(1, Math.round(w * 0.56)),
                height: Math.max(1, Math.round(h * 0.56)),
                ignoredColor: [[255, 255, 255, 255, 40]],
              }
        )
        fac.destroy()

        var hex = (color && color.hex) || ''
        if (hex) {
          cache[cacheId] = hex
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

    var chain = Promise.resolve()
    buttons.forEach(function (btn) {
      btn.setAttribute('data-swatch-done', '1')
      var url = btn.getAttribute('data-swatch-src') || ''
      var label =
        btn.getAttribute('title') || btn.getAttribute('data-color-lc') || ''
      if (!url) {
        paint(btn, hexFromName(label) || '#d1d5db')
        return
      }
      var lower = !isHeadwear(btn)
      chain = chain.then(function () {
        return colorFromImage(url, label, lower).then(function (hex) {
          paint(btn, hex || hexFromName(label) || '#d1d5db')
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
