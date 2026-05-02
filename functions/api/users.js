import { json, loadAuth, publicUser } from "../_shared.js";

export async function onRequestGet(context) {
  const db = await loadAuth(context.env);
  return json({ users: db.users.map(publicUser) });
}
