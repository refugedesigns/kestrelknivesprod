(function () {
  const cache = new Map();
  let apiReadyDispatched = false;
  let globalBadgeObserverStarted = false;

  function parseGid(gid) {
    if (gid == null || gid === '') return null;
    const str = String(gid);
    const match = str.match(/\/(\d+)$/);
    if (match) return Number(match[1]);
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  }

  function variantIdsMatch(a, b) {
    const idA = parseGid(a);
    const idB = parseGid(b);
    if (idA != null && idB != null) return idA === idB;
    return String(a) === String(b);
  }

  function getProductVariants(dibsProduct) {
    if (!dibsProduct) return [];
    if (Array.isArray(dibsProduct.variants) && dibsProduct.variants.length) {
      return dibsProduct.variants;
    }
    if (
      Array.isArray(dibsProduct.applicableVariants) &&
      dibsProduct.applicableVariants.length
    ) {
      return dibsProduct.applicableVariants;
    }
    return [];
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
    const variants = getProductVariants(dibsProduct);
    const variant = variants.find(function (v) {
      return variantIdsMatch(v.id, variantId);
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
          if (!apiReadyDispatched) {
            apiReadyDispatched = true;
            window.dispatchEvent(new CustomEvent('kk-dibs-api-ready'));
          }
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

    const ready = await waitForApi(80);
    if (!ready) return null;

    try {
      const result = await lbOrdereasyGetProducts({
        productHandles: [handle],
      });
      const product = Array.isArray(result) ? result[0] : result;
      if (product && product.handle) {
        cache.set(product.handle, product);
      }
      return product || null;
    } catch (e) {
      console.error('[Dibs] fetch failed for', handle, e);
      return null;
    }
  }

  function parseProductHandleFromElement(el) {
    if (!el) return null;
    try {
      const raw = el.getAttribute('data-product') || '{}';
      const txt = document.createElement('textarea');
      txt.innerHTML = raw;
      const product = JSON.parse(txt.value);
      return product && product.handle ? product.handle : null;
    } catch (e) {
      return null;
    }
  }

  function refreshCardFromElement(cardEl, attempt) {
    if (!cardEl) return;
    attempt = attempt || 0;

    if (!cardEl._x_dataStack || !cardEl._x_dataStack[0]) {
      if (attempt < 30) {
        setTimeout(function () {
          refreshCardFromElement(cardEl, attempt + 1);
        }, 200);
      }
      return;
    }

    const state = cardEl._x_dataStack[0];
    state.dibsBadgeDetected = true;
    if (typeof state.refreshPurchaseState === 'function') {
      state.refreshPurchaseState();
    }
    if (typeof state.loadDibsPreorder === 'function') {
      state.loadDibsPreorder();
    }
  }

  function initGlobalBadgeObserver() {
    if (globalBadgeObserverStarted) return;
    globalBadgeObserverStarted = true;

    document
      .querySelectorAll('[data-product] .lb-ordereasy-product-list-badge')
      .forEach(function (badge) {
        refreshCardFromElement(badge.closest('[data-product]'));
      });

    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;

          if (node.classList && node.classList.contains('lb-ordereasy-product-list-badge')) {
            refreshCardFromElement(node.closest('[data-product]'));
            return;
          }

          if (node.querySelectorAll) {
            node
              .querySelectorAll('.lb-ordereasy-product-list-badge')
              .forEach(function (badge) {
                refreshCardFromElement(badge.closest('[data-product]'));
              });
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  async function prefetchCardProducts() {
    const handles = [];
    document.querySelectorAll('[data-product]').forEach(function (el) {
      const handle = parseProductHandleFromElement(el);
      if (handle && handles.indexOf(handle) === -1) handles.push(handle);
    });
    if (!handles.length) return;

    const ready = await waitForApi(80);
    if (!ready) return;

    try {
      const result = await lbOrdereasyGetProducts({ productHandles: handles });
      if (!Array.isArray(result)) return;
      result.forEach(function (product) {
        if (product && product.handle) {
          cache.set(product.handle, product);
        }
      });
      window.dispatchEvent(new CustomEvent('kk-dibs-prefetch-ready'));
    } catch (e) {
      console.error('[Dibs] prefetch failed', e);
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
      'input.lb-ordereasy-payment-option-radio:checked',
      'input[name="payment"]:checked',
      'input[name="selling_plan"]:checked',
      'input[name="selling_plan"]',
      'input[name="purchase_option"]:checked',
      'input[type="radio"][name*="selling_plan"]:checked',
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

      var planContainer = searchRoot.querySelector(
        '[data-selected-selling-plan-id]'
      );
      if (planContainer) {
        var attrId = parseGid(
          planContainer.getAttribute('data-selected-selling-plan-id')
        );
        if (attrId) return attrId;
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
      dibsPreorderActive: false,
      dibsBadgeDetected: false,
      dibsListenersBound: false,
      canPurchase: false,
      cardHasPreorder: false,
      cardAddToCartLabel: '+ ADD TO CART',
      dibsPollTimer: null,

      productHasPreorderPlans(dibsProduct) {
        if (!dibsProduct) return false;
        return getProductVariants(dibsProduct).some(function (variant) {
          return (
            variant.applicableSellingPlans &&
            variant.applicableSellingPlans.length > 0
          );
        });
      },

      detectDibsBadgeOnCard() {
        if (!this.$el) return false;
        return !!this.$el.querySelector('.lb-ordereasy-product-list-badge');
      },

      bindDibsListeners() {
        if (this.dibsListenersBound) return;
        this.dibsListenersBound = true;

        const reload = () => {
          if (typeof this.loadDibsPreorder === 'function') {
            this.loadDibsPreorder();
          }
        };

        window.addEventListener('kk-dibs-prefetch-ready', reload);
        window.addEventListener('kk-dibs-api-ready', reload);
      },

      observeDibsWidget() {
        if (!this.$el) return;

        const sync = () => {
          if (this.detectDibsBadgeOnCard()) {
            this.dibsBadgeDetected = true;
            this.refreshPurchaseState();
            this.loadDibsPreorder();
          }
        };

        sync();

        const observer = new MutationObserver(sync);
        observer.observe(this.$el, {
          childList: true,
          subtree: true,
        });
      },

      startDibsPolling() {
        if (this.dibsPollTimer) return;
        let polls = 0;
        this.dibsPollTimer = setInterval(() => {
          polls += 1;
          this.refreshPurchaseState();
          if (this.canPurchase || polls >= 120) {
            clearInterval(this.dibsPollTimer);
            this.dibsPollTimer = null;
          }
        }, 1000);
      },

      get dibsVariantPlans() {
        if (!this.dibsProduct) return [];
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

      get hasDibsInjectedBadge() {
        return this.dibsBadgeDetected;
      },

      get dibsHasPreorder() {
        return this.dibsPreorderActive;
      },

      get qvDibsHasPreorder() {
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
        if (plan) return plan.badge;
        const badge = this.$el && this.$el.querySelector(
          '.lb-ordereasy-product-list-badge'
        );
        return badge ? badge.textContent.trim() : 'Preorder Available';
      },

      get qvAddToCartLabel() {
        if (!this.qvCanPurchase) return 'SOLD OUT';
        if (this.qvDibsHasPreorder) return 'PRE ORDER';
        return 'Add to Cart';
      },

      get qvCanPurchase() {
        if (this.qvSelectedVariantObj) {
          return (
            !!this.qvSelectedVariantObj.available || this.qvDibsHasPreorder
          );
        }
        return !!this.isAvailable || this.qvDibsHasPreorder;
      },

      refreshPurchaseState() {
        if (this.detectDibsBadgeOnCard()) {
          this.dibsBadgeDetected = true;
        }

        const plans = this.dibsVariantPlans;
        this.dibsPreorderActive = plans.length > 0;
        this.dibsSelectedPlanId = syncPlanSelection(
          plans,
          this.dibsSelectedPlanId
        );

        const hasProductPreorder = this.productHasPreorderPlans(this.dibsProduct);

        this.cardHasPreorder =
          this.dibsPreorderActive ||
          this.dibsBadgeDetected ||
          hasProductPreorder;

        this.canPurchase =
          !!this.isAvailable ||
          this.dibsPreorderActive ||
          this.dibsBadgeDetected ||
          hasProductPreorder;

        this.cardAddToCartLabel =
          this.dibsPreorderActive || this.dibsBadgeDetected || hasProductPreorder
            ? '+ PRE ORDER'
            : '+ ADD TO CART';
      },

      syncDibsPlanSelection() {
        this.syncDibsState();
      },

      syncDibsState() {
        this.refreshPurchaseState();
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

        this.bindDibsListeners();

        const cached = cache.get(handle);
        if (cached) {
          this.dibsProduct = cached;
        } else {
          this.dibsProduct = await window.KKDibsPreorder.fetchProduct(handle);
        }

        this.refreshPurchaseState();
        this.syncQvDibsPlanSelection();

        if (!this.dibsProduct && this.dibsLoadAttempts < 15) {
          this.dibsLoadAttempts += 1;
          setTimeout(() => this.loadDibsPreorder(), 1000);
        }
      },

      initDibsPreorder() {
        this.observeDibsWidget();
        this.loadDibsPreorder();
        this.refreshPurchaseState();
        this.startDibsPolling();
      },

      getDibsSellingPlanId() {
        const plans = this.dibsVariantPlans;
        if (!plans.length && this.dibsProduct) {
          const variants = getProductVariants(this.dibsProduct);
          for (let i = 0; i < variants.length; i++) {
            const fallbackPlans = (variants[i].applicableSellingPlans || [])
              .map(normalizePlan)
              .filter(function (p) { return p.id != null; });
            if (fallbackPlans.length) {
              return pickDefaultPlanId(fallbackPlans);
            }
          }
        }
        if (!plans.length) return null;
        return resolveSellingPlanId(
          plans,
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
    prefetchCardProducts: prefetchCardProducts,
    getVariantPlans: getVariantPlans,
    getProductVariants: getProductVariants,
    normalizePlan: normalizePlan,
    pickDefaultPlanId: pickDefaultPlanId,
    syncPlanSelection: syncPlanSelection,
    getWidgetSellingPlanId: getWidgetSellingPlanId,
    resolveSellingPlanId: resolveSellingPlanId,
    createState: createState,
    addToCartWithPlan: addToCartWithPlan,
    refreshCardFromElement: refreshCardFromElement,
  };

  function onReady() {
    initGlobalBadgeObserver();
    setTimeout(prefetchCardProducts, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
