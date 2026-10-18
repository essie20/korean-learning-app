export interface PronunciationNote {
  id: string
  label: string
  text: string
}

// The approved Finnish-oriented pronunciation notation guide, sourced from
// "Korean_50_Sentences_Finnish_Oriented_Pronunciation_Final.pdf" (the
// authoritative version - not the earlier V1 working notes). Only the
// symbols/combinations that actually appear in this app's pronunciation
// strings are covered here. Do not add, remove or reword entries without
// the approved source - Korean audio remains the primary pronunciation
// reference; this text only explains the written notation.
const NOTES = {
  eo: {
    id: 'eo',
    label: 'ŏ',
    text: 'ŏ vastaa korean ㅓ-vokaalia.',
  },
  eu: {
    id: 'eu',
    label: 'ŭ',
    text: 'Suomen kielessä ei ole täysin vastaavaa äännettä. Se muistuttaa u-äännettä, mutta huulet eivät pyöristy samalla tavalla.',
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
  j: {
    id: 'j',
    label: 'j',
    text: 'j luetaan kuten suomen j.',
  },
  tense: {
    id: 'tense',
    label: 'kk / tt / pp / ss / ddj',
    text: 'Kaksoiskonsonantti ilmaisee tässä oppaassa korean jännitteistä konsonanttia, ei pelkästään pitkää suomen konsonanttia.',
  },
} as const satisfies Record<string, PronunciationNote>

// Detects which of the approved notation entries actually occur in one
// sentence's pronunciation string, so the popover only ever shows notes
// relevant to the current sentence. "ddj" is the final-app notation for
// the tense Korean j-type sound, so it is grouped into the shared
// tense/doubled-consonant note rather than reported as an unrelated "dj".
// A bare "j" is only reported once any "dj"/"ddj" occurrences have been
// removed, so it is never duplicated with the dj/tš entries. Ordinary
// letter combinations that are not part of this approved list (hw, gw,
// dw, nj, plain hyphen separators, etc.) are intentionally never reported.
export function getPronunciationNotes(
  pronunciation: string,
): PronunciationNote[] {
  let bareScan = pronunciation
  const hasDdj = bareScan.includes('ddj')
  if (hasDdj) bareScan = bareScan.split('ddj').join('')

  const hasDj = bareScan.includes('dj')
  if (hasDj) bareScan = bareScan.split('dj').join('')

  const hasTs = pronunciation.includes('tš')
  const hasEo = pronunciation.includes('ŏ')
  const hasEu = pronunciation.includes('ŭ')
  const hasW = pronunciation.includes('w')
  const hasTense =
    hasDdj ||
    ['kk', 'tt', 'pp', 'ss'].some((seq) => pronunciation.includes(seq))
  const hasJ = bareScan.includes('j')

  const notes: PronunciationNote[] = []
  if (hasEo) notes.push(NOTES.eo)
  if (hasEu) notes.push(NOTES.eu)
  if (hasDj) notes.push(NOTES.dj)
  if (hasTs) notes.push(NOTES.ts)
  if (hasW) notes.push(NOTES.w)
  if (hasJ) notes.push(NOTES.j)
  if (hasTense) notes.push(NOTES.tense)
  return notes
}
