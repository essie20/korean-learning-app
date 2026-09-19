// Shared Tailwind classes for buttons and links that look like buttons

const base =
  'inline-block rounded-md px-5 py-3 text-center text-lg font-semibold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

export const primaryButton = `${base} bg-blue-700 text-white hover:bg-blue-800`
export const secondaryButton = `${base} border-2 border-slate-400 bg-white text-slate-900 hover:bg-slate-100`
export const dangerButton = `${base} bg-red-700 text-white hover:bg-red-800`
