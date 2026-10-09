# Skyline Sprint

An original side-scrolling platformer built with HTML, CSS, and vanilla JavaScript. Follow the fireflies through Sunlit Meadow, Whispering Woods, Amber Canyon, Cloudbound Peaks, and Starlight Coast to reach the lighthouse.

## Play

Open `index.html` in a browser. No installation or build is required. For a local server, run `npm start` and visit http://localhost:4173.

**Controls:** A/D or Left/Right to move; Space, W, or Up for one jump. Midair jumps are disabled. Hold F or J to fire sparks in the direction you're facing. P or Escape pauses. R returns to your checkpoint and uses one life. Touch buttons are available on phones and tablets. Sound is optional.

## Adventure

- Five chapters, 70 obstacle sections, and 40 checkpoints, including one at each boss arena.
- In Sunlit Meadow, tall rotating and pop-up spike gates block the route. They extend above the highest reachable jump. Watch their warning glow, wait for them to retract, and run through the opening.
- Single jumps, moving platforms, more ground-level spike patches and holes, spinning saws, springboards, and cracked platforms that crumble beneath you. The additional ground hazards do not add raised platforms.
- Beetles can be stomped or shot. A few ranged enemies fire at you and take two spark hits to defeat.
- Whispering Woods, the second chapter, has 70 shootable enemies across its 14 sections—five times its former density. Four additional beetles are spaced through each section.
- Each chapter ends with a boss that must be defeated to advance. The last guardian has 35 health, five times the previous final boss's seven.
- Once the first chapter boss falls, the Shadow Hunter follows and shoots until it is defeated. It takes exactly 20 spark hits.
- Optional fireflies encourage exploring upper routes.
- A run starts with six lives. Falling or taking a hit consumes one; zero lives ends the run. Checkpoint progress and remaining lives save automatically in this browser when storage is available; choose **Continue run** on the title screen to resume.
- Finishing records your best time. A new run replaces checkpoint progress.
- Intended first-play duration: about 7–12 minutes, varying with skill and exploration. Course gaps are sized for single jumps. An automated traversal test covers the whole route with an extended life allowance; it verifies reachability and pacing, not that typical players can finish within six lives. Human difficulty has not been measured.

## Work in VS Code

Open this folder in VS Code. Press F5 and choose **Play Skyline Sprint**, or open `index.html` directly. Use `npm test` to run the dependency-free physics and course tests (Node.js 18+).

- `index.html`: page, controls, and menus
- `style.css`: layout and responsive styling
- `level.js`: chapter themes and deterministic course generation
- `engine.js`: fixed-step movement, collisions, checkpoints, and completion
- `game.js`: original canvas art, keyboard/touch input, sound, and persistence

All artwork is drawn in code. The game makes no external requests and uses no downloaded assets, libraries, or tracking.

## GitHub Pages

Play the published game at https://osaids-git.github.io/games/. GitHub Pages deploys from the `main` branch and the repository root.
