import { useEffect } from 'react'

const APP_NAME = 'Koreaa lauseilla'

// Sets the browser tab / page title, e.g. "Aiheet – Koreaa lauseilla"
export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    document.title = `${pageTitle} – ${APP_NAME}`
  }, [pageTitle])
}
