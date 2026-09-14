# Sorry Message Experience

A first working version of the receiver-focused apology experience.

## Run

1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL shown by Vite.

## Test

- `/` opens the creator setup.
- Add several photos and messages.
- Click `Preview receiver experience`.
- Open `/sorry/demo`.

The current version stores uploaded photos locally in the browser so the experience can be tested immediately. Firebase Storage/Firestore can be connected in the next step for permanent shareable links.

## Design direction

The receiver view uses a static memory-collage composition. Photos sit around the central apology messages rather than moving as a slideshow. The background is original and can be replaced independently.
