import { json, publicUser, requireUser } from "../_shared.js";

export async function onRequestGet(context) {
  const { user } = await requireUser(context);
  if (!user) return json({ error: "no active session" }, 401);
  return json({ user: publicUser(user) });
}
