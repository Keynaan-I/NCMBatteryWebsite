import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../AuthContext";
import JsonEditor, { parseJson } from "./JsonEditor";
import ParameterEditor, { defaultParameters, validateParameters } from "./ParameterEditor";
import { KINDS } from "./kinds";
import { NAME_PATTERN, suggestCopyName } from "./copyName";

/**
 * Creates a parameter/instruction set, either from scratch (/library/:kind/new)
 * or as an edited copy of an existing one (/library/:kind/:id/copy). Always
 * saves a NEW row -- the source set is only read, never modified.
 */
function ConfigEditor() {
  const { kind, id } = useParams();
  const [searchParams] = useSearchParams();
  const cfg = KINDS[kind];
  const navigate = useNavigate();
  const { csrfToken } = useAuth();
  const isCopy = Boolean(id);

  const [taskTypes, setTaskTypes] = useState([]);
  const [existing, setExisting] = useState([]); // every set of this kind, for name-collision checks
  const [source, setSource] = useState(null); // the record being copied, if any
  const initialTaskTypeId = Number(searchParams.get("task_type_id")) || "";
  const [taskTypeId, setTaskTypeId] = useState(initialTaskTypeId);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("EN");
  const [text, setText] = useState("{\n  \n}");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!cfg) return;
    let cancelled = false;
    Promise.all([api.listTaskTypes(), cfg.list(), isCopy ? api.getRecord(kind, id) : null])
      .then(([types, all, src]) => {
        if (cancelled) return;
        setTaskTypes(types);
        setExisting(all);
        if (src) {
          setSource(src);
          setTaskTypeId(src.task_type_id);
          setLanguage(src.language);
          setText(JSON.stringify(src[cfg.bodyKey], null, 2));
          const names = all.filter((r) => cfg.sameNameSpace(r, src.task_type_id, src.language)).map((r) => r[cfg.nameKey]);
          setName(suggestCopyName(src[cfg.nameKey], names));
        } else if (kind === "parameter") {
          // New set for a task chosen on the list page: start from that task's defaults.
          const def = types.find((t) => t.task_type_id === initialTaskTypeId)?.parameter_schema;
          if (def) setText(JSON.stringify(defaultParameters(def), null, 2));
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cfg, kind, id, isCopy, initialTaskTypeId]);

  if (!cfg) return <p className="error-text">Unknown library "{kind}".</p>;
  if (loading) return <p className="app-container">Loading...</p>;

  // Only parameter sets have schemas; instruction sets are always edited as JSON.
  const schemaDef =
    kind === "parameter" ? taskTypes.find((t) => t.task_type_id === Number(taskTypeId))?.parameter_schema ?? null : null;

  const changeTaskType = (value) => {
    setTaskTypeId(value);
    // A new parameter set starts from the task's defaults, if it has a schema.
    const def = kind === "parameter" ? taskTypes.find((t) => t.task_type_id === value)?.parameter_schema : null;
    if (!isCopy && def && !parseJson(text).value) setText(JSON.stringify(defaultParameters(def), null, 2));
  };

  const parsed = parseJson(text);
  const nameTaken = existing.some(
    (r) => cfg.sameNameSpace(r, Number(taskTypeId), language) && r[cfg.nameKey] === name.trim()
  );

  const handleSave = async () => {
    setError(null);
    if (!taskTypeId) return setError("Choose a task type.");
    if (!NAME_PATTERN.test(name.trim())) return setError("Name may only contain letters, numbers, and underscores.");
    if (nameTaken) return setError(`"${name.trim()}" already exists. Choose a new name; existing sets are never overwritten.`);
    if (parsed.error) return setError(`Fix the JSON first: ${parsed.error}`);
    const problems = validateParameters(schemaDef, parsed.value);
    if (problems.length) return setError(`Check these fields: ${problems.join("; ")}`);

    setSaving(true);
    try {
      const result = await cfg.create(csrfToken, {
        taskTypeId: Number(taskTypeId),
        name: name.trim(),
        language,
        body: parsed.value,
      });
      navigate(`/library/${kind}`, {
        state: { message: `Saved new ${cfg.label} "${result[cfg.nameKey]}" (id ${result[cfg.idKey]}).` },
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="app-container">
      <p>
        <Link to={`/library/${kind}`}>← {cfg.title}</Link>
      </p>
      <h2>{isCopy ? `Edit as copy: ${source?.[cfg.nameKey]}` : `New ${cfg.label}`}</h2>

      {source && (
        <p className="hint">
          Your changes will be saved as a <b>new</b> {cfg.label}. The original "{source[cfg.nameKey]}" stays unchanged
          {source.used_by.length > 0 && (
            <>
              {" "}
              and remains in use by battery index {source.used_by.map((b) => b.battery_index).join(", ")}. To switch
              those batteries to the new set, copy each battery and pick the new set in the builder
            </>
          )}
          .
        </p>
      )}

      <div className="form-grid">
        <label>
          Task type
          <select value={taskTypeId} onChange={(e) => changeTaskType(Number(e.target.value))} disabled={isCopy}>
            <option value="">-- choose --</option>
            {taskTypes.map((t) => (
              <option key={t.task_type_id} value={t.task_type_id}>
                {t.task_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RAVLT_Spoken_v2" />
          {nameTaken && <span className="error-text">Already exists</span>}
        </label>
        <label>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="EN">EN</option>
            <option value="FR">FR</option>
            <option value="KR">KR</option>
          </select>
        </label>
      </div>

      {kind === "parameter" ? (
        <ParameterEditor schemaDef={schemaDef} text={text} onChange={setText} />
      ) : (
        <JsonEditor text={text} onChange={setText} />
      )}

      {error && <p className="error-text">{error}</p>}
      <button className="primary" onClick={handleSave} disabled={saving || !!parsed.error}>
        {saving ? "Saving..." : `Save as new ${cfg.label}`}
      </button>
    </div>
  );
}

export default ConfigEditor;
