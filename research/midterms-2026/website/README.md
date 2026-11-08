# Website integration

This folder holds the shared live-result module and fixed predictions. The
portfolio imports them directly; there is no second copy of the live UI.

- Article renderer and styles: `../../../src/content/midterms-2026.tsx` and its CSS module.
- React wrapper: `../../../src/content/live-comparison.tsx`.
- Live module: `live/widget.mjs`; scoring and validation: `live/core.mjs`.
- Fixed predictions: `live/predictions.json`.
- Initial results snapshot: `../data/results/live-snapshot.json`.

Build the model from the parent directory with `python -m election_forecast build`.
Then run `npm run sync:midterms` at the portfolio root to update the committed
article, images and downloads. The normal website build needs no Python step.

The standalone preview uses this same live module. Run `npm ci` and
`npm run article` in the parent directory to create `site/index.html`.
