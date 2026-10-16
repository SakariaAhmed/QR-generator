# QR Studio

A finished QR utility with a responsive browser interface and a small Python command-line companion.

**[Open QR Studio](https://sakariaahmed.com/tools/qr/)** · **[Sakaria's portfolio](https://sakariaahmed.com/#projects)**

## In the browser

- Create website, text and Wi-Fi codes with a live preview.
- Export PNG at 512, 1024 or 2048 pixels, or resolution-independent SVG.
- Choose three high-contrast ink colors and M/Q/H error correction.
- Keep a four-module quiet zone around every code.
- Get clear validation and capacity feedback; invalid edits disable downloads.
- Generate entirely on your device: no API, account or content upload. The interface loads its fonts from Google Fonts; QR content is never sent there.

Wi-Fi codes contain the network credentials, so share them with the same care as the password. Codes are static: there is no tracking redirect or expiration service. Scan an exported code before printing it.

## Develop

```sh
npm ci
npm test
npm run dev
# http://127.0.0.1:4317
```

`npm run build` creates `dist/`, which can be hosted under any path. The portfolio serves this build at `/tools/qr/`. After editing HTML or CSS, restart the development server; JavaScript rebuilds automatically.

The browser uses `qrcode` for encoding and esbuild for bundling. Automated checks decode actual PNG exports with the independent `jsQR` decoder, including Unicode, escaped Wi-Fi credentials, all colors, output sizes and recovery levels. SVG output and oversized/invalid content are checked too.

## Python CLI

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python main.py 'https://sakariaahmed.com' -o website.png
.venv/bin/python main.py 'Hello from Oslo' -o message.svg
printf 'A small note' | .venv/bin/python main.py -o note.png
```

Choose `--correction M|Q|H` and `--scale 1..100` (pixels per module). Existing outputs are protected unless `--force` is supplied. This replaces the original one-input script while retaining Python-based generation.
