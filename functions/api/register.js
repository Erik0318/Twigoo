import { STARTING_GOOS, cleanUsername, createSession, hasDataStore, hashPassword, json, loadAuth, publicUser, readJson, saveAuth, validatePassword } from "../_shared.js";

export async function onRequestPost(context) {
  if (!hasDataStore(context.env)) return json({ error: "account data store is not configured" }, 503);

  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);

  const username = cleanUsername(body.username);
  const password = String(body.password || "");
  if (username.length < 3 || username.length > 20) return json({ error: "username must be 3-20 letters, numbers, or underscores" }, 400);
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError }, 400);

  const db = await loadAuth(context.env);
  if (db.users.some((user) => user.username === username)) return json({ error: "username already registered" }, 409);

  const salt = crypto.randomUUID();
  const user = {
    username,
    salt,
    passwordHash: await hashPassword(password, salt),
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
  const token = await createSession(db, username);
  await saveAuth(context.env, db);
  return json({ user: publicUser(user), token }, 201);
}
