import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as api from "./api";
import { useAuth } from "./AuthContext";

const STORAGE_KEY = (taskTypeId, id) => `task-${taskTypeId}-${id}`;

function FormSettings({ saveFormSettings }) {
  const { taskTypeId, id } = useParams();
  const navigate = useNavigate();
  const { csrfToken } = useAuth();

  const [taskName, setTaskName] = useState("");
  const [existingParams, setExistingParams] = useState([]); // [{parameter_id, parameter_name, language}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY(taskTypeId, id)) || "null");

  // "existing" = reusing an already-saved parameter_id as-is (read-only preview).
  // "new" = building a brand-new named parameter set via API_admin_create_parameter.php.
  const [mode, setMode] = useState(saved?.mode || "new");
  const [selectedParameterId, setSelectedParameterId] = useState(saved?.parameterId || "");
  const [newName, setNewName] = useState(saved?.parameterName || "");
  const [settings, setSettings] = useState(saved?.settings || {});
  const [iconName, setIconName] = useState(saved?.iconName || "");

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listTaskTypes(), api.listParameters(taskTypeId)])
      .then(([taskTypes, params]) => {
        if (cancelled) return;
        const tt = taskTypes.find((t) => String(t.task_type_id) === String(taskTypeId));
        setTaskName(tt ? tt.task_name : `Task type ${taskTypeId}`);
        setExistingParams(params);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [taskTypeId]);

  // When switching to "use an existing parameter set", fetch its full JSON so
  // the user can see what they're about to attach -- this app has no update
  // endpoint, so this view is read-only, not an editable form.
  const handleSelectExisting = async (parameterId) => {
    setSelectedParameterId(parameterId);
    setSaveError(null);
    const chosen = existingParams.find((p) => String(p.parameter_id) === String(parameterId));
    if (!chosen || !taskName) return;
    try {
      const detail = await api.getParameterDetail(taskName, chosen.parameter_name);
      setSettings(detail);
    } catch (err) {
      setSaveError(`Could not load "${chosen.parameter_name}": ${err.message}`);
    }
  };

  const handleFieldChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? value : value === "true" ? true : value === "false" ? false : value,
    }));
  };

  const persistDraft = (extra = {}) => {
    localStorage.setItem(
      STORAGE_KEY(taskTypeId, id),
      JSON.stringify({ mode, parameterId: selectedParameterId, parameterName: newName, settings, iconName, ...extra })
    );
  };

  const handleSave = async () => {
    setSaveError(null);

    if (mode === "existing") {
      if (!selectedParameterId) {
        setSaveError("Pick an existing parameter set first.");
        return;
      }
      persistDraft();
      saveFormSettings({
        id,
        taskTypeId: Number(taskTypeId),
        name: taskName,
        parameterId: Number(selectedParameterId),
        parameterName: existingParams.find((p) => String(p.parameter_id) === String(selectedParameterId))
          ?.parameter_name,
        iconName,
      });
      navigate("/");
      return;
    }

    // mode === "new": create the parameter set in the database first, so
    // Home.js's "Save as Battery" only ever references parameter sets that
    // genuinely exist -- never an unsaved local draft.
    if (!newName.trim()) {
      setSaveError('Give this parameter set a name (e.g. "RAVLT_Spoken_Immediate").');
      return;
    }
    if (Object.keys(settings).length === 0) {
      setSaveError("Add at least one setting before saving.");
      return;
    }
    setSaving(true);
    try {
      const result = await api.createParameter(csrfToken, {
        taskTypeId: Number(taskTypeId),
        parameterName: newName.trim(),
        language: "EN",
        parameters: settings,
      });
      persistDraft();
      saveFormSettings({
        id,
        taskTypeId: Number(taskTypeId),
        name: taskName,
        parameterId: result.parameter_id,
        parameterName: result.parameter_name,
        iconName,
      });
      navigate("/");
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    const key = window.prompt("New setting name (e.g. RecallDuration):");
    if (!key) return;
    if (key in settings) {
      window.alert(`"${key}" already exists.`);
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: "" }));
  };

  const renderFormFields = () => {
    return Object.entries(settings).map(([key, value]) => (
      <div key={key} style={{ marginBottom: "10px" }}>
        {typeof value === "boolean" ? (
          <label>
            {key}:
            <select
              value={value ? "true" : "false"}
              disabled={mode === "existing"}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        ) : Array.isArray(value) ? (
          <label>
            {key}: <input type="text" value={JSON.stringify(value)} readOnly />
          </label>
        ) : typeof value === "object" && value !== null ? (
          <label>
            {key}: <input type="text" value={JSON.stringify(value)} readOnly />
          </label>
        ) : (
          <label>
            {key}:
            <input
              type={typeof value === "number" ? "number" : "text"}
              value={value ?? ""}
              disabled={mode === "existing"}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          </label>
        )}
      </div>
    ));
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (loadError) return <p style={{ padding: "20px", color: "red" }}>{loadError}</p>;

  return (
    <div className="form-settings" style={{ padding: "20px" }}>
      <h2>{taskName}</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>
          <input
            type="radio"
            checked={mode === "new"}
            onChange={() => setMode("new")}
          />{" "}
          Create a new parameter set
        </label>
        <br />
        <label>
          <input
            type="radio"
            checked={mode === "existing"}
            onChange={() => setMode("existing")}
            disabled={existingParams.length === 0}
          />{" "}
          Use an existing parameter set{" "}
          {existingParams.length === 0 && "(none exist yet for this task type)"}
        </label>
      </div>

      {mode === "existing" && (
        <div style={{ marginBottom: "15px" }}>
          <select value={selectedParameterId} onChange={(e) => handleSelectExisting(e.target.value)}>
            <option value="">-- choose one --</option>
            {existingParams.map((p) => (
              <option key={p.parameter_id} value={p.parameter_id}>
                {p.parameter_name} ({p.language})
              </option>
            ))}
          </select>
          <p style={{ fontSize: "0.85em", color: "#666" }}>
            Existing parameter sets are shown read-only -- there is no edit endpoint yet
            (changing one could break other batteries that already reference it).
          </p>
        </div>
      )}

      {mode === "new" && (
        <div style={{ marginBottom: "15px" }}>
          <label>
            New parameter set name:
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. RAVLT_Spoken_New"
              style={{ marginLeft: "8px" }}
            />
          </label>
          <button type="button" onClick={addField} style={{ marginLeft: "10px" }}>
            + Add setting
          </button>
        </div>
      )}

      {renderFormFields()}

      <div style={{ margin: "15px 0" }}>
        <label>
          Display label (optional, e.g. "Immediate"):
          <input type="text" value={iconName} onChange={(e) => setIconName(e.target.value)} style={{ marginLeft: "8px" }} />
        </label>
      </div>

      {saveError && <p style={{ color: "red" }}>{saveError}</p>}

      <button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default FormSettings;
