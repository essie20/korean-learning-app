export interface PronunciationNote {
  id: string
  label: string
  text: string
}

// Finnish translations of the notation legend in the approved source,
// "Korean_50_Sentences_Finnish_Oriented_Pronunciation_Final.pdf". The
// legend explains exactly five symbols - ŏ, ŭ, dj, tš and w - so only
// those have notes here. Other spellings in the pronunciation strings
// (j, ddj, doubled consonants, etc.) are not explained by the source and
// must not get notes. Do not add, remove or reword entries without the
// approved source.
const NOTES = {
  eo: {
    id: 'eo',
    label: 'ŏ',
    text: 'ŏ vastaa korean ㅓ-vokaalia.',
  },
  eu: {
    id: 'eu',
    label: 'ŭ',
    text: 'ŭ vastaa korean ㅡ-vokaalia. Se on keskivokaali, joka äännetään huulia pyöristämättä.',
  },
  dj: {
    id: 'dj',
    label: 'dj',
    text: 'dj on tässä oppaassa käytetty merkintä korean ㅈ-tyyppiselle konsonantille.',
  },
  ts: {
    id: 'ts',
    label: 'tš',
    text: 'tš on tässä oppaassa käytetty merkintä korean ㅊ-tyyppiselle konsonantille.',
  },
  w: {
    id: 'w',
    label: 'w',
    text: 'w ääntyy englannin w:n kaltaisena liukuäänteenä, ei suomen v:nä.',
  },
} as const satisfies Record<string, PronunciationNote>

// Finnish translation of the source's caveat (legend and closing note):
// the spellings are an approximate reading aid, not official
// romanization, and the Korean audio is the primary reference. Shown with
// every sentence's notes, including when a sentence has none.
export const PRONUNCIATION_CAVEAT =
  'Merkinnät ovat likimääräinen lukemisen apu, eivät virallinen latinisointi. Tarkista ääntämys korealaisesta äänitteestä, joka on ensisijainen ääntämisen malli.'

// Detects which of the legend's symbols actually occur in one sentence's
// pronunciation string, so the popover only ever shows notes relevant to
// the current sentence. "ddj" is a different spelling from "dj" and the
// source does not explain it, so it is removed before looking for "dj";
// otherwise it would wrongly trigger the dj note.
export function getPronunciationNotes(
  pronunciation: string,
): PronunciationNote[] {
  const withoutDdj = pronunciation.split('ddj').join('')

  const notes: PronunciationNote[] = []
  if (pronunciation.includes('ŏ')) notes.push(NOTES.eo)
  if (pronunciation.includes('ŭ')) notes.push(NOTES.eu)
  if (withoutDdj.includes('dj')) notes.push(NOTES.dj)
  if (pronunciation.includes('tš')) notes.push(NOTES.ts)
  if (pronunciation.includes('w')) notes.push(NOTES.w)
  return notes
}
