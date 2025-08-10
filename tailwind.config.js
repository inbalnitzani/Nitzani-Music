/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: { colors: {
      primary: 'var(--color-primary)',
      'primary-light': 'var(--color-primary-light)',
      'primary-dark': 'var(--color-primary-dark)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
      neutral: 'var(--color-neutral)',
      border: 'var(--color-border)',
      text: 'var(--color-text)',
      danger: 'var(--color-danger)',
      'danger-bg': 'var(--color-danger-bg)',
    }},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
