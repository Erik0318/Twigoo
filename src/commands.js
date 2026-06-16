(function () {
  "use strict";

  const State = () => window.ForumState;

  const commandNames = [
    "help", "home", "boards", "tags", "tag", "open", "read", "new", "reply", "title", "headline", "body", "append",
    "upload", "uploadmd", "publish", "cancel", "edit", "delete", "search", "profile", "bio", "streak", "register", "login", "logout", "clear", "back", "reset", "theme", "dark", "light", "next", "prev", "enter", "select",
    "page", "more", "less", "quote", "link", "links", "bookmark", "unbookmark", "bookmarks"
  ];

  function normalizeTags(value) {
    const list = Array.isArray(value) ? value : String(value || "").split(/[,\s#]+/);
    return Array.from(new Set(list.map((item) => String(item || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32)).filter(Boolean))).slice(0, 6);
  }

  function tokenize(input) {
    const tokens = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match;
    while ((match = re.exec(input))) {
      tokens.push(match[1] || match[2] || match[3]);
    }
    return tokens;
  }

  function route(hash) {
    if (window.location.hash === hash) {
      if (window.ForumApp) window.ForumApp.render({ focusPrompt: true });
      return;
    }
    window.location.hash = hash;
  }

  function currentTags() {
    const current = window.ForumApp && window.ForumApp.getRoute ? window.ForumApp.getRoute() : null;
    if (current && current.name === "tag" && current.slug) return [current.slug];
    if (current && current.name === "thread" && current.id) {
      const thread = State().getThread(current.id);
      if (thread) return normalizeTags(thread.tags);
    }
    const firstTag = State().state.tags[0];
    return firstTag ? [firstTag.slug] : [];
  }

  function currentThreadId() {
    const current = window.ForumApp && window.ForumApp.getRoute ? window.ForumApp.getRoute() : null;
    return current && current.name === "thread" ? Number(current.id) : null;
  }

  function currentRoute() {
    return window.ForumApp && window.ForumApp.getRoute ? window.ForumApp.getRoute() : { name: "home" };
  }

  function pageKey() {
    const routeInfo = currentRoute();
    if (window.ForumApp && window.ForumApp.pageKeyForRoute) return window.ForumApp.pageKeyForRoute(routeInfo);
    return routeInfo.name || "home";
  }

  function markdownWeight(line) {
    const text = String(line || "");
    const columns = markdownLineColumns();
    if (!text.trim()) return 1.2;
    if (/^#{1,6}\s+/.test(text)) return 3;
    if (/^(```+|~~~+)/.test(text)) return 2.4;
    const wrapped = Math.max(1, Math.ceil(text.length / columns));
    return wrapped + (/[.!?:;)]$/.test(text.trim()) ? .35 : 0);
  }

  function markdownLineColumns() {
    const fontSize = typeof getComputedStyle === "function" ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize || "16") || 16 : 16;
    const width = window.innerWidth || 1200;
    const sideLog = Math.min(42 * fontSize * .62, Math.max(24 * fontSize * .62, width * .32));
    const columnWidth = Math.max(280, (width - sideLog - 28) / 2);
    return Math.max(44, Math.min(82, Math.floor(columnWidth / (fontSize * .64))));
  }

  function markdownPageWeightLimit() {
    const fontSize = typeof getComputedStyle === "function" ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize || "16") || 16 : 16;
    const height = window.innerHeight || 760;
    const rows = Math.floor((height - 270) / (fontSize * 1.32));
    return Math.max(26, Math.min(56, rows));
  }

  function markdownBodyWeight(value) {
    return String(value || "").replace(/\r\n?/g, "\n").split("\n").reduce((total, line) => total + markdownWeight(line), 0);
  }

  function postChromeWeight() {
    return 3.4;
  }

  function splitLongMarkdownLine(line, maxWeight) {
    if (markdownWeight(line) <= maxWeight) return [line];
    const maxChars = Math.max(24, Math.floor(markdownLineColumns() * Math.max(1, maxWeight - .5)));
    const parts = [];
    const words = String(line || "").split(/(\s+)/);
    let current = "";

    words.forEach((word) => {
      if (!word) return;
      if (word.length > maxChars) {
        if (current.trim()) {
          parts.push(current.trimEnd());
          current = "";
        }
        for (let i = 0; i < word.length; i += maxChars) parts.push(word.slice(i, i + maxChars));
        return;
      }
      if (current && current.length + word.length > maxChars) {
        parts.push(current.trimEnd());
        current = word.trimStart();
      } else {
        current += word;
      }
    });

    if (current.trim()) parts.push(current.trimEnd());
    return parts.length ? parts : [line];
  }

  function splitMarkdownPageWeights(value) {
    const rawLines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const maxWeight = markdownPageWeightLimit();
    const weights = [];
    let weight = 0;
    let inFence = false;

    rawLines.forEach((rawLine) => {
      const lineParts = inFence ? [rawLine] : splitLongMarkdownLine(rawLine, maxWeight);
      lineParts.forEach((line) => {
        const fence = line.match(/^(```+|~~~+)/);
        const lineWeight = markdownWeight(line);
        if (!inFence && weight > 0 && weight + lineWeight > maxWeight) {
          weights.push(Math.min(maxWeight, weight + postChromeWeight()));
          weight = 0;
        }
        weight += lineWeight;
        if (fence) inFence = !inFence;
      });
    });

    if (weight > 0) weights.push(Math.min(maxWeight, weight + postChromeWeight()));
    return weights.length ? weights : [Math.min(maxWeight, markdownBodyWeight(value) + postChromeWeight())];
  }

  function threadDisplayPageCount(threadId) {
    const columnLimit = markdownPageWeightLimit();
    const posts = State().getPostsForThread(threadId);
    const weights = posts.flatMap((post) => splitMarkdownPageWeights(post.body));
    let pages = 1;
    let column = 0;
    let columnWeight = 0;

    weights.forEach((weight) => {
      if (columnWeight > 0 && columnWeight + weight > columnLimit) {
        column += 1;
        columnWeight = 0;
        if (column > 1) {
          pages += 1;
          column = 0;
        }
      }
      columnWeight += weight;
    });

    return Math.max(1, pages);
  }

  function pageLimit(routeInfo) {
    const route = routeInfo || currentRoute();
    const perPage = route.name === "thread" ? 3 : 6;
    let count = 1;
    if (route.name === "home") count = State().getRecentThreads(6).length;
    if (route.name === "boards") count = State().state.boards.length;
    if (route.name === "board") count = State().getThreadsForBoard(route.slug).length;
    if (route.name === "tags") count = State().state.tags.length;
    if (route.name === "tag") count = State().getThreadsForTag(route.slug).length;
    if (route.name === "thread") return threadDisplayPageCount(route.id);
    if (route.name === "profile") count = State().state.threads.filter((thread) => thread.author === route.username).length;
    if (route.name === "search") count = State().search(route.query).length;
    if (route.name === "bookmarks") count = State().getBookmarkedThreads().length;
    return Math.max(1, Math.ceil(count / perPage));
  }

  function parseQuote(args) {
    const quoteIndex = args.findIndex((arg) => arg === "--quote" || arg === "quote");
    if (quoteIndex === -1) return { quotePostId: null, args };
    const quotePostId = Number(args[quoteIndex + 1]);
    if (!quotePostId) return { quotePostId: null, args, error: "usage: --quote <post_id>" };
    const nextArgs = args.slice(0, quoteIndex).concat(args.slice(quoteIndex + 2));
    return { quotePostId, args: nextArgs };
  }

  function parseThreadInline(raw) {
    const match = String(raw || "").match(/^\s*\S+\s+\S+\s+([\s\S]+)$/);
    const text = match ? match[1].trim() : "";
    const separator = text.indexOf(";");
    if (separator === -1) return null;
    return {
      title: text.slice(0, separator).trim(),
      body: text.slice(separator + 1).trim()
    };
  }

  function chooseMarkdownFile() {
    return new Promise((resolve) => {
      const draft = State().state.ui.draft;
      if (!draft || draft.kind !== "thread") {
        resolve({ ok: false, message: "start a thread draft first. use: new <tag>" });
        return;
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".md,.markdown,text/markdown,text/plain";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      input.style.top = "0";
      document.body.appendChild(input);

      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        input.remove();
        resolve(result);
      };

      input.addEventListener("change", () => {
        const file = input.files && input.files[0];
        if (!file) {
          finish({ ok: false, message: "no file selected" });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => finish(State().importMarkdownDraft(String(reader.result || ""), file.name));
        reader.onerror = () => finish({ ok: false, message: "could not read markdown file" });
        reader.readAsText(file);
      });

      window.setTimeout(() => {
        if (!settled && (!input.files || !input.files.length)) finish({ ok: false, message: "no file selected" });
      }, 120000);
      input.click();
    });
  }

  function currentListItem() {
    return window.ForumApp && window.ForumApp.getSelectedItem ? window.ForumApp.getSelectedItem() : null;
  }

  function suggest(command) {
    let best = null;
    let bestDistance = Infinity;
    commandNames.forEach((candidate) => {
      const distance = levenshtein(command, candidate);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    });
    return bestDistance <= 2 ? best : null;
  }

  function levenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }

  function maskSecretCommand(cmd, args) {
    if ((cmd === "login" || cmd === "register") && args.length > 1) {
      return cmd + " " + args[0] + " " + "*".repeat(Math.min(12, Math.max(8, String(args[1]).length)));
    }
    return null;
  }

  function displayInput(input) {
    const raw = String(input || "").trim();
    const tokens = tokenize(raw);
    const cmd = (tokens[0] || "").toLowerCase();
    const masked = maskSecretCommand(cmd, tokens.slice(1));
    return masked || raw;
  }

  function addResult(raw, output, ok, displayInput) {
    State().addLog(displayInput || raw, output, ok ? "info" : "error");
  }

  function commandId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  }

  function streakLine(user) {
    const streak = Math.max(0, Number(user && user.streak) || 0);
    const goos = Math.max(10, Number(user && user.goos) || 10);
    return streak + " " + (streak === 1 ? "day" : "days") + " streak | " + goos + " goos";
  }

  async function run(input) {
    const raw = String(input || "").trim();
    const startingHash = window.location.hash;
    if (!raw) return { ok: true, output: "" };

    const tokens = tokenize(raw);
    const cmd = (tokens[0] || "").toLowerCase();
    const args = tokens.slice(1);
    let output = "";
    let ok = true;
    let shouldLog = true;
    let displayInput = maskSecretCommand(cmd, args);
    let rewardChanged = false;

    switch (cmd) {
      case "help":
      case "?":
        output = "help";
        route("#/help");
        break;

      case "home":
      case "cd":
        output = "/home";
        route("#/home");
        break;

      case "boards":
        output = "/boards";
        State().state.ui.selectedIndex = 0;
        State().save();
        route("#/boards");
        break;

      case "tags":
      case "ls":
        if (cmd === "tags" && args.length) {
          const result = State().setDraftTags(args.join(" "));
          ok = result.ok;
          output = result.message;
          break;
        }
        output = "/tags";
        State().state.ui.selectedIndex = 0;
        State().save();
        route("#/tags");
        break;

      case "open": {
        const slug = args[0];
        if (!slug) {
          ok = false;
          output = "usage: open <tag|station>";
          break;
        }
        const board = State().getBoard(slug);
        const tag = State().getTag(slug);
        if (!board && !tag) {
          ok = false;
          output = "unknown tag or board: " + slug;
          break;
        }
        State().state.ui.selectedIndex = 0;
        State().save();
        output = board ? "/boards/" + board.slug : "/tag/" + tag.slug;
        route(board ? "#/board/" + encodeURIComponent(board.slug) : "#/tag/" + encodeURIComponent(tag.slug));
        break;
      }

      case "tag": {
        const action = String(args[0] || "").toLowerCase();
        if (!action) {
          output = "/tags";
          route("#/tags");
          break;
        }
        if (action === "create") {
          const slug = args[1];
          const text = args.slice(2).join(" ");
          const separator = text.indexOf(";");
          const title = separator === -1 ? text : text.slice(0, separator);
          const description = separator === -1 ? "" : text.slice(separator + 1);
          const result = State().createTag(slug, title, description);
          ok = result.ok;
          output = result.message;
          if (result.ok) route("#/tag/" + encodeURIComponent(result.tag.slug));
          break;
        }
        if (action === "bio" || action === "decorate") {
          const slug = args[1];
          const text = args.slice(2).join(" ");
          const result = State().decorateTag(slug, text);
          ok = result.ok;
          output = result.message;
          if (result.ok) route("#/tag/" + encodeURIComponent(result.tag.slug));
          break;
        }
        const tag = State().getTag(action);
        if (!tag) {
          ok = false;
          output = "unknown tag: " + action;
          break;
        }
        output = "/tag/" + tag.slug;
        route("#/tag/" + encodeURIComponent(tag.slug));
        break;
      }

      case "read":
      case "cat": {
        const id = Number(args[0]);
        if (!id) {
          ok = false;
          output = "usage: read <#number>";
          break;
        }
        const thread = State().getThread(id);
        if (!thread) {
          ok = false;
          output = "unknown thread: " + args[0];
          break;
        }
        output = "thread #" + thread.id;
        route("#/thread/" + thread.id);
        break;
      }

      case "new":
      case "touch": {
        const tags = args[0] ? normalizeTags(args[0]) : currentTags();
        const inline = args[0] ? parseThreadInline(raw) : null;
        if (inline) {
          if (!inline.title || !inline.body) {
            ok = false;
            output = "usage: new <tag[,tag]> <title>; <body>";
            break;
          }
          const result = State().createThread("station", inline.title, inline.body, tags);
          ok = result.ok;
          output = result.ok ? "created thread #" + result.thread.id : result.message;
          if (result.ok) route("#/thread/" + result.thread.id);
          break;
        }
        const result = State().startThreadDraft(tags);
        ok = result.ok;
        output = result.ok ? result.message + ". use: title <text>; tags <tag>; body <text>; publish" : result.message;
        route(tags[0] ? "#/tag/" + encodeURIComponent(tags[0]) : "#/tags");
        break;
      }

      case "reply": {
        const parsed = parseQuote(args);
        if (parsed.error) {
          ok = false;
          output = parsed.error;
          break;
        }
        const id = Number(parsed.args[0]) || currentThreadId();
        const body = parsed.args.slice(Number(parsed.args[0]) ? 1 : 0).join(" ");
        if (!id) {
          ok = false;
          output = "usage: reply thread_id or reply thread_id \"body\"";
          break;
        }
        const thread = State().getThread(id);
        if (!thread) {
          ok = false;
          output = "unknown thread: " + id;
          break;
        }
        if (body) {
          const result = State().addReply(id, body, parsed.quotePostId);
          ok = result.ok;
          output = result.ok ? "reply added to thread #" + id : result.message;
          if (result.ok) route("#/thread/" + id);
          break;
        }
        const result = State().startReplyDraft(id, parsed.quotePostId);
        ok = result.ok;
        output = result.ok ? result.message + ". use: body <text>; publish" : result.message;
        route("#/thread/" + id);
        break;
      }

      case "quote": {
        const postId = Number(args[0]);
        if (!postId) {
          ok = false;
          output = "usage: quote <post_id>";
          break;
        }
        const post = State().getPost(postId);
        if (!post) {
          ok = false;
          output = "unknown post: " + args[0];
          break;
        }
        const result = State().startReplyDraft(post.threadId, post.id);
        ok = result.ok;
        output = result.ok ? "quoted post #" + post.id + ". use: body <text>; publish" : result.message;
        route("#/thread/" + post.threadId);
        break;
      }

      case "title": {
        const text = args.join(" ");
        const result = State().setDraftTitle(text);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "headline": {
        const text = args.join(" ");
        if (!text) {
          ok = false;
          output = "usage: headline <text>";
          break;
        }
        const result = await State().setProfileTitle(text);
        ok = result.ok;
        output = result.message;
        if (result.ok && result.user) route("#/profile/" + encodeURIComponent(result.user.username));
        break;
      }

      case "body": {
        const text = args.join(" ");
        const result = State().setDraftBody(text);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "append":
      case "+": {
        const text = args.join(" ");
        const result = State().appendDraftBody(text);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "upload":
      case "uploadmd": {
        const result = await chooseMarkdownFile();
        ok = result.ok;
        output = result.message;
        break;
      }

      case "publish":
      case "send":
      case "submit": {
        const result = State().publishDraft();
        ok = result.ok;
        if (result.post && result.thread) {
          output = "reply added to thread #" + result.thread.id;
          route("#/thread/" + result.thread.id);
        } else if (result.post) {
          output = result.message;
          route("#/thread/" + result.post.threadId);
        } else if (result.thread) {
          output = "created thread #" + result.thread.id;
          route("#/thread/" + result.thread.id);
        } else {
          output = result.message;
        }
        break;
      }

      case "cancel":
      case "discard": {
        const result = State().cancelDraft();
        ok = result.ok;
        output = result.message;
        break;
      }

      case "edit": {
        const postId = Number(args[0]);
        const body = args.slice(1).join(" ");
        if (!postId) {
          ok = false;
          output = "usage: edit <post_id>";
          break;
        }
        const post = State().getPost(postId);
        const result = body ? State().editPost(postId, body) : State().startEditDraft(postId);
        ok = result.ok;
        output = body ? result.message : result.message + ". use: body <text>; append <text>; publish";
        if (result.ok && post) route("#/thread/" + post.threadId);
        break;
      }

      case "delete":
      case "del":
      case "rm": {
        const postId = Number(args[0]);
        if (!postId) {
          ok = false;
          output = "usage: delete <post_id>";
          break;
        }
        const result = State().deletePost(postId);
        ok = result.ok;
        output = result.message;
        if (result.ok && result.threadDeleted) {
          route("#/board/" + encodeURIComponent(result.boardSlug));
        } else if (result.ok && result.thread) {
          route("#/thread/" + result.thread.id);
        }
        break;
      }

      case "search":
      case "grep": {
        const query = args.join(" ");
        if (!query) {
          ok = false;
          output = "usage: search <text>";
          break;
        }
        output = "search: " + query;
        route("#/search/" + encodeURIComponent(query));
        break;
      }

      case "profile":
      case "whois": {
        const username = args[0];
        if (!username) {
          output = "/profile";
          route("#/profile");
          break;
        }
        const user = State().getUser(username);
        if (!user) {
          ok = false;
          output = "unknown user: " + username;
          break;
        }
        output = "/profile/" + user.username;
        route("#/profile/" + encodeURIComponent(user.username));
        break;
      }

      case "streak": {
        if (!State().getSessionUser()) {
          ok = false;
          output = "login required. type: register <username> <password> or login <username> <password>";
          break;
        }
        const result = await State().rewardCommand("streak", commandId());
        ok = result.ok;
        rewardChanged = result.ok;
        if (!result.ok) {
          output = result.message;
          break;
        }
        output = streakLine(result.user || State().getSessionUser());
        if (result.reward > 0) output += " | +" + result.reward + " goos";
        if (result.alreadyClaimedToday) output += " | daily goos already claimed";
        break;
      }

      case "bio": {
        const text = args.join(" ");
        if (!text) {
          ok = false;
          output = "usage: bio <text>";
          break;
        }
        const result = await State().setBio(text);
        ok = result.ok;
        output = result.message;
        if (result.ok && result.user) route("#/profile/" + encodeURIComponent(result.user.username));
        break;
      }

      case "bookmark": {
        const id = Number(args[0]) || currentThreadId();
        if (!id) {
          ok = false;
          output = "usage: bookmark <#number>";
          break;
        }
        const result = State().bookmarkThread(id);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "unbookmark": {
        const id = Number(args[0]) || currentThreadId();
        if (!id) {
          ok = false;
          output = "usage: unbookmark <#number>";
          break;
        }
        const result = State().unbookmarkThread(id);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "bookmarks":
        output = "/bookmarks";
        route("#/bookmarks");
        break;

      case "register": {
        const username = args[0];
        const password = args[1];
        if (!username || !password) {
          ok = false;
          output = "usage: register <username> <password>";
          route("#/login");
          break;
        }
        const result = await State().register(username, password);
        ok = result.ok;
        output = result.message;
        if (result.ok && State().state.session.username) route("#/profile/" + encodeURIComponent(State().state.session.username));
        break;
      }

      case "login": {
        const username = args[0];
        const password = args[1];
        if (!username || !password) {
          ok = false;
          output = "usage: login <username> <password>";
          route("#/login");
          break;
        }
        const result = await State().login(username, password);
        ok = result.ok;
        output = result.message;
        if (result.ok) route("#/profile/" + encodeURIComponent(State().state.session.username));
        break;
      }

      case "logout":
        output = State().logout();
        break;

      case "clear":
      case "cls":
        State().clearLog();
        shouldLog = false;
        output = "cleared";
        break;

      case "back":
      case "..":
        output = "back";
        history.back();
        break;

      case "reset":
        output = "reset";
        addResult(raw, output, true, displayInput);
        State().reset();
        return { ok: true, output };

      case "theme":
      case "dark":
      case "light": {
        const target = cmd === "theme" ? args[0] : cmd;
        const result = State().setTheme(target);
        ok = result.ok;
        output = result.message;
        break;
      }

      case "page": {
        const target = String(args[0] || "").toLowerCase();
        const key = pageKey();
        const maxPage = pageLimit();
        if (target === "next" || target === "+") {
          const page = State().movePage(key, 1, maxPage);
          output = "page " + page + "/" + maxPage;
        } else if (target === "prev" || target === "previous" || target === "-") {
          const page = State().movePage(key, -1, maxPage);
          output = "page " + page + "/" + maxPage;
        } else {
          const page = Number(args[0]);
          if (!page) {
            ok = false;
            output = "usage: page <number|next|prev>";
            break;
          }
          State().setPage(key, Math.min(page, maxPage));
          output = "page " + Math.min(page, maxPage) + "/" + maxPage;
        }
        shouldLog = false;
        break;
      }

      case "more": {
        const maxPage = pageLimit();
        const page = State().movePage(pageKey(), 1, maxPage);
        output = "page " + page + "/" + maxPage;
        shouldLog = false;
        break;
      }

      case "less": {
        const maxPage = pageLimit();
        const page = State().movePage(pageKey(), -1, maxPage);
        output = "page " + page + "/" + maxPage;
        shouldLog = false;
        break;
      }

      case "links": {
        const links = window.ForumApp && window.ForumApp.getMarkdownLinks ? window.ForumApp.getMarkdownLinks() : [];
        output = links.length ? links.map((link) => link.index + ": " + link.label + " -> " + link.href).join("\n") : "no links on this page";
        break;
      }

      case "link": {
        const index = Number(args[0]);
        if (!index) {
          ok = false;
          output = "usage: link <number>";
          break;
        }
        const result = window.ForumApp && window.ForumApp.followMarkdownLink ? window.ForumApp.followMarkdownLink(index) : { ok: false, message: "no links on this page" };
        ok = result.ok;
        output = result.message;
        break;
      }

      case "next":
      case "j":
        if (window.ForumApp) window.ForumApp.moveSelection(1);
        output = "selected next";
        shouldLog = false;
        break;

      case "prev":
      case "k":
        if (window.ForumApp) window.ForumApp.moveSelection(-1);
        output = "selected previous";
        shouldLog = false;
        break;

      case "select": {
        const index = Number(args[0]);
        if (!index) {
          ok = false;
          output = "usage: select <number>";
          break;
        }
        if (window.ForumApp) window.ForumApp.selectIndex(index - 1);
        output = "selected " + index;
        shouldLog = false;
        break;
      }

      case "enter":
      case "go": {
        const item = currentListItem();
        if (!item) {
          ok = false;
          output = "nothing selected";
          break;
        }
        output = item.command;
        route(item.href);
        break;
      }

      default: {
        ok = false;
        const maybe = suggest(cmd);
        output = "unknown command: " + cmd + (maybe ? ". maybe: " + maybe : ". type help");
      }
    }

    if (shouldLog) addResult(raw, output, ok, displayInput);

    if (window.ForumApp && (window.location.hash === startingHash || rewardChanged)) {
      window.ForumApp.render({ focusPrompt: true });
    }

    return { ok, output };
  }

  function suggestions(input) {
    const raw = String(input || "");
    const tokens = tokenize(raw);
    const first = tokens[0] || "";
    const lowerRaw = raw.toLowerCase();
    const hasCommand = /\s/.test(raw);
    const unique = (items) => Array.from(new Set(items));
    const matching = (items) => unique(items).filter((item) => item.toLowerCase().startsWith(lowerRaw)).slice(0, 12);

    if (!first) return commandNames.slice(0, 12);
    if (!hasCommand) return matching(commandNames);

    if (first === "open") return matching(State().state.boards.map((board) => "open " + board.slug).concat(State().state.tags.map((tag) => "open " + tag.slug)));
    if (first === "tag") return matching(State().state.tags.map((tag) => "tag " + tag.slug).concat(["tag create ", "tag bio "]));
    if (first === "new") return matching(State().state.tags.map((tag) => "new " + tag.slug));
    if (first === "read") return matching(State().getRecentThreads(12).map((thread) => "read " + thread.id));
    if (first === "profile" || first === "whois") return matching(State().state.users.map((user) => first + " " + user.username));
    if (first === "page") return matching(["page next", "page prev"]);
    if (first === "theme") return matching(["theme dark", "theme light"]);

    return matching([
      "register ", "login ", "streak", "bio ", "headline ", "quote ", "edit ", "delete ",
      "bookmark", "unbookmark", "bookmarks"
    ]);
  }

  function isCommandName(value) {
    return commandNames.includes(String(value || ""));
  }

  function complete(input) {
    const current = String(input || "");
    const options = suggestions(current);
    if (!options.length) return current;
    const value = options[0];
    return isCommandName(value) ? value + " " : value;
  }

  window.ForumCommands = { run, tokenize, suggestions, complete, isCommandName, displayInput };
})();
