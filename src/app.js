(function () {
  "use strict";

  const app = document.getElementById("app");
  const State = () => window.ForumState;
  const Views = () => window.ForumViews;
  const Commands = () => window.ForumCommands;

  const commandHistory = [];
  let historyIndex = 0;
  let pendingHistoryInput = "";
  let completionMatches = [];
  let completionIndex = 0;
  let marqueeTimer = null;
  let marqueeIndex = -1;

  function syncCommandHistory() {
    const saved = State().state.commandLog || [];
    saved.forEach((line) => {
      const input = String(line.input || "").trim();
      if (input && commandHistory[commandHistory.length - 1] !== input) commandHistory.push(input);
    });
    historyIndex = commandHistory.length;
  }

  function syncViewportHeight() {
    const height = window.visualViewport && window.visualViewport.height ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", Math.floor(height) + "px");
  }

  function parseRoute() {
    const raw = window.location.hash.replace(/^#/, "") || "/home";
    const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);

    if (!parts.length || parts[0] === "home") return { name: "home" };
    if (parts[0] === "boards") return { name: "boards" };
    if (parts[0] === "board" && parts[1]) return { name: "board", slug: parts[1] };
    if (parts[0] === "tags") return { name: "tags" };
    if (parts[0] === "tag" && parts[1]) return { name: "tag", slug: parts[1] };
    if (parts[0] === "thread" && parts[1]) return { name: "thread", id: Number(parts[1]) };
    if (parts[0] === "new" && parts[1]) return { name: "new", slug: parts[1] };
    if (parts[0] === "profile" && parts[1]) return { name: "profile", username: parts[1] };
    if (parts[0] === "profile") return { name: "profiles" };
    if (parts[0] === "bookmarks") return { name: "bookmarks" };
    if (parts[0] === "login") return { name: "login" };
    if (parts[0] === "help") return { name: "help" };
    if (parts[0] === "search") return { name: "search", query: parts.slice(1).join("/") };
    return { name: "not-found", message: "unknown route: " + raw };
  }

  function viewForRoute(route) {
    switch (route.name) {
      case "home": return Views().homeView();
      case "boards": return Views().boardsView();
      case "board": return Views().boardView(route.slug);
      case "tags": return Views().tagsView();
      case "tag": return Views().tagView(route.slug);
      case "thread": return Views().threadView(route.id);
      case "new": return Views().newThreadView(route.slug);
      case "profile": return Views().profileView(route.username);
      case "profiles": return Views().profilesView();
      case "bookmarks": return Views().bookmarksView();
      case "login": return Views().loginView();
      case "help": return Views().helpView();
      case "search": return Views().searchView(route.query);
      default: return Views().notFoundView(route.message);
    }
  }

  function render(options) {
    const theme = State().state.ui.theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    const route = parseRoute();
    app.innerHTML = Views().shell(route, viewForRoute(route));
    bindCommandInput();
    bindStudioMarquee();
    numberMarkdownLinks();
    if (!options || options.focusPrompt !== false) focusCommandInput();
  }

  function numberMarkdownLinks() {
    Array.from(document.querySelectorAll(".markdown-body a[href]")).forEach((link, index) => {
      const number = index + 1;
      link.setAttribute("data-link-index", String(number));
      link.setAttribute("data-link-label", "[" + number + "] ");
    });
  }

  function bindStudioMarquee() {
    const marquee = document.querySelector(".studio-marquee");
    const lines = marquee ? Array.from(marquee.querySelectorAll("span")) : [];
    if (marqueeTimer) {
      clearInterval(marqueeTimer);
      marqueeTimer = null;
    }
    if (!lines.length) return;

    const showRandomLine = () => {
      let next = Math.floor(Math.random() * lines.length);
      if (lines.length > 1 && next === marqueeIndex) next = (next + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length;
      marqueeIndex = next;
      lines.forEach((line, index) => line.classList.toggle("is-active", index === marqueeIndex));
      marquee.setAttribute("aria-label", lines[marqueeIndex].textContent || "");
    };

    showRandomLine();
    marqueeTimer = setInterval(showRandomLine, 8200);
  }

  function bindCommandInput() {
    const commandForm = document.getElementById("command-form");
    const commandInput = document.getElementById("command-input");
    if (!commandForm || !commandInput) return;
    if (!commandHistory.length) syncCommandHistory();
    updateAutocomplete(commandInput.value);

    commandForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = commandInput.value.trim();
      if (!value) {
        openSelected();
        return;
      }
      commandHistory.push(Commands().displayInput ? Commands().displayInput(value) : value);
      historyIndex = commandHistory.length;
      pendingHistoryInput = "";
      commandInput.value = "";
      clearAutocomplete();
      Promise.resolve(Commands().run(value)).finally(() => {
        setTimeout(() => focusCommandInput(), 0);
      });
    });

    commandInput.addEventListener("input", () => {
      if (historyIndex === commandHistory.length) pendingHistoryInput = commandInput.value;
      completionIndex = 0;
      updateAutocomplete(commandInput.value);
    });

    commandInput.addEventListener("keydown", (event) => {
      const empty = commandInput.value.trim() === "";

      if (event.key === "ArrowUp") {
        event.preventDefault();
        recallHistory(commandInput, -1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        recallHistory(commandInput, 1);
        return;
      }

      if (empty && event.key === "j") {
        event.preventDefault();
        moveSelection(1);
        return;
      }

      if (empty && event.key === "k") {
        event.preventDefault();
        moveSelection(-1);
        return;
      }

      if (event.key === "Escape") {
        commandInput.value = "";
        clearAutocomplete();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        acceptCompletion(commandInput);
      }
    });
  }

  function recallHistory(input, delta) {
    if (!commandHistory.length) return;
    if (historyIndex === commandHistory.length) pendingHistoryInput = input.value;

    historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + delta));
    input.value = historyIndex === commandHistory.length ? pendingHistoryInput : commandHistory[historyIndex];
    completionIndex = 0;
    updateAutocomplete(input.value);
    moveCaretToEnd(input);
  }

  function updateAutocomplete(value) {
    const input = String(value || "");
    const row = document.getElementById("autocomplete-row");
    const prefix = document.getElementById("autocomplete-prefix");
    const suffix = document.getElementById("autocomplete-suffix");
    if (!row || !prefix || !suffix || !window.ForumCommands || !window.ForumCommands.suggestions) return;

    completionMatches = window.ForumCommands.suggestions(input);
    if (completionIndex >= completionMatches.length) completionIndex = 0;

    const selected = completionMatches[completionIndex] || "";
    const lowerInput = input.toLowerCase();
    const lowerSelected = selected.toLowerCase();
    const suffixText = input && lowerSelected.startsWith(lowerInput) && selected.length > input.length ? selected.slice(input.length) : "";

    prefix.textContent = input;
    suffix.textContent = suffixText;
    row.innerHTML = completionMatches.slice(0, 6).map((item, index) => {
      const marker = index === completionIndex ? ">" : " ";
      return `<span class="${index === completionIndex ? "is-current" : ""}">${marker} ${Views().escapeHtml(item)}</span>`;
    }).join("");
  }

  function clearAutocomplete() {
    completionMatches = [];
    completionIndex = 0;
    updateAutocomplete("");
  }

  function cycleCompletion(delta) {
    if (completionMatches.length < 2) return false;
    completionIndex = (completionIndex + delta + completionMatches.length) % completionMatches.length;
    const input = document.getElementById("command-input");
    updateAutocomplete(input ? input.value : "");
    return true;
  }

  function acceptCompletion(input) {
    updateAutocomplete(input.value);
    const selected = completionMatches[completionIndex];
    if (!selected) return;
    input.value = window.ForumCommands.isCommandName && window.ForumCommands.isCommandName(selected) ? selected + " " : selected;
    completionIndex = 0;
    updateAutocomplete(input.value);
    moveCaretToEnd(input);
  }

  function focusCommandInput() {
    const input = document.getElementById("command-input");
    if (input) input.focus({ preventScroll: true });
  }

  function moveCaretToEnd(input) {
    requestAnimationFrame(() => {
      input.selectionStart = input.value.length;
      input.selectionEnd = input.value.length;
    });
  }

  function getSelectableItems() {
    return Array.from(document.querySelectorAll("[data-selectable]"));
  }

  function moveSelection(delta) {
    const items = getSelectableItems();
    if (!items.length) return;
    const current = State().state.ui.selectedIndex || 0;
    const next = Math.max(0, Math.min(items.length - 1, current + delta));
    if (next === current) return;
    State().state.ui.selectedIndex = next;
    State().save();
    render({ focusPrompt: true });
  }

  function selectIndex(index) {
    const items = getSelectableItems();
    if (!items.length) return;
    const next = Math.max(0, Math.min(items.length - 1, Number(index) || 0));
    State().state.ui.selectedIndex = next;
    State().save();
    render({ focusPrompt: true });
  }

  function getSelectedItem() {
    const items = getSelectableItems();
    if (!items.length) return null;
    const index = Math.max(0, Math.min(items.length - 1, State().state.ui.selectedIndex || 0));
    const selected = items[index];
    if (!selected) return null;
    return {
      href: selected.getAttribute("data-href"),
      command: selected.getAttribute("data-command") || selected.getAttribute("data-href") || "selected"
    };
  }

  function openSelected() {
    const selected = getSelectedItem();
    if (!selected || !selected.href) return false;
    window.location.hash = selected.href.replace(/^#/, "#");
    return true;
  }

  function getMarkdownLinks() {
    return Array.from(document.querySelectorAll(".markdown-body a[href]")).map((link, index) => ({
      index: Number(link.getAttribute("data-link-index") || index + 1),
      href: link.getAttribute("href") || "",
      label: (link.textContent || link.getAttribute("href") || "").trim()
    }));
  }

  function followMarkdownLink(index) {
    const link = document.querySelector(`.markdown-body a[data-link-index="${Number(index)}"]`);
    if (!link) return { ok: false, message: "unknown link: " + index };
    const href = link.getAttribute("href") || "";

    if (href.startsWith("#/")) {
      window.location.hash = href;
      return { ok: true, message: href };
    }
    if (href.startsWith("/")) {
      window.location.hash = "#" + href;
      return { ok: true, message: href };
    }
    if (href.startsWith("#")) {
      const targetPage = Number(link.getAttribute("data-md-page") || 0);
      const route = parseRoute();
      if (targetPage && route.name === "thread") {
        State().setPage(pageKeyForRoute(route), targetPage);
        render({ focusPrompt: true });
        return { ok: true, message: "page " + targetPage };
      }
      const anchor = decodeURIComponent(href.slice(1));
      return document.getElementById(anchor) ? { ok: true, message: "page " + State().getPage(pageKeyForRoute(route)) } : { ok: false, message: "unknown anchor: " + anchor };
    }

    window.open(href, "_blank", "noopener,noreferrer");
    return { ok: true, message: href };
  }

  function pageKeyForRoute(route) {
    if (!route) return "home";
    if (route.name === "home") return "home";
    if (route.name === "boards") return "boards";
    if (route.name === "board") return "board:" + route.slug;
    if (route.name === "tags") return "tags";
    if (route.name === "tag") return "tag:" + route.slug;
    if (route.name === "thread") return "thread:" + route.id;
    if (route.name === "profile") return "profile:" + route.username;
    if (route.name === "search") return "search:" + route.query;
    if (route.name === "bookmarks") return "bookmarks";
    return route.name;
  }

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const input = document.getElementById("command-input");
    if (!input) return;
    if (document.activeElement !== input && event.key.length === 1) focusCommandInput();
  });

  window.addEventListener("resize", () => {
    syncViewportHeight();
    render({ focusPrompt: false });
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      syncViewportHeight();
      render({ focusPrompt: false });
    });
  }

  window.addEventListener("hashchange", () => {
    State().state.ui.selectedIndex = 0;
    State().save();
    render({ focusPrompt: true });
  });

  syncViewportHeight();

  if (!window.location.hash) window.location.hash = "#/home";
  State().restoreForumData().finally(() => {
    render({ focusPrompt: true });
    State().refreshUsers().then(() => State().restoreSession()).finally(() => {
      render({ focusPrompt: true });
    });
  });

  document.addEventListener("wheel", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

  window.ForumApp = {
    render,
    getRoute: parseRoute,
    focusCommandInput,
    moveSelection,
    selectIndex,
    getSelectedItem,
    openSelected,
    getMarkdownLinks,
    followMarkdownLink,
    pageKeyForRoute
  };
})();
