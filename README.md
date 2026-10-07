# Blood Donation System (MERN)

Backend: Express + MongoDB (unchanged). Frontend: React (Vite) in `client/`.

## Run (development)
1. Create `.env` (see `.env.example`), then `npm install`
2. Terminal 1: `node server.js`  (port 3000)
3. Terminal 2: `cd client && npm install && npm run dev`  -> http://localhost:5173

## Production
`npm run build` builds the React app into `public/`, which `server.js` already serves.
Then `node server.js` and open http://localhost:3000
(Render: render.yaml already runs the build.)

## WhatsApp AI agent
Optional. See `WHATSAPP.md` for setup. Without the keys in `.env` it stays off.
