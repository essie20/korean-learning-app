// Shared Tailwind classes for buttons and links that look like buttons

const base =
  'inline-block max-w-full rounded-full px-6 py-3 text-center text-lg font-semibold transition-all focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export const primaryButton = `${base} bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30`
export const secondaryButton = `${base} border-2 border-blue-100 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50`
export const dangerButton = `${base} bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700`
