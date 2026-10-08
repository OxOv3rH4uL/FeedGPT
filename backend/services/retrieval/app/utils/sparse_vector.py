import re

STOP = {"the","a","an","and","or","of","to","in","is","are","for","on","with"}

def hasher(token: str) -> int:              
    h = 2166136261
    for ch in token:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF     
    return h

def to_sparse(text: str):
    tf: dict[int, int] = {}
    for t in re.findall(r"[a-z0-9]+", text.lower()):
        if t in STOP:
            continue
        idx = hasher(t)
        tf[idx] = tf.get(idx, 0) + 1
    return list(tf.keys()), list(tf.values())