import { redis_state, redis } from "../queue/redis";

const sub = redis.duplicate();
const waiters = new Map<string, Set<(status: string) => void>>();


//help needed so kinda used AI coz first time working with pub sub model bro , what to do
sub.on("error", (err) => console.error("waiter subscriber error", err));
sub.psubscribe("doc-done:*").catch((err) => console.error("psubscribe failed", err));

sub.on("pmessage", (_pattern, channel, status) => {
  const id = channel.slice("doc-done:".length);
  const set = waiters.get(id);
  if (!set) return;
  for (const resolve of set) resolve(status);
});

export async function waitForProcessing(document_id: string, timeout = 30 * 60_000): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  let resolver!: (status: string) => void;

  const done = new Promise<string>((resolve, reject) => {
    resolver = resolve;
    timer = setTimeout(
      () => reject(new Error(`timed out waiting for ${document_id}`)),
      timeout
    );
  });
  done.catch(() => {}); 
  let set = waiters.get(document_id);
  if (!set) waiters.set(document_id, (set = new Set()));
  set.add(resolver);

  try {
    const existing = await redis_state.get(`docstatus:${document_id}`);
    if (existing) return existing;

    poll = setInterval(async () => {
      try {
        const s = await redis_state.get(`docstatus:${document_id}`);
        if (s) resolver(s);
      } catch {
        /* ignore, next tick retries */
      }
    }, 30_000);

    return await done;
  } finally {
    if (timer) clearTimeout(timer);
    if (poll) clearInterval(poll);
    set.delete(resolver);
    if (set.size === 0) waiters.delete(document_id);
  }
}