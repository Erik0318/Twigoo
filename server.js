const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const dataDir = path.join(root, "data");
const dbPath = path.join(dataDir, "auth.json");
const forumPath = path.join(dataDir, "forum.json");
const STARTING_GOOS = 10;
const COMMAND_GOOS = 5;
const REWARD_TZ_OFFSET_MS = 8 * 60 * 60 * 1000;
const MAX_JSON_BODY = 2 * 1024 * 1024;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

function safePath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const resolved = path.resolve(root, cleaned);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

function readBody(req, callback) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_JSON_BODY) req.destroy();
  });
  req.on("end", () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (error) {
      callback(error);
    }
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function writeJsonAtomic(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = filePath + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tmpPath, filePath);
}

function loadDb() {
  try {
    return normalizeDb(JSON.parse(fs.readFileSync(dbPath, "utf8")));
  } catch (error) {
    if (fs.existsSync(dbPath)) throw error;
    return normalizeDb({ users: [], sessions: [] });
  }
}

function saveDb(db) {
  writeJsonAtomic(dbPath, normalizeDb(db));
}

function loadSeedForum() {
  try {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, "src/data.js"), "utf8"), context, { filename: "src/data.js" });
    return normalizeForum(context.window.TerminalForumSeed || {});
  } catch (error) {
    return normalizeForum({ boards: [], tags: [], threads: [], posts: [] });
  }
}

function loadForum() {
  if (!fs.existsSync(forumPath)) return loadSeedForum();
  try {
    return normalizeForum(JSON.parse(fs.readFileSync(forumPath, "utf8")));
  } catch (error) {
    throw error;
  }
}

function saveForum(forum) {
  writeJsonAtomic(forumPath, normalizeForum(forum));
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

function cleanText(value, fallback, limit) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return (text || fallback || "").slice(0, limit || 240);
}

function cleanTags(value) {
  const list = Array.isArray(value) ? value : String(value || "").split(/[,\s#]+/);
  return Array.from(new Set(list.map(cleanSlug).filter(Boolean))).slice(0, 6);
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
    const tagsForThread = cleanTags(thread.tags || []);
    return id && postIds.length ? {
      id,
      boardSlug: "station",
      title: cleanText(thread.title, "untitled thread", 160),
      author: cleanUsername(thread.author) || "unknown",
      createdAt: thread.createdAt || new Date().toISOString(),
      status: thread.status === "locked" ? "locked" : "open",
      tags: tagsForThread,
      postIds
    } : null;
  }).filter(Boolean);

  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));
  threads.forEach((thread) => {
    thread.tags.forEach((slug) => {
      if (!tagMap.has(slug)) {
        tagMap.set(slug, {
          slug,
          title: slug,
          description: "User-created tag.",
          owner: thread.author || "system",
          updatedAt: new Date().toISOString()
        });
      }
    });
  });

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

function normalizeDb(db) {
  const value = db && typeof db === "object" ? db : {};
  value.users = Array.isArray(value.users) ? value.users.map(normalizeUser) : [];
  value.sessions = Array.isArray(value.sessions) ? value.sessions : [];
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

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "password must be at least 8 characters";
  if (value.length > 128) return "password must be at most 128 characters";
  return null;
}

function cleanBio(bio) {
  return String(bio || "").replace(/\s+/g, " ").trim();
}

function cleanTitle(title) {
  return String(title || "").replace(/\s+/g, " ").trim();
}

function createSession(db, username) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  db.sessions = (db.sessions || []).filter((session) => session.username !== username);
  db.sessions.push({ token, username, createdAt: now });
  return token;
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function sessionUser(db, req) {
  const token = bearerToken(req);
  const session = (db.sessions || []).find((item) => item.token === token);
  const user = session ? (db.users || []).find((item) => item.username === session.username) : null;
  return user ? normalizeUser(user) : null;
}

