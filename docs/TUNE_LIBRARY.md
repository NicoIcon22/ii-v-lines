# Tune library

The tunes the generator knows by name, with the key it uses by default and the ii–Vs it writes lines for. Every tune except East of the Sun stores its chord changes (`ch` in `tunes.js`, as on a common fake-book chart), and the app finds the ii–Vs in them exactly as it does for a pasted or uploaded chart: every m7 or m7♭5 followed by a dominant 7th a fourth up, major or minor, resolving to a major, minor or dominant I, or not resolving at all. The last column is what it finds, as ii → V → I in the tune's key. "Doesn't resolve" means the I shown is where the ii–V points, not a chord in the tune; "also unresolved" means the same ii–V turns up elsewhere without resolving. East of the Sun keeps the four targets from the original E♭ page.

Open *Paste the chord changes* on the page to see a library tune's changes (in the key you picked), and *Edit the library changes* to copy them into the box and change them. Fake books differ, so check them against your chart; pasting or uploading your chart always takes over.

With long lines the home ii–V also gets a one-bar version, and when the changes have the minor ii–V into ii right before the home ii–V (iii VI ii V I), the full chain plays the two as one line.

To add a tune, add an entry to `tunes.js` (format described at the top of that file).

| Tune | Composer | Year | Key | Style | ii–Vs in the changes |
|---|---|---|---|---|---|
| East of the Sun (and West of the Moon) | Brooks Bowman | 1934 | E♭ | Swing | E♭, F minor, A♭, C minor (target list) |
| Autumn Leaves | Joseph Kosma | 1945 | G minor | Swing | Cm7 → F7 → B♭maj7; Am7♭5 → D7 → Gm7; Gm7 → C7 → Fm7; Fm7 → B♭7 → E♭maj7 |
| All the Things You Are | Jerome Kern | 1939 | A♭ | Swing | B♭m7 → E♭7 → A♭maj7; Fm7 → B♭7 → E♭maj7; Am7 → D7 → Gmaj7; F♯m7 → B7 → Emaj7; Gm7♭5 → C7 → Fm7 (doesn't resolve) |
| Blue Bossa | Kenny Dorham | 1963 | C minor | Bossa nova | Dm7♭5 → G7 → Cm7 (also unresolved); E♭m7 → A♭7 → D♭maj7 |
| Satin Doll | Duke Ellington & Billy Strayhorn | 1953 | C | Swing | Dm7 → G7 → Cmaj7 (doesn't resolve); Em7 → A7 → Dmaj7 (doesn't resolve); Am7 → D7 → G7 (also unresolved); A♭m7 → D♭7 → G♭maj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (also unresolved) |
| Take the "A" Train | Billy Strayhorn | 1939 | C | Swing | Dm7 → G7 → Cmaj7 (also unresolved) |
| Tune Up | Miles Davis (credited) | 1953 | D | Up-tempo swing | Em7 → A7 → Dmaj7 (also unresolved); Dm7 → G7 → Cmaj7; Cm7 → F7 → B♭maj7 |
| Solar | Miles Davis (credited) | 1954 | C minor | Swing | Gm7 → C7 → Fmaj7; Fm7 → B♭7 → E♭maj7; E♭m7 → A♭7 → D♭maj7; Dm7♭5 → G7 → Cm7 (doesn't resolve) |
| Blues for Alice | Charlie Parker | 1951 | F | Bebop blues | Em7♭5 → A7 → Dm7; Dm7 → G7 → Cm7; Cm7 → F7 → B♭7; B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Am7 → D7 → Gmaj7 (doesn't resolve); A♭m7 → D♭7 → G♭maj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (also unresolved) |
| There Will Never Be Another You | Harry Warren | 1942 | E♭ | Swing | Dm7♭5 → G7 → Cm7; B♭m7 → E♭7 → A♭maj7; Cm7 → F7 → B♭maj7 (doesn't resolve); Fm7 → B♭7 → E♭maj7 (also unresolved); Am7♭5 → D7 → Gm7 (doesn't resolve) |
| Stella by Starlight | Victor Young | 1944 | B♭ | Swing | Em7♭5 → A7 → Dm7 (also unresolved); Cm7 → F7 → B♭maj7 (doesn't resolve); Fm7 → B♭7 → E♭maj7; B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Am7♭5 → D7 → G7; Dm7♭5 → G7 → Cm7; Cm7♭5 → F7 → B♭maj7 |
| Just Friends | John Klenner | 1931 | G | Swing | Cm7 → F7 → B♭maj7 (doesn't resolve); B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Am7 → D7 → Gmaj7 (also unresolved); Bm7 → E7 → Am7 |
| Misty | Erroll Garner | 1954 | E♭ | Ballad | B♭m7 → E♭7 → A♭maj7; A♭m7 → D♭7 → G♭maj7 (doesn't resolve); Fm7 → B♭7 → E♭maj7 (also unresolved); Gm7 → C7 → Fm7; Am7 → D7 → Gm7 |
| Fly Me to the Moon | Bart Howard | 1954 | C | Swing | Dm7 → G7 → Cmaj7 (also unresolved); Bm7♭5 → E7 → Am7 (also unresolved); Em7 → A7 → Dm7 |
| Days of Wine and Roses | Henry Mancini | 1962 | F | Swing | Am7 → D7 → Gm7; B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (also unresolved); Em7♭5 → A7 → Dm7; Dm7 → G7 → Cmaj7 (doesn't resolve) |
| Have You Met Miss Jones? | Richard Rodgers | 1937 | F | Swing | Gm7 → C7 → Fmaj7 (also unresolved); Am7 → D7 → Gm7; Cm7 → F7 → B♭maj7; A♭m7 → D♭7 → G♭maj7; Em7 → A7 → Dmaj7 |
| Lady Bird | Tadd Dameron | 1939 | C | Swing | Fm7 → B♭7 → E♭maj7 (doesn't resolve); B♭m7 → E♭7 → A♭maj7; Am7 → D7 → Gmaj7 (doesn't resolve); Dm7 → G7 → Cmaj7 |
| Confirmation | Charlie Parker | 1946 | F | Bebop | Em7♭5 → A7 → Dm7; Dm7 → G7 → Cm7; Cm7 → F7 → B♭7; Am7 → D7 → Gm7; Gm7 → C7 → Fmaj7; Cm7 → F7 → B♭maj7; E♭m7 → A♭7 → D♭maj7 |
| Donna Lee | Charlie Parker | 1947 | A♭ | Bebop | B♭m7 → E♭7 → A♭maj7 (also unresolved); E♭m7 → A♭7 → D♭maj7; C♯m7 → F♯7 → Bmaj7 (doesn't resolve); Gm7♭5 → C7 → Fm7 |
| Giant Steps | John Coltrane | 1959 | B (no key signature) | Up-tempo | Am7 → D7 → Gmaj7; Fm7 → B♭7 → E♭maj7; C♯m7 → F♯7 → Bmaj7 (also unresolved) |
| Cherokee | Ray Noble | 1938 | B♭ | Up-tempo swing | Fm7 → B♭7 → E♭maj7; Cm7 → F7 → B♭maj7 (also unresolved); C♯m7 → F♯7 → Bmaj7; Bm7 → E7 → Amaj7; Am7 → D7 → Gmaj7; Gm7 → C7 → Fmaj7 (doesn't resolve) |
| How High the Moon | Morgan Lewis | 1940 | G | Swing | Gm7 → C7 → Fmaj7; Fm7 → B♭7 → E♭maj7; Am7♭5 → D7 → Gmaj7; Am7 → D7 → Gmaj7 (also unresolved); B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Bm7 → E7 → Am7; Cm7 → F7 → B♭maj7 (doesn't resolve) |
| Ornithology | Charlie Parker & Benny Harris | 1946 | G | Bebop | Gm7 → C7 → Fmaj7; Fm7 → B♭7 → E♭maj7; Am7♭5 → D7 → Gmaj7; Am7 → D7 → Gmaj7 (also unresolved); B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Bm7 → E7 → Am7; Cm7 → F7 → B♭maj7 (doesn't resolve) |
| Body and Soul | Johnny Green | 1930 | D♭ | Ballad | E♭m7 → A♭7 → D♭maj7 (also unresolved); Fm7♭5 → B♭7 → E♭m7; Em7 → A7 → Dmaj7; Em7 → A7 → Dm7; Dm7 → G7 → Cmaj7 |
| Alone Together | Arthur Schwartz | 1932 | D minor | Swing | Em7♭5 → A7 → Dm7 (also unresolved); Am7♭5 → D7 → Gm7; Bm7 → E7 → Amaj7 (doesn't resolve); Gm7 → C7 → Fmaj7; Gm7♭5 → C7 → Fmaj7 |
| Beautiful Love | Victor Young | 1931 | D minor | Swing | Em7♭5 → A7 → Dm7 (also unresolved); Gm7 → C7 → Fmaj7; Dm7 → G7 → Cmaj7 (doesn't resolve) |
| A Night in Tunisia | Dizzy Gillespie | 1942 | D minor | Afro-Cuban / swing | Em7♭5 → A7 → Dm7 (also unresolved); Am7♭5 → D7 → Gm7; Gm7♭5 → C7 → Fmaj7 |
| Yesterdays | Jerome Kern | 1933 | D minor | Swing | Em7♭5 → A7 → Dm7 (also unresolved); Bm7♭5 → E7 → A7 |
| Softly, as in a Morning Sunrise | Sigmund Romberg | 1928 | C minor | Swing | Dm7♭5 → G7 → Cm7 (also unresolved); Gm7♭5 → C7 → Fm7; Fm7 → B♭7 → E♭maj7 |
| My Funny Valentine | Richard Rodgers | 1937 | C minor | Ballad | Dm7♭5 → G7 → Cm7 (also unresolved); Fm7 → B♭7 → E♭maj7 (also unresolved); Gm7 → C7 → Fm7; B♭m7 → E♭7 → A♭maj7 |
| Bye Bye Blackbird | Ray Henderson | 1926 | F | Swing | Gm7 → C7 → Fmaj7 (also unresolved); Am7♭5 → D7 → Gm7; Cm7 → F7 → B♭maj7; Am7 → D7 → Gm7 |
| I Got Rhythm (Rhythm changes) | George Gershwin | 1930 | B♭ | Up-tempo swing | Cm7 → F7 → B♭maj7 (also unresolved); Dm7 → G7 → Cm7; Fm7 → B♭7 → E♭maj7 |
| Oleo | Sonny Rollins | 1954 | B♭ | Up-tempo (Rhythm changes) | Cm7 → F7 → B♭maj7 (also unresolved); Dm7 → G7 → Cm7 (also unresolved); Fm7 → B♭7 → E♭maj7; Am7 → D7 → Gmaj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (doesn't resolve) |
| Anthropology | Charlie Parker & Dizzy Gillespie | 1946 | B♭ | Bebop (Rhythm changes) | Cm7 → F7 → B♭maj7 (also unresolved); Dm7 → G7 → Cm7 (also unresolved); Fm7 → B♭7 → E♭maj7; Am7 → D7 → Gmaj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (doesn't resolve) |
| Blues in F (bebop changes) | Traditional form | — | F | Blues | Cm7 → F7 → B♭7; Am7♭5 → D7 → Gm7; Gm7 → C7 → F7 (also unresolved) |
| Blues in B♭ (bebop changes) | Traditional form | — | B♭ | Blues | Fm7 → B♭7 → E♭7; Dm7♭5 → G7 → Cm7; Cm7 → F7 → B♭7 (also unresolved) |
| Joy Spring | Clifford Brown | 1954 | F | Swing | Gm7 → C7 → Fmaj7; B♭m7 → E♭7 → A♭maj7 (doesn't resolve); A♭m7 → D♭7 → G♭maj7 (also unresolved); Bm7 → E7 → Amaj7 (doesn't resolve); Am7 → D7 → Gmaj7 (doesn't resolve); Fm7 → B♭7 → E♭maj7; Am7♭5 → D7 → Gm7 (doesn't resolve) |
| Afternoon in Paris | John Lewis | 1949 | C | Swing | Cm7 → F7 → B♭maj7; B♭m7 → E♭7 → A♭maj7; Dm7 → G7 → Cmaj7 (also unresolved); Em7 → A7 → Dm7 |
| What Is This Thing Called Love? | Cole Porter | 1929 | C | Swing | Dm7♭5 → G7 → Cm7; Gm7♭5 → C7 → Fmaj7; Fm7 → B♭7 → E♭maj7 (doesn't resolve); Dm7♭5 → G7 → Cmaj7 |
| All of Me | Gerald Marks & Seymour Simons | 1931 | C | Swing | Am7 → D7 → Gmaj7 (doesn't resolve); Dm7 → G7 → Cmaj7 (also unresolved); Em7 → A7 → Dm7 |
| Out of Nowhere | Johnny Green | 1931 | G | Swing | B♭m7 → E♭7 → A♭maj7 (doesn't resolve); Am7 → D7 → Gmaj7 (also unresolved); F♯m7♭5 → B7 → Em7; Em7 → A7 → Dmaj7 (doesn't resolve); Bm7 → E7 → Am7; Cm7 → F7 → B♭maj7 (doesn't resolve) |
| Honeysuckle Rose | Fats Waller | 1929 | F | Swing | Gm7 → C7 → Fmaj7 (also unresolved); Cm7 → F7 → B♭maj7 (also unresolved); Dm7 → G7 → Cmaj7 (doesn't resolve) |
| Scrapple from the Apple | Charlie Parker | 1947 | F | Bebop | Gm7 → C7 → Fmaj7 (also unresolved); Em7 → A7 → Dmaj7 (doesn't resolve); Am7 → D7 → Gmaj7 (doesn't resolve); Dm7 → G7 → Cmaj7 (doesn't resolve) |
| Perdido | Juan Tizol | 1941 | B♭ | Swing | Cm7 → F7 → B♭maj7 (also unresolved); Am7 → D7 → Gmaj7 (doesn't resolve); Dm7 → G7 → Cmaj7 (doesn't resolve); Gm7 → C7 → Fmaj7 (doesn't resolve) |
| The Girl from Ipanema | Antônio Carlos Jobim | 1962 | F | Bossa nova | Am7 → D7 → Gm7; Gm7 → C7 → Fmaj7 |

45 tunes.
