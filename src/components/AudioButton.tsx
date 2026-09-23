import { useRef, useState } from 'react'
import { PauseIcon, SpeakerIcon } from './SpeakerIcon'

interface AudioButtonProps {
  src: string
}

// A compact, styled play/pause control that replaces the large native
// <audio controls> UI. The real <audio> element stays in the DOM (so the
// browser handles playback and accessibility), it is just visually hidden;
// this button is the only interactive control the user sees.
function AudioButton({ src }: AudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      // play() returns a promise that rejects if playback is interrupted
      // (e.g. paused again before it starts); that's expected here, not an error.
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  return (
    <div>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        className="sr-only"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        type="button"
        aria-pressed={isPlaying}
        onClick={toggle}
        className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-blue-700 bg-blue-50 px-5 py-2.5 text-base font-semibold text-blue-800 transition-colors hover:bg-blue-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        {isPlaying ? <PauseIcon /> : <SpeakerIcon />}
        Kuuntele ääntämys
      </button>
    </div>
  )
}

export default AudioButton
