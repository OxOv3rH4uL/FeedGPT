const STOP = new Set(["the","a","an","and","or","of","to","is","in","are","for","on","with"])

function hash(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function toSparse(text: string) {
  const tf = new Map<number, number>();
  for (const t of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (STOP.has(t)) continue;
    const idx = hash(t);
    tf.set(idx, (tf.get(idx) ?? 0) + 1);
  }
  return { indices: [...tf.keys()], values: [...tf.values()] };
}