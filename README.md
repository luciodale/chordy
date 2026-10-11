# Chordy

Private, ad free piano chord sheets. Astro on Cloudflare Workers + D1.

## Flow

1. Search on the home page. Your library filters instantly; accordiespartiti.it results load below, each flagged **In library** or **Add**.
2. **Add** pulls the sheet through the WordPress JSON API, converts Italian notation (DO, LAm, SOL4) and "chords over lyrics" layout to ChordPro with English names, stores it, and opens it.
3. **Paste** (top right) accepts any chords over lyrics text or ChordPro from anywhere else.

## Viewer

- Transpose ± (key shown, sharps or flats picked from the target key), tap the key to reset
- Text size ±, autoscroll with 10 speeds, Easy (reduce to triads, bass kept), C / Do notation
- Tap a chord: piano keyboard with the voicing
- Tap the sheet: hide or show the controls
- Screen stays awake while a song is open
- Transpose, Easy and speed are saved per song in D1; text size and notation per device

## Develop

```sh
bun install
bun run db:migrate:local
bun run dev
bun run test && bun run lint && bun run check
```

## Deploy (once)

```sh
bunx wrangler d1 create chordy-db        # paste database_id into wrangler.json
bun run db:migrate
bun run deploy
```

Then protect it with **Cloudflare Access** (Zero Trust → Access → Applications → Self hosted): add the worker hostname, policy "Allow" for your email. The app itself has no auth; without Access anyone with the URL can edit.
