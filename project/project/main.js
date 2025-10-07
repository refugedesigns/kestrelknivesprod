// Product image functionality
const productImages = [
  'https://images.pexels.com/photos/4226769/pexels-photo-4226769.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4226764/pexels-photo-4226764.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/4226832/pexels-photo-4226832.jpeg?auto=compress&cs=tinysrgb&w=800',
];

let currentImageIndex = 0;

// Change main image
function changeImage(index) {
  const mainImage = document.getElementById('mainImage');
  const thumbnails = document.querySelectorAll('.thumbnail');

  if (index >= 0 && index < productImages.length) {
    currentImageIndex = index;
    mainImage.src = productImages[index];

    // Update thumbnail borders
    thumbnails.forEach((thumbnail, i) => {
      if (i === index) {
        thumbnail.classList.remove('border-gray-200');
        thumbnail.classList.add('border-orange-500');
      } else {
        thumbnail.classList.remove('border-orange-500');
        thumbnail.classList.add('border-gray-200');
      }
    });
  }
}

// Navigate to previous image
function previousImage() {
  const newIndex =
    currentImageIndex > 0 ? currentImageIndex - 1 : productImages.length - 1;
  changeImage(newIndex);
}

// Navigate to next image
function nextImage() {
  const newIndex =
    currentImageIndex < productImages.length - 1 ? currentImageIndex + 1 : 0;
  changeImage(newIndex);
}

// Quantity management
function decreaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  const currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
}

function increaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  const currentValue = parseInt(quantityInput.value);
  quantityInput.value = currentValue + 1;
}

// Handle color selection
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[name="handleColor"]').forEach(radio => {
    radio.addEventListener('change', function () {
      // Update visual selection
      document.querySelectorAll('input[name="handleColor"]').forEach(r => {
        const container = r.parentElement.querySelector('div');
        if (r.checked) {
          container.classList.remove('border-gray-300');
          container.classList.add('border-orange-500');
        } else {
          container.classList.remove('border-orange-500');
          container.classList.add('border-gray-300');
        }
      });
    });
  });
});

// Add to cart functionality
function addToCart() {
  const quantity = document.getElementById('quantity').value;
  const selectedColor = document.querySelector(
    'input[name="handleColor"]:checked'
  ).value;

  // Animate button
  const button = event.target;
  const originalText = button.textContent;

  button.style.transform = 'scale(0.95)';
  button.textContent = 'ADDING...';
  button.disabled = true;

  setTimeout(() => {
    button.style.transform = 'scale(1)';
    button.textContent = 'ADDED TO CART ✓';
    button.classList.remove('bg-black', 'hover:bg-gray-800');
    button.classList.add('bg-green-600');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('bg-green-600');
      button.classList.add('bg-black', 'hover:bg-gray-800');
      button.disabled = false;
    }, 2000);
  }, 500);

  console.log(`Added to cart: ${quantity} x Ovis Scalpel (${selectedColor})`);
}

// Sticky tabs functionality
function handleStickyTabs() {
  const tabsNav = document.getElementById('tabsNavigation');
  const header = document.querySelector('header');
  const headerHeight = header.offsetHeight;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          tabsNav.style.top = `${headerHeight}px`;
          tabsNav.classList.add('shadow-md');
        } else {
          tabsNav.style.top = `${headerHeight}px`;
          tabsNav.classList.remove('shadow-md');
        }
      });
    },
    {
      threshold: 0,
      rootMargin: `-${headerHeight}px 0px 0px 0px`,
    }
  );

  // Observe the main product section
  const mainSection = document.querySelector('main');
  if (mainSection) {
    observer.observe(mainSection);
  }
}

// Scroll to section functionality
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  const header = document.querySelector('header');
  const tabsNav = document.getElementById('tabsNavigation');
  const offset = header.offsetHeight + tabsNav.offsetHeight + 20;

  if (section) {
    const sectionTop = section.offsetTop - offset;
    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth',
    });

    // Update active tab
    updateActiveTab(sectionId);
  }
}

// Update active tab
function updateActiveTab(activeTabId) {
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach(button => {
    const tabId = button.getAttribute('data-tab');
    if (tabId === activeTabId) {
      button.classList.remove('border-transparent', 'text-gray-500');
      button.classList.add('border-orange-500', 'text-orange-600');
    } else {
      button.classList.remove('border-orange-500', 'text-orange-600');
      button.classList.add('border-transparent', 'text-gray-500');
    }
  });
}

// Handle scroll-based tab activation
function handleScrollBasedTabs() {
  const sections = ['specs', 'design'];
  const header = document.querySelector('header');
  const tabsNav = document.getElementById('tabsNavigation');
  const offset = header.offsetHeight + tabsNav.offsetHeight + 100;

  let currentSection = '';

  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) {
      const sectionTop = section.offsetTop - offset;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
        currentSection = sectionId;
      }
    }
  });

  if (currentSection) {
    updateActiveTab(currentSection);
  }
}

// Keyboard navigation for images
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowLeft') {
    previousImage();
  } else if (e.key === 'ArrowRight') {
    nextImage();
  }
});

// Initialize everything
document.addEventListener('DOMContentLoaded', function () {
  changeImage(0);
  handleStickyTabs();

  // Set initial active tab
  updateActiveTab('specs');

  // Handle scroll events for tab activation
  let scrollTimeout;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScrollBasedTabs, 100);
  });
});

// Handle window resize
window.addEventListener('resize', function () {
  handleStickyTabs();
});

console.log('Enhanced product page loaded successfully');
