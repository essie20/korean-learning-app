import type { Sentence } from '../types/content'

interface SentenceCardProps {
  sentence: Sentence
}

// Image, pronunciation and audio are only rendered when they have content.
// Media paths in the data are relative (e.g. "images/x.webp"). BASE_URL makes
// them work when the app is deployed under a sub-path such as GitHub Pages.
function SentenceCard({ sentence }: SentenceCardProps) {
  const { korean, pronunciation, finnish, image, imageAlt, audio } = sentence
  const baseUrl = import.meta.env.BASE_URL

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6">
      {image && (
        <img
          src={`${baseUrl}${image}`}
          alt={imageAlt}
          className="mb-6 max-h-96 w-full rounded object-contain"
        />
      )}
      <p lang="ko" className="text-3xl font-bold text-slate-900">
        {korean}
      </p>
      {pronunciation && (
        <p className="mt-2 text-lg text-slate-700">
          <span className="font-semibold">Ääntämys:</span> {pronunciation}
        </p>
      )}
      {audio && (
        <audio
          controls
          preload="none"
          aria-label="Kuuntele korean ääntämys"
          src={`${baseUrl}${audio}`}
          className="mt-4 w-full"
        />
      )}
      <p className="mt-4 text-xl text-slate-900">{finnish}</p>
    </article>
  )
}

export default SentenceCard