function handleApi(req, res) {
  if (req.method === "GET" && req.url === "/api/forum") {
    sendJson(res, 200, { forum: loadForum() });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/forum") {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: "invalid json" });
        return;
      }

      const db = loadDb();
      const user = sessionUser(db, req);
      if (!user) {
        sendJson(res, 401, { error: "login required" });
        return;
      }

      const forum = normalizeForum(body.forum || {});
      if (!forum.threads.length || !forum.posts.length) {
        sendJson(res, 400, { error: "refusing to save empty forum data" });
        return;
      }

      saveForum(forum);
      sendJson(res, 200, { forum });
    });
    return true;
  }

  if (req.method === "GET" && req.url === "/api/users") {
    const db = loadDb();
    sendJson(res, 200, { users: (db.users || []).map(publicUser) });
    return true;
  }

  if (req.method === "GET" && req.url === "/api/session") {
    const db = loadDb();
    const user = sessionUser(db, req);
    if (!user) {
      sendJson(res, 401, { error: "no active session" });
      return true;
    }
    saveDb(db);
    sendJson(res, 200, { user: publicUser(user) });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/reward-command") {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: "invalid json" });
        return;
      }

      const db = loadDb();
      const user = sessionUser(db, req);
      if (!user) {
        sendJson(res, 401, { error: "login required" });
        return;
      }

      const commandId = String(body.commandId || "").replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 80);
      if (!commandId) {
        sendJson(res, 400, { error: "missing command id" });
        return;
      }

      const duplicate = user.goosLedger.some((entry) => entry && entry.id === commandId);
      let reward = 0;
      let alreadyClaimedToday = false;
      if (!duplicate) {
        const today = dayStamp();
        alreadyClaimedToday = user.lastGooDay === today;
        if (!alreadyClaimedToday) {
          const previous = previousDayStamp(today);
          const currentStreak = Number(user.streak) || 0;
          user.streak = user.lastGooDay === previous ? currentStreak + 1 : 1;
          user.bestStreak = Math.max(Number(user.bestStreak) || 0, user.streak);
          user.lastGooDay = today;
          user.goos = Math.max(STARTING_GOOS, (Number(user.goos) || STARTING_GOOS) + COMMAND_GOOS);
          user.goosEarned = Math.max(0, (Number(user.goosEarned) || 0) + COMMAND_GOOS);
          reward = COMMAND_GOOS;
        }
        user.lastCommandDay = today;
        user.commandCount = Math.max(0, (Number(user.commandCount) || 0) + 1);
        user.goosLedger.push({
          id: commandId,
          command: String(body.command || "").slice(0, 48),
          amount: reward,
          day: today,
          at: new Date().toISOString()
        });
        user.goosLedger = user.goosLedger.slice(-200);
      }

      normalizeUser(user);
      saveDb(db);
      sendJson(res, 200, { user: publicUser(user), reward, duplicate, alreadyClaimedToday });
    });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/profile/bio") {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: "invalid json" });
        return;
      }

      const db = loadDb();
      const user = sessionUser(db, req);
      if (!user) {
        sendJson(res, 401, { error: "login required" });
        return;
      }

      const bio = cleanBio(body.bio);
      if (!bio) {
        sendJson(res, 400, { error: "usage: bio <text>" });
        return;
      }
      if (bio.length > 240) {
        sendJson(res, 400, { error: "bio must be at most 240 characters" });
        return;
      }

      user.bio = bio;
      saveDb(db);
      sendJson(res, 200, { user: publicUser(user) });
    });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/profile/title") {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: "invalid json" });
        return;
      }

      const db = loadDb();
      const user = sessionUser(db, req);
      if (!user) {
        sendJson(res, 401, { error: "login required" });
        return;
      }

      const title = cleanTitle(body.title);
      if (!title) {
        sendJson(res, 400, { error: "usage: headline <text>" });
        return;
      }
      if (title.length > 64) {
        sendJson(res, 400, { error: "headline must be at most 64 characters" });
        return;
      }

      user.title = title;
      saveDb(db);
      sendJson(res, 200, { user: publicUser(user) });
    });
    return true;
  }

  if (req.method === "POST" && (req.url === "/api/register" || req.url === "/api/login" || req.url === "/api/logout")) {
    readBody(req, (error, body) => {
      if (error) {
        sendJson(res, 400, { error: "invalid json" });
        return;
      }

      const db = loadDb();

      if (req.url === "/api/logout") {
        const token = bearerToken(req);
        db.sessions = (db.sessions || []).filter((session) => session.token !== token);
        saveDb(db);
        sendJson(res, 200, { message: "logged out" });
        return;
      }

      const username = cleanUsername(body.username);
      const password = String(body.password || "");
      if (username.length < 3 || username.length > 20) {
        sendJson(res, 400, { error: "username must be 3-20 letters, numbers, or underscores" });
        return;
      }
      const passwordError = validatePassword(password);
      if (passwordError) {
        sendJson(res, 400, { error: passwordError });
        return;
      }

      db.users = db.users || [];
      db.sessions = db.sessions || [];
      const existing = db.users.find((user) => user.username === username);

      if (req.url === "/api/register") {
        if (existing) {
          sendJson(res, 409, { error: "username already registered" });
          return;
        }
        const salt = crypto.randomBytes(16).toString("hex");
        const user = {
          username,
          salt,
          passwordHash: hashPassword(password, salt),
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
        const token = createSession(db, username);
        saveDb(db);
        sendJson(res, 201, {
          user: publicUser(user),
          token
        });
        return;
      }

      if (!existing || hashPassword(password, existing.salt) !== existing.passwordHash) {
        sendJson(res, 401, { error: "invalid username or password" });
        return;
      }
      const token = createSession(db, username);
      saveDb(db);
      sendJson(res, 200, { user: publicUser(existing), token });
    });
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  if ((req.url || "").startsWith("/api/")) {
    try {
      if (!handleApi(req, res)) sendJson(res, 404, { error: "unknown api route" });
    } catch (error) {
      console.error("api error", error);
      sendJson(res, 500, { error: "server data unavailable" });
    }
    return;
  }

  let filePath = safePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        fs.readFile(path.join(root, "index.html"), (fallbackError, fallback) => {
          if (fallbackError) {
            res.writeHead(404);
            res.end("not found");
            return;
          }
          res.writeHead(200, { "Content-Type": types[".html"] });
          res.end(fallback);
        });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
      res.end(content);
    });
  });
});

server.listen(port, () => {
  console.log("terminal-forum running at http://localhost:" + port);
});
