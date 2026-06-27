# KC Rail Future website

This package contains a static, deployable website for a citizen-led Kansas City rail transit thought piece.

## Pages

- `/` redirects to `/waldo-extension/`
- `/about/`
- `/waldo-extension/`
- `/east-west-extension/`
- `/voice-your-support/`

The Waldo Extension page uses the uploaded PDF directly as the visual source: each PDF page has been rendered as a 1920 x 1080 PNG and displayed as a fullscreen scroll-snap panel. There are no added titles, callouts, or transcript panels on the Waldo page.

The Voice Your Support page embeds the provided Google Form directly in the page and includes a fallback link that opens the form in a new tab if the embedded form does not load.

## Deployment

This version is static-only. You can upload the entire `kc-rail-site` folder to a standard static hosting service such as Netlify, Vercel static hosting, Cloudflare Pages, GitHub Pages, or a traditional web host that serves HTML/CSS/JS files.

No custom SQL database, backend server, Node.js runtime, or environment variables are required for this version. Support submissions are collected through the linked Google Form.

## Local preview

You can preview the site by opening `index.html`, or by serving the folder locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
