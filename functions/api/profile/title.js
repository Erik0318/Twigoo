import { cleanText, hasDataStore, json, publicUser, readJson, requireUser, saveAuth } from "../../_shared.js";

export async function onRequestPost(context) {
  if (!hasDataStore(context.env)) return json({ error: "account data store is not configured" }, 503);

  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);

  const { db, user } = await requireUser(context);
  if (!user) return json({ error: "login required" }, 401);

  const title = cleanText(body.title, "", 64);
  if (!title) return json({ error: "usage: headline <text>" }, 400);

  user.title = title;
  await saveAuth(context.env, db);
  return json({ user: publicUser(user) });
}
