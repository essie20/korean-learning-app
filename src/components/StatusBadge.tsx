export type TopicStatus = 'Aloita' | 'Jatka' | 'Suoritettu'

const styles: Record<TopicStatus, string> = {
  Aloita: 'bg-slate-100 text-slate-600',
  Jatka: 'bg-amber-100 text-amber-700',
  Suoritettu: 'bg-emerald-100 text-emerald-700',
}

function StatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${styles[status]}`}
    >
      {status}
    </span>
  )
}

export default StatusBadge
