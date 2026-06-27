# KC Rail Future website

This package contains a deployable website for a citizen-led Kansas City rail transit thought piece.

## Pages

- `/` redirects to `/waldo-extension/`
- `/about/`
- `/waldo-extension/`
- `/east-west-extension/`
- `/voice-your-support/`

The Waldo Extension page uses the uploaded PDF directly as the visual source: each PDF page has been rendered as a 1920 x 1080 PNG and displayed as a fullscreen scroll-snap panel. There are no added titles, callouts, or transcript panels on the Waldo page.

## Backend and secure database

A static-only host can serve the pages, but it cannot securely store form submissions by itself. The support form posts to `/api/support`, which is implemented in `server.js` as a Node/Express backend using a private PostgreSQL database connection.

Security measures included:

- Database credentials stay on the server in environment variables.
- SQL writes use parameterized queries.
- Server-side validation enforces full name, ZIP code, email, and the 256-word comment limit.
- Basic rate limiting reduces abuse.
- A honeypot field reduces bot spam.
- Raw IP addresses are not stored; the backend stores a salted HMAC hash for abuse control.
- Helmet security headers and optional same-origin checking are enabled.

## Local preview

Install Node.js 20 or newer, then run:

```bash
npm install
npm start
```

Open `http://localhost:3000`. Without `DATABASE_URL`, the pages will work, but the support form will return a database-not-configured message.

## Production deployment

1. Create a PostgreSQL database with your hosting provider.
2. Copy `.env.example` to `.env` or set the same variables in your host dashboard.
3. Set `DATABASE_URL`, `DATABASE_SSL=true` if your provider requires TLS, `APP_ORIGIN` to your real domain, and a long random `IP_HASH_SECRET`.
4. Deploy this folder to a Node-capable host such as Render, Railway, Fly.io, Heroku-compatible platforms, a VPS, or any hosting service that supports Node and PostgreSQL.
5. Run `npm install` and `npm start` as the start command.

## Static-only deployment option

You can upload the HTML/CSS/JS/assets folders to a static host, and all pages except the support form will work. To collect support submissions on a static-only host, replace the form action with a trusted hosted form service or deploy the included backend separately.
