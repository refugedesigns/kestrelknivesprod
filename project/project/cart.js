// Cart functionality
let cartData = {
  items: [
    {
      id: 'ovis-scalpel-001',
      name: 'Ovis Scalpel',
      brand: 'KestrelKnivesProd',
      price: 135.0,
      quantity: 1,
      handleColor: 'Orange',
      sku: 'OVS-001',
      image:
        'https://images.pexels.com/photos/4226769/pexels-photo-4226769.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ],
  subtotal: 135.0,
  tax: 13.5,
  shipping: 0.0,
  total: 148.5,
};

// Update quantity
function updateQuantity(action) {
  const quantityInput = document.getElementById('cartQuantity');
  const currentValue = parseInt(quantityInput.value);

  if (action === 'increase') {
    quantityInput.value = currentValue + 1;
  } else if (action === 'decrease' && currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }

  // Update cart totals
  updateCartTotals();

  // Add visual feedback
  const button = event.target.closest('button');
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 150);
}

// Update cart totals
function updateCartTotals() {
  const quantity = parseInt(document.getElementById('cartQuantity').value);
  const itemPrice = 135.0;

  const subtotal = itemPrice * quantity;
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Update display
  document.querySelector('[data-subtotal]').textContent =
    `GH¢${subtotal.toFixed(2)}`;
  document.querySelector('[data-tax]').textContent = `GH¢${tax.toFixed(2)}`;
  document.querySelector('[data-total]').textContent = `GH¢${total.toFixed(2)}`;

  // Update cart badge
  const cartBadge = document.querySelector('.bg-orange-500');
  if (cartBadge) {
    cartBadge.textContent = quantity;
  }
}

// Save for later
function saveForLater() {
  const button = event.target.closest('button');
  const originalText = button.innerHTML;

  button.innerHTML = `
    <svg class="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    Saving...
  `;

  setTimeout(() => {
    button.innerHTML = `
      <svg class="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      Saved
    `;
    button.classList.add('text-green-600');

    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('text-green-600');
    }, 2000);
  }, 1000);

  console.log('Item saved for later');
}

// Remove item
function removeItem() {
  if (confirm('Are you sure you want to remove this item from your cart?')) {
    const cartItem = event.target.closest('.p-6');

    // Add fade out animation
    cartItem.style.transition =
      'opacity 0.3s ease-out, transform 0.3s ease-out';
    cartItem.style.opacity = '0';
    cartItem.style.transform = 'translateX(-20px)';

    setTimeout(() => {
      cartItem.remove();
      showEmptyCart();
    }, 300);

    console.log('Item removed from cart');
  }
}

// Show empty cart state
function showEmptyCart() {
  document.querySelector('.lg\\:grid').style.display = 'none';
  document.getElementById('emptyCart').classList.remove('hidden');
}

// Update cart
function updateCart() {
  const button = event.target;
  const originalText = button.textContent;

  button.textContent = 'Updating...';
  button.disabled = true;
  button.classList.add('opacity-75');

  setTimeout(() => {
    button.textContent = 'Updated ✓';
    button.classList.remove('opacity-75');
    button.classList.remove(
      'border-gray-300',
      'hover:border-gray-400',
      'text-gray-700'
    );
    button.classList.add('border-green-500', 'text-green-600');

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
      button.classList.add(
        'border-gray-300',
        'hover:border-gray-400',
        'text-gray-700'
      );
      button.classList.remove('border-green-500', 'text-green-600');
    }, 2000);
  }, 1000);

  updateCartTotals();
  console.log('Cart updated');
}

// Proceed to checkout
function proceedToCheckout() {
  const button = event.target;
  const originalText = button.textContent;

  button.style.transform = 'scale(0.98)';
  button.textContent = 'Processing...';
  button.disabled = true;

  setTimeout(() => {
    button.style.transform = 'scale(1)';
    button.textContent = 'Redirecting to Checkout...';

    setTimeout(() => {
      // Here you would redirect to checkout page
      console.log('Redirecting to checkout...');
      alert('Redirecting to secure checkout page...');

      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  }, 500);
}

// Apply promo code
function applyPromoCode() {
  const input = event.target.previousElementSibling;
  const code = input.value.trim().toUpperCase();
  const button = event.target;

  if (!code) {
    showNotification('Please enter a promo code', 'error');
    return;
  }

  button.textContent = 'Applying...';
  button.disabled = true;

  setTimeout(() => {
    if (code === 'SAVE10') {
      showNotification('Promo code applied! 10% discount added.', 'success');
      // Apply discount logic here
    } else {
      showNotification('Invalid promo code. Please try again.', 'error');
    }

    button.textContent = 'Apply';
    button.disabled = false;
    input.value = '';
  }, 1000);
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg z-50 transition-all duration-300 transform translate-x-full ${
    type === 'success'
      ? 'bg-green-600 text-white'
      : type === 'error'
        ? 'bg-red-600 text-white'
        : 'bg-blue-600 text-white'
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Animate out and remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Handle promo code input
document.addEventListener('DOMContentLoaded', function () {
  const promoInput = document.querySelector(
    'input[placeholder="Enter promo code"]'
  );
  const promoButton = promoInput?.nextElementSibling;

  if (promoButton) {
    promoButton.addEventListener('click', applyPromoCode);
  }

  if (promoInput) {
    promoInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        applyPromoCode.call(promoButton);
      }
    });
  }

  // Add data attributes for dynamic updates
  const subtotalElement = document.querySelector(
    '.flex.justify-between .font-medium.text-gray-900'
  );
  const taxElement = document.querySelectorAll(
    '.flex.justify-between .font-medium.text-gray-900'
  )[1];
  const totalElement = document.querySelector(
    '.text-lg.font-bold.text-gray-900'
  );

  if (subtotalElement) subtotalElement.setAttribute('data-subtotal', '');
  if (taxElement) taxElement.setAttribute('data-tax', '');
  if (totalElement) totalElement.setAttribute('data-total', '');
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
  // Ctrl/Cmd + Enter to checkout
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    proceedToCheckout();
  }

  // Escape to clear promo code input
  if (e.key === 'Escape') {
    const promoInput = document.querySelector(
      'input[placeholder="Enter promo code"]'
    );
    if (promoInput && document.activeElement === promoInput) {
      promoInput.value = '';
      promoInput.blur();
    }
  }
});

// Auto-save cart notes
let saveTimeout;
document.addEventListener('DOMContentLoaded', function () {
  const notesTextarea = document.getElementById('cartNotes');
  if (notesTextarea) {
    notesTextarea.addEventListener('input', function () {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        console.log('Cart notes auto-saved:', this.value);
        // Here you would save to localStorage or send to server
      }, 1000);
    });
  }
});

console.log('Cart page loaded successfully');
