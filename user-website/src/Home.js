import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import * as api from "./api";
import { iconForTaskType } from "./iconMap";
import { useAuth } from "./AuthContext";
import { emptyDraft } from "./draft";
import { parseList } from "./library/copyName";

function Home({ draft, setDraft }) {
  const navigate = useNavigate();
  const { csrfToken } = useAuth();
  const { header, items, sourceBattery } = draft;

  const [taskTypes, setTaskTypes] = useState([]);
  const [batteries, setBatteries] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deactivateOriginal, setDeactivateOriginal] = useState(false);

  useEffect(() => {
    Promise.all([api.listTaskTypes(), api.listBatteries()])
      .then(([t, b]) => {
        setTaskTypes(t);
        setBatteries(b);
      })
      .catch((err) => setLoadError(err.message));
  }, [saveResult]);

  const taskTypeById = (id) => taskTypes.find((t) => t.task_type_id === id);
  const nextFreeIndex = batteries.reduce((max, b) => Math.max(max, b.battery_index), 0) + 1;
  const indexTaken = batteries.some((b) => String(b.battery_index) === String(header.battery_index).trim());

  const setHeader = (key, value) => setDraft((d) => ({ ...d, header: { ...d.header, [key]: value } }));
  const setItems = (newItems) => setDraft((d) => ({ ...d, items: newItems }));

  const handleFormClick = (taskTypeId) => {
    const uniqueId = uuidv4(); // lets the same task type be added to a battery more than once
    navigate(`/settings/${taskTypeId}/${uniqueId}`);
  };

  const handleRemove = (id) => setItems(items.filter((item) => item.id !== id));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setItems(copy);
  };

  const startOver = () => {
    if (items.length > 0 && !window.confirm("Clear the battery currently in the builder?")) return;
    setDraft(emptyDraft());
    setSaveResult(null);
    setSaveError(null);
  };

  const saveAsBattery = async () => {
    setSaveError(null);
    setSaveResult(null);

    const batteryIndex = String(header.battery_index).trim();
    if (!/^\d+$/.test(batteryIndex) || Number(batteryIndex) === 0) {
      setSaveError('"Battery index" must be a positive whole number.');
      return;
    }
    if (indexTaken) {
      setSaveError(`Battery index ${batteryIndex} is already used. Next free index: ${nextFreeIndex}.`);
      return;
    }
    if (items.length === 0) {
      setSaveError("Add at least one form to the battery first.");
      return;
    }
    if (items.some((item) => !item.parameterId)) {
      setSaveError(
        "Every selected form must have a saved parameter set (open it and click Save) before the battery can be created."
      );
      return;
    }

    setSaving(true);
    try {
      const result = await api.createBattery(csrfToken, {
        battery_index: Number(batteryIndex),
        battery_name: header.battery_name,
        description: header.description,
        battery_instructions: header.battery_instructions,
        language: header.language,
        run_audio_test: header.run_audio_test,
        footer: header.footer,
        short_name: header.short_name || null,
        header_buttons: parseList(header.header_buttons),
        languages_to_show: parseList(header.languages_to_show),
        redirect_url: header.redirect_url || null,
        tasks: items.map((item) => ({
          task_type_id: item.taskTypeId,
          parameter_id: item.parameterId,
          instruction_id: item.instructionId || null,
          icon_name: item.iconName || item.parameterName,
        })),
      });
      let note = "";
      if (sourceBattery && deactivateOriginal) {
        try {
          await api.setBatteryActive(csrfToken, sourceBattery.battery_id, false);
          note = ` Original battery index ${sourceBattery.battery_index} deactivated.`;
        } catch (err) {
          note = ` The new battery was saved, but deactivating index ${sourceBattery.battery_index} failed: ${err.message}`;
        }
      }
      setSaveResult({ ...result, note });
      // The builder now holds a saved battery; any further changes become a copy of it.
      setDraft((d) => ({
        ...d,
        sourceBattery: { battery_id: result.battery_id, battery_index: result.battery_index },
        header: { ...d.header, battery_index: "" },
      }));
      setDeactivateOriginal(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const textField = (key, label) => (
    <label>
      {label}
      <input type="text" value={header[key] ?? ""} onChange={(e) => setHeader(key, e.target.value)} />
    </label>
  );

  return (
    <div className="app-container">
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>
          {sourceBattery ? `Copy of battery index ${sourceBattery.battery_index}` : "New battery"}
        </h2>
        <span className="nav-spacer" />
        <button onClick={startOver}>Start a new battery</button>
      </div>
      {sourceBattery && (
        <p className="hint">
          Saving creates a <b>new</b> battery; index {sourceBattery.battery_index} is not changed.
        </p>
      )}

      <div className="selected-list">
        <h3>Selected forms (in run order)</h3>
        {loadError && <p className="error-text">{loadError}</p>}
        <div className="selected-items vertical">
          {items.map((item, i) => {
            const tt = taskTypeById(item.taskTypeId);
            return (
              <div className="selected-item" key={item.id}>
                <span className="order">{i + 1}.</span>
                <img src={iconForTaskType(tt?.icon_file)} alt="" />
                <span className="item-text">
                  <b>{item.name}</b>
                  {item.iconName ? ` "${item.iconName}"` : ""}
                  <br />
                  Parameters: {item.parameterName || <i>not saved yet</i>}
                  {" · "}Instructions:{" "}
                  {item.instructionName ? `${item.instructionName} (${item.instructionLanguage})` : <i>none</i>}
                </span>
                <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up">
                  ↑
                </button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">
                  ↓
                </button>
                <button onClick={() => navigate(`/settings/${item.taskTypeId}/${item.id}`)}>Edit</button>
                <button onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            );
          })}
          {items.length === 0 && <p className="hint">Click a form below to add it.</p>}
        </div>
      </div>

      <div className="form-grid">
        <label>
          Battery index (unique number)
          <input
            type="text"
            value={header.battery_index}
            onChange={(e) => setHeader("battery_index", e.target.value)}
            placeholder={`next free: ${nextFreeIndex}`}
          />
          {indexTaken && <span className="error-text">Already used</span>}
        </label>
        {textField("battery_name", "Battery name")}
        {textField("description", "Description")}
        {textField("battery_instructions", "Battery instructions")}
        {textField("footer", "Footer")}
        {textField("short_name", "Short name")}
        {textField("header_buttons", "Header buttons (comma-separated)")}
        {textField("languages_to_show", "Languages to show (comma-separated)")}
        {textField("redirect_url", "Redirect URL")}
        <label>
          Language
          <select value={header.language} onChange={(e) => setHeader("language", e.target.value)}>
            <option value="EN">EN</option>
            <option value="FR">FR</option>
            <option value="KR">KR</option>
          </select>
        </label>
        <label>
          Run audio test
          <select
            value={header.run_audio_test ? "true" : "false"}
            onChange={(e) => setHeader("run_audio_test", e.target.value === "true")}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        {sourceBattery && (
          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={deactivateOriginal}
              onChange={(e) => setDeactivateOriginal(e.target.checked)}
            />{" "}
            After saving, deactivate the original (index {sourceBattery.battery_index})
          </label>
        )}
        <button className="primary" onClick={saveAsBattery} disabled={saving}>
          {saving ? "Saving..." : "Save as new battery"}
        </button>
        {saveError && <p className="error-text">{saveError}</p>}
        {saveResult && (
          <p className="ok-text">
            Saved battery index {saveResult.battery_index} with {saveResult.task_count} task(s).{saveResult.note}
          </p>
        )}
      </div>

      <div className="available-forms">
        <h3>Add a form</h3>
        <div className="forms-grid">
          {taskTypes.map((tt) => (
            <div className="form-item" key={tt.task_type_id} onClick={() => handleFormClick(tt.task_type_id)}>
              <img src={iconForTaskType(tt.icon_file)} alt={tt.task_name} />
              <p>{tt.task_name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
