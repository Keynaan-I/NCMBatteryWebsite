import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import * as api from "./api";
import { useAuth } from "./AuthContext";
import { parseJson } from "./library/JsonEditor";
import ParameterEditor, { defaultParameters, validateParameters } from "./library/ParameterEditor";
import { NAME_PATTERN, suggestCopyName } from "./library/copyName";

/**
 * Settings for one task in the battery being built: which parameter set and
 * instruction set it uses, and its display label.
 *
 * Parameter set modes (copy-on-edit -- an existing set is never modified):
 *   "existing" -- attach an existing set as-is (read-only preview)
 *   "copy"     -- start from an existing set, edit it, save it under a new name
 *   "new"      -- write a new set from scratch
 */
function FormSettings({ draft, saveFormSettings }) {
  const { taskTypeId, id } = useParams();
  const navigate = useNavigate();
  const { csrfToken } = useAuth();
  const item = draft.items.find((i) => i.id === id); // undefined when adding a new task

  const [taskName, setTaskName] = useState("");
  const [schemaDef, setSchemaDef] = useState(null); // task_types.parameter_schema, if any
  const [params, setParams] = useState([]); // [{parameter_id, parameter_name, language, used_by}]
  const [instructions, setInstructions] = useState([]); // [{instruction_id, instruction_name, language, used_by}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState(item?.parameterId ? "existing" : null); // null until lists load
  const [selectedParameterId, setSelectedParameterId] = useState(item?.parameterId ?? "");
  const [text, setText] = useState("{\n  \n}");
  const [newName, setNewName] = useState("");
  const [language, setLanguage] = useState(draft.header.language);
  const [instructionId, setInstructionId] = useState(item?.instructionId ?? "");
  const [iconName, setIconName] = useState(item?.iconName ?? "");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listTaskTypes(), api.listParameters(taskTypeId), api.listInstructions(taskTypeId)])
      .then(([taskTypes, p, ins]) => {
        if (cancelled) return;
        const tt = taskTypes.find((t) => String(t.task_type_id) === String(taskTypeId));
        setTaskName(tt ? tt.task_name : `Task type ${taskTypeId}`);
        setSchemaDef(tt?.parameter_schema ?? null);
        setParams(p);
        setInstructions(ins);
        setMode((m) => m ?? (p.length > 0 ? "existing" : "new"));
        // No sets exist yet, so the page opens on "new": start from the schema's defaults.
        if (p.length === 0 && tt?.parameter_schema) {
          setText(JSON.stringify(defaultParameters(tt.parameter_schema), null, 2));
        }
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [taskTypeId]);

  // Load the chosen set's JSON: a read-only preview in "existing" mode, the
  // starting point in "copy" mode.
  useEffect(() => {
    if (!selectedParameterId || mode === "new") return;
    let cancelled = false;
    api
      .getRecord("parameter", selectedParameterId)
      .then((rec) => {
        if (cancelled) return;
        setText(JSON.stringify(rec.parameters, null, 2));
        if (mode === "copy") {
          setNewName(suggestCopyName(rec.parameter_name, params.map((p) => p.parameter_name)));
          setLanguage(rec.language);
        }
      })
      .catch((err) => !cancelled && setSaveError(`Could not load parameter set: ${err.message}`));
    return () => {
      cancelled = true;
    };
  }, [selectedParameterId, mode, params]);

  const changeMode = (m) => {
    setSaveError(null);
    setMode(m);
    if (m === "new") {
      setText(schemaDef ? JSON.stringify(defaultParameters(schemaDef), null, 2) : "{\n  \n}");
      setNewName("");
    }
  };

  const chosenInstruction = instructions.find((i) => String(i.instruction_id) === String(instructionId));
  const parsed = parseJson(text);

  const finish = (parameterId, parameterName) => {
    saveFormSettings({
      id,
      taskTypeId: Number(taskTypeId),
      name: taskName,
      parameterId,
      parameterName,
      instructionId: chosenInstruction ? chosenInstruction.instruction_id : null,
      instructionName: chosenInstruction?.instruction_name ?? null,
      instructionLanguage: chosenInstruction?.language ?? null,
      iconName,
    });
    navigate("/");
  };

  const handleSave = async () => {
    setSaveError(null);

    if (mode === "existing") {
      const chosen = params.find((p) => String(p.parameter_id) === String(selectedParameterId));
      if (!chosen) {
        setSaveError("Pick an existing parameter set first.");
        return;
      }
      finish(chosen.parameter_id, chosen.parameter_name);
      return;
    }

    // "copy" / "new": create the parameter set in the database first, so the
    // builder's "Save as new battery" only ever references sets that exist.
    const name = newName.trim();
    if (!NAME_PATTERN.test(name)) {
      setSaveError("Name may only contain letters, numbers, and underscores.");
      return;
    }
    if (params.some((p) => p.parameter_name === name)) {
      setSaveError(`"${name}" already exists for this task. Choose a new name; existing sets are never overwritten.`);
      return;
    }
    if (parsed.error) {
      setSaveError(`Fix the JSON first: ${parsed.error}`);
      return;
    }
    const problems = validateParameters(schemaDef, parsed.value);
    if (problems.length) {
      setSaveError(`Check these fields: ${problems.join("; ")}`);
      return;
    }
    setSaving(true);
    try {
      const result = await api.createParameter(csrfToken, {
        taskTypeId: Number(taskTypeId),
        parameterName: name,
        language,
        parameters: parsed.value,
      });
      finish(result.parameter_id, result.parameter_name);
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (loadError) return <p style={{ padding: "20px", color: "red" }}>{loadError}</p>;

  const sourcePicker = (
    <select value={selectedParameterId} onChange={(e) => setSelectedParameterId(e.target.value)}>
      <option value="">-- choose one --</option>
      {params.map((p) => (
        <option key={p.parameter_id} value={p.parameter_id}>
          {p.parameter_name} ({p.language}){p.used_by ? ` — used by ${p.used_by}` : ""}
        </option>
      ))}
    </select>
  );

  const languageSelect = (
    <label>
      Language
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="EN">EN</option>
        <option value="FR">FR</option>
        <option value="KR">KR</option>
      </select>
    </label>
  );

  return (
    <div className="app-container form-settings">
      <p>
        <Link to="/">← Battery builder</Link>
      </p>
      <h2>{taskName}</h2>

      <h3>Parameter set</h3>
      <div className="mode-picker">
        <label>
          <input
            type="radio"
            checked={mode === "existing"}
            onChange={() => changeMode("existing")}
            disabled={params.length === 0}
          />{" "}
          Use an existing set as-is
        </label>
        <label>
          <input type="radio" checked={mode === "copy"} onChange={() => changeMode("copy")} disabled={params.length === 0} />{" "}
          Edit a copy of an existing set
        </label>
        <label>
          <input type="radio" checked={mode === "new"} onChange={() => changeMode("new")} /> Create a new set from scratch
        </label>
        {params.length === 0 && <span className="hint">(no sets exist yet for this task)</span>}
      </div>

      {mode === "existing" && (
        <>
          {sourcePicker}
          {selectedParameterId && <ParameterEditor schemaDef={schemaDef} text={text} onChange={() => {}} readOnly />}
        </>
      )}

      {mode === "copy" && (
        <>
          <label>Start from: {sourcePicker}</label>
          {selectedParameterId && (
            <>
              <p className="hint">
                Your changes are saved as a new set; the original stays unchanged for any battery already using it.
              </p>
              <div className="form-grid">
                <label>
                  New name
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </label>
                {languageSelect}
              </div>
              <ParameterEditor schemaDef={schemaDef} text={text} onChange={setText} />
            </>
          )}
        </>
      )}

      {mode === "new" && (
        <>
          <div className="form-grid">
            <label>
              Name
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. RAVLT_Spoken_New"
              />
            </label>
            {languageSelect}
          </div>
          <ParameterEditor schemaDef={schemaDef} text={text} onChange={setText} />
        </>
      )}

      <h3>Instruction set</h3>
      <select value={instructionId} onChange={(e) => setInstructionId(e.target.value)}>
        <option value="">-- none --</option>
        {instructions.map((i) => (
          <option key={i.instruction_id} value={i.instruction_id}>
            {i.instruction_name} ({i.language})
          </option>
        ))}
      </select>
      {chosenInstruction && chosenInstruction.language !== draft.header.language && (
        <p className="warn-text">
          This instruction set is {chosenInstruction.language}, but the battery language is {draft.header.language}.
        </p>
      )}
      <p className="hint">
        To create or edit instruction sets, use the <Link to="/library/instruction">Instruction sets</Link> page; this
        battery stays in the builder while you do.
      </p>

      <h3>Display label</h3>
      <input
        type="text"
        value={iconName}
        onChange={(e) => setIconName(e.target.value)}
        placeholder='optional, e.g. "Immediate"'
      />

      {saveError && <p className="error-text">{saveError}</p>}
      <p>
        <button className="primary" onClick={handleSave} disabled={saving || (mode !== "existing" && !!parsed.error)}>
          {saving ? "Saving..." : item ? "Update task" : "Add task to battery"}
        </button>
      </p>
    </div>
  );
}

export default FormSettings;
