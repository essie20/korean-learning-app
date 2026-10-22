# Content and alt-text review, 22 October 2026

Record of an author content review and the alt-text corrections that followed. It adds to the evidence in `docs/app-gap-audit.md` and does not change any earlier record.

## What happened

1. **Author review.** On 22 October 2026 the author reported reviewing all 50 sentences in the app at `http://localhost:5173/`, including the audio, images, Finnish translations and pronunciation notation. She reported no issues, based on her own judgement.
2. **Reviewed version.** The app used for that review was identified afterwards as commit `b5da167bf9cfa21ed0b1e112afeb609d94e24c9f`, with no uncommitted app source changes at that time. Its app source is identical to `main` at `6a466e2`. The identification was made after the review, not during it; the last app source change before it was on 21 October 2026.
3. **Alt-text comparison.** A subsequent ChatGPT-assisted comparison of screenshots of all 50 images against their alt texts identified five descriptions for correction.
4. **Corrections.** Claude applied those five corrections to `src/data/sentences.ts`. ChatGPT then checked the updated wording against the earlier screenshots.
5. **Not yet confirmed.** The author has not yet explicitly confirmed a post-fix visual review of the corrected descriptions.
6. **Approval (added 22 October 2026, after PR #6 was opened).** The author approved the five alt-text corrections for application. This is approval of the changes, not confirmation that she personally repeated the post-fix visual review, so point 5 still applies.

This was **not** participant testing, independent expert validation or screen-reader testing. It does not establish overall accessibility or WCAG conformance.

## The five corrections

Only the `imageAlt` field changed. The English glosses are explanatory and are not part of the app.

| Sentence             | Korean            | Before                                                               | After                                                                                                                                                                                     |
| -------------------- | ----------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| topic-01-sentence-02 | 안녕히 가세요.    | Nainen vilkuttaa hyvästiksi pois lähtevälle miehelle.                | Mies vilkuttaa hyvästiksi naiselle, jolla on matkalaukku. _(A man waves goodbye to a woman who has a suitcase.)_                                                                          |
| topic-01-sentence-05 | 미안해요.         | Nainen pyytää anteeksi kaadettuaan juomaa vahingossa.                | Mies kumartaa päätään naisen edessä. Pöydällä on kaatunut kuppi ja läikkynyttä juomaa. _(A man bows his head in front of a woman. A tipped-over cup and spilled drink are on the table.)_ |
| topic-02-sentence-01 | 저는 학생이에요.  | Opiskelija seisoo koulun edessä kirjat sylissään.                    | Opiskelija seisoo sisätiloissa, pitää kirjaa ja osoittaa itseään. _(A student stands indoors, holds a book and points to himself.)_                                                       |
| topic-05-sentence-02 | 이거 얼마예요?    | Asiakas pitää tuotetta ja kysyy sen hintaa myyjältä.                 | Asiakas osoittaa tiskillä olevaa kuppia ja katsoo myyjää. _(A customer points to a cup on the counter and looks at the seller.)_                                                          |
| topic-10-sentence-05 | 한국어 잘 못해요. | Nainen näyttää epävarmalta pitäessään Korea-aiheista opiskeluvihkoa. | Nainen hymyilee ja pitää Korean lipulla varustettua vihkoa keskustellessaan miehen kanssa. _(A woman smiles and holds a notebook bearing the Korean flag while talking with a man.)_      |

The other 45 alt texts are unchanged.

## Verification of the change

- A field-by-field comparison of `src/data/sentences.ts` with `main` (`6a466e2`) shows exactly these five `imageAlt` changes. All other fields of all 50 sentences (Korean, pronunciation, Finnish, image, audio, ids and order) are unchanged, and no other app file changed.
- `npm run lint`, `npm run build` and `npm run build:pages` passed on this source.
- A temporary local review page (not part of the repository) showed all 50 images in full next to their alt texts. At 375 px and 1280 px all 50 images loaded and all 50 alt texts matched the data file exactly. This checks that the right text is shown, not whether a description fits its image.

## Effect on the audit

The "Alt text for images" row in `docs/app-gap-audit.md` is unchanged by this record. Whether the descriptions fit their images rests on the author review and the AI-assisted comparison described above. The author approved the corrections for application but has not confirmed that she personally repeated a post-fix visual review.
