/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        schedule: {
          d6: '#FEF3C7',      // light amber
          d6text: '#92400E',
          d9: '#DBEAFE',      // soft blue
          d9text: '#1E40AF',
          m: '#EDE9FE',       // lavender
          mtext: '#6D28D9',
          e: '#FFEDD5',       // soft peach
          etext: '#C2410C',
          n: '#CCFBF1',       // soft teal
          ntext: '#0F766E',
          off: '#F3F4F6',     // light gray
          offtext: '#6B7280',
          half: '#F0FDF4',    // very light green for half shifts
        },
        sat: '#EFF6FF',       // saturday bg
        sun: '#FFF1F2',       // sunday bg
        sidebar: '#1E293B',   // dark slate
        header: '#334155',
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}
