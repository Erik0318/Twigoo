# Terminal Forum

A command-only, text-first forum prototype.

No buttons. No visible composer boxes. No images. No icons. The only input surface is the command line at the bottom.


## Run

```bash
node server.js
```

Open:

```txt
http://localhost:5173
```

## Cloudflare Pages

This repo is ready for Cloudflare Pages with Functions:

```txt
Build command: npm run build
Build output directory: dist
Functions directory: functions
```

Create a KV namespace and bind it to the Pages project as `TWIGOO_DATA`. Online accounts, goos, sessions, tags, threads, and posts use that KV binding. Without `TWIGOO_DATA`, the static UI can load, but online login and shared forum updates cannot persist correctly.

## Main commands

```txt
help
boards
tags
tag design
open station
open design
read 1
register erik "long-password"
login erik "long-password"
logout
tag create tools Tools; small utilities and workflow notes
tag bio tools command-first tool notes
new design
tags design,terminal
new design this is a topic; this is the body
upload
reply 1
reply 1 "body"
edit 101
delete 101
quote 101
reply 1 --quote 101 "body"
bookmark 1
bookmarks
unbookmark 1
page next
page prev
page 2
title my title
body my body
append another line
publish
cancel
search server
profile erik
bio building small tools for terminal people
headline terminal person
theme light
theme dark
clear
reset
```

Auth is command-only. Registration and login use username plus password only. Passwords are sent to the local Node server, stored as salted hashes in generated `data/auth.json`, and masked in the command log. Shared forum content is stored by the server in generated `data/forum.json`, while the browser keeps localStorage as a cache/fallback for the current session.

Logged-in users can decorate their profile page with `bio <text>` and `headline <text>`.

New accounts start with 10 goos. Once per GMT+8 calendar day, the first successful command from a logged-in user credits 5 goos and updates their command streak. Goos are server-backed account data, exposed in profile views as `x days streak`, and guarded with migration defaults so missing or malformed saved values fall back to at least 10 instead of zero.

For Node deployment, keep the `data/` directory on persistent storage. The app generates `data/auth.json` and `data/forum.json` at runtime and writes them atomically; these generated JSON files are intentionally ignored by git. For Cloudflare deployment, use the `TWIGOO_DATA` KV binding instead of filesystem data.

Direct thread publishing uses a semicolon between the title and body:

```txt
new design this is a topic; this is the body
```

Without the semicolon, `new <tag>` starts a draft so the first title word is not misread as the whole topic. Drafts require at least one tag before publishing.

Markdown files can be imported into an active thread draft from your local machine:

```txt
new design
title Release notes
upload
publish
```

The `upload` command opens the local file picker, reads a `.md` or `.markdown` file into the draft body, and renders Markdown when the thread is published. Long Markdown posts scroll inside the post body so the full file remains readable.

When the command prompt is empty:

```txt
j                  move selection down
k                  move selection up
enter              open selected item
tab                complete command text
arrow up/down      cycle command history, even when the prompt is empty
```

## Layout notes

The page is locked to the viewport. The browser window should not scroll. The main forum screen stays on the left and the command log stays on the side. On narrow screens, the log moves below the main screen but remains inside the viewport.

The visual system uses a VS Code-inspired dark/light palette. It does not ship a font file. The CSS uses a close system monospace stack with bitmap-style rendering settings.

## Boards and tags

Preset topic boards have been cleared down to a single `station` board for site-level posts. Discussion discovery is tag-based:

```txt
tags
tag design
tag create tools Tools; small utilities and workflow notes
tag bio tools command-first tool notes
new design,terminal
tags javascript,ui
```

Each thread can carry multiple tags. Tag owners can decorate tag home pages with `tag bio <slug> <text>`.


Update notes: fixed viewport sizing, capped command log for no-screen-overflow behavior, and changed help hints to generic placeholders such as read <#number>.
