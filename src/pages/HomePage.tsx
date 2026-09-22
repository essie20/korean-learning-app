import { useDocumentTitle } from '../hooks/useDocumentTitle'

function HomePage() {
  useDocumentTitle('Etusivu')

  return <h1>Etusivu</h1>
}

export default HomePage
