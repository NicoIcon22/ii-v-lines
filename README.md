# ii–V Lines

Practice ii–V lines for any jazz tune. Type a tune, and the page writes an essential line (chord tones and guide tones) and a bebop line (♭9s, enclosures, chromatic passing tones) for every ii–V in it, notated and playable with a soft piano-and-bass backing.

**Live:** https://nicoicon22.github.io/ii-v-lines/

It grew out of the *East of the Sun ii–V Lines* page and keeps the same layout and controls; East of the Sun is the default tune and produces the same eleven lines.

## Using it

1. **Tune.** Start typing and pick from the suggestions. Tunes in the library (see `docs/TUNE_LIBRARY.md`) come with their key and their ii–Vs.
2. **Key.** Leave it on *Tune's key*, or pick another key to transpose everything. For a tune that isn't in the library and has no changes yet, only its home ii–V in that key is written; paste or upload its changes to get the rest.
3. **Paste the chord changes (optional).** Any ii–V in the text (a m7 or m7♭5 followed by a dominant 7th a fourth up) gets its own lines. This overrides the library list. With pasted changes, the Key menu sets the home key and doesn't transpose them.
4. **Upload chart PDF (optional).** Click *Upload chart PDF* or drop a PDF on the tune box. The lines always come from the chart's own chord changes, never the library's list, even when the title matches a library tune. The app reads the chord symbols from the PDF's text, or, for a scanned chart with no text, with OCR ([Tesseract.js](https://tesseract.projectnaptha.com/) 5.1.1, downloaded the first time, about 10 MB). The chords go into the changes box: check them there against the chart (OCR in particular can misread a symbol), fix anything and press Generate lines. It also takes the title from the chart and shows the chart's pages above the lines. If no chord symbols can be read at all, the status line says so and the changes box opens for you to type them. To use a different chart, click *Replace chart PDF* (or drop another PDF): the new chart's changes replace the old ones. Remove the PDF with the × on its name. A chart belongs to its tune: switching to another tune clears the PDF and the changes read from it (a tune saved in My tunes brings back its own PDF).

   Only the tune's own ii–Vs and ii–V–Is get lines: a m7 or m7♭5 followed by a dominant 7th a fourth up. When the next chord is the I, its quality comes from the tune, so a ii–V can resolve to a major, a minor or a dominant chord, and the line's last bar is written for that chord (for example the ♭7 instead of the major 7th going into a dominant). A ii–V that doesn't resolve still gets lines, with a note saying so. A V7 → I with no ii, or chords moving any other way, gets nothing.
5. **Lines per ii–V.** Pick how many essential and how many bebop lines each ii–V gets (0–3 each; default 1 + 1). Lines in a section are always different from each other.
6. **Length.** *Long* writes one bar per chord (ii | V | I), as before, plus a one-bar ii–V section in the home key. *Short* writes every ii–V with two beats per chord (ii V | I). *Both* gives each ii–V its long and its short lines, tagged Long and Short.
7. **Generate lines**, then **New variations** to get different lines for the same ii–Vs. The button flashes, shows the variation number, and the lines that changed light up briefly.

Lines per ii–V and Length apply as soon as you change them, are remembered for your next visit, and are saved with each tune in My tunes.

## Each line's own controls

Next to every line:

- **Low / Orig / High** sets that line's octave (an octave below the original, the original, an octave above). A line follows the page-wide Octave setting until you pick one; the underlined button shows a line's own choice, and picking the page's octave again clears it. Playback follows the line's octave.
- **Keep** holds the line in place: New variations, Generate lines and changing Lines per ii–V or Length replace everything else but leave kept lines (and their octave and Print setting) where they are, and never repeat a kept line elsewhere in its section. Kept lines get a gold edge. Keeps belong to the tune, key and changes they were made for; they're saved in My tunes and come back when you reopen the tune.
- **Print** (on by default) decides whether the line goes on paper.

## Printing

In the transport bar, **Print All / None** ticks or unticks Print on every line, and **Print** opens the browser's print dialog with only the ticked lines: tune title, reading key, clef, date and a link back to the page, then each section that has a ticked line, with its chord path, notation and note. The tune box, controls and chart are left off. Print in the reading key and clef you need (B♭/E♭, bass clef): the printout uses whatever is on screen. Lines that come in new (not kept) start with Print ticked.

## My tunes

