/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Scan all Liquid templates and sections
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './templates/**/*.liquid',
    './templates/**/*.json',
    // Include any JavaScript files that might contain classes
    './assets/**/*.js',
    // Include any additional files that might contain Tailwind classes
    './locales/**/*.json'
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    },
  },
  plugins: [
    // No plugins needed for CDN-based Flowbite
  ],
  // Enable purging in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './layout/**/*.liquid',
      './sections/**/*.liquid', 
      './snippets/**/*.liquid',
      './templates/**/*.liquid',
      './templates/**/*.json',
      './assets/**/*.js',
      './locales/**/*.json'
    ],
    // Safelist any classes that might be dynamically generated
    safelist: [
      // Add any classes that are dynamically generated and might be missed
      'bg-red-500',
      'bg-green-500',
      'text-red-500',
      'text-green-500',
      // Flowbite classes that might be dynamically generated (CDN version)
      'flowbite',
      'flowbite-*',
      // Common Flowbite component classes
      'dropdown',
      'modal',
      'tooltip',
      'popover',
      'accordion',
      'carousel',
      'tabs',
      'sidebar',
      'navbar',
      'footer',
      // Flowbite data attributes and classes
      'data-dropdown-toggle',
      'data-modal-toggle',
      'data-tooltip-target',
      'data-popover-target',
      'data-accordion-target',
      'data-carousel-target',
      'data-tabs-target',
      'data-sidebar-toggle',
      'data-navbar-toggle',
      // Flowbite utility classes
      'hidden',
      'block',
      'flex',
      'grid',
      'opacity-0',
      'opacity-100',
      'transform',
      'transition',
      'duration-300',
      'ease-in-out'
    ],
    // Options for purging
    options: {
      // Preserve keyframes and font-face rules
      keyframes: true,
      fontFace: true,
    }
  }
}
