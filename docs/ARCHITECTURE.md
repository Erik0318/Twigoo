# Architecture

This prototype is plain HTML, CSS, and JavaScript. It intentionally avoids build tools and dependencies.

## Files

```txt
index.html          shell and script loading
server.js           tiny local static server plus auth API
functions/          Cloudflare Pages Functions API using KV
data/auth.json      generated auth/account store, ignored by git
data/forum.json     generated shared forum-content store, ignored by git
src/data.js         seed station board, tags, threads, posts, users
src/state.js        localStorage state, sessions, drafts, theme, mutations
src/views.js        text-only render functions
src/commands.js     command parser and command actions
src/app.js          routing, rendering, keyboard behavior, scroll lock
src/styles.css      VS Code-inspired terminal UI system
```

## State

The app uses localStorage under `terminal_forum_state_v5_auth`.

State includes:

```txt
boards
tags
threads
posts
users
session.username
commandLog
ui.selectedIndex
ui.draft
ui.theme
ui.pages
ui.bookmarks
```

## Command model

Every major action is reachable by command. There are no visible action buttons or textareas.

Examples:

```txt
register erik "long-password"
login erik "long-password"
streak
tags
tag design
read 2
reply 2 "sounds useful"
quote 201
bookmark 2
bookmarks
bio building small tools for terminal people
headline terminal person
edit 201
delete 201
page next
new design title text; body text
theme light
```

Draft commands allow longer writing without a textarea:

```txt
new design
title My title
tags design,terminal
body First paragraph
append Second paragraph
publish
```

Post edits use the same draft surface. `edit <post_id>` preloads the current post body, then `body`, `append`, `publish`, and `cancel` work the same way as other drafts.

Thread drafts can also import local Markdown files:

```txt
new design
title My Markdown Thread
upload
publish
```

The browser reads the selected `.md` or `.markdown` file with `FileReader`, stores the text in the active draft body, and renders Markdown after publishing. Long Markdown posts use an internal scroll area so large files remain accessible inside the fixed viewport.

Inline `new` commands use `new <tag[,tag]> <title>; <body>` so multi-word titles are separated from body text without relying on quotes.

## Board and tag model

The app keeps one built-in `station` board for site notices and coordination. User-facing discussion spaces are tags. A thread can have multiple tags, tag pages list matching threads, and logged-in users can create/decorate tag home pages:

```txt
tag create tools Tools; small utilities and workflow notes
tag bio tools command-first tool notes
new tools,design
tags javascript,ui
```

The state loader migrates old preset-board content by moving threads to `station` and turning the old board slug into a tag.

## Layout model

The page is a fixed-height viewport grid:

```txt
top bar
main forum screen | command log
command prompt
```

CSS locks document scrolling with `overflow: hidden`. Overflowing text is clipped or line-clamped. Longer content is handled through paging commands instead of scrollbars.

## Auth

Registration and login are real server calls:

```txt
POST /api/register
POST /api/login
POST /api/logout
GET /api/session
GET /api/users
```

The server validates usernames, stores salted password hashes in generated `data/auth.json`, and issues random bearer tokens after registration or login. The browser stores only the token and current session username. Command logging masks password arguments.

## Goos and streaks

Goos are server-backed account fields, not localStorage-only UI state. New users start with 10 goos. After a logged-in user enters the `streak` command, the browser calls:

```txt
POST /api/reward-command
```

The server accepts this reward request only for `command: "streak"`. It credits 5 goos once per GMT+8 calendar day, updates the user's command count, and maintains a GMT+8-day streak. Later `streak` commands on the same GMT+8 day update command activity but do not add more goos. Each reward request includes a command id; duplicate ids are ignored so a retry cannot double-credit the same command. User records are normalized on load and before public output, with a hard minimum of 10 goos so missing, old, or malformed data never zeroes the balance accidentally.

## Future backend path

Forum content is server-backed in generated `data/forum.json`. The browser loads `/api/forum` before the first render and keeps localStorage as a cache/fallback. Logged-in content mutations sync to `POST /api/forum`; the server normalizes forum data and refuses to overwrite the store with an empty thread/post payload.

For Node production, deploy with persistent storage mounted at `data/` or replace the JSON-file stores with a database. The current JSON writes use temp-file plus rename to avoid partial writes, and existing malformed JSON files return a server error instead of silently resetting to empty data. Multiple app instances should share a real database rather than separate local disks.

For Cloudflare Pages, run `npm run build`, publish `dist`, and use the `functions/` directory for `/api/*`. Bind a KV namespace as `TWIGOO_DATA`; the Pages Functions store auth/account state and shared forum state there. If the KV namespace is empty, `/api/forum` returns the seed forum; the first successful content sync writes the normalized forum payload to KV.