Every tune you generate is saved in **My tunes** (under the tune box): title, key, pasted or PDF changes, the variation you were on, lines per ii–V and length, and the PDF itself. Click a tune to bring it back exactly as you left it; × twice deletes it. Generating the same title again updates its entry.

The list is stored in your browser (IndexedDB), so it's per device and per browser. **Export list** downloads everything, PDFs included, as one `.json` file; **Import** merges such a file into the list on another device (newer entries win). In a private window the list only lasts until the page is closed.

Typing a different title: a tune from My tunes brings back its saved setup, a library tune starts clean, and any other title clears the chart PDF and the changes read from it. With no PDF on the page, another title is treated as renaming the tune (pasted changes stay).

The transport bar works as before: Read for Concert / B♭ / E♭, Treble or Bass clef, Octave lower (default) or Original, Tempo, Swing, Piano & bass, Loop. Playing a line highlights each note as it sounds.

**Read for B♭ / E♭** writes everything in the instrument's key, not just the notation: the chord path above each section, the section notes, the explanation under every line, the summary at the top and the printout all use the same chord and note names as the staff (B♭ instruments read a major 2nd up, E♭ instruments a major 6th up; for keys nobody writes, like G♯, the enharmonic key is used). Concert pitch is still shown in the header, and playback always sounds at concert pitch.

Every setting is in the URL, so a link opens the same page, for example
`?tune=Autumn Leaves&key=Am&v=2`, `?tune=Misty&e=2&b=2&len=both` or `?tune=My Tune&key=F&changes=Gm7 C7 | Fmaj7`.

## What's on the page

For each ii–V in the tune, the essential and bebop lines you asked for, long (one bar per chord), short (two beats per chord) or both. With long lines only, the home ii–V also gets a one-bar section. When the tune has the minor ii–V into ii right before the home ii–V (iii VI ii V I), long lines end with the full chain, the two as one line.

The template pools hold 4 essential and 4 bebop long lines per ii–V type (major and minor), and 3 + 3 short ones, so even at 3 lines each, New variations brings in something new.

## How it works

- `lines.js` holds the line templates and the engine. Each template is written in ABC notation for one specific ii–V. The engine parses it to pitches, moves it diatonically to the target ii–V (so B♭ stays a B♭-shaped note and never turns into A♯), chooses up or down so the line stays between G3 and A5, and writes ABC back out against the tune's key signature with bar-by-bar accidentals. Chord symbols and the note under each line are transposed the same way. See `docs/LINE_TEMPLATES.md`.
- `tunes.js` is the tune library: title, composer, year, key, style and ii–V targets.
- `pdfchart.js` reads chart PDFs with [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174 (loaded the first time a PDF is used): it joins text pieces on each line (so a raised “-7” after “F” becomes “F-7”), keeps lines that are mostly chord symbols, and draws the pages. With no chord symbols in the text it renders up to 4 pages and runs OCR on them. The title is the clearly biggest text at the top of page 1, then the PDF's own title (ignored when it is just the app or author name, like “Claude”), then the file name.
- `mytunes.js` stores My tunes in IndexedDB and handles export and import.
- `index.html` is the page markup, `style.css` its styles, and `app.js` the page logic: building the sheet, rendering with [abcjs](https://www.abcjs.net/) 6.4.4, Web Audio playback (rootless piano voicings, a two-feel bass, hi-hat on 2 and 4, swing eighths), and the tune box, chart PDF and My tunes wiring.

No build step and no server code. Any static host works.

## Adding a tune

Add an entry to `tunes.js`:

```js
{t:"Tune title", c:"Composer", y:1950, k:"F", s:"Swing", ii:["F","Gm","Bb"]}
```

`k` is the key (`"Gm"` for minor). In `ii`, `"Bb"` is a ii–V into B♭ major, `"Gm"` a minor ii–V into G minor, `"Cm7"` a ii–V with a m7 ii into Cm7 (Dm7 → G7 → Cm7) and `"G7"` a ii–V into the dominant G7, home key first. List only ii–Vs that are in the tune. Optional: `aka` (other names that match), `n` (one description per target), `sig` (print a different key signature, e.g. `"C"` for none).

## Notes

Lines are original practice material. Tune keys follow common fake-book keys and the ii–V lists cover each tune's main cadences; check them against your chart, and paste the changes when they differ.
