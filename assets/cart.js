;(function () {
  function copyProperties(value) {
    if (!value || typeof value !== 'object') return null
    const properties = {}
    Object.keys(value).forEach(function (key) {
      if (value[key] == null || value[key] === '') return
      properties[key] = value[key]
    })
    return Object.keys(properties).length ? properties : null
  }

  async function add(options) {
    const opts = options || {}
    const payload = {
      id: opts.id,
      quantity: opts.quantity == null ? 1 : opts.quantity,
    }
    const properties = copyProperties(opts.properties)
    if (properties) payload.properties = properties
    if (opts.sellingPlanId) payload.selling_plan = Number(opts.sellingPlanId)

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error('Failed to add to cart')

    if (opts.refresh !== false) {
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
    if (opts.open !== false) {
      window.dispatchEvent(new CustomEvent('open-cart'))
    }
    return response
  }

  window.kkCart = { add: add }
})()
