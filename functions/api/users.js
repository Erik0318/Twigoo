import { hasDataStore, json, loadAuth, publicUser } from "../_shared.js";

export async function onRequestGet(context) {
  if (!hasDataStore(context.env)) return json({ error: "account data store is not configured" }, 503);

  const db = await loadAuth(context.env);
  return json({ users: db.users.map(publicUser) });
}
