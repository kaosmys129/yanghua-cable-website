// Local PostCSS config for Strapi admin build
// This prevents Vite from traversing up to the parent workspace's PostCSS config
// which references '@tailwindcss/postcss' and is not needed for Strapi admin.

export default {
  plugins: [],
};