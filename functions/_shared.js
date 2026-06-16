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
  return env && (env.TWIGOO_DATA || env.DATA) || null;
}

function hasDataStore(env) {
  return Boolean(dataStore(env));
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
  return normalizeForum({
    boards: [{
      slug: "station",
      title: "Station",
      description: "Site notices, rules, changelogs, and public coordination for the forum itself.",
      threadIds: []
    }],
    tags: [],
    threads: [],
    posts: []
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
  hasDataStore,
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
