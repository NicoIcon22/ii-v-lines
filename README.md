# ii–V Lines

Practice ii–V lines for any jazz tune. Type a tune, and the page writes an essential line (chord tones and guide tones) and a bebop line (♭9s, enclosures, chromatic passing tones) for every ii–V in it, notated and playable with a soft piano-and-bass backing.

**Live:** https://nicoicon22.github.io/ii-v-lines/

It grew out of the *East of the Sun ii–V Lines* page and keeps the same layout and controls; East of the Sun is the default tune and produces the same eleven lines.

## Using it

1. **Tune.** Start typing and pick from the suggestions. Tunes in the library (see `docs/TUNE_LIBRARY.md`) come with their key and their ii–Vs.
2. **Key.** Leave it on *Tune's key*, or pick another key to transpose everything. For a tune that isn't in the library, the key decides the ii–Vs: home, into ii, to IV and into vi for a major key; home, the relative major and the iv for a minor key.
3. **Paste the chord changes (optional).** Any ii–V in the text (a m7 or m7♭5 followed by a dominant 7th a fourth up) gets its own lines. This overrides the library list. With pasted changes, the Key menu sets the home key and doesn't transpose them.
4. **Generate lines**, then **New variations** to get different lines for the same ii–Vs.

The transport bar works as before: Read for Concert / B♭ / E♭, Treble or Bass clef, Octave lower (default) or Original, Tempo, Swing, Piano & bass, Loop. Playing a line highlights each note as it sounds.

Every setting is in the URL, so a link opens the same page, for example
`?tune=Autumn Leaves&key=Am&v=2` or `?tune=My Tune&key=F&changes=Gm7 C7 | Fmaj7`.

## What's on the page

For each ii–V target, one essential and one bebop line, one bar per chord. Then, in the home key, a one-bar ii–V (two beats per chord), and for major tunes the full chain: the minor ii–V into ii followed by the home ii–V, one bar per chord.

## How it works

- `lines.js` holds the line templates and the engine. Each template is written in ABC notation for one specific ii–V. The engine parses it to pitches, moves it diatonically to the target ii–V (so B♭ stays a B♭-shaped note and never turns into A♯), chooses up or down so the line stays between G3 and A5, and writes ABC back out against the tune's key signature with bar-by-bar accidentals. Chord symbols and the note under each line are transposed the same way. See `docs/LINE_TEMPLATES.md`.
- `tunes.js` is the tune library: title, composer, year, key, style and ii–V targets.
- `index.html` is the page: picker, rendering with [abcjs](https://www.abcjs.net/) 6.4.4, and Web Audio playback (rootless piano voicings, a two-feel bass, hi-hat on 2 and 4, swing eighths).

No build step and no server code. Any static host works.

## Adding a tune

Add an entry to `tunes.js`:

```js
{t:"Tune title", c:"Composer", y:1950, k:"F", s:"Swing", ii:["F","Gm","Bb"]}
```

`k` is the key (`"Gm"` for minor). In `ii`, `"Bb"` is a ii–V into B♭ major and `"Gm"` a minor ii–V into G minor, home key first. Optional: `aka` (other names that match), `n` (one description per target), `sig` (print a different key signature, e.g. `"C"` for none).

## Notes

Lines are original practice material. Tune keys follow common fake-book keys and the ii–V lists cover each tune's main cadences; check them against your chart, and paste the changes when they differ.
