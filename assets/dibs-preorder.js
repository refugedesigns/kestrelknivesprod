(function () {
  const cache = new Map();

  function parseGid(gid) {
    if (gid == null || gid === '') return null;
    const str = String(gid);
    const match = str.match(/\/(\d+)$/);
    if (match) return Number(match[1]);
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  }

  function interpolate(template, plan) {
    const amount =
      plan.price ||
      (plan.checkoutCharge && plan.checkoutCharge.amountWithCurrency) ||
      (plan.checkoutCharge && plan.checkoutCharge.amount) ||
      '';
    const date = plan.remainingBalanceDue || '';
    return String(template || '')
      .replace(/\{\{amount\}\}/g, amount)
      .replace(/\{\{date\}\}/g, date);
  }

  function normalizePlan(plan) {
    const contents =
      (plan.sellingPlanGroup && plan.sellingPlanGroup.contents) || {};
    const card = contents.planSelectorCard || {};
    const isPartial = plan.paymentModeType === 'partial';

    return {
      id: parseGid(plan.id),
      isDefault: !!plan.isDefault,
      paymentModeType: plan.paymentModeType || 'full',
      name: plan.name || 'Preorder',
      badge: contents.badge || 'Preorder Available',
      submitButton: contents.submitButton || 'Preorder Now!',
      optionLabel:
        interpolate(
          isPartial
            ? card.partialPaymentOptionLabel
            : card.fullPaymentOptionLabel,
          plan
        ) || plan.name || 'Preorder',
      optionDescription: interpolate(
        isPartial
          ? card.partialPaymentOptionDescription
          : card.fullPaymentOptionDescription,
        plan
      ),
      purchaseTerms: card.purchaseTerms || '',
    };
  }

  function getVariantPlans(dibsProduct, variantId) {
    if (!dibsProduct || variantId == null) return [];
    const numericId = Number(variantId);
    const variant = (dibsProduct.variants || []).find(function (v) {
      return parseGid(v.id) === numericId;
    });
    if (!variant || !variant.applicableSellingPlans) return [];
    return (variant.applicableSellingPlans || [])
      .map(normalizePlan)
      .filter(function (p) {
        return p.id != null;
      });
  }

  function pickDefaultPlanId(plans) {
    if (!plans || !plans.length) return null;
    const def = plans.find(function (p) {
      return p.isDefault;
    });
    return (def || plans[0]).id;
  }

  function waitForApi(maxAttempts) {
    return new Promise(function (resolve) {
      var attempts = 0;
      function check() {
        if (typeof lbOrdereasyGetProducts === 'function') {
          resolve(true);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        setTimeout(check, 250);
      }
      check();
    });
  }

  async function fetchProduct(handle) {
    if (!handle) return null;
    if (cache.has(handle)) return cache.get(handle);

    const ready = await waitForApi(40);
    if (!ready) return null;

    try {
      const result = await lbOrdereasyGetProducts({
        productHandles: [handle],
      });
      const product = Array.isArray(result) ? result[0] : result;
      cache.set(handle, product || null);
      return product || null;
    } catch (e) {
      console.error('[Dibs] fetch failed for', handle, e);
      cache.set(handle, null);
      return null;
    }
  }

  function syncPlanSelection(plans, currentId) {
    if (!plans.length) return null;
    if (currentId && plans.some(function (p) { return p.id === currentId; })) {
      return currentId;
    }
    return pickDefaultPlanId(plans);
  }

  function getWidgetSellingPlanId(scope) {
    const root = scope || document;
    const searchRoots = [];

    if (root && root.querySelectorAll) {
      searchRoots.push(root);
      root.querySelectorAll(
        '[class*="lb-ordereasy"], [id*="lb-ordereasy"], [class*="ordereasy"], [data-lb-ordereasy]'
      ).forEach(function (el) {
        searchRoots.push(el);
      });
    }

    const selectors = [
      'input[name="selling_plan"]:checked',
      'input[name="selling_plan"]',
      'input[name="purchase_option"]:checked',
      'input[type="radio"][name*="selling_plan"]:checked',
      'input[type="radio"][name*="selling-plan"]:checked',
      'select[name="selling_plan"]',
    ];

    for (var i = 0; i < searchRoots.length; i++) {
      var searchRoot = searchRoots[i];
      for (var j = 0; j < selectors.length; j++) {
        var el = searchRoot.querySelector(selectors[j]);
        if (!el || el.value == null || el.value === '') continue;
        var id = parseGid(el.value);
        if (id) return id;
      }
    }

    return null;
  }

  function resolveSellingPlanId(plans, scope) {
    if (!plans || !plans.length) return null;
    const fromWidget = getWidgetSellingPlanId(scope);
    if (fromWidget && plans.some(function (p) { return p.id === fromWidget; })) {
      return fromWidget;
    }
    return pickDefaultPlanId(plans);
  }

  function createState() {
    return {
      dibsProduct: null,
      dibsSelectedPlanId: null,
      dibsQvSelectedPlanId: null,
      dibsLoadAttempts: 0,

      productHasPreorderPlans(dibsProduct) {
        if (!dibsProduct || !dibsProduct.variants) return false;
        return dibsProduct.variants.some(function (variant) {
          return (
            variant.applicableSellingPlans &&
            variant.applicableSellingPlans.length > 0
          );
        });
      },

      get dibsVariantPlans() {
        const handle = this.productData && this.productData.handle;
        if (!handle || !this.dibsProduct) return [];
        const variantId =
          this.selectedVariant != null
            ? this.selectedVariant
            : this.qvSelectedVariantId;
        return getVariantPlans(this.dibsProduct, variantId);
      },

      get qvDibsVariantPlans() {
        if (!this.dibsProduct) return [];
        const variantId =
          this.qvSelectedVariantId != null
            ? this.qvSelectedVariantId
            : this.selectedVariant;
        return getVariantPlans(this.dibsProduct, variantId);
      },

      get dibsHasPreorder() {
        if (!this.dibsProduct) return false;
        if (this.dibsVariantPlans.length > 0) return true;
        return this.productHasPreorderPlans(this.dibsProduct);
      },

      get qvDibsHasPreorder() {
        if (!this.dibsProduct) return false;
        return this.qvDibsVariantPlans.length > 0;
      },

      get dibsSelectedPlan() {
        const plans = this.dibsVariantPlans;
        if (!plans.length) return null;
        const planId = resolveSellingPlanId(
          plans,
          (this.$el && this.$el.closest('form')) || this.$el || document
        );
        return plans.find(function (p) { return p.id === planId; }) || plans[0];
      },

      get qvDibsSelectedPlan() {
        const plans = this.qvDibsVariantPlans;
        if (!plans.length) return null;
        const planId = resolveSellingPlanId(plans, this.$el || document);
        return plans.find(function (p) { return p.id === planId; }) || plans[0];
      },

      get dibsBadgeText() {
        const plan = this.dibsSelectedPlan;
        return plan ? plan.badge : '';
      },

      get dibsButtonText() {
        const plan = this.dibsSelectedPlan;
        return plan ? plan.submitButton : 'PRE ORDER';
      },

      get qvDibsButtonText() {
        const plan = this.qvDibsSelectedPlan;
        return plan ? plan.submitButton : 'PRE ORDER';
      },

      get cardAddToCartLabel() {
        return this.dibsHasPreorder ? '+ PRE ORDER' : '+ ADD TO CART';
      },

      get qvAddToCartLabel() {
        if (!this.qvCanPurchase) return 'SOLD OUT';
        return this.qvDibsHasPreorder ? 'PRE ORDER' : 'Add to Cart';
      },

      get canPurchase() {
        return !!this.isAvailable || this.dibsHasPreorder;
      },

      get qvCanPurchase() {
        if (this.productData && this.productData.available === false && !this.qvDibsHasPreorder) {
          return false;
        }
        if (this.qvSelectedVariantObj) {
          return !!this.qvSelectedVariantObj.available || this.qvDibsHasPreorder;
        }
        return !!this.isAvailable || this.qvDibsHasPreorder;
      },

      syncDibsPlanSelection() {
        this.dibsSelectedPlanId = syncPlanSelection(
          this.dibsVariantPlans,
          this.dibsSelectedPlanId
        );
      },

      syncQvDibsPlanSelection() {
        this.dibsQvSelectedPlanId = syncPlanSelection(
          this.qvDibsVariantPlans,
          this.dibsQvSelectedPlanId
        );
      },

      async loadDibsPreorder() {
        const handle = this.productData && this.productData.handle;
        if (!handle || !window.KKDibsPreorder) return;
        this.dibsProduct = await window.KKDibsPreorder.fetchProduct(handle);
        this.syncDibsPlanSelection();
        this.syncQvDibsPlanSelection();
        if (!this.dibsProduct && this.dibsLoadAttempts < 4) {
          this.dibsLoadAttempts += 1;
          setTimeout(() => this.loadDibsPreorder(), 1000);
        }
      },

      getDibsSellingPlanId() {
        if (!this.dibsVariantPlans.length) return null;
        return resolveSellingPlanId(
          this.dibsVariantPlans,
          (this.$el && this.$el.closest('form')) || this.$el || document
        );
      },

      getQvDibsSellingPlanId() {
        if (!this.qvDibsVariantPlans.length) return null;
        return resolveSellingPlanId(this.qvDibsVariantPlans, this.$el || document);
      },
    };
  }

  async function addToCartWithPlan(
    variantId,
    quantity,
    sellingPlanId,
    source,
    propsOverride
  ) {
    const cartSheet = document.querySelector('[x-data*="cartSheet"]');
    if (
      cartSheet &&
      cartSheet._x_dataStack &&
      cartSheet._x_dataStack[0] &&
      typeof cartSheet._x_dataStack[0].addToCart === 'function'
    ) {
      await cartSheet._x_dataStack[0].addToCart(
        variantId,
        quantity,
        source || 'unknown',
        propsOverride,
        sellingPlanId
      );
      return true;
    }

    const payload = { id: variantId, quantity: quantity || 1, properties: {} };
    if (sellingPlanId) payload.selling_plan = Number(sellingPlanId);

    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to add to cart');
    window.dispatchEvent(new CustomEvent('open-cart'));
    return true;
  }

  window.KKDibsPreorder = {
    parseGid: parseGid,
    fetchProduct: fetchProduct,
    getVariantPlans: getVariantPlans,
    normalizePlan: normalizePlan,
    pickDefaultPlanId: pickDefaultPlanId,
    syncPlanSelection: syncPlanSelection,
    getWidgetSellingPlanId: getWidgetSellingPlanId,
    resolveSellingPlanId: resolveSellingPlanId,
    createState: createState,
    addToCartWithPlan: addToCartWithPlan,
  };
})();
