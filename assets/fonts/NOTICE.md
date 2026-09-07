# Noto Sans Thai (regular, static instance)

Used to render Thai text (movie titles, date headings) in exported PDF plans — jsPDF needs a real
embedded font for non-Latin glyphs; the built-in fonts only cover WinAnsi.

- Source: https://github.com/google/fonts/blob/main/ofl/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf
  (a variable font covering Thai + Latin + digits)
- `NotoSansThai-Regular.ttf` here is a static `wght=400, wdth=100` instance of that file, produced with:
  ```
  python3 -m fontTools.varLib.instancer NotoSansThai[wdth,wght].ttf wght=400 wdth=100 -o NotoSansThai-Regular.ttf
  ```
  (a static instance, not a subset — jsPDF's font embedder doesn't handle variable-font tables well,
  and this keeps the embedded file small).
- License: SIL Open Font License 1.1, see `OFL.txt`.

Regenerate `src/lib/pdfFont.generated.ts` from this file with `npm run generate:pdf-font`.
