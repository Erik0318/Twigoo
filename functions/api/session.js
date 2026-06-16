import { hasDataStore, json, publicUser, requireUser } from "../_shared.js";

export async function onRequestGet(context) {
  if (!hasDataStore(context.env)) return json({ error: "account data store is not configured" }, 503);

  const { user } = await requireUser(context);
  if (!user) return json({ error: "no active session" }, 401);
  return json({ user: publicUser(user) });
}
