/* Tune library for the ii–V Lines generator.
 *
 * Each entry:
 *   t   title (shown and matched in the tune field)
 *   aka optional extra names that also match
 *   c   composer(s)
 *   y   year
 *   k   concert key as commonly played (major "Eb", minor "Gm")
 *   sig optional key signature to print instead of the one for k (e.g. "C" for no key signature)
 *   s   style label
 *   ch  the tune's chord changes in key k, as on a common fake-book chart, bars split by |.
 *       The app finds every ii–V in them, the same way it does for a pasted or uploaded
 *       chart: major and minor, resolving to a major, minor or dominant I, or not resolving.
 *   ii  instead of ch, a list of ii–V targets, home key first: "Ab" = ii–V into A♭ major,
 *       "Cm" = minor ii–V (m7♭5 → 7♭9) into C minor, "Cm7" = ii–V with a m7 ii into Cm7,
 *       "G7" = ii–V into the dominant G7. Only ii–Vs that are in the tune.
 *   n   with ii, optional notes per target, same order as ii
 *
 * Keys and changes follow common fake-book versions. If your chart is in another key, pick
 * it in the Key menu and every ii–V is transposed with it. If your changes differ, paste
 * them in the Changes box (or upload the chart) and the app uses those instead.
 */
window.TUNES = [
  {t:"East of the Sun (and West of the Moon)", aka:["East of the Sun"], c:"Brooks Bowman", y:1934, k:"Eb", s:"Swing",
   ii:["Eb","Fm","Ab","Cm"],
   n:["The ii–V back to the tonic. It closes the A sections and comes back in every turnaround.",
      "The minor ii–V that sets up the ii chord. It usually leads straight into the home ii–V, so the last section of the page chains the two.",
      "The ii–V to A♭. Use it wherever your chart heads to the IV chord, which many versions do in the bridge.",
      "The minor ii–V to C minor, the relative minor. It shows up in many arrangements and is a common reharmonization of the turnaround."]},
  {t:"Autumn Leaves", aka:["Les Feuilles Mortes"], c:"Joseph Kosma", y:1945, k:"Gm", s:"Swing",
   ch:"| Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7 | Gm6 | Gm6 | Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7 | Gm6 | Gm6 | Am7b5 | D7 | Gm6 | Gm6 | Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7b9 | Gm7 C7 | Fm7 Bb7 | Ebmaj7 | Am7b5 D7b9 | Gm6 | Gm6 |"},
  {t:"All the Things You Are", c:"Jerome Kern", y:1939, k:"Ab", s:"Swing",
   ch:"| Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | G7 | Cmaj7 | Cmaj7 | Cm7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | Am7 D7 | Gmaj7 | Gmaj7 | Am7 | D7 | Gmaj7 | Gmaj7 | F#m7 | B7 | Emaj7 | C7#5 | Fm7 | Bbm7 | Eb7 | Abmaj7 | Dbmaj7 | Dbm7 | Cm7 | Bdim7 | Bbm7 | Eb7 | Abmaj7 | Gm7b5 C7b9 |"},
  {t:"Blue Bossa", c:"Kenny Dorham", y:1963, k:"Cm", s:"Bossa nova",
   ch:"| Cm7 | Cm7 | Fm7 | Fm7 | Dm7b5 | G7b9 | Cm7 | Cm7 | Ebm7 | Ab7 | Dbmaj7 | Dbmaj7 | Dm7b5 | G7b9 | Cm7 | Dm7b5 G7b9 |"},
  {t:"Satin Doll", c:"Duke Ellington & Billy Strayhorn", y:1953, k:"C", s:"Swing",
   ch:"| Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 | Cmaj7 | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 | Cmaj7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Fmaj7 | Am7 D7 | Am7 D7 | G7 | G7 | Dm7 G7 | Dm7 G7 | Em7 A7 | Em7 A7 | Am7 D7 | Abm7 Db7 | Cmaj7 | Cmaj7 |"},
  {t:"Take the \"A\" Train", aka:["Take the A Train","A Train"], c:"Billy Strayhorn", y:1939, k:"C", s:"Swing",
   ch:"| Cmaj7 | Cmaj7 | D7b5 | D7b5 | Dm7 | G7 | Cmaj7 | Dm7 G7 | Cmaj7 | Cmaj7 | D7b5 | D7b5 | Dm7 | G7 | Cmaj7 | Cmaj7 | Fmaj7 | Fmaj7 | Fmaj7 | Fmaj7 | D7 | D7 | Dm7 | G7 | Cmaj7 | Cmaj7 | D7b5 | D7b5 | Dm7 | G7 | Cmaj7 | Dm7 G7 |"},
  {t:"Tune Up", c:"Miles Davis (credited)", y:1953, k:"D", s:"Up-tempo swing",
   ch:"| Em7 | A7 | Dmaj7 | Dmaj7 | Dm7 | G7 | Cmaj7 | Cmaj7 | Cm7 | F7 | Bbmaj7 | Ebmaj7 | Em7 | F7 | Em7 | A7 |"},
  {t:"Solar", c:"Miles Davis (credited)", y:1954, k:"Cm", s:"Swing",
   ch:"| Cm6 | Cm6 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Ebm7 Ab7 | Dbmaj7 | Dm7b5 G7b9 |"},
  {t:"Blues for Alice", c:"Charlie Parker", y:1951, k:"F", s:"Bebop blues",
   ch:"| Fmaj7 | Em7b5 A7b9 | Dm7 G7 | Cm7 F7 | Bb7 | Bbm7 Eb7 | Am7 D7 | Abm7 Db7 | Gm7 | C7 | Fmaj7 D7 | Gm7 C7 |"},
  {t:"There Will Never Be Another You", c:"Harry Warren", y:1942, k:"Eb", s:"Swing",
   ch:"| Ebmaj7 | Ebmaj7 | Dm7b5 | G7b9 | Cm7 | Cm7 | Bbm7 | Eb7 | Abmaj7 | Db7 | Ebmaj7 | Cm7 | F7 | F7 | Fm7 | Bb7 | Ebmaj7 | Ebmaj7 | Dm7b5 | G7b9 | Cm7 | Cm7 | Bbm7 | Eb7 | Abmaj7 | Db7 | Ebmaj7 | Am7b5 D7 | Ebmaj7 | Fm7 Bb7 | Ebmaj7 | Fm7 Bb7 |"},
  {t:"Stella by Starlight", c:"Victor Young", y:1944, k:"Bb", s:"Swing",
   ch:"| Em7b5 | A7b9 | Cm7 | F7 | Fm7 | Bb7 | Ebmaj7 | Ab7 | Bbmaj7 | Em7b5 A7 | Dm7 | Bbm7 Eb7 | Fmaj7 | Em7b5 A7 | Am7b5 | D7b9 | G7#5 | G7 | Cm7 | Cm7 | Ab7 | Ab7 | Bbmaj7 | Bbmaj7 | Em7b5 | A7b9 | Dm7b5 | G7b9 | Cm7b5 | F7b9 | Bbmaj7 | Bbmaj7 |"},
  {t:"Just Friends", c:"John Klenner", y:1931, k:"G", s:"Swing",
   ch:"| Cmaj7 | Cmaj7 | Cm7 | F7 | Gmaj7 | Gmaj7 | Bbm7 | Eb7 | Am7 | Am7 | D7 | D7 | Bm7 | E7 | Am7 | D7 | Cmaj7 | Cmaj7 | Cm7 | F7 | Gmaj7 | Gmaj7 | Bbm7 | Eb7 | Am7 | D7 | Bm7 E7 | Am7 D7 | Gmaj7 | Gmaj7 |"},
  {t:"Misty", c:"Erroll Garner", y:1954, k:"Eb", s:"Ballad",
   ch:"| Ebmaj7 | Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Ebmaj7 Cm7 | Fm7 Bb7 | Gm7 C7 | Fm7 Bb7 | Ebmaj7 | Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Ebmaj7 Cm7 | Fm7 Bb7 | Ebmaj7 | Ebmaj7 | Bbm7 | Eb7 | Abmaj7 | Abmaj7 | Am7 | D7 | Gm7 C7 | Fm7 Bb7 | Ebmaj7 | Bbm7 Eb7 | Abmaj7 | Abm7 Db7 | Ebmaj7 Cm7 | Fm7 Bb7 | Ebmaj7 | Ebmaj7 |"},
  {t:"Fly Me to the Moon", aka:["In Other Words"], c:"Bart Howard", y:1954, k:"C", s:"Swing",
   ch:"| Am7 | Dm7 | G7 | Cmaj7 C7 | Fmaj7 | Bm7b5 | E7 | Am7 A7 | Dm7 | G7 | Cmaj7 | Am7 | Dm7 | G7 | Bm7b5 | E7 | Am7 | Dm7 | G7 | Cmaj7 C7 | Fmaj7 | Bm7b5 | E7 | Am7 A7 | Dm7 | G7 | Em7 A7 | Dm7 | G7 | Cmaj7 | Bm7b5 E7 |"},
  {t:"Days of Wine and Roses", c:"Henry Mancini", y:1962, k:"F", s:"Swing",
   ch:"| Fmaj7 | Eb7 | Am7 | D7 | Gm7 | Gm7 | Bbm7 | Eb7 | Am7 | D7 | Gm7 | C7 | Am7 D7 | Gm7 C7 | Fmaj7 | Gm7 C7 | Fmaj7 | Eb7 | Am7 | D7 | Gm7 | Gm7 | Bbm7 | Eb7 | Am7 | D7 | Gm7 | C7 | Em7b5 | A7 | Dm7 | G7 | Gm7 | C7 | Fmaj7 | Gm7 C7 |"},
  {t:"Have You Met Miss Jones?", aka:["Have You Met Miss Jones"], c:"Richard Rodgers", y:1937, k:"F", s:"Swing",
   ch:"| Fmaj7 | F#dim7 | Gm7 | C7 | Am7 D7 | Gm7 C7 | Fmaj7 | Gm7 C7 | Fmaj7 | F#dim7 | Gm7 | C7 | Am7 D7 | Gm7 C7 | Fmaj7 | Cm7 F7 | Bbmaj7 | Abm7 Db7 | Gbmaj7 | Em7 A7 | Dmaj7 | Abm7 Db7 | Gbmaj7 | Gm7 C7 | Fmaj7 | F#dim7 | Gm7 | C7 | Am7 D7 | Gm7 C7 | Fmaj7 | Gm7 C7 |"},
  {t:"Lady Bird", c:"Tadd Dameron", y:1939, k:"C", s:"Swing",
   ch:"| Cmaj7 | Cmaj7 | Fm7 | Bb7 | Cmaj7 | Cmaj7 | Bbm7 | Eb7 | Abmaj7 | Abmaj7 | Am7 | D7 | Dm7 | G7 | Cmaj7 Ebmaj7 | Abmaj7 Dbmaj7 |"},
  {t:"Confirmation", c:"Charlie Parker", y:1946, k:"F", s:"Bebop",
   ch:"| Fmaj7 | Em7b5 A7 | Dm7 G7 | Cm7 F7 | Bb7 | Am7 D7 | Gm7 | C7 | Fmaj7 | Em7b5 A7 | Dm7 G7 | Cm7 F7 | Bb7 | Am7 D7 | Gm7 C7 | Fmaj7 | Cm7 | F7 | Bbmaj7 | Bbmaj7 | Ebm7 | Ab7 | Dbmaj7 | Gm7 C7 | Fmaj7 | Em7b5 A7 | Dm7 G7 | Cm7 F7 | Bb7 | Am7 D7 | Gm7 C7 | Fmaj7 |"},
  {t:"Donna Lee", c:"Charlie Parker", y:1947, k:"Ab", s:"Bebop",
   ch:"| Abmaj7 | Abmaj7 | F7 | F7 | Bb7 | Bb7 | Bbm7 | Eb7 | Abmaj7 | Abmaj7 | F7 | F7 | Bb7 | Bb7 | Bbm7 | Eb7 | Abmaj7 | Abmaj7 | Ebm7 Ab7 | Dbmaj7 | Dbm7 | Gb7 | Abmaj7 | Gm7b5 C7 | Fm7 | C7 | Fm7 | Fm7 | Bbm7 | Eb7 | Abmaj7 | Bbm7 Eb7 |"},
  {t:"Giant Steps", c:"John Coltrane", y:1959, k:"B", sig:"C", s:"Up-tempo",
   ch:"| Bmaj7 D7 | Gmaj7 Bb7 | Ebmaj7 | Am7 D7 | Gmaj7 Bb7 | Ebmaj7 F#7 | Bmaj7 | Fm7 Bb7 | Ebmaj7 | Am7 D7 | Gmaj7 | C#m7 F#7 | Bmaj7 | Fm7 Bb7 | Ebmaj7 | C#m7 F#7 |"},
  {t:"Cherokee", c:"Ray Noble", y:1938, k:"Bb", s:"Up-tempo swing",
   ch:"| Bbmaj7 | Bbmaj7 | Fm7 | Bb7 | Ebmaj7 | Ebmaj7 | Ab7 | Ab7 | Bbmaj7 | Bbmaj7 | C7 | C7 | Cm7 | F7 | Bbmaj7 | Cm7 F7 | Bbmaj7 | Bbmaj7 | Fm7 | Bb7 | Ebmaj7 | Ebmaj7 | Ab7 | Ab7 | Bbmaj7 | Bbmaj7 | Cm7 | F7 | Bbmaj7 | Bbmaj7 | Bbmaj7 | Bbmaj7 | C#m7 | F#7 | Bmaj7 | Bmaj7 | Bm7 | E7 | Amaj7 | Amaj7 | Am7 | D7 | Gmaj7 | Gmaj7 | Gm7 | C7 | Cm7 | F7 | Bbmaj7 | Bbmaj7 | Fm7 | Bb7 | Ebmaj7 | Ebmaj7 | Ab7 | Ab7 | Bbmaj7 | Bbmaj7 | Cm7 | F7 | Bbmaj7 | Bbmaj7 | Cm7 F7 |"},
  {t:"How High the Moon", c:"Morgan Lewis", y:1940, k:"G", s:"Swing",
   ch:"| Gmaj7 | Gmaj7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Am7b5 D7 | Gmaj7 | Am7 D7 | Bm7 | Bbm7 Eb7 | Am7 | D7 | Gmaj7 | Gmaj7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Am7b5 D7 | Gmaj7 | Bm7 E7 | Am7 | Cm7 F7 | Gmaj7 Em7 | Am7 D7 |"},
  {t:"Ornithology", c:"Charlie Parker & Benny Harris", y:1946, k:"G", s:"Bebop",
   ch:"| Gmaj7 | Gmaj7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Am7b5 D7 | Gmaj7 | Am7 D7 | Bm7 | Bbm7 Eb7 | Am7 | D7 | Gmaj7 | Gmaj7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Am7b5 D7 | Gmaj7 | Bm7 E7 | Am7 | Cm7 F7 | Gmaj7 Em7 | Am7 D7 |"},
  {t:"Body and Soul", c:"Johnny Green", y:1930, k:"Db", s:"Ballad",
   ch:"| Ebm7 Bb7 | Ebm7 Ab7 | Dbmaj7 Gb7 | Fm7 E7 | Ebm7 Ab7 | Dbmaj7 | Fm7b5 Bb7 | Ebm7 Ab7 | Ebm7 Bb7 | Ebm7 Ab7 | Dbmaj7 Gb7 | Fm7 E7 | Ebm7 Ab7 | Dbmaj7 | Dbmaj7 | Dbmaj7 | Dmaj7 | Em7 A7 | Dmaj7 | Em7 A7 | Dm7 G7 | Cmaj7 | Cmaj7 Fm7b5 | Bb7 | Ebm7 Bb7 | Ebm7 Ab7 | Dbmaj7 Gb7 | Fm7 E7 | Ebm7 Ab7 | Dbmaj7 | Dbmaj7 | Dbmaj7 |"},
  {t:"Alone Together", c:"Arthur Schwartz", y:1932, k:"Dm", s:"Swing",
   ch:"| Dm6 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm7 | Am7b5 D7 | Gm7 | Gm7 | Bm7 E7 | Gm7 C7 | Fmaj7 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm7 | Am7b5 D7 | Gm7 | Gm7 | Bm7 E7 | Gm7 C7 | Fmaj7 | Em7b5 A7 | Am7b5 | D7 | Gm7 | Gm7 | Gm7b5 | C7 | Fmaj7 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm7 | Bb7 A7 | Dm6 | Em7b5 A7 |"},
  {t:"Beautiful Love", c:"Victor Young", y:1931, k:"Dm", s:"Swing",
   ch:"| Em7b5 | A7 | Dm7 | Dm7 | Gm7 | C7 | Fmaj7 | Em7b5 A7 | Dm7 | G7 | Bb7 | A7 | Dm7 | Em7b5 A7 | Dm7 | Dm7 | Em7b5 | A7 | Dm7 | Dm7 | Gm7 | C7 | Fmaj7 | Em7b5 A7 | Dm7 | Bb7 | Em7b5 | A7 | Dm7 | Em7b5 A7 | Dm7 | Em7b5 A7 |"},
  {t:"A Night in Tunisia", aka:["Night in Tunisia"], c:"Dizzy Gillespie", y:1942, k:"Dm", s:"Afro-Cuban / swing",
   ch:"| Eb7 | Dm6 | Eb7 | Dm6 | Eb7 | Dm6 | Em7b5 A7 | Dm6 | Eb7 | Dm6 | Eb7 | Dm6 | Eb7 | Dm6 | Em7b5 A7 | Dm6 | Am7b5 | D7 | Gm6 | Gm6 | Gm7b5 | C7 | Fmaj7 | Em7b5 A7 | Eb7 | Dm6 | Eb7 | Dm6 | Eb7 | Dm6 | Em7b5 A7 | Dm6 |"},
  {t:"Yesterdays", c:"Jerome Kern", y:1933, k:"Dm", s:"Swing",
   ch:"| Dm6 | Em7b5 A7 | Dm6 | Em7b5 A7 | Dm6 | Bm7b5 | E7 | A7 | D7 | G7 | C7 | F7 | Bb7 | A7 | Dm6 | Em7b5 A7 |"},
  {t:"Softly, as in a Morning Sunrise", aka:["Softly as in a Morning Sunrise"], c:"Sigmund Romberg", y:1928, k:"Cm", s:"Swing",
   ch:"| Cm6 | Dm7b5 G7 | Cm6 | Dm7b5 G7 | Cm6 | Dm7b5 G7 | Cm6 | Gm7b5 C7 | Fm7 | Bb7 | Ebmaj7 | Abmaj7 | Dm7b5 | G7 | Cm6 | Dm7b5 G7 |"},
  {t:"My Funny Valentine", c:"Richard Rodgers", y:1937, k:"Cm", s:"Ballad",
   ch:"| Cm | CmMaj7 | Cm7 | Cm6 | Abmaj7 | Fm7 | Dm7b5 | G7 | Cm | CmMaj7 | Cm7 | Cm6 | Abmaj7 | Fm7 | Fm7 | Bb7 | Ebmaj7 Fm7 | Gm7 Fm7 | Ebmaj7 Fm7 | Gm7 Fm7 | Ebmaj7 | Gm7 C7 | Fm7 | Bb7 | Cm | CmMaj7 | Cm7 | Cm6 | Abmaj7 | Fm7 | Dm7b5 | G7 | Cm | Bbm7 Eb7 | Abmaj7 | Fm7 | Dm7b5 | G7 | Cm6 | Dm7b5 G7 |"},
  {t:"Bye Bye Blackbird", c:"Ray Henderson", y:1926, k:"F", s:"Swing",
   ch:"| Fmaj7 | Fmaj7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Am7b5 | D7 | Gm7 | Gm7 | Gm7 | C7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Cm7 | F7 | Bbmaj7 | Bbm6 | Am7 | D7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Gm7 | C7 | Fmaj7 | Am7b5 D7 | Gm7 C7 | Fmaj7 |"},
  {t:"I Got Rhythm (Rhythm changes)", aka:["I Got Rhythm","Rhythm changes"], c:"George Gershwin", y:1930, k:"Bb", s:"Up-tempo swing",
   ch:"| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Dm7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 | D7 | D7 | G7 | G7 | C7 | C7 | F7 | F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 |"},
  {t:"Oleo", c:"Sonny Rollins", y:1954, k:"Bb", s:"Up-tempo (Rhythm changes)",
   ch:"| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Dm7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 | Am7 D7 | Am7 D7 | Dm7 G7 | Dm7 G7 | Gm7 C7 | Gm7 C7 | Cm7 F7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 |"},
  {t:"Anthropology", c:"Charlie Parker & Dizzy Gillespie", y:1946, k:"Bb", s:"Bebop (Rhythm changes)",
   ch:"| Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Dm7 G7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 | Am7 D7 | Am7 D7 | Dm7 G7 | Dm7 G7 | Gm7 C7 | Gm7 C7 | Cm7 F7 | Cm7 F7 | Bbmaj7 G7 | Cm7 F7 | Dm7 G7 | Cm7 F7 | Fm7 Bb7 | Ebmaj7 Ebm6 | Cm7 F7 | Bbmaj7 |"},
  {t:"Blues in F (bebop changes)", aka:["F Blues","Blues in F"], c:"Traditional form", y:null, k:"F", s:"Blues",
   ch:"| F7 | Bb7 | F7 | Cm7 F7 | Bb7 | Bdim7 | F7 | Am7b5 D7 | Gm7 | C7 | F7 D7 | Gm7 C7 |"},
  {t:"Blues in B♭ (bebop changes)", aka:["Bb Blues","Blues in Bb","B♭ Blues"], c:"Traditional form", y:null, k:"Bb", s:"Blues",
   ch:"| Bb7 | Eb7 | Bb7 | Fm7 Bb7 | Eb7 | Edim7 | Bb7 | Dm7b5 G7 | Cm7 | F7 | Bb7 G7 | Cm7 F7 |"},
  {t:"Joy Spring", c:"Clifford Brown", y:1954, k:"F", s:"Swing",
   ch:"| Fmaj7 | Gm7 C7 | Fmaj7 | Bbm7 Eb7 | Am7 | Abm7 Db7 | Gm7 | C7 | Fmaj7 | Gm7 C7 | Fmaj7 | Bbm7 Eb7 | Am7 | Abm7 Db7 | Gm7 C7 | Fmaj7 | Gbmaj7 | Abm7 Db7 | Gbmaj7 | Bm7 E7 | Bbm7 | Am7 D7 | Abm7 | Db7 | Gm7 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Ebmaj7 | Am7b5 D7 | Fmaj7 | Gm7 C7 | Fmaj7 | Bbm7 Eb7 | Am7 | Abm7 Db7 | Gm7 C7 | Fmaj7 |"},
  {t:"Afternoon in Paris", c:"John Lewis", y:1949, k:"C", s:"Swing",
   ch:"| Cmaj7 | Cm7 F7 | Bbmaj7 | Bbm7 Eb7 | Abmaj7 | Dm7 G7 | Em7 A7 | Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 | Bbm7 Eb7 | Abmaj7 | Dm7 G7 | Cmaj7 | Cmaj7 | Dm7 | G7 | Cmaj7 | Cmaj7 | Dm7 | G7 | Cmaj7 | Dm7 G7 | Cmaj7 | Cm7 F7 | Bbmaj7 | Bbm7 Eb7 | Abmaj7 | Dm7 G7 | Cmaj7 | Dm7 G7 |"},
  {t:"What Is This Thing Called Love?", aka:["What Is This Thing Called Love"], c:"Cole Porter", y:1929, k:"C", s:"Swing",
   ch:"| Dm7b5 | G7 | Cm7 | Cm7 | Gm7b5 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Cmaj7 | Cmaj7 | Dm7b5 | G7 | Cmaj7 | Cmaj7 | Dm7b5 | G7 | Cm7 | Cm7 | Gm7b5 | C7 | Fmaj7 | Fmaj7 | Fm7 | Bb7 | Cmaj7 | Cmaj7 | Dm7b5 | G7 | Cmaj7 | Cmaj7 |"},
  {t:"All of Me", c:"Gerald Marks & Seymour Simons", y:1931, k:"C", s:"Swing",
   ch:"| Cmaj7 | Cmaj7 | E7 | E7 | A7 | A7 | Dm7 | Dm7 | E7 | E7 | Am7 | Am7 | D7 | D7 | Dm7 | G7 | Cmaj7 | Cmaj7 | E7 | E7 | A7 | A7 | Dm7 | Dm7 | Fmaj7 | Fm6 | Em7 | A7 | Dm7 | G7 | C6 | Dm7 G7 |"},
  {t:"Out of Nowhere", c:"Johnny Green", y:1931, k:"G", s:"Swing",
   ch:"| Gmaj7 | Gmaj7 | Bbm7 | Eb7 | Gmaj7 | Gmaj7 | Am7 | D7 | Bm7 | F#m7b5 B7 | Em7 | Em7 | A7 | A7 | Am7 | D7 | Gmaj7 | Gmaj7 | Bbm7 | Eb7 | Gmaj7 | Gmaj7 | Am7 | D7 | Bm7 E7 | Am7 | Cm7 | F7 | Gmaj7 Em7 | Am7 D7 | Gmaj7 | Am7 D7 |"},
  {t:"Honeysuckle Rose", c:"Fats Waller", y:1929, k:"F", s:"Swing",
   ch:"| Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Bbmaj7 | Dm7 G7 | Dm7 G7 | Gm7 | C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 |"},
  {t:"Scrapple from the Apple", c:"Charlie Parker", y:1947, k:"F", s:"Bebop",
   ch:"| Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 | Em7 A7 | Em7 A7 | Am7 D7 | Am7 D7 | Dm7 G7 | Dm7 G7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Gm7 C7 | Fmaj7 | Dm7 | Gm7 C7 | Fmaj7 |"},
  {t:"Perdido", c:"Juan Tizol", y:1941, k:"Bb", s:"Swing",
   ch:"| Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Am7 D7 | Am7 D7 | Dm7 G7 | Dm7 G7 | Gm7 C7 | Gm7 C7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 | Cm7 F7 | Cm7 F7 | Cm7 F7 | Bbmaj7 |"},
  {t:"The Girl from Ipanema", aka:["Girl from Ipanema","Garota de Ipanema"], c:"Antônio Carlos Jobim", y:1962, k:"F", s:"Bossa nova",
   ch:"| Fmaj7 | Fmaj7 | G7 | G7 | Gm7 | Gb7 | Fmaj7 | Gb7 | Fmaj7 | Fmaj7 | G7 | G7 | Gm7 | Gb7 | Fmaj7 | Fmaj7 | Gbmaj7 | Gbmaj7 | B7 | B7 | F#m7 | F#m7 | D7 | D7 | Gm7 | Gm7 | Eb7 | Eb7 | Am7 | D7b9 | Gm7 | C7 | Fmaj7 | Fmaj7 | G7 | G7 | Gm7 | Gb7 | Fmaj7 | Gb7 |"}
];
