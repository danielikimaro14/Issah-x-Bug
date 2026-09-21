# Maintenance scripts

These files are not loaded by `index.js` during a normal bot start. They are standalone maintenance commands called by the npm scripts in the repository root:

- `npm start` starts the bot with `index.js`.
- `npm run cleanup` runs `scripts/cleanup.js` before a clean start.
- `npm run reset-session` runs `scripts/reset-session.js` when a fresh WhatsApp login is needed.
- `npm run start:clean` cleans temporary files, then starts `index.js`.
- `npm run start:fresh` resets the session, then starts `index.js`.

They belong in `scripts/` rather than `lib/`: `lib/` contains modules imported by the running bot, while these files are executable operational tools.
