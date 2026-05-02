import { cleanText, json, publicUser, readJson, requireUser, saveAuth } from "../../_shared.js";

export async function onRequestPost(context) {
  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);

  const { db, user } = await requireUser(context);
  if (!user) return json({ error: "login required" }, 401);

  const bio = cleanText(body.bio, "", 240);
  if (!bio) return json({ error: "usage: bio <text>" }, 400);

  user.bio = bio;
  await saveAuth(context.env, db);
  return json({ user: publicUser(user) });
}
