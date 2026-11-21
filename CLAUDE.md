# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A fork of `tonybaloney/vscode-pets` (upstream "VS Code Pets"), rebranded in the UI as **vsPal**. Pixel-art pets live in a webview. This fork adds "agent" pets (Codex/Claude Code/eye variants), a pet chat backed by the Codex CLI, and a floating popup window (`vscode-pets.open-popup`, `vscode-pets.position = popup`). Command IDs, settings keys, and the package name still use the `vscode-pets` prefix.

## Commands

Node 26 LTS (`.nvmrc`), npm 11. CI also tests Node 24.

```bash
npm ci
npm run compile        # webpack panel bundle + tsc extension + tsc tests + webpack web extension
npm run watch          # webpack once, then tsc --watch on the extension
npm run lint           # eslint src && prettier --check src
npm run lint:fix
npm test               # pretest runs compile + lint, then launches a downloaded VS Code host (mocha, tdd UI)
xvfb-run npm test      # on headless Linux
npm run test:coverage  # after compiling
npm run test:gifs      # validate GIF/icon filenames in media/ (after compiling)
npm run test:web       # browser extension host
npm run package        # build VSIX with locked vsce
npm run generate:finley  # regenerate Finley GIFs from media/finley/pixel-art.json (needs ImageMagick 7)
```

Running a single test: there is no grep flag wired up. Tests are discovered from `out/test/**/*.test.js` (`src/test/suite/index.ts`); temporarily use `suite.only`/`test.only` in `src/test/suite/panel.test.ts`, or add a `grep` to the Mocha options there. To skip the lint/compile in `pretest`, run `npm run compile:test && node ./out/test/runTest.js` (extension/panel must already be compiled). The runner uses a throwaway user-data/extensions dir and a 10s per-test timeout.

## Architecture

Three separately compiled targets share `src/common/`:

- **Extension host** — `src/extension/extension.ts` (compiled by `tsconfig.extension.json` → `out/extension/`, and by webpack as a webworker build → `dist/web/extension-web.js` for VS Code for the Web). Registers commands, owns the webview providers (editor panel, explorer `petsView` webview view, popup), persists the pet list in `context.globalState` (synced keys), and reads settings from `vscode-pets.*`. `src/extension/codexChat.ts` shells out to `codex exec --json` in a temp dir for pet chat replies; it throws in the web build where `child_process` is absent. On any failure the extension sends a `pet-chat-reply` with no `text`, and the panel-side chat UI (`src/panel/petChat.ts`) falls back to a local reply. Replies are de-duplicated by request `id` (`pendingPetChats`/`recentPetChatReplies`), so a resent request returns the same reply. Model and effort come from `vscode-pets.petChat.*` settings.
- **Webview panel** — `src/panel/main.ts` is the entry point, bundled by webpack (`tsconfig.panel.json`) into `media/main-bundle.js`, exposed as global `petApp`. The extension's HTML calls `petApp.petPanelApp(...)`. **`media/main-bundle.js` is a build artifact checked into `media/`; rebuild after editing anything under `src/panel/`.**
- **Tests** — `src/test/` (mocha in a VS Code host via `@vscode/test-electron`). `panel.test.ts` exercises panel code directly using jsdom.

The extension and panel cannot import each other (each tsconfig excludes the other's directory); only `src/common/` is shared.

### Extension ↔ webview messaging

All interaction is `postMessage` with a `command` field. Extension → panel commands (`spawn-pet`, `throw-ball`, `pat-pet`, `list-pets`, `roll-call`, `delete-pet`, `reset-pet`, `pause-pet`, `disable-effects`, `tick`, `pet-chat-reply`, …) are handled in the `window.addEventListener('message', …)` switch at the bottom of `src/panel/main.ts`. Panel → extension messages (`pet-panel-ready`, `list-pets`, `alert`, `info`, `pet-chat`) are handled in `extension.ts`. Chat request/reply shapes are `PetChatRequest`/`PetChatReply` in `src/common/types.ts`. The extension drives animation via periodic `tick` messages. Webview state (pets, chat history) is saved with the VS Code webview state API (`saveState` in `main.ts`).

### Pets

- `PetType`, `PetColor`, `PetSize`, `Theme` enums live in `src/common/types.ts`.
- Each pet is a class in `src/panel/pets/` extending `BasePetType` (`src/panel/basepettype.ts`), declaring `label`, `possibleColors`, and a `sequence` state graph (`startingState` + `possibleNextStates` per state). States and their behavior are in `src/panel/states.ts`.
- `src/panel/pets.ts` has the `createPet` factory and `availableColors` switch; `src/common/names.ts` has default name pools.
- Sprites: `media/<petType>/<color>_<state>_8fps.gif` (states like `idle`, `walk`, `walk_fast`, `run`, `swipe`, `with_ball`), plus an icon. `npm run test:gifs` checks the naming.
- Adding a pet touches: the `PetType` (and any new `PetColor`) enum, the class, `createPet`/`availableColors`, names, the `vscode-pets.petType`/`petColor` enums in `package.json`, `package.nls*.json`/`l10n` strings, and the media folder.

Some cat/frog/bunny art and icons ship only inside `media/extra.zip` (password-protected, extracted in CI on main/tags) and `media/extraIcons.zip`. Code references these filenames even though they're absent locally; `test:gifs` inspects the zip listings rather than extracting.

### Themes

`src/panel/themes.ts` defines `THEMES` (background/foreground image URLs per light/dark and pet size, floor height, optional effect from `src/panel/effects/`). Assets are in `media/backgrounds/<theme>/`. New themes also need the `vscode-pets.theme` enum in `package.json`.

### Localization

User-facing strings: `package.nls.json` (+ per-language `package.nls.*.json`) for manifest contributions, and `l10n/bundle.l10n*.json` for runtime strings via `vscode.l10n.t`. Translations come from Crowdin; edit the base/`en` files.
