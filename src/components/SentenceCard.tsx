import type { ReactNode } from 'react'
import AudioButton from './AudioButton'
import Mascot from './Mascot'
import ProgressBar from './ProgressBar'
import type { Sentence } from '../types/content'

interface SentenceCardProps {
  sentence: Sentence
  topicTitle: string
  position: number
  total: number
  /** The Previous / Next / Valmis button row, rendered at the end of the
   * text column so it visually belongs to the learning content. */
  children: ReactNode
}

// The main Study card: a media frame on the left (on lg+ screens) and the
// learning content - topic/progress, Korean, pronunciation, Finnish,
// audio, navigation - on the right. Stacks vertically below that.
function SentenceCard({
  sentence,
  topicTitle,
  position,
  total,
  children,
}: SentenceCardProps) {
  const { korean, pronunciation, finnish, image, imageAlt, audio } = sentence
  const baseUrl = import.meta.env.BASE_URL
  const progressPercent = total === 0 ? 0 : Math.round((position / total) * 100)

  return (
    <div className="relative rounded-[2.75rem] bg-gradient-to-br from-blue-200/60 via-indigo-200/40 to-transparent p-[2px] shadow-2xl shadow-indigo-950/10">
      <article className="grid grid-cols-1 gap-6 rounded-[2.7rem] border border-white/70 bg-white/85 p-4 backdrop-blur lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10 lg:p-10">
        {image && (
          // Fixed aspect ratio so the frame is the same size for every
          // sentence, whatever the source image's own dimensions are. The
          // approved image is never cropped or stretched: it sits centred
          // and whole via object-contain. The same image, blurred and
          // enlarged, fills the rest of the frame so there is no empty
          // white bar.
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[500px] overflow-hidden rounded-[1.75rem] bg-slate-100 shadow-inner lg:mx-0 lg:max-w-none">
            <img
              src={`${baseUrl}${image}`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
            />
            <img
              src={`${baseUrl}${image}`}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-contain p-4 drop-shadow-md"
            />
          </div>
        )}

        <div className="flex flex-col gap-5 lg:justify-center">
          <div>
            <h1 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1 text-sm font-semibold tracking-wide text-white uppercase shadow-sm">
              {topicTitle}
            </h1>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar percent={progressPercent} className="h-2" />
              </div>
              <p
                aria-live="polite"
                className="shrink-0 text-sm font-semibold text-slate-600"
              >
                {position} / {total}
              </p>
            </div>
          </div>

          <p
            lang="ko"
            className="text-4xl font-bold tracking-tight break-keep text-slate-900"
          >
            {korean}
          </p>

          {pronunciation && (
            <p className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-base text-slate-600">
              <span className="font-semibold text-slate-500">Ääntämys</span>
              <span className="text-slate-400">·</span>
              {pronunciation}
            </p>
          )}

          <p className="rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-xl font-medium text-slate-900">
            {finnish}
          </p>

          {audio && (
            <div className="flex items-center">
              <AudioButton src={`${baseUrl}${audio}`} />
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-3">{children}</div>
        </div>
      </article>

      {/* Listening mascot near the audio area - kept outside the <article>
          (and its content images/audio) entirely, so it never interferes
          with the sentence media itself; positioned in the card's lower
          corner, close to where the audio button sits on desktop. */}
      <Mascot
        src="mascot-listen.webp"
        size={64}
        className="absolute -right-4 -bottom-4 hidden lg:block"
      />
    </div>
  )
}

export default SentenceCard
