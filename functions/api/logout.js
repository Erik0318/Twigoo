import { bearerToken, json, loadAuth, readJson, saveAuth } from "../_shared.js";

export async function onRequestPost(context) {
  await readJson(context.request);
  const db = await loadAuth(context.env);
  const token = bearerToken(context.request);
  db.sessions = (db.sessions || []).filter((session) => session.token !== token);
  await saveAuth(context.env, db);
  return json({ message: "logged out" });
}
