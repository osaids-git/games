# Skyline Sprint

An original side-scrolling platformer built with HTML, CSS, and vanilla JavaScript. Follow the fireflies through Sunlit Meadow, Whispering Woods, Amber Canyon, Cloudbound Peaks, and Starlight Coast to reach the lighthouse.

## Play

Open `index.html` in a browser. No installation or build is required. For a local server, run `npm start` and visit http://localhost:4173.

**Controls:** A/D or Left/Right to move; Space, W, or Up to jump. Press jump again in midair for a double jump. P or Escape pauses. R returns to your checkpoint. Touch buttons are available on phones and tablets. Sound is optional.

## Adventure

- Five chapters, 70 obstacle sections, and 35 checkpoints.
- Double jumps, moving platforms, thorn patches, and beetles you can stomp.
- Optional fireflies encourage exploring upper routes.
- Unlimited retries. Checkpoint progress saves automatically in this browser when storage is available; choose **Continue run** on the title screen to resume.
- Finishing records your best time. A new run replaces checkpoint progress.
- Intended first-play duration: about 7–12 minutes, varying with skill and exploration. Traversing the 111,740-pixel route at 280 pixels/second takes at least 6 minutes 39 seconds; jumping and retries add time. This is a design estimate, not a measured human playtest.

## Work in VS Code

Open this folder in VS Code. Press F5 and choose **Play Skyline Sprint**, or open `index.html` directly. Use `npm test` to run the dependency-free physics and course tests (Node.js 18+).

- `index.html`: page, controls, and menus
- `style.css`: layout and responsive styling
- `level.js`: chapter themes and deterministic course generation
- `engine.js`: fixed-step movement, collisions, checkpoints, and completion
- `game.js`: original canvas art, keyboard/touch input, sound, and persistence

All artwork is drawn in code. The game makes no external requests and uses no downloaded assets, libraries, or tracking.

## GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select **main**, select **/(root)**, and save. The game can then be played at `https://osaids-git.github.io/games/` if the repository belongs to `osaids-git`. This URL becomes available only after Pages is enabled and its deployment succeeds.
