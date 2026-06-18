# Simulator Script Layout

These files are loaded as classic browser scripts from `simulator.html`, so top-level declarations intentionally share the page global scope. Keep the order in `simulator.html` when adding new files.

- `ui-modals.js`: custom `alert` / `confirm` queues and modal focus handling.
- `state.js`: shared helpers, default game state, save migration helpers, global runtime state, and balance constants.
- `storage.js`: localStorage save/load and backup recovery.
- `audio.js`: synthesized BGM and SFX.
- `boot.js`: page initialization, clock startup, and pause detection.
- `game-loop.js`: weekly tick, economy updates, trend/event triggers, and autosave.
- `development.js`: project setup, development progress, release scoring, and review modal rendering.
- `team-research-events.js`: hiring, training, research, and random event data/actions.
- `views.js`: screen switching, office/history/stat rendering, trend chart, and floating feedback text.
- `meta-systems.js`: publisher selection, share/import/export, chronology, debug minigame, specialties, bankruptcy, and medal shop.

Next architecture step: move pure calculations from these classic scripts into testable functions before converting the loader to ES modules.
