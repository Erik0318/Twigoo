# Update Log

## 2026-04-30

- Added this log to record concise notes for future project changes.
- Added state support for pages, bookmarks, and reply quote references.
- Added routes and commands for paging, quotes, bookmarks, and tab completion.
- Kept autocomplete keyboard-only by removing the browser dropdown UI.
- Added text-only quote previews in reply drafts and posts.
- Added validation for missing quote post ids.
- Documented tab completion in the README.
- Added pale inline completion text and arrow-key cycling for command options.

## 2026-05-01

- Added command-only `edit <post_id> <body>` and `delete <post_id>` actions for a user's own posts and replies.
- Reverted authentication to username plus password only and removed the email confirmation flow.
- Clarified the help menu entry for Markdown uploads in thread drafts.
- Added `[edited]` markers on edited posts, aligned in the post metadata area.
- Changed direct thread publishing to `new <board> <title>; <body>` so multi-word titles parse correctly.
- Grouped and reformatted the help menu, and documented edit/delete plus the semicolon `new` format.
- Changed command prompt ArrowUp/ArrowDown behavior to recall input history like a normal console.
- Hydrated command history from the saved command log so ArrowUp works from an empty prompt after re-render or reload.
- Added a Twigoo-branded top-bar marquee: `Welcome to the Twigoo Tech Forum.`
- Centered the Twigoo marquee and removed its borders for a lighter TempleOS-style banner.
- Added multiple Twigoo/forum banner lines and randomized their display order.
- Restored marquee movement while keeping randomized banner line selection.
- Escaped command placeholders in the Twigoo banner so browser parsing cannot break the page layout.
- Added `FEATURES.md` with a complete feature summary for sharing.
- Added local Markdown upload for thread drafts and Markdown rendering for published posts.

## 2026-05-02

- Cleared preset topic boards down to a single `station` board.
- Added tag-centric navigation, tag pages, and multi-tag thread publishing.
- Added command-only tag creation and tag page decoration with `tag create` and `tag bio`.
- Added draft tag editing with `tags <tag[,tag]>`.
- Added profile headline decoration with `headline <text>`.
- Changed the dark/light palette to VS Code-inspired colors.
- Updated README and architecture notes for the station-board plus tag model.
- Changed `edit <post_id>` to preload the existing post into a draft before publishing the edit.
- Added server-backed goos and command streaks: accounts start at 10 goos, successful signed-in commands earn 5 goos, and account normalization keeps malformed balances from dropping below 10.
- Changed goo rewards to once per GMT+8 calendar day and updated streak display to `x days streak`.
- Added server-backed shared forum storage in generated `data/forum.json`, loaded through `/api/forum` and synced after logged-in content mutations.
- Changed generated data ignores from `data/auth.json` to `data/*.json` so runtime auth/forum stores are not committed.
- Hardened JSON data loading so corrupted existing runtime files return an error instead of silently resetting to empty data.
- Added Cloudflare Pages build support with `npm run build`, `dist/` output, and Pages Functions backed by a `TWIGOO_DATA` KV binding.
