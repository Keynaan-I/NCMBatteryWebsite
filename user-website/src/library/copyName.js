// Helpers shared by the copy-on-edit screens.

export const NAME_PATTERN = /^[A-Za-z0-9_]+$/; // same rule the admin API enforces

/**
 * Suggests a name for an edited copy of `name` that doesn't collide with any
 * of `existingNames`: "RAVLT_Spoken" -> "RAVLT_Spoken_v2", and a copy of
 * "RAVLT_Spoken_v2" -> "RAVLT_Spoken_v3" (not "..._v2_v2").
 */
export function suggestCopyName(name, existingNames) {
  const base = name.replace(/_v\d+$/, "");
  const taken = new Set(existingNames);
  for (let n = 2; ; n++) {
    const candidate = `${base}_v${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Splits "Quit, Stop" into ["Quit", "Stop"]; empty input -> null (column stays NULL). */
export function parseList(text) {
  const items = text.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length ? items : null;
}
