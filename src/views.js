(function () {
  "use strict";

  const S = () => window.ForumState;
  let markdownParser = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeUrl(value) {
    const url = String(value || "").trim();
    if (/^(https?:|mailto:|#|\/(?!\/)|\.\/|\.\.\/)/i.test(url)) return url;
    return "#";
  }

  function renderInlineMarkdown(value) {
    const codeSpans = [];
    let text = String(value || "").replace(/`([^`]+)`/g, (_, code) => {
      const token = "@@CODE" + codeSpans.length + "@@";
      codeSpans.push("<code>" + escapeHtml(code) + "</code>");
      return token;
    });

    text = escapeHtml(text);
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, alt, url, title) => {
      const titleAttr = title ? " title=\"" + escapeHtml(title) + "\"" : "";
      return "<img src=\"" + escapeHtml(safeUrl(url.replace(/&amp;/g, "&"))) + "\" alt=\"" + alt + "\"" + titleAttr + ">";
    });
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_, label, url, title) => {
      const titleAttr = title ? " title=\"" + escapeHtml(title) + "\"" : "";
      return "<a href=\"" + escapeHtml(safeUrl(url.replace(/&amp;/g, "&"))) + "\"" + titleAttr + " target=\"_blank\" rel=\"noreferrer\">" + label + "</a>";
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^\*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    text = text.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
    text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    text = text.replace(/\^\^([^^]+)\^\^/g, "<mark>$1</mark>");
    codeSpans.forEach((html, index) => {
      text = text.replace(new RegExp("@@CODE" + index + "@@", "g"), html);
    });
    return text;
  }

  function renderMarkdownBlocks(lines, start, stopOnBlockquote) {
    const html = [];
    let i = start || 0;

    while (i < lines.length) {
      const line = lines[i];
      if (stopOnBlockquote && !/^>\s?/.test(line)) break;
      if (!line.trim()) {
        i += 1;
        continue;
      }

      const fence = line.match(/^(```+|~~~+)\s*(.*)$/);
      if (fence) {
        const marker = fence[1].charAt(0);
        const lang = fence[2].trim().split(/\s+/)[0];
        const body = [];
        i += 1;
        while (i < lines.length && !new RegExp("^" + marker + "{3,}\\s*$").test(lines[i])) {
          body.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        html.push("<pre class=\"md-code\"><code" + (lang ? " data-lang=\"" + escapeHtml(lang) + "\"" : "") + ">" + escapeHtml(body.join("\n")) + "</code></pre>");
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        html.push("<h" + level + ">" + renderInlineMarkdown(heading[2].replace(/\s+#+\s*$/, "")) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        html.push("<hr>");
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quoted = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoted.push(lines[i].replace(/^>\s?/, ""));
          i += 1;
        }
        html.push("<blockquote>" + renderMarkdownBlocks(quoted, 0).html + "</blockquote>");
        continue;
      }

      if (i + 1 < lines.length && /^\s*\|?[-: ]+\|[-|: ]+\|?\s*$/.test(lines[i + 1]) && /\|/.test(line)) {
        const headers = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
        i += 2;
        const rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
          rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
          i += 1;
        }
        html.push("<table><thead><tr>" + headers.map((cell) => "<th>" + renderInlineMarkdown(cell) + "</th>").join("") + "</tr></thead><tbody>" + rows.map((row) => "<tr>" + headers.map((_, index) => "<td>" + renderInlineMarkdown(row[index] || "") + "</td>").join("") + "</tr>").join("") + "</tbody></table>");
        continue;
      }

      const list = line.match(/^(\s*)([-+*]|\d+[.)])\s+(\[[ xX]\]\s+)?(.+)$/);
      if (list) {
        const ordered = /\d/.test(list[2]);
        const tag = ordered ? "ol" : "ul";
        const items = [];
        while (i < lines.length) {
          const item = lines[i].match(/^(\s*)([-+*]|\d+[.)])\s+(\[[ xX]\]\s+)?(.+)$/);
          if (!item || /\d/.test(item[2]) !== ordered) break;
          const checked = item[3] ? /x/i.test(item[3]) : null;
          const checkbox = checked === null ? "" : "<input type=\"checkbox\" disabled" + (checked ? " checked" : "") + "> ";
          items.push("<li>" + checkbox + renderInlineMarkdown(item[4]) + "</li>");
          i += 1;
        }
        html.push("<" + tag + ">" + items.join("") + "</" + tag + ">");
        continue;
      }

      const paragraph = [line];
      i += 1;
      while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s+/.test(lines[i]) && !/^(```+|~~~+)/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^(\s*)([-+*]|\d+[.)])\s+/.test(lines[i]) && !/^ {0,3}([-*_])(?:\s*[-*_]){2,}\s*$/.test(lines[i])) {
        paragraph.push(lines[i]);
        i += 1;
      }
      html.push("<p>" + paragraph.map(renderInlineMarkdown).join("<br>") + "</p>");
    }

    return { html: html.join(""), index: i };
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/&[^;\s]+;/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  }

  function annotateMarkdownHtml(html, anchorPages, postId) {
    const seenHeadings = {};
    let linkIndex = 0;
    const withHeadings = String(html || "").replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (match, level, text) => {
      const base = slugify(text);
      seenHeadings[base] = (seenHeadings[base] || 0) + 1;
      const id = seenHeadings[base] === 1 ? base : base + "-" + seenHeadings[base];
      return `<h${level} id="${escapeHtml(id)}">${text}</h${level}>`;
    });

    return withHeadings.replace(/<a\b([^>]*?)href="([^"]+)"([^>]*)>/g, (match, before, href, after) => {
      linkIndex += 1;
      const rawAnchor = href.startsWith("#") && !href.startsWith("#/") ? href.slice(1) : "";
      const page = rawAnchor ? anchorPages && anchorPages[decodeURIComponent(rawAnchor)] : 0;
      const pageAttr = page ? ` data-md-page="${page}" data-md-post-id="${escapeHtml(postId)}"` : "";
      return `<a${before}href="${href}" data-link-index="${linkIndex}" data-link-label="[${linkIndex}] "${pageAttr}${after}>`;
    });
  }

  function renderMarkdown(value, anchorPages, postId) {
    const normalized = String(value || "").replace(/\r\n?/g, "\n");
    let html;
    if (window.markdownit) {
      if (!markdownParser) {
        markdownParser = window.markdownit({
          html: false,
          linkify: true,
          breaks: true,
          typographer: false
        });
      }
      html = markdownParser.render(normalized);
    } else {
      html = renderMarkdownBlocks(normalized.split("\n"), 0).html || "<p></p>";
    }
    return annotateMarkdownHtml(html, anchorPages, postId);
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

  function splitMarkdownPages(value) {
    const rawLines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
    const maxWeight = markdownPageWeightLimit();
    const pages = [];
    let page = [];
    let weight = 0;
    let inFence = false;

    rawLines.forEach((rawLine) => {
      const lineParts = inFence ? [rawLine] : splitLongMarkdownLine(rawLine, maxWeight);
      lineParts.forEach((line) => {
      const fence = line.match(/^(```+|~~~+)/);
      const lineWeight = markdownWeight(line);
      const canBreak = !inFence && page.length && weight + lineWeight > maxWeight;
      if (canBreak) {
        pages.push(page.join("\n").trim());
        page = [];
        weight = 0;
      }
      page.push(line);
      weight += lineWeight;
      if (fence) inFence = !inFence;
      });
    });

    const last = page.join("\n").trim();
    if (last) pages.push(last);
    return pages.length ? pages : [String(value || "")];
  }

  function markdownAnchorPages(pages) {
    const anchors = {};
    const seen = {};
    pages.forEach((body, pageIndex) => {
      const lines = String(body || "").split("\n");
      lines.forEach((line, lineIndex) => {
        const atx = line.match(/^#{1,6}\s+(.+)$/);
        const setext = lineIndex + 1 < lines.length && line.trim() && /^ {0,3}(=+|-+)\s*$/.test(lines[lineIndex + 1]);
        if (!atx && !setext) return;
        const text = atx ? atx[1].replace(/\s+#+\s*$/, "") : line.trim();
        const base = slugify(text);
        seen[base] = (seen[base] || 0) + 1;
        const id = seen[base] === 1 ? base : base + "-" + seen[base];
        anchors[id] = pageIndex + 1;
      });
    });
    return anchors;
  }

  function threadDisplayPages(posts, key) {
    const columnLimit = markdownPageWeightLimit();
    const expanded = posts.map((post) => {
      const pages = splitMarkdownPages(post.body);
      return { post, pages, anchors: markdownAnchorPages(pages) };
    });
    const units = expanded.flatMap((entry) => entry.pages.map((body, index) => ({
      post: entry.post,
      body,
      anchorPages: entry.anchors,
      anchors: {},
      bodyPage: index + 1,
      bodyPages: entry.pages.length,
      weight: Math.min(columnLimit, markdownBodyWeight(body) + postChromeWeight())
    })));
    const pages = [{ columns: [[], []], weights: [0, 0] }];
    let column = 0;

    units.forEach((unit) => {
      let page = pages[pages.length - 1];
      if (page.weights[column] > 0 && page.weights[column] + unit.weight > columnLimit) {
        column += 1;
        if (column > 1) {
          page = { columns: [[], []], weights: [0, 0] };
          pages.push(page);
          column = 0;
        }
      }
      page.columns[column].push(unit);
      page.weights[column] += unit.weight;
    });

    const postAnchorPages = {};
    pages.forEach((page, pageIndex) => {
      page.columns.flat().forEach((unit) => {
        Object.keys(unit.anchorPages).forEach((anchor) => {
          if (unit.anchorPages[anchor] === unit.bodyPage) {
            postAnchorPages[unit.post.id] = postAnchorPages[unit.post.id] || {};
            postAnchorPages[unit.post.id][anchor] = pageIndex + 1;
          }
        });
      });
    });
    pages.forEach((page) => {
      page.columns.flat().forEach((unit) => {
        unit.anchors = postAnchorPages[unit.post.id] || {};
      });
    });

    const totalPages = Math.max(1, pages.length);
    const current = Math.min(S().getPage(pageKey(key)), totalPages);
    const active = pages[current - 1] || pages[0];
    active.columns.forEach((column, columnIndex) => {
      column.forEach((unit) => {
        unit.continued = unit.bodyPage > 1;
      });
    });
    return {
      columns: active.columns,
      current,
      totalPages,
      totalItems: units.length
    };
  }

  function formatTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "unknown";
    return date.toLocaleString([], {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function plural(count, word) {
    return count + " " + word + (count === 1 ? "" : "s");
  }

  function pathLabel(route) {
    if (!route || route.name === "home") return "/home";
    if (route.name === "boards") return "/boards";
    if (route.name === "board") return "/boards/" + route.slug;
    if (route.name === "tags") return "/tags";
    if (route.name === "tag") return "/tag/" + route.slug;
    if (route.name === "thread") return "/thread/" + route.id;
    if (route.name === "new") return "/new/" + route.slug;
    if (route.name === "profile") return "/profile/" + route.username;
    if (route.name === "profiles") return "/profile";
    if (route.name === "bookmarks") return "/bookmarks";
    if (route.name === "search") return "/search/" + route.query;
    if (route.name === "login") return "/login";
    if (route.name === "help") return "/help";
    return "/" + route.name;
  }

  function shell(route, content) {
    const user = S().getSessionUser();
    const session = user ? user.username + " " + Math.max(10, Number(user.goos) || 10) + " goos | " + Math.max(0, Number(user.streak) || 0) + " days streak" : "guest";
    const theme = S().state.ui.theme === "light" ? "light" : "dark";

    return `
      <div class="site-grid">
        <header class="topbar">
          <div class="topbar-inner">
            <div class="brand"><span class="brand-mark">[forum]</span><span class="brand-path">${escapeHtml(pathLabel(route))}</span></div>
            <div class="studio-marquee" aria-label="Welcome to the Twigoo Tech Forum.">
              <span>Welcome to the Twigoo Tech Forum.</span>
              <span>Type 'help' to see all commands.</span>
              <span>Please be polite and respectful in other people's threads.</span>
              <span>Good posts include context, details, and what you already tried.</span>
              <span>Use 'new &lt;tag&gt; &lt;title&gt;; &lt;body&gt;' to publish fast.</span>
              <span>Use drafts when the thought needs more room.</span>
              <span>Twigoo builds weird little tools with serious intent.</span>
            </div>
            <div class="session-state">${escapeHtml(session)}</div>
            <div class="theme-state">${escapeHtml(theme)}</div>
          </div>
        </header>

        <main id="main" class="screen-grid" tabindex="-1">
          <section class="screen-main" aria-label="forum screen">
            <div class="view-stack">
              ${content}
              ${renderDraftPanel()}
            </div>
          </section>
          <aside class="side-log" aria-label="command log">
            ${renderCommandLog()}
          </aside>
        </main>

        <section class="command-dock" aria-label="command input">
          <form class="command-line" id="command-form" autocomplete="off">
            <div class="autocomplete-row" id="autocomplete-row" aria-hidden="true"></div>
            <div class="command-entry">
              <label class="prompt-label" for="command-input">&gt;</label>
              <div class="command-input-wrap">
                <div class="autocomplete-ghost" aria-hidden="true"><span id="autocomplete-prefix"></span><span id="autocomplete-suffix"></span></div>
                <input id="command-input" class="command-input" name="command" placeholder="help" spellcheck="false" autocomplete="off" autofocus />
              </div>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  function pageKey(key) {
    return key;
  }

  function paginate(items, key, size) {
    const pageSize = size || 6;
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(S().getPage(pageKey(key)), totalPages);
    const start = (current - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      current,
      totalPages,
      totalItems: items.length
    };
  }

  function pageFoot(page, base) {
    const commands = base ? base + " | " : "";
    return commands + "page " + page.current + "/" + page.totalPages + " | page next | page prev";
  }

  function visibleLogLines(log) {
    if (!log.length) return [{ input: "", output: "commands appear here", kind: "info" }];

    const fontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize || "16") || 16;
    const sideChars = Math.max(20, Math.floor((window.innerWidth * 0.32) / (fontSize * 0.62)));
    const reservedPx = 120;
    const availableRows = Math.max(8, Math.floor((window.innerHeight - reservedPx) / (fontSize * 1.12)));

    const picked = [];
    let rows = 0;

    for (let i = log.length - 1; i >= 0; i -= 1) {
      const line = log[i];
      const inputRows = Math.max(1, Math.ceil((String(line.input || "").length + 2) / sideChars));
      const outputRows = Math.max(1, Math.ceil(String(line.output || "").length / sideChars));
      const estimate = inputRows + outputRows;
      if (picked.length && rows + estimate > availableRows) break;
      picked.push(line);
      rows += estimate;
    }

    return picked.reverse();
  }

  function renderCommandLog() {
    const lines = visibleLogLines(S().state.commandLog);
    return panel("log", "clear", `
      <div class="command-log">
        ${lines.map((line) => `
          <div class="log-line ${escapeHtml(line.kind || "info")}">
            <span class="input">&gt; ${escapeHtml(line.input)}</span>
            <span class="output">${escapeHtml(line.output)}</span>
          </div>
        `).join("")}
      </div>
    `);
  }
  function renderDraftPanel() {
    const draft = S().state.ui.draft;
    if (!draft) return "";

    if (draft.kind === "thread") {
      return panel("draft", (draft.tags || []).map((tag) => "#" + tag).join(" ") || "/tags", `
        <div class="draft-lines">
          <div><span class="muted">title</span> ${escapeHtml(draft.title || "[unset]")}</div>
          <div><span class="muted">tags</span> ${escapeHtml((draft.tags || []).join(", ") || "[unset]")}</div>
          ${draft.markdownFile ? `<div><span class="muted">markdown</span> ${escapeHtml(draft.markdownFile)}</div>` : ""}
          <div><span class="muted">body</span></div>
          <pre class="draft-body">${escapeHtml(draft.body || "[empty]")}</pre>
        </div>
        <div class="cmd-help">title &lt;text&gt; | tags &lt;tag[,tag]&gt; | upload | body &lt;text&gt; | append &lt;text&gt; | publish | cancel</div>
      `);
    }

    if (draft.kind === "edit") {
      const post = S().getPost(draft.postId);
      const thread = S().getThread(draft.threadId);
      return panel("draft", "edit post #" + draft.postId, `
        <div class="draft-lines">
          <div><span class="muted">thread</span> ${escapeHtml(thread ? thread.title : "unknown")}</div>
          <div><span class="muted">post</span> #${escapeHtml(post ? post.id : draft.postId)}</div>
          <div><span class="muted">body</span></div>
          <pre class="draft-body">${escapeHtml(draft.body || "[empty]")}</pre>
        </div>
        <div class="cmd-help">body &lt;text&gt; | append &lt;text&gt; | publish | cancel</div>
      `);
    }

    const thread = S().getThread(draft.threadId);
    const quoted = draft.quotePostId ? S().getPost(draft.quotePostId) : null;
    return panel("draft", "reply to #" + draft.threadId, `
      <div class="draft-lines">
        <div><span class="muted">thread</span> ${escapeHtml(thread ? thread.title : "unknown")}</div>
        ${quoted ? `<pre class="quote-block">&gt; ${escapeHtml(quoted.author)}: ${escapeHtml(quoted.body).slice(0, 180)}</pre>` : ""}
        <div><span class="muted">body</span></div>
        <pre class="draft-body">${escapeHtml(draft.body || "[empty]")}</pre>
      </div>
      <div class="cmd-help">body &lt;text&gt; | append &lt;text&gt; | publish | cancel</div>
    `);
  }

  function panel(title, kicker, body, foot) {
    return `
      <section class="panel">
        <div class="panel-head">
          <span class="panel-title">${escapeHtml(title)}</span>
          ${kicker ? `<span class="panel-kicker">${escapeHtml(kicker)}</span>` : ""}
        </div>
        <div class="panel-body">${body}</div>
        ${foot ? `<div class="panel-foot">${foot}</div>` : ""}
      </section>
    `;
  }

  function homeView() {
    const recent = S().getRecentThreads(6);
    const page = paginate(recent, "home", 6);
    return `
      <pre class="ascii-hero">FORUM</pre>
      ${panel("index", "", `
        <div class="cmd-help">help | tags | tag &lt;tag&gt; | read &lt;#number&gt; | new &lt;tag&gt;</div>
      `)}
      ${panel("recent", "", renderThreadList(page.items), pageFoot(page, ""))}
    `;
  }

  function boardsView() {
    const page = paginate(S().state.boards, "boards", 6);
    return panel("/boards", "station board only", renderBoardList(page.items), pageFoot(page, "open station | tags"));
  }

  function renderBoardList(boards) {
    const selected = S().state.ui.selectedIndex || 0;
    const list = boards || S().state.boards;
    return `
      <div class="board-list" data-list="boards">
        ${list.map((board, index) => {
          const threads = S().getThreadsForBoard(board.slug);
          return `
            <div class="board-row ${index === selected ? "is-selected" : ""}" data-selectable="true" data-index="${index}" data-href="#/board/${escapeHtml(board.slug)}" data-command="open ${escapeHtml(board.slug)}">
              <span class="row-title"><span class="index">[${String(index + 1).padStart(2, "0")}]</span> /boards/${escapeHtml(board.slug)}</span>
              <span>${escapeHtml(board.description)}</span>
              <span class="row-meta">${plural(threads.length, "thread")} | open ${escapeHtml(board.slug)}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function boardView(slug) {
    const board = S().getBoard(slug);
    if (!board) return notFoundView("unknown board: " + slug);
    const threads = S().getThreadsForBoard(slug);
    const page = paginate(threads, "board:" + slug, 6);
    return panel("/boards/" + board.slug, board.title, `
      <p>${escapeHtml(board.description)}</p>
      ${renderThreadList(page.items)}
    `, pageFoot(page, `new station | read &lt;#number&gt; | tags`));
  }

  function tagsView() {
    const page = paginate(S().state.tags.slice().sort((a, b) => a.slug.localeCompare(b.slug)), "tags", 6);
    return panel("/tags", "user-created spaces", renderTagList(page.items), pageFoot(page, "tag &lt;tag&gt; | tag create &lt;slug&gt; &lt;title&gt;; &lt;description&gt;"));
  }

  function renderTagList(tags) {
    if (!tags.length) return `<div class="empty">[empty] tag create project Project; discussion space</div>`;
    const selected = S().state.ui.selectedIndex || 0;
    return `
      <div class="board-list" data-list="tags">
        ${tags.map((tag, index) => {
          const threads = S().getThreadsForTag(tag.slug);
          return `
            <div class="board-row ${index === selected ? "is-selected" : ""}" data-selectable="true" data-index="${index}" data-href="#/tag/${escapeHtml(tag.slug)}" data-command="tag ${escapeHtml(tag.slug)}">
              <span class="row-title"><span class="index">[${String(index + 1).padStart(2, "0")}]</span> #${escapeHtml(tag.slug)}</span>
              <span>${escapeHtml(tag.description || "User-created tag.")}</span>
              <span class="row-meta">${escapeHtml(tag.owner || "system")} | ${plural(threads.length, "thread")} | tag ${escapeHtml(tag.slug)}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function tagView(slug) {
    const tag = S().getTag(slug);
    if (!tag) return notFoundView("unknown tag: " + slug);
    const threads = S().getThreadsForTag(tag.slug);
    const page = paginate(threads, "tag:" + tag.slug, 6);
    return `
      ${panel("#" + tag.slug, tag.title || tag.slug, `
        <dl class="kv">
          <dt>owner</dt><dd>${escapeHtml(tag.owner || "system")}</dd>
          <dt>threads</dt><dd>${threads.length}</dd>
          <dt>about</dt><dd>${escapeHtml(tag.description || "User-created tag.")}</dd>
        </dl>
      `, "new " + escapeHtml(tag.slug) + " | tag bio " + escapeHtml(tag.slug) + " <text> | tags")}
      ${panel("threads", "", renderThreadList(page.items), pageFoot(page, "read &lt;#number&gt;"))}
    `;
  }

  function renderThreadList(threads) {
    if (!threads.length) return `<div class="empty">[empty] new design</div>`;

    const selected = S().state.ui.selectedIndex || 0;
    return `
      <div class="thread-list" data-list="threads">
        ${threads.map((thread, index) => {
          const posts = S().getPostsForThread(thread.id);
          const last = posts[posts.length - 1];
          const mark = S().isBookmarked(thread.id) ? "*" : " ";
          const tags = (thread.tags || []).map((tag) => "#" + tag).join(" ") || "#untagged";
          return `
            <div class="thread-row ${index === selected ? "is-selected" : ""}" data-selectable="true" data-index="${index}" data-href="#/thread/${thread.id}" data-command="read ${thread.id}">
              <span class="row-title"><span class="index">[${String(thread.id).padStart(3, "0")}${mark}]</span> ${escapeHtml(thread.title)}</span>
              <span class="row-meta">${escapeHtml(tags)} | ${plural(posts.length, "post")} | ${escapeHtml(last ? formatTime(last.createdAt) : formatTime(thread.createdAt))} | ${escapeHtml(thread.author)}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderUserList(users) {
    if (!users.length) return `<div class="empty">[empty] register &lt;username&gt; &lt;password&gt;</div>`;

    const selected = S().state.ui.selectedIndex || 0;
    return `
      <div class="user-list" data-list="users">
        ${users.map((user, index) => {
          const threads = S().state.threads.filter((thread) => thread.author === user.username);
          const posts = S().state.posts.filter((post) => post.author === user.username);
          return `
            <div class="user-row ${index === selected ? "is-selected" : ""}" data-selectable="true" data-index="${index}" data-href="#/profile/${escapeHtml(user.username)}" data-command="profile ${escapeHtml(user.username)}">
              <span class="row-title"><span class="index">[${String(index + 1).padStart(2, "0")}]</span> ${escapeHtml(user.username)}</span>
              <span class="row-meta">${escapeHtml(user.title || "member")} | ${Math.max(10, Number(user.goos) || 10)} goos | ${Math.max(0, Number(user.streak) || 0)} days streak | ${plural(threads.length, "thread")} | ${plural(posts.length, "post")}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function threadView(id) {
    const thread = S().getThread(id);
    if (!thread) return notFoundView("unknown thread: " + id);
    const posts = S().getPostsForThread(thread.id);
    const page = threadDisplayPages(posts, "thread:" + thread.id);
    const bookmarkCommand = S().isBookmarked(thread.id) ? "unbookmark" : "bookmark";

    return `
      ${panel("thread #" + thread.id, thread.status, `
        <pre class="thread-head">title ${escapeHtml(thread.title)}
tags ${escapeHtml((thread.tags || []).map((tag) => "#" + tag).join(" ") || "#untagged")} | posts ${posts.length} | author ${escapeHtml(thread.author)}</pre>
      `, pageFoot(page, `${bookmarkCommand} | reply &lt;#number&gt; | edit &lt;post_id&gt; | delete &lt;post_id&gt; | quote &lt;post_id&gt; | upload in a new draft | back`))}
      <section class="post-spread">
        ${page.columns.map((column) => `<div class="post-column ${column.length === 1 ? "is-single" : ""}">${column.map(renderPost).join("")}</div>`).join("")}
      </section>
    `;
  }

  function renderPost(entry) {
    const post = entry.post || entry;
    const body = entry.body == null ? post.body : entry.body;
    const anchors = entry.anchors || {};
    const bodyPageLabel = entry.bodyPages > 1 ? ` | body ${entry.bodyPage}/${entry.bodyPages}` : "";
    const quoted = post.quotePostId ? S().getPost(post.quotePostId) : null;
    const user = S().getSessionUser();
    const ownPost = user && user.username === post.author;
    const edited = post.updatedAt ? `<span class="edited-mark">[edited]</span>` : "";
    return `
      <article class="post-block">
        <div class="post-head">
          <span class="post-author">[${escapeHtml(entry.continued ? "continued" : post.author)}]</span>
          <span class="row-meta">#${post.id} | ${escapeHtml(formatTime(post.createdAt))}${bodyPageLabel}${ownPost ? " | edit " + post.id + " | delete " + post.id : ""} ${edited}</span>
        </div>
        ${quoted ? `<pre class="quote-block">&gt; ${escapeHtml(quoted.author)}: ${escapeHtml(quoted.body).slice(0, 180)}</pre>` : ""}
        <div class="post-body markdown-body">${renderMarkdown(body, anchors, post.id)}</div>
      </article>
    `;
  }

  function newThreadView(slug) {
    const tag = S().getTag(slug);
    if (!tag) return notFoundView("unknown tag: " + slug);
    return panel("new", "/tag/" + tag.slug, `
      <div class="cmd-help">new &lt;tag&gt; starts a draft.</div>
      <div class="cmd-help">upload opens a local Markdown file for the active draft.</div>
      <div class="cmd-help">new &lt;tag&gt; &lt;title&gt;; &lt;body&gt; publishes directly.</div>
    `);
  }

  function loginView() {
    const user = S().getSessionUser();
    return panel("login", user ? user.username : "guest", `
      <div class="cmd-help">register &lt;username&gt; &lt;password&gt;</div>
      <div class="cmd-help">login &lt;username&gt; &lt;password&gt;</div>
      <div class="cmd-help">logout</div>
    `);
  }

  function profileView(username) {
    const user = S().getUser(username);
    if (!user) return notFoundView("unknown user: " + username);
    const threads = S().state.threads.filter((thread) => thread.author === username);
    const posts = S().state.posts.filter((post) => post.author === username);
    const page = paginate(threads, "profile:" + username, 6);

    return `
      ${panel("/profile/" + user.username, user.title, `
        <dl class="kv">
          <dt>joined</dt><dd>${escapeHtml(formatTime(user.joinedAt))}</dd>
          <dt>threads</dt><dd>${threads.length}</dd>
          <dt>posts</dt><dd>${posts.length}</dd>
          <dt>goos</dt><dd>${Math.max(10, Number(user.goos) || 10)}</dd>
          <dt>streak</dt><dd>${Math.max(0, Number(user.streak) || 0)} days streak</dd>
          <dt>best</dt><dd>${Math.max(0, Number(user.bestStreak) || 0)} days streak</dd>
          <dt>commands</dt><dd>${Math.max(0, Number(user.commandCount) || 0)}</dd>
          <dt>bio</dt><dd>${escapeHtml(user.bio)}</dd>
        </dl>
      `, "headline &lt;text&gt; | bio &lt;text&gt;")}
      ${panel("threads", "", renderThreadList(page.items), pageFoot(page, ""))}
    `;
  }

  function profilesView() {
    const users = S().state.users.slice().sort((a, b) => a.username.localeCompare(b.username));
    return panel("/profile", plural(users.length, "username"), renderUserList(users), "profile &lt;username&gt; | register &lt;username&gt; &lt;password&gt;");
  }

  function searchView(query) {
    const results = S().search(query);
    const page = paginate(results, "search:" + query, 6);
    return panel("search", query || "", renderThreadList(page.items), pageFoot(page, "search keyword"));
  }

  function bookmarksView() {
    const threads = S().getBookmarkedThreads();
    const page = paginate(threads, "bookmarks", 6);
    return panel("bookmarks", plural(threads.length, "thread"), renderThreadList(page.items), pageFoot(page, "read &lt;#number&gt; | unbookmark &lt;#number&gt;"));
  }

  function helpView() {
    const groups = [
      ["move", [
        ["home", "go home"],
        ["tags", "list tags"],
        ["tag <tag>", "open tag page"],
        ["open <tag|station>", "open tag or station board"],
        ["read <#number>", "open thread"],
        ["page <number|next|prev>", "page content"],
        ["next / prev", "move cursor"],
        ["enter", "open selected"],
        ["links", "list page links"],
        ["link <number>", "open numbered link"]
      ]],
      ["account", [
        ["register <username> <password>", "create account"],
        ["login <username> <password>", "start session"],
        ["logout", "end session"],
        ["streak", "claim daily goos"],
        ["profile <username>", "open profile"],
        ["bio <text>", "update your profile bio"],
        ["headline <text>", "update profile headline"]
      ]],
      ["write", [
        ["new <tag>", "start thread draft"],
        ["new <tag> <title>; <body>", "publish tagged thread"],
        ["tags <tag[,tag]>", "set draft tags"],
        ["reply <#number>", "start reply draft"],
        ["reply <#number> <body>", "publish reply"],
        ["edit <post_id>", "start edit draft"],
        ["delete <post_id>", "delete your post"],
        ["title <text>", "set draft title"],
        ["upload", "choose a local .md file for a thread draft"],
        ["body <text>", "set draft body"],
        ["append <text>", "add draft line"],
        ["publish", "send draft"],
        ["cancel", "discard draft"]
      ]],
      ["tools", [
        ["search <text>", "search threads"],
        ["tag create <slug> <title>; <description>", "create tag page"],
        ["tag bio <slug> <text>", "decorate owned tag"],
        ["quote <post_id>", "quote into reply"],
        ["bookmark <#number>", "save thread"],
        ["bookmarks", "list saved threads"],
        ["unbookmark <#number>", "remove saved thread"],
        ["theme <light|dark>", "switch theme"],
        ["clear", "clear log"],
        ["reset", "factory reset"]
      ]]
    ];

    return panel("help", "", `
      <div class="help-grid">
        ${groups.map(([name, commands]) => `
          <div class="help-section">
            <div class="help-section-title">/${escapeHtml(name)}</div>
            ${commands.map(([cmd, desc]) => `
              <div class="help-row">
                <span class="help-cmd">${escapeHtml(cmd)}</span>
                <span class="help-desc">${escapeHtml(desc)}</span>
              </div>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `, "arrows: command history, even empty | j/k: selection | enter: open selected");
  }

  function notFoundView(message) {
    return panel("404", "", `
      <div class="notice error"><span class="label">[error]</span> ${escapeHtml(message || "page not found")}</div>
      <div class="cmd-help">home | boards | help</div>
    `);
  }

  window.ForumViews = {
    escapeHtml,
    formatTime,
    shell,
    panel,
    homeView,
    boardsView,
    boardView,
    tagsView,
    tagView,
    threadView,
    newThreadView,
    loginView,
    profileView,
    profilesView,
    searchView,
    bookmarksView,
    helpView,
    notFoundView
  };
})();
