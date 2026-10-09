import React from "react";

/**
 * Plain-textarea JSON editor. Parameter and instruction sets have a different
 * shape for every task type, so a generic editor is used rather than
 * per-task forms. The parent owns the text; `parseJson` tells it whether the
 * text is currently saveable.
 */
export function parseJson(text) {
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { value: null, error: "Must be a JSON object ({ ... })." };
    }
    if (Object.keys(value).length === 0) {
      return { value: null, error: "Object is empty." };
    }
    return { value, error: null };
  } catch (err) {
    return { value: null, error: err.message };
  }
}

function JsonEditor({ text, onChange, readOnly = false, rows = 24 }) {
  const { error } = parseJson(text);

  const format = () => {
    const { value } = parseJson(text);
    if (value) onChange(JSON.stringify(value, null, 2));
  };

  return (
    <div className="json-editor">
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        rows={rows}
        spellCheck={false}
        className={error ? "invalid" : ""}
      />
      <div className="json-editor-status">
        {error ? <span className="error-text">Invalid JSON: {error}</span> : <span className="ok-text">Valid JSON</span>}
        {!readOnly && (
          <button type="button" onClick={format} disabled={!!error}>
            Format
          </button>
        )}
      </div>
    </div>
  );
}

export default JsonEditor;
