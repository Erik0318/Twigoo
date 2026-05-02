import { cleanUsername, createSession, hashPassword, json, loadAuth, publicUser, readJson, saveAuth, validatePassword } from "../_shared.js";

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);

  const username = cleanUsername(body.username);
  const password = String(body.password || "");
  if (username.length < 3 || username.length > 20) return json({ error: "username must be 3-20 letters, numbers, or underscores" }, 400);
  const passwordError = validatePassword(password);
  if (passwordError) return json({ error: passwordError }, 400);

  const db = await loadAuth(context.env);
  const user = db.users.find((item) => item.username === username);
  if (!user || await hashPassword(password, user.salt) !== user.passwordHash) {
    return json({ error: "invalid username or password" }, 401);
  }

  const token = await createSession(db, username);
  await saveAuth(context.env, db);
  return json({ user: publicUser(user), token });
}
