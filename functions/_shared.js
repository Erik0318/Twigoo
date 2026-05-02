const STARTING_GOOS = 10;
const COMMAND_GOOS = 5;
const REWARD_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const AUTH_KEY = "auth";
const FORUM_KEY = "forum";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

function dataStore(env) {
  return env.TWIGOO_DATA || env.DATA || null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

function cleanUsername(username) {
  return String(username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function cleanSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function cleanText(value, fallback, limit = 240) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return (text || fallback || "").slice(0, limit);
}

function cleanTags(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,\s#]+/);
  return Array.from(new Set(list.map(cleanSlug).filter(Boolean))).slice(0, 6);
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

function normalizeUser(user) {
  const value = user || {};
  const balance = Number(value.goos);
  value.username = cleanUsername(value.username);
  value.title = cleanText(value.title, "new member", 64);
  value.bio = cleanText(value.bio, "No bio yet.", 240);
  value.joinedAt = value.joinedAt || new Date().toISOString();
  value.goos = Number.isFinite(balance) ? Math.max(STARTING_GOOS, Math.floor(balance)) : STARTING_GOOS;
  value.goosEarned = Math.max(0, Math.floor(Number(value.goosEarned) || 0));
  value.commandCount = Math.max(0, Math.floor(Number(value.commandCount) || 0));
  value.streak = Math.max(0, Math.floor(Number(value.streak) || 0));
  value.bestStreak = Math.max(value.streak, Math.floor(Number(value.bestStreak) || 0));
  value.lastCommandDay = value.lastCommandDay ? dayStamp(value.lastCommandDay) : null;
  value.lastGooDay = value.lastGooDay ? dayStamp(value.lastGooDay) : value.lastCommandDay;
  value.goosLedger = Array.isArray(value.goosLedger) ? value.goosLedger.slice(-200) : [];
  return value;
}

function publicUser(user) {
  const safe = normalizeUser(user);
  return {
    username: safe.username,
    title: safe.title,
    bio: safe.bio,
    joinedAt: safe.joinedAt,
    goos: safe.goos,
    goosEarned: safe.goosEarned,
    streak: safe.streak,
    bestStreak: safe.bestStreak,
    commandCount: safe.commandCount,
    lastCommandDay: safe.lastCommandDay,
    lastGooDay: safe.lastGooDay
  };
}

function normalizeAuth(db) {
  const value = db && typeof db === "object" ? db : {};
  value.users = Array.isArray(value.users) ? value.users.map(normalizeUser).filter((user) => user.username) : [];
  value.sessions = Array.isArray(value.sessions) ? value.sessions : [];
  return value;
}

function normalizeForum(forum) {
  const value = forum && typeof forum === "object" ? forum : {};
  const rawThreads = Array.isArray(value.threads) ? value.threads : [];
  const rawPosts = Array.isArray(value.posts) ? value.posts : [];
  const rawTags = Array.isArray(value.tags) ? value.tags : [];
  const posts = rawPosts.map((post) => ({
    id: Math.max(1, Math.floor(Number(post.id) || 0)),
    threadId: Math.max(1, Math.floor(Number(post.threadId) || 0)),
    author: cleanUsername(post.author) || "unknown",
    createdAt: post.createdAt || new Date().toISOString(),
    updatedAt: post.updatedAt || null,
    body: String(post.body || "").slice(0, 200000),
    bodyFormat: post.bodyFormat === "markdown" ? "markdown" : undefined,
    quotePostId: post.quotePostId ? Math.max(1, Math.floor(Number(post.quotePostId) || 0)) : null
  })).filter((post) => post.id && post.threadId && post.body);
  const tags = rawTags.map((tag) => {
    const slug = cleanSlug(tag.slug);
    return slug ? {
      slug,
      title: cleanText(tag.title, slug, 80),
      description: cleanText(tag.description, "User-created tag.", 500),
      owner: cleanUsername(tag.owner) || "system",
      updatedAt: tag.updatedAt || new Date().toISOString()
    } : null;
  }).filter(Boolean);
  const threads = rawThreads.map((thread) => {
    const id = Math.max(1, Math.floor(Number(thread.id) || 0));
    const postIds = posts.filter((post) => post.threadId === id).map((post) => post.id);
    return id && postIds.length ? {
      id,
      boardSlug: "station",
      title: cleanText(thread.title, "untitled thread", 160),
      author: cleanUsername(thread.author) || "unknown",
      createdAt: thread.createdAt || new Date().toISOString(),
      status: thread.status === "locked" ? "locked" : "open",
      tags: cleanTags(thread.tags || []),
      postIds
    } : null;
  }).filter(Boolean);
  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));
  threads.forEach((thread) => thread.tags.forEach((slug) => {
    if (!tagMap.has(slug)) {
      tagMap.set(slug, {
        slug,
        title: slug,
        description: "User-created tag.",
        owner: thread.author || "system",
        updatedAt: new Date().toISOString()
      });
    }
  }));
  return {
    boards: [{
      slug: "station",
      title: "Station",
      description: "Site notices, rules, changelogs, and public coordination for the forum itself.",
      threadIds: threads.map((thread) => thread.id)
    }],
    tags: Array.from(tagMap.values()).sort((a, b) => a.slug.localeCompare(b.slug)),
    threads,
    posts
  };
}

async function loadAuth(env) {
  const store = dataStore(env);
  if (!store) return normalizeAuth({});
  const value = await store.get(AUTH_KEY, "json");
  return normalizeAuth(value || {});
}

async function saveAuth(env, db) {
  const store = dataStore(env);
  if (!store) throw new Error("missing TWIGOO_DATA KV binding");
  await store.put(AUTH_KEY, JSON.stringify(normalizeAuth(db)));
}

async function loadForum(env) {
  const store = dataStore(env);
  if (!store) return null;
  const value = await store.get(FORUM_KEY, "json");
  return value ? normalizeForum(value) : seedForum();
}

async function saveForum(env, forum) {
  const store = dataStore(env);
  if (!store) throw new Error("missing TWIGOO_DATA KV binding");
  await store.put(FORUM_KEY, JSON.stringify(normalizeForum(forum)));
}

function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function sessionUser(db, request) {
  const token = bearerToken(request);
  const session = (db.sessions || []).find((item) => item.token === token);
  const user = session ? (db.users || []).find((item) => item.username === session.username) : null;
  return user ? normalizeUser(user) : null;
}

async function hashPassword(password, salt) {
  const input = new TextEncoder().encode(String(password || "") + ":" + salt);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "password must be at least 8 characters";
  if (value.length > 128) return "password must be at most 128 characters";
  return null;
}

function seedForum() {
  const now = new Date();
  const iso = (daysAgo, hour) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 18, 0, 0);
    return d.toISOString();
  };
  return normalizeForum({
    boards: [{
      slug: "station",
      title: "Station",
      description: "Site notices, rules, changelogs, and public coordination for the forum itself.",
      threadIds: [1, 2, 3, 4, 5]
    }],
    tags: [
      { slug: "design", title: "Design", description: "Interfaces, reading rhythm, text UI, and visual direction.", owner: "erik", updatedAt: iso(0, 8) },
      { slug: "homelab", title: "Homelab", description: "Small servers, Linux installs, storage, and always-on machines.", owner: "nullfan", updatedAt: iso(1, 8) },
      { slug: "javascript", title: "JavaScript", description: "Browser code, command parsers, UI state, and local-first prototypes.", owner: "byteghost", updatedAt: iso(2, 8) },
      { slug: "books", title: "Books", description: "Short computing history reads and systems culture notes.", owner: "archivist", updatedAt: iso(4, 8) },
      { slug: "weird-web", title: "Weird Web", description: "Text sites, personal protocols, BBS energy, and experimental pages.", owner: "erik", updatedAt: iso(5, 8) }
    ],
    threads: [
      { id: 1, boardSlug: "station", title: "What should a text-only forum feel like?", author: "erik", createdAt: iso(0, 12), status: "open", tags: ["design", "terminal"], postIds: [101, 102] },
      { id: 2, boardSlug: "station", title: "Turning an old laptop into a quiet server", author: "nullfan", createdAt: iso(1, 21), status: "open", tags: ["homelab", "linux"], postIds: [201, 202] },
      { id: 3, boardSlug: "station", title: "Command parser architecture for a web shell UI", author: "byteghost", createdAt: iso(2, 15), status: "open", tags: ["javascript", "ui"], postIds: [301] },
      { id: 4, boardSlug: "station", title: "Small books about computing history", author: "archivist", createdAt: iso(4, 9), status: "open", tags: ["books"], postIds: [401] },
      { id: 5, boardSlug: "station", title: "A website that pretends to be one text object", author: "erik", createdAt: iso(5, 22), status: "open", tags: ["weird-web", "bbs", "aesthetic"], postIds: [501, 502] }
    ],
    posts: [
      { id: 101, threadId: 1, author: "erik", createdAt: iso(0, 12), updatedAt: null, body: "I want a forum that feels like a console, but not in a cheap green-on-black way. It should be serious enough to read for a long time." },
      { id: 102, threadId: 1, author: "byteghost", createdAt: iso(0, 13), updatedAt: null, body: "The hard part is not the look. It is making commands discoverable. Every page needs to tell the user the next useful command." },
      { id: 201, threadId: 2, author: "nullfan", createdAt: iso(1, 21), updatedAt: null, body: "I have a spare laptop. I want it to run a tiny forum, maybe a bot, and a few static pages. What should I install first?" },
      { id: 202, threadId: 2, author: "erik", createdAt: iso(1, 22), updatedAt: null, body: "Start with a minimal Linux server install, SSH, firewall, Tailscale if you need private access, then deploy one small web service. Do not make it complicated too early." },
      { id: 301, threadId: 3, author: "byteghost", createdAt: iso(2, 15), updatedAt: null, body: "A parser should return an intent object, not directly mutate the page. Example: { type: 'open_tag', slug: 'javascript' }. Then the app can decide how to render or navigate." },
      { id: 401, threadId: 4, author: "archivist", createdAt: iso(4, 9), updatedAt: null, body: "Looking for books that are small enough to read on the train but not empty beginner stuff. Computing history, company stories, systems culture." },
      { id: 501, threadId: 5, author: "erik", createdAt: iso(5, 22), updatedAt: null, body: "What if the whole website is made from text, like the browser is just a terminal pane? Not fake Linux. More like a forum designed as a document you can operate." },
      { id: 502, threadId: 5, author: "nullfan", createdAt: iso(5, 23), updatedAt: null, body: "That can work if the text has rhythm. Borders, paths, commands, short metadata lines. It needs discipline." }
    ]
  });
}

async function createSession(db, username) {
  const token = randomToken();
  db.sessions = (db.sessions || []).filter((session) => session.username !== username);
  db.sessions.push({ token, username, createdAt: new Date().toISOString() });
  return token;
}

async function requireUser(context) {
  const db = await loadAuth(context.env);
  const user = sessionUser(db, context.request);
  return { db, user };
}

export {
  COMMAND_GOOS,
  STARTING_GOOS,
  cleanText,
  cleanUsername,
  createSession,
  bearerToken,
  dayStamp,
  hashPassword,
  json,
  loadAuth,
  loadForum,
  normalizeForum,
  publicUser,
  readJson,
  requireUser,
  saveAuth,
  saveForum,
  seedForum,
  sessionUser,
  validatePassword,
  previousDayStamp
};
