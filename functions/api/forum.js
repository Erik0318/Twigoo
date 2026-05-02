import { json, loadForum, normalizeForum, readJson, requireUser, saveForum } from "../_shared.js";

export async function onRequestGet(context) {
  const forum = await loadForum(context.env);
  if (!forum) return json({ error: "forum data store is not configured" }, 503);
  return json({ forum });
}

export async function onRequestPost(context) {
  const { user } = await requireUser(context);
  if (!user) return json({ error: "login required" }, 401);

  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);
  const forum = normalizeForum(body.forum || {});
  if (!forum.threads.length || !forum.posts.length) return json({ error: "refusing to save empty forum data" }, 400);

  await saveForum(context.env, forum);
  return json({ forum });
}
