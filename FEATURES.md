# Terminal Forum Feature Summary

Terminal Forum is a command-driven, text-first forum prototype. The site avoids normal buttons and visible post textareas; actions happen through the command line at the bottom of the screen.

## Main Features

1. **Station board and tags**
   - The built-in board list is reduced to the single `station` board.
   - Discussion discovery is tag-based with `tags`, `tag design`, and `open design`.
   - Logged-in users can create and decorate tags with `tag create` and `tag bio`.

2. **Threads and posts**
   - View recent threads on the home screen.
   - Read a thread with `read 1`.
   - Threads show title, author, tags, reply count, and timestamps.
   - Long thread content is handled with paging commands.

3. **Account system**
   - Register with `register username password`.
   - Log in with `login username password`.
   - Log out with `logout`.
   - Open a profile with `profile username`.
   - Change profile decoration with `bio text` and `headline text`.
   - Passwords are sent to the local Node server and stored as salted hashes in `data/auth.json`.
   - Passwords are masked in command history.

4. **Goos and streaks**
   - New accounts start with 10 goos.
   - Logged-in users earn 5 goos on the first successful command of each GMT+8 calendar day.
   - The server tracks command count, current streak, best streak, last command day, and last goo claim day.
   - Streaks are shown to users as `x days streak`.
   - Goos are server-backed and normalized with a minimum 10-goo balance so old or malformed account records do not accidentally zero out.

5. **Posting**
   - Logged-in users can create new tagged threads.
   - Draft mode commands:
     - `new design`
     - `title My title`
     - `tags design,terminal`
     - `body My body`
     - `append More body text`
     - `upload`
     - `publish`
   - `upload` imports a local `.md` or `.markdown` file into the active thread draft.
   - Published posts render Markdown.
   - Inline posting is also supported:
     - `new design Title; body text`

6. **Replies and quotes**
   - Start a reply with `reply 1`.
   - Reply inline with `reply 1 body text`.
   - Quote another post with `quote 101`.
   - Reply with a quote using `reply 1 --quote 101 body text`.

7. **Edit and delete**
   - Start an edit draft with `edit 101`; the existing post body is preloaded.
   - Publish the edit with `publish` or discard it with `cancel`.
   - Delete your own post with `delete 101`.
   - Deleting your own first post in a thread deletes the whole thread.

8. **Search and bookmarks**
   - Search thread titles, authors, station board, tags, and post bodies with `search server`.
   - Bookmark a thread with `bookmark 1`.
   - View bookmarks with `bookmarks`.
   - Remove a bookmark with `unbookmark 1`.

9. **Navigation and assistance**
   - Change pages with `page next`, `page prev`, `page 2`, `more`, and `less`.
   - Move selection with `j`, `k`, `next`, or `prev`.
   - Open the selected tag or thread with `enter`.
   - Use arrow keys for command history and `Tab` for autocomplete.
   - Unknown commands suggest close matches.

10. **Interface and server**
    - Fixed viewport layout without normal page scrolling.
    - Main content appears on the left, with command history on the right.
    - The visual style uses a VS Code-inspired terminal palette.
    - The top bar shows route, logged-in user, goo balance, theme state, and marquee status.
   - The plain Node.js server serves static files, account APIs, and shared forum-content APIs.

11. **Deployment data**
   - Accounts, goos, and sessions are stored by the server in generated `data/auth.json`.
   - Shared forum boards, tags, threads, and posts are stored by the server in generated `data/forum.json`.
   - Cloudflare Pages uses Functions plus a required `TWIGOO_DATA` KV binding for the same account/forum data.
   - Browser `localStorage` is still used for cache/fallback UI state such as drafts, bookmarks, page state, command history, and theme.
   - Node deploys need persistent storage mounted at `data/` so generated JSON data survives restarts.

## Short Summary

Terminal Forum is a command-driven technical forum prototype for browsing tags, logging in, earning goos, posting, replying, searching, bookmarking, editing, deleting, and switching themes.
