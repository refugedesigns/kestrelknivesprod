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
    './locales/**/*.json',
  ],
  theme: {
    extend: {
      // Add any custom theme extensions here
    },
  },
  plugins: [
    '@tailwindcss/typography',
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
      './locales/**/*.json',
    ],
    safelist: [
      'bg-red-500',
      'bg-green-500',
      'text-red-500',
      'text-green-500',
      'bg-black',
      'bg-[#000000]',
      'hidden',
      'block',
      'flex',
      'grid',
      'opacity-0',
      'opacity-100',
      'transform',
      'transition',
      'duration-300',
      'ease-in-out',
    ],
    // Options for purging
    options: {
      // Preserve keyframes and font-face rules
      keyframes: true,
      fontFace: true,
    },
  },
};
