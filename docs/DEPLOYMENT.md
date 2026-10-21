# Deployment

The app is a static site (`index.html`, `style.css`, `app.js`, `lines.js`, `tunes.js`, `pdfchart.js`, `mytunes.js`) hosted on GitHub Pages. Saved tunes live in each visitor's browser, so there is no server or database to run.

- **Repository:** https://github.com/NicoIcon22/ii-v-lines (public)
- **Live URL:** https://nicoicon22.github.io/ii-v-lines/
- **Pages source:** the `main` branch, root folder.

## Updating

1. Edit the files on `main` (on github.com, or locally and push).
2. In `index.html`, bump the `?v=` tag on the `style.css` and `.js` links (for example `?v=20261021d` → `?v=20261022a`). Pages lets browsers cache files for 10 minutes, so without a new tag a visitor can get the new page with an old script.
3. Pages rebuilds in a minute or two. Hard-refresh the page to see it.

The Pages settings are under the repository's **Settings → Pages**.

## Running locally

Open `index.html` through any local web server, e.g. `python3 -m http.server` in the folder, then visit http://localhost:8000. Opening the file directly also works in most browsers.

## External resources

- abcjs 6.4.4 from cdnjs (notation and timing)
- pdf.js 3.11.174 from cdnjs (chart PDFs; loaded only when a PDF is used)
- Tesseract.js 5.1.1 from jsDelivr (OCR for scanned charts; loaded only when a PDF has no readable chord text, about 10 MB the first time)
- Google Fonts: Big Shoulders Display, Work Sans, IBM Plex Mono
