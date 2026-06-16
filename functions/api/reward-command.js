import { COMMAND_GOOS, dayStamp, hasDataStore, json, previousDayStamp, publicUser, readJson, requireUser, saveAuth } from "../_shared.js";

export async function onRequestPost(context) {
  if (!hasDataStore(context.env)) return json({ error: "account data store is not configured" }, 503);

  const body = await readJson(context.request);
  if (!body) return json({ error: "invalid json" }, 400);

  const { db, user } = await requireUser(context);
  if (!user) return json({ error: "login required" }, 401);

  const commandId = String(body.commandId || "").replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 80);
  if (!commandId) return json({ error: "missing command id" }, 400);
  const command = String(body.command || "").trim().toLowerCase();
  if (command !== "streak") return json({ error: "usage: streak" }, 400);

  const duplicate = user.goosLedger.some((entry) => entry && entry.id === commandId);
  let reward = 0;
  let alreadyClaimedToday = false;
  if (!duplicate) {
    const today = dayStamp();
    alreadyClaimedToday = user.lastGooDay === today;
    if (!alreadyClaimedToday) {
      const previous = previousDayStamp(today);
      const currentStreak = Number(user.streak) || 0;
      user.streak = user.lastGooDay === previous ? currentStreak + 1 : 1;
      user.bestStreak = Math.max(Number(user.bestStreak) || 0, user.streak);
      user.lastGooDay = today;
      user.goos = Math.max(10, (Number(user.goos) || 10) + COMMAND_GOOS);
      user.goosEarned = Math.max(0, (Number(user.goosEarned) || 0) + COMMAND_GOOS);
      reward = COMMAND_GOOS;
    }
    user.lastCommandDay = today;
    user.commandCount = Math.max(0, (Number(user.commandCount) || 0) + 1);
    user.goosLedger.push({
      id: commandId,
      command: String(body.command || "").slice(0, 48),
      amount: reward,
      day: today,
      at: new Date().toISOString()
    });
    user.goosLedger = user.goosLedger.slice(-200);
  }

  await saveAuth(context.env, db);
  return json({ user: publicUser(user), reward, duplicate, alreadyClaimedToday });
}
