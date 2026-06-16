(function () {
  "use strict";

  const STORAGE_KEY = "terminal_forum_state_v5_auth";
  const TOKEN_KEY = "terminal_forum_auth_token_v1";
  const LOCAL_AUTH_KEY = "terminal_forum_local_auth_v1";
  const LOCAL_TOKEN_PREFIX = "local:";
  const STARTING_GOOS = 10;
  const COMMAND_GOOS = 5;
  const REWARD_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanUsername(username) {
    return String(username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  function validatePassword(password) {
    const value = String(password || "");
    if (value.length < 8) return "password must be at least 8 characters";
    if (value.length > 128) return "password must be at most 128 characters";
    return null;
  }

  function dayStamp(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return dayStamp();
    return new Date(date.getTime() + REWARD_TZ_OFFSET_MS).toISOString().slice(0, 10);
  }

  function previousDayStamp(day) {
    const date = new Date(String(day || dayStamp()) + "T00:00:00.000Z");
    if (Number.isNaN(date.getTime())) return "";
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }

  function normalizeTags(value) {
    const list = Array.isArray(value) ? value : String(value || "").split(/[,\s#]+/);
    return Array.from(new Set(list.map(slugify).filter(Boolean))).slice(0, 6);
  }

  function stationBoard() {
    return clone(window.TerminalForumSeed.boards[0]);
  }

  function ensureTag(slug, title, description, owner) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return null;
    state.tags = Array.isArray(state.tags) ? state.tags : [];
    let tag = state.tags.find((item) => item.slug === cleanSlug);
    if (!tag) {
      tag = {
        slug: cleanSlug,
        title: normalizeText(title) || cleanSlug,
        description: normalizeText(description) || "User-created tag.",
        owner: owner || "system",
        updatedAt: new Date().toISOString()
      };
      state.tags.push(tag);
    }
    return tag;
  }

  function ensureStateShape(value) {
    const source = value || freshState();
    source.boards = [stationBoard()];
    source.tags = Array.isArray(source.tags) && source.tags.length ? source.tags : clone(window.TerminalForumSeed.tags || []);
    const addSourceTag = (slug, title, description, owner) => {
      const cleanSlug = slugify(slug);
      if (!cleanSlug || source.tags.some((tag) => tag.slug === cleanSlug)) return;
      source.tags.push({
        slug: cleanSlug,
        title: normalizeText(title) || cleanSlug,
        description: normalizeText(description) || "User-created tag.",
        owner: owner || "system",
        updatedAt: new Date().toISOString()
      });
    };
    source.threads = Array.isArray(source.threads) ? source.threads : [];
    source.threads.forEach((thread) => {
      const legacyBoard = thread.boardSlug && thread.boardSlug !== "station" ? thread.boardSlug : "";
      const tags = normalizeTags(thread.tags || []);
      if (legacyBoard && !tags.includes(legacyBoard)) tags.unshift(slugify(legacyBoard));
      thread.boardSlug = "station";
      thread.tags = normalizeTags(tags);
      thread.tags.forEach((tag) => addSourceTag(tag, tag, "User-created tag.", thread.author || "system"));
    });
    source.boards[0].threadIds = source.threads.map((thread) => thread.id);
    return source;
  }

  function freshState() {
    return {
      boards: clone(window.TerminalForumSeed.boards),
      tags: clone(window.TerminalForumSeed.tags || []),
      threads: clone(window.TerminalForumSeed.threads),
      posts: clone(window.TerminalForumSeed.posts),
      users: clone(window.TerminalForumSeed.users),
      session: { username: null },
      commandLog: [],
      ui: { selectedIndex: 0, draft: null, theme: "dark", pages: {}, bookmarks: [] }
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.boards && parsed.threads && parsed.posts && parsed.users) {
          parsed.session = parsed.session || { username: null };
          parsed.commandLog = Array.isArray(parsed.commandLog) ? parsed.commandLog : [];
          parsed.ui = parsed.ui || {};
          parsed.ui.selectedIndex = Number(parsed.ui.selectedIndex || 0);
          parsed.ui.draft = parsed.ui.draft || null;
          parsed.ui.theme = parsed.ui.theme === "light" ? "light" : "dark";
          parsed.ui.pages = parsed.ui.pages || {};
          parsed.ui.bookmarks = Array.isArray(parsed.ui.bookmarks) ? parsed.ui.bookmarks.map(Number).filter(Boolean) : [];
          return ensureStateShape(parsed);
        }
      }
    } catch (error) {
      console.warn("state restore failed", error);
    }
    return ensureStateShape(freshState());
  }

  const state = loadState();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function forumSnapshot() {
    return {
      boards: clone(state.boards),
      tags: clone(state.tags || []),
      threads: clone(state.threads),
      posts: clone(state.posts)
    };
  }

  function applyForumSnapshot(forum) {
    if (!forum || !Array.isArray(forum.threads) || !Array.isArray(forum.posts)) return false;
    const shaped = ensureStateShape({
      boards: forum.boards || [],
      tags: forum.tags || [],
      threads: forum.threads || [],
      posts: forum.posts || [],
      users: state.users,
      session: state.session,
      commandLog: state.commandLog,
      ui: state.ui
    });
    state.boards = shaped.boards;
    state.tags = shaped.tags;
    state.threads = shaped.threads;
    state.posts = shaped.posts;
    save();
    return true;
  }

  function apiResponse(response) {
    const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return response.text().then((text) => {
        const body = String(text || "").trim();
        const error = body.startsWith("<")
          ? "api returned html instead of json. run node server.js or deploy the api functions"
          : "api returned a non-json response";
        return { response, payload: { error } };
      });
    }
    return response.json()
      .catch(() => ({ error: "api returned invalid json" }))
      .then((payload) => ({ response, payload: payload || {} }));
  }

  function restoreForumData() {
    return fetch("/api/forum")
      .then(apiResponse)
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) return { ok: false, message: payload.error || "forum restore failed" };
        return { ok: applyForumSnapshot(payload.forum), message: "forum restored" };
      })
      .catch(authFailure);
  }

  function syncForumData() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return Promise.resolve({ ok: false, message: "login required" });
    return fetch("/api/forum", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
      body: JSON.stringify({ forum: forumSnapshot() })
    })
      .then(apiResponse)
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) return { ok: false, message: payload.error || "forum sync failed" };
        if (payload.forum) applyForumSnapshot(payload.forum);
        return { ok: true };
      })
      .catch(authFailure);
  }

  function saveForumMutation() {
    save();
    syncForumData().catch(() => null);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LOCAL_AUTH_KEY);
    location.reload();
  }

  function getSessionUser() {
    if (!state.session.username) return null;
    return state.users.find((user) => user.username === state.session.username) || null;
  }

  function rememberUser(user) {
    if (!user || !user.username) return null;
    const existing = state.users.find((item) => item.username === user.username);
    if (existing) {
      Object.assign(existing, user);
      return existing;
    }
    state.users.push(user);
    return user;
  }

  function authHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: "Bearer " + token } : {};
  }

  function authRequest(path, body) {
    return fetch(path, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, authHeaders()),
      body: JSON.stringify(body || {})
    }).then(apiResponse);
  }

  function authFailure(error) {
    return { ok: false, message: error && error.message ? error.message : "auth server unavailable" };
  }

  function localFallbackError(error) {
    const message = String(error || "");
    return message.includes("data store is not configured")
      || message.includes("api returned html instead of json")
      || message.includes("api returned a non-json response")
      || message.includes("api returned invalid json")
      || message.includes("auth server unavailable")
      || message.includes("Failed to fetch");
  }

  function isLocalToken(token) {
    return String(token || "").startsWith(LOCAL_TOKEN_PREFIX);
  }

  function normalizeLocalAuth(value) {
    const db = value && typeof value === "object" ? value : {};
    db.users = Array.isArray(db.users) ? db.users.filter((user) => user && user.username) : [];
    db.sessions = Array.isArray(db.sessions) ? db.sessions.filter((session) => session && session.token && session.username) : [];
    return db;
  }

  function loadLocalAuth() {
    try {
      return normalizeLocalAuth(JSON.parse(localStorage.getItem(LOCAL_AUTH_KEY) || "{}"));
    } catch (error) {
      return normalizeLocalAuth({});
    }
  }

  function saveLocalAuth(db) {
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(normalizeLocalAuth(db)));
  }

  function randomHex(bytes) {
    const size = Math.max(8, Math.floor(Number(bytes) || 16));
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      const data = new Uint8Array(size);
      window.crypto.getRandomValues(data);
      return Array.from(data).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }

  function fallbackHash(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function localPasswordHash(password, salt) {
    const text = String(password || "") + ":" + salt;
    if (window.crypto && window.crypto.subtle && typeof TextEncoder === "function") {
      const input = new TextEncoder().encode(text);
      return window.crypto.subtle.digest("SHA-256", input)
        .then((digest) => Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join(""));
    }
    return Promise.resolve(fallbackHash(text));
  }

  function publicLocalUser(user) {
    return normalizeUserEconomy({
      username: cleanUsername(user.username),
      title: user.title || "new member",
      bio: user.bio || "No bio yet.",
      joinedAt: user.joinedAt || new Date().toISOString(),
      goos: user.goos,
      goosEarned: user.goosEarned,
      streak: user.streak,
      bestStreak: user.bestStreak,
      commandCount: user.commandCount,
      lastCommandDay: user.lastCommandDay || null,
      lastGooDay: user.lastGooDay || null
    });
  }

  function applyLocalAuth(db, user) {
    const token = LOCAL_TOKEN_PREFIX + randomHex(24);
    db.sessions = (db.sessions || []).filter((session) => session.username !== user.username);
    db.sessions.push({ token, username: user.username, createdAt: new Date().toISOString() });
    saveLocalAuth(db);
    const publicUser = rememberUser(publicLocalUser(user));
    localStorage.setItem(TOKEN_KEY, token);
    state.session.username = publicUser.username;
    save();
    return publicUser;
  }

  function rememberLocalUsers() {
    loadLocalAuth().users.map(publicLocalUser).forEach(rememberUser);
    save();
  }

  function localRegister(username, password) {
    const clean = cleanUsername(username);
    if (clean.length < 3 || clean.length > 20) return Promise.resolve({ ok: false, message: "username must be 3-20 letters, numbers, or underscores" });
    const passwordError = validatePassword(password);
    if (passwordError) return Promise.resolve({ ok: false, message: passwordError });

    const db = loadLocalAuth();
    if (db.users.some((user) => user.username === clean)) return Promise.resolve({ ok: false, message: "username already registered" });

    const salt = randomHex(16);
    return localPasswordHash(password, salt).then((passwordHash) => {
      const user = {
        username: clean,
        salt,
        passwordHash,
        title: "new member",
        bio: "No bio yet.",
        joinedAt: new Date().toISOString(),
        goos: STARTING_GOOS,
        goosEarned: 0,
        streak: 0,
        bestStreak: 0,
        commandCount: 0,
        lastCommandDay: null,
        lastGooDay: null,
        goosLedger: []
      };
      db.users.push(user);
      const publicUser = applyLocalAuth(db, user);
      return { ok: true, message: "registered locally as " + publicUser.username };
    });
  }

  function localLogin(username, password) {
    const clean = cleanUsername(username);
    const db = loadLocalAuth();
    const user = db.users.find((item) => item.username === clean);
    if (!user) return Promise.resolve({ ok: false, message: "invalid username or password" });

    return localPasswordHash(password, user.salt).then((passwordHash) => {
      if (passwordHash !== user.passwordHash) return { ok: false, message: "invalid username or password" };
      const publicUser = applyLocalAuth(db, user);
      return { ok: true, message: "logged in locally as " + publicUser.username };
    });
  }

  function localSessionRecord(token) {
    const db = loadLocalAuth();
    const session = db.sessions.find((item) => item.token === token);
    const user = session ? db.users.find((item) => item.username === session.username) : null;
    return { db, session, user };
  }

  function restoreLocalSession(token) {
    const record = localSessionRecord(token);
    if (!record.user) {
      localStorage.removeItem(TOKEN_KEY);
      state.session.username = null;
      save();
      return { ok: false, message: "session expired" };
    }
    const user = rememberUser(publicLocalUser(record.user));
    state.session.username = user.username;
    save();
    return { ok: true, user };
  }

  function updateLocalProfile(changes, message) {
    const token = localStorage.getItem(TOKEN_KEY);
    const record = localSessionRecord(token);
    if (!record.user) return { ok: false, message: "login required. type: register <username> <password> or login <username> <password>" };
    Object.assign(record.user, changes);
    saveLocalAuth(record.db);
    const user = rememberUser(publicLocalUser(record.user));
    state.session.username = user.username;
    save();
    return { ok: true, message, user };
  }

  function localRewardCommand(command, commandId) {
    const token = localStorage.getItem(TOKEN_KEY);
    const record = localSessionRecord(token);
    if (!record.user) return { ok: false, message: "login required. type: register <username> <password> or login <username> <password>" };

    record.user.goosLedger = Array.isArray(record.user.goosLedger) ? record.user.goosLedger : [];
    const cleanId = String(commandId || "").replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 80);
    const duplicate = record.user.goosLedger.some((entry) => entry && entry.id === cleanId);
    let reward = 0;
    let alreadyClaimedToday = false;

    if (!duplicate && cleanId) {
      const today = dayStamp();
      alreadyClaimedToday = record.user.lastGooDay === today;
      if (!alreadyClaimedToday) {
        const previous = previousDayStamp(today);
        const currentStreak = Number(record.user.streak) || 0;
        record.user.streak = record.user.lastGooDay === previous ? currentStreak + 1 : 1;
        record.user.bestStreak = Math.max(Number(record.user.bestStreak) || 0, record.user.streak);
        record.user.lastGooDay = today;
        record.user.goos = Math.max(STARTING_GOOS, (Number(record.user.goos) || STARTING_GOOS) + COMMAND_GOOS);
        record.user.goosEarned = Math.max(0, (Number(record.user.goosEarned) || 0) + COMMAND_GOOS);
        reward = COMMAND_GOOS;
      }
      record.user.lastCommandDay = today;
      record.user.commandCount = Math.max(0, (Number(record.user.commandCount) || 0) + 1);
      record.user.goosLedger.push({
        id: cleanId,
        command: String(command || "").slice(0, 48),
        amount: reward,
        day: today,
        at: new Date().toISOString()
      });
      record.user.goosLedger = record.user.goosLedger.slice(-200);
    }

    saveLocalAuth(record.db);
    const user = rememberUser(publicLocalUser(record.user));
    state.session.username = user.username;
    save();
    return { ok: true, user, reward, duplicate, alreadyClaimedToday };
  }

  function localLogout(token) {
    const db = loadLocalAuth();
    db.sessions = (db.sessions || []).filter((session) => session.token !== token);
    saveLocalAuth(db);
  }

  function normalizeUserEconomy(user) {
    if (!user) return user;
    user.goos = Math.max(STARTING_GOOS, Math.floor(Number(user.goos) || STARTING_GOOS));
    user.goosEarned = Math.max(0, Math.floor(Number(user.goosEarned) || 0));
    user.streak = Math.max(0, Math.floor(Number(user.streak) || 0));
    user.bestStreak = Math.max(user.streak, Math.floor(Number(user.bestStreak) || 0));
    user.commandCount = Math.max(0, Math.floor(Number(user.commandCount) || 0));
    user.lastCommandDay = user.lastCommandDay || null;
    user.lastGooDay = user.lastGooDay || null;
    return user;
  }

  function applyAuth(payload) {
    const user = rememberUser(normalizeUserEconomy(payload.user));
    localStorage.setItem(TOKEN_KEY, payload.token);
    state.session.username = user.username;
    save();
    return user;
  }

  function register(username, password) {
    return authRequest("/api/register", { username, password })
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) return localRegister(username, password);
          return { ok: false, message: payload.error || "registration failed" };
        }
        const user = applyAuth(payload);
        return { ok: true, message: "registered as " + user.username };
      })
      .catch((error) => localFallbackError(error && error.message) ? localRegister(username, password) : authFailure(error));
  }

  function login(username, password) {
    return authRequest("/api/login", { username, password })
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) return localLogin(username, password);
          return { ok: false, message: payload.error || "login failed" };
        }
        const user = applyAuth(payload);
        return { ok: true, message: "logged in as " + user.username };
      })
      .catch((error) => localFallbackError(error && error.message) ? localLogin(username, password) : authFailure(error));
  }

  function setBio(bio) {
    const session = requireLogin();
    if (!session.ok) return Promise.resolve(session);
    if (isLocalToken(localStorage.getItem(TOKEN_KEY))) {
      const cleanBio = normalizeText(bio).slice(0, 240);
      if (!cleanBio) return Promise.resolve({ ok: false, message: "usage: bio <text>" });
      return Promise.resolve(updateLocalProfile({ bio: cleanBio }, "bio updated"));
    }

    return authRequest("/api/profile/bio", { bio })
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) return updateLocalProfile({ bio: normalizeText(bio).slice(0, 240) }, "bio updated");
          return { ok: false, message: payload.error || "bio update failed" };
        }
        const user = rememberUser(normalizeUserEconomy(payload.user));
        state.session.username = user.username;
        save();
        return { ok: true, message: "bio updated", user };
      })
      .catch(authFailure);
  }

  function setProfileTitle(title) {
    const session = requireLogin();
    if (!session.ok) return Promise.resolve(session);
    if (isLocalToken(localStorage.getItem(TOKEN_KEY))) {
      const cleanTitle = normalizeText(title).slice(0, 64);
      if (!cleanTitle) return Promise.resolve({ ok: false, message: "usage: headline <text>" });
      return Promise.resolve(updateLocalProfile({ title: cleanTitle }, "profile title updated"));
    }

    return authRequest("/api/profile/title", { title })
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) return updateLocalProfile({ title: normalizeText(title).slice(0, 64) }, "profile title updated");
          return { ok: false, message: payload.error || "profile title update failed" };
        }
        const user = rememberUser(normalizeUserEconomy(payload.user));
        state.session.username = user.username;
        save();
        return { ok: true, message: "profile title updated", user };
      })
      .catch((error) => {
        if (localFallbackError(error && error.message)) {
          rememberLocalUsers();
          return { ok: false, message: error.message || "users refresh failed" };
        }
        return authFailure(error);
      });
  }

  function restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return Promise.resolve({ ok: false, message: "no saved session" });
    if (isLocalToken(token)) return Promise.resolve(restoreLocalSession(token));
    return fetch("/api/session", { headers: authHeaders() })
      .then(apiResponse)
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          localStorage.removeItem(TOKEN_KEY);
          state.session.username = null;
          save();
          return { ok: false, message: payload.error || "session expired" };
        }
        const user = rememberUser(payload.user);
        state.session.username = user.username;
        save();
        return { ok: true, user };
      })
      .catch(authFailure);
  }

  function refreshUsers() {
    return fetch("/api/users")
      .then(apiResponse)
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) {
            rememberLocalUsers();
            return { ok: false, message: payload.error || "users refresh failed" };
          }
          return { ok: false, message: payload.error || "users refresh failed" };
        }
        const users = Array.isArray(payload.users) ? payload.users.map(normalizeUserEconomy) : [];
        loadLocalAuth().users.map(publicLocalUser).forEach((localUser) => {
          if (!users.some((user) => user.username === localUser.username)) users.push(localUser);
        });
        state.users = users;
        save();
        return { ok: true };
      })
      .catch(authFailure);
  }

  function rewardCommand(command, commandId) {
    const session = requireLogin();
    if (!session.ok) return Promise.resolve(session);
    if (isLocalToken(localStorage.getItem(TOKEN_KEY))) return Promise.resolve(localRewardCommand(command, commandId));

    return authRequest("/api/reward-command", { command, commandId })
      .then(({ response, payload }) => {
        if (!response.ok || payload.error) {
          if (localFallbackError(payload.error)) return localRewardCommand(command, commandId);
          return { ok: false, message: payload.error || "goos reward failed" };
        }
        const user = rememberUser(normalizeUserEconomy(payload.user));
        state.session.username = user.username;
        save();
        return { ok: true, user, reward: Number(payload.reward) || 0, duplicate: Boolean(payload.duplicate), alreadyClaimedToday: Boolean(payload.alreadyClaimedToday) };
      })
      .catch(authFailure);
  }

  function logout() {
    const before = state.session.username;
    const token = localStorage.getItem(TOKEN_KEY);
    state.session.username = null;
    state.ui.draft = null;
    save();
    if (token) {
      if (isLocalToken(token)) {
        localLogout(token);
      } else {
        fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: "{}"
        }).catch(() => null);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    return before ? "logged out from " + before : "no active session";
  }

  function getBoard(slug) {
    return state.boards.find((board) => board.slug === slug) || null;
  }

  function getThread(id) {
    const numericId = Number(id);
    return state.threads.find((thread) => thread.id === numericId) || null;
  }

  function getPost(id) {
    const numericId = Number(id);
    return state.posts.find((post) => post.id === numericId) || null;
  }

  function getUser(username) {
    return state.users.find((user) => user.username === username) || null;
  }

  function getTag(slug) {
    const cleanSlug = slugify(slug);
    return (state.tags || []).find((tag) => tag.slug === cleanSlug) || null;
  }

  function getThreadsForTag(slug) {
    const cleanSlug = slugify(slug);
    return state.threads
      .filter((thread) => normalizeTags(thread.tags).includes(cleanSlug))
      .sort((a, b) => newestPostTime(b) - newestPostTime(a));
  }

  function getThreadsForBoard(slug) {
    return state.threads
      .filter((thread) => thread.boardSlug === slug)
      .sort((a, b) => newestPostTime(b) - newestPostTime(a));
  }

  function getPostsForThread(id) {
    const numericId = Number(id);
    return state.posts
      .filter((post) => post.threadId === numericId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  function newestPostTime(thread) {
    const posts = getPostsForThread(thread.id);
    if (!posts.length) return new Date(thread.createdAt).getTime();
    return Math.max(...posts.map((post) => new Date(post.createdAt).getTime()));
  }

  function getRecentThreads(limit) {
    return state.threads
      .slice()
      .sort((a, b) => newestPostTime(b) - newestPostTime(a))
      .slice(0, limit || 8);
  }

  function nextThreadId() {
    return state.threads.reduce((max, thread) => Math.max(max, thread.id), 0) + 1;
  }

  function nextPostId() {
    return state.posts.reduce((max, post) => Math.max(max, post.id), 0) + 1;
  }

  function requireLogin() {
    const user = getSessionUser();
    if (!user) return { ok: false, message: "login required. type: register <username> <password> or login <username> <password>" };
    return { ok: true, user };
  }

  function getPage(key) {
    const pages = state.ui.pages || {};
    return Math.max(1, Number(pages[key] || 1));
  }

  function setPage(key, page) {
    state.ui.pages = state.ui.pages || {};
    state.ui.pages[key] = Math.max(1, Number(page) || 1);
    state.ui.selectedIndex = 0;
    save();
  }

  function movePage(key, delta, maxPage) {
    const current = getPage(key);
    const next = Math.max(1, Math.min(maxPage || current, current + Number(delta || 0)));
    setPage(key, next);
    return next;
  }

  function isBookmarked(threadId) {
    const id = Number(threadId);
    return (state.ui.bookmarks || []).includes(id);
  }

  function bookmarkThread(threadId) {
    const thread = getThread(threadId);
    if (!thread) return { ok: false, message: "unknown thread: " + threadId };
    state.ui.bookmarks = state.ui.bookmarks || [];
    if (!state.ui.bookmarks.includes(thread.id)) state.ui.bookmarks.push(thread.id);
    save();
    return { ok: true, message: "bookmarked thread #" + thread.id };
  }

  function unbookmarkThread(threadId) {
    const thread = getThread(threadId);
    if (!thread) return { ok: false, message: "unknown thread: " + threadId };
    state.ui.bookmarks = (state.ui.bookmarks || []).filter((id) => id !== thread.id);
    save();
    return { ok: true, message: "removed bookmark #" + thread.id };
  }

  function getBookmarkedThreads() {
    const ids = state.ui.bookmarks || [];
    return ids.map(getThread).filter(Boolean).sort((a, b) => newestPostTime(b) - newestPostTime(a));
  }

  function createThread(boardSlug, title, body, tags) {
    const session = requireLogin();
    if (!session.ok) return session;

    const board = getBoard(boardSlug) || getBoard("station");
    if (!board) return { ok: false, message: "unknown board: station" };

    const cleanTitle = normalizeText(title);
    const cleanBody = String(body || "").trim();
    const cleanTags = normalizeTags(tags || []);
    if (cleanTitle.length < 4) return { ok: false, message: "thread title is too short" };
    if (cleanBody.length < 8) return { ok: false, message: "thread body is too short" };
    if (!cleanTags.length) return { ok: false, message: "add at least one tag. use: tags <tag>" };

    const threadId = nextThreadId();
    const postId = nextPostId();
    const now = new Date().toISOString();

    const thread = {
      id: threadId,
      boardSlug: board.slug,
      title: cleanTitle,
      author: session.user.username,
      createdAt: now,
      status: "open",
      tags: cleanTags,
      postIds: [postId]
    };

    const post = {
      id: postId,
      threadId,
      author: session.user.username,
      createdAt: now,
      updatedAt: null,
      body: cleanBody,
      bodyFormat: "markdown"
    };

    state.threads.push(thread);
    state.posts.push(post);
    if (!board.threadIds.includes(threadId)) board.threadIds.push(threadId);
    cleanTags.forEach((tag) => ensureTag(tag, tag, "User-created tag.", session.user.username));
    state.ui.draft = null;
    saveForumMutation();
    return { ok: true, thread };
  }

  function addReply(threadId, body, quotePostId) {
    const session = requireLogin();
    if (!session.ok) return session;

    const thread = getThread(threadId);
    if (!thread) return { ok: false, message: "unknown thread: " + threadId };
    if (thread.status === "locked") return { ok: false, message: "thread is locked" };

    const quotedPost = quotePostId ? getPost(quotePostId) : null;
    if (quotePostId && (!quotedPost || quotedPost.threadId !== thread.id)) {
      return { ok: false, message: "quote must be a post from thread #" + thread.id };
    }

    const cleanBody = String(body || "").trim();
    if (cleanBody.length < 2) return { ok: false, message: "reply is too short" };

    const postId = nextPostId();
    const post = {
      id: postId,
      threadId: Number(threadId),
      author: session.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      body: cleanBody,
      quotePostId: quotedPost ? quotedPost.id : null
    };

    state.posts.push(post);
    thread.postIds.push(postId);
    state.ui.draft = null;
    saveForumMutation();
    return { ok: true, post, thread };
  }

  function editPost(postId, body) {
    const session = requireLogin();
    if (!session.ok) return session;

    const post = getPost(postId);
    if (!post) return { ok: false, message: "unknown post: " + postId };
    if (post.author !== session.user.username) return { ok: false, message: "you can only edit your own posts" };

    const cleanBody = String(body || "").trim();
    if (cleanBody.length < 2) return { ok: false, message: "post body is too short" };

    post.body = cleanBody;
    post.updatedAt = new Date().toISOString();
    state.ui.draft = null;
    saveForumMutation();
    return { ok: true, message: "edited post #" + post.id, post };
  }

  function startEditDraft(postId) {
    const session = requireLogin();
    if (!session.ok) return session;

    const post = getPost(postId);
    if (!post) return { ok: false, message: "unknown post: " + postId };
    if (post.author !== session.user.username) return { ok: false, message: "you can only edit your own posts" };

    state.ui.draft = {
      kind: "edit",
      postId: post.id,
      threadId: post.threadId,
      body: post.body || "",
      bodyFormat: post.bodyFormat || "markdown",
      createdAt: new Date().toISOString()
    };
    save();
    return { ok: true, message: "edit draft started for post #" + post.id, post };
  }

  function deletePost(postId) {
    const session = requireLogin();
    if (!session.ok) return session;

    const post = getPost(postId);
    if (!post) return { ok: false, message: "unknown post: " + postId };
    if (post.author !== session.user.username) return { ok: false, message: "you can only delete your own posts" };

    const thread = getThread(post.threadId);
    if (!thread) return { ok: false, message: "unknown thread: " + post.threadId };

    if (thread.postIds[0] === post.id) {
      if (thread.author !== session.user.username) return { ok: false, message: "you can only delete your own thread" };
      state.posts = state.posts.filter((item) => item.threadId !== thread.id);
      state.threads = state.threads.filter((item) => item.id !== thread.id);
      const board = getBoard(thread.boardSlug);
      if (board) board.threadIds = board.threadIds.filter((id) => id !== thread.id);
      state.ui.bookmarks = (state.ui.bookmarks || []).filter((id) => id !== thread.id);
      state.ui.draft = null;
      saveForumMutation();
      return { ok: true, message: "deleted thread #" + thread.id, threadDeleted: true, threadId: thread.id, boardSlug: "station" };
    }

    state.posts = state.posts.filter((item) => item.id !== post.id);
    thread.postIds = thread.postIds.filter((id) => id !== post.id);
    saveForumMutation();
    return { ok: true, message: "deleted post #" + post.id, thread };
  }

  function startThreadDraft(tags) {
    const session = requireLogin();
    if (!session.ok) return session;
    const cleanTags = normalizeTags(tags);
    state.ui.draft = {
      kind: "thread",
      boardSlug: "station",
      tags: cleanTags,
      title: "",
      body: "",
      createdAt: new Date().toISOString()
    };
    save();
    return { ok: true, message: "thread draft started with tags: " + (cleanTags.join(", ") || "[unset]") };
  }

  function startReplyDraft(threadId, quotePostId) {
    const session = requireLogin();
    if (!session.ok) return session;
    const thread = getThread(threadId);
    if (!thread) return { ok: false, message: "unknown thread: " + threadId };
    const quotedPost = quotePostId ? getPost(quotePostId) : null;
    if (quotePostId && (!quotedPost || quotedPost.threadId !== thread.id)) {
      return { ok: false, message: "quote must be a post from thread #" + thread.id };
    }
    state.ui.draft = {
      kind: "reply",
      threadId: Number(threadId),
      body: "",
      quotePostId: quotedPost ? quotedPost.id : null,
      createdAt: new Date().toISOString()
    };
    save();
    return { ok: true, message: "reply draft started for thread #" + thread.id };
  }

  function setDraftTitle(title) {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active" };
    if (draft.kind !== "thread") return { ok: false, message: "reply drafts do not have titles" };
    draft.title = normalizeText(title);
    save();
    return { ok: true, message: "title set" };
  }

  function setDraftBody(body) {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active" };
    draft.body = String(body || "").trim();
    draft.bodyFormat = "markdown";
    save();
    return { ok: true, message: "body set" };
  }

  function setDraftTags(tags) {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active" };
    if (draft.kind !== "thread") return { ok: false, message: "reply drafts do not have tags" };
    draft.tags = normalizeTags(tags);
    save();
    return { ok: true, message: "tags set: " + (draft.tags.join(", ") || "[unset]") };
  }

  function appendDraftBody(body) {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active" };
    const text = String(body || "").trim();
    if (!text) return { ok: false, message: "nothing to append" };
    draft.body = draft.body ? draft.body + "\n" + text : text;
    draft.bodyFormat = "markdown";
    save();
    return { ok: true, message: "body appended" };
  }

  function importMarkdownDraft(markdown, filename) {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active. use: new <tag>" };
    if (draft.kind !== "thread") return { ok: false, message: "markdown upload is only available for thread drafts" };
    const body = String(markdown || "").trim();
    if (!body) return { ok: false, message: "markdown file is empty" };
    draft.body = body;
    draft.bodyFormat = "markdown";
    draft.markdownFile = String(filename || "upload.md");
    if (!draft.title) {
      draft.title = normalizeText(String(filename || "").replace(/\.(md|markdown|txt)$/i, "").replace(/[-_]+/g, " "));
    }
    save();
    return { ok: true, message: "imported markdown: " + draft.markdownFile };
  }

  function cancelDraft() {
    if (!state.ui.draft) return { ok: false, message: "no draft active" };
    state.ui.draft = null;
    save();
    return { ok: true, message: "draft discarded" };
  }

  function publishDraft() {
    const draft = state.ui.draft;
    if (!draft) return { ok: false, message: "no draft active" };
    if (draft.kind === "thread") return createThread(draft.boardSlug, draft.title, draft.body, draft.tags);
    if (draft.kind === "reply") return addReply(draft.threadId, draft.body, draft.quotePostId);
    if (draft.kind === "edit") return editPost(draft.postId, draft.body);
    return { ok: false, message: "invalid draft" };
  }

  function search(query) {
    const q = normalizeText(query).toLowerCase();
    if (!q) return [];

    return state.threads
      .map((thread) => {
        const posts = getPostsForThread(thread.id);
        const haystack = [thread.title, thread.author, thread.boardSlug, thread.tags.join(" "), ...posts.map((post) => post.body)].join(" ").toLowerCase();
        return haystack.includes(q) ? thread : null;
      })
      .filter(Boolean)
      .sort((a, b) => newestPostTime(b) - newestPostTime(a));
  }

  function setTheme(theme) {
    const value = String(theme || "").toLowerCase();
    if (value !== "dark" && value !== "light") {
      return { ok: false, message: "usage: theme dark | theme light" };
    }
    state.ui.theme = value;
    save();
    return { ok: true, message: "theme: " + value };
  }

  function createTag(slug, title, description) {
    const session = requireLogin();
    if (!session.ok) return session;
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return { ok: false, message: "usage: tag create <slug> <title>; <description>" };
    if (getTag(cleanSlug)) return { ok: false, message: "tag already exists: " + cleanSlug };
    const cleanTitle = normalizeText(title) || cleanSlug;
    const cleanDescription = normalizeText(description) || "User-created tag.";
    const tag = ensureTag(cleanSlug, cleanTitle, cleanDescription, session.user.username);
    saveForumMutation();
    return { ok: true, message: "created tag #" + tag.slug, tag };
  }

  function decorateTag(slug, description) {
    const session = requireLogin();
    if (!session.ok) return session;
    const tag = getTag(slug);
    if (!tag) return { ok: false, message: "unknown tag: " + slug };
    if (tag.owner !== session.user.username) return { ok: false, message: "only tag owner can decorate #" + tag.slug };
    const cleanDescription = normalizeText(description);
    if (!cleanDescription) return { ok: false, message: "usage: tag bio <slug> <text>" };
    tag.description = cleanDescription;
    tag.updatedAt = new Date().toISOString();
    saveForumMutation();
    return { ok: true, message: "tag updated #" + tag.slug, tag };
  }

  function addLog(input, output, kind) {
    state.commandLog.push({
      input: input || "",
      output: output || "",
      kind: kind || "info",
      at: new Date().toISOString()
    });
    state.commandLog = state.commandLog.slice(-14);
    save();
  }

  function clearLog() {
    state.commandLog = [];
    save();
  }

  window.ForumState = {
    state,
    save,
    reset,
    register,
    login,
    setBio,
    setProfileTitle,
    logout,
    restoreSession,
    refreshUsers,
    rewardCommand,
    restoreForumData,
    syncForumData,
    getSessionUser,
    getBoard,
    getThread,
    getPost,
    getUser,
    getTag,
    getThreadsForBoard,
    getThreadsForTag,
    getPostsForThread,
    getRecentThreads,
    getPage,
    setPage,
    movePage,
    isBookmarked,
    bookmarkThread,
    unbookmarkThread,
    getBookmarkedThreads,
    createThread,
    addReply,
    editPost,
    startEditDraft,
    deletePost,
    startThreadDraft,
    startReplyDraft,
    setDraftTitle,
    setDraftBody,
    setDraftTags,
    appendDraftBody,
    importMarkdownDraft,
    cancelDraft,
    publishDraft,
    search,
    setTheme,
    createTag,
    decorateTag,
    addLog,
    clearLog
  };
})();
