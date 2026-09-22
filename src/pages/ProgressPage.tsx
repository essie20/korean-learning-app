import { useState } from 'react'
import { secondaryButton } from '../components/buttonStyles'
import ConfirmDialog from '../components/ConfirmDialog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'

function ProgressPage() {
  useDocumentTitle('Edistyminen')
  const { resetProgress } = useProgress()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleConfirm() {
    resetProgress()
    setConfirmOpen(false)
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">Edistyminen</h1>

      <section className="mt-12 border-t border-slate-200 pt-6">
        <h2 className="text-xl font-bold text-slate-900">
          Edistymisen nollaus
        </h2>
        <p className="mt-2 text-lg text-slate-700">
          Tämä poistaa kaikki tallennetut tiedot opiskelluista lauseista,
          aiheiden suorituksista ja kertauksista.
        </p>
        <button
          type="button"
          className={`${secondaryButton} mt-4`}
          onClick={() => setConfirmOpen(true)}
        >
          Nollaa edistyminen
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Nollataanko edistyminen?"
        message="Kaikki tallennettu edistyminen poistetaan. Tätä ei voi perua."
        cancelLabel="Peruuta"
        confirmLabel="Nollaa edistyminen"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default ProgressPage
