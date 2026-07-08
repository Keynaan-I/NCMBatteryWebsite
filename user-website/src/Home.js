import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import * as api from "./api";
import { iconForTaskType } from "./iconMap";
import { useAuth } from "./AuthContext";

function Home({ selectedItems, setSelectedItems }) {
  const navigate = useNavigate();
  const { username, csrfToken, logout } = useAuth();

  const [taskTypes, setTaskTypes] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .listTaskTypes()
      .then(setTaskTypes)
      .catch((err) => setLoadError(err.message));
  }, []);

  const taskTypeById = (id) => taskTypes.find((t) => t.task_type_id === id);

  const handleFormClick = (taskTypeId) => {
    const uniqueId = uuidv4(); // lets the same task type be added to a battery more than once
    navigate(`/settings/${taskTypeId}/${uniqueId}`);
  };

  const handleRemove = (id) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== id));
  };

  // Global battery variables
  const [batteryIndex, setBatteryIndex] = useState("");
  const [batteryName, setBatteryName] = useState("The 3C Platform");
  const [description, setDescription] = useState("The 3C Platform");
  const [batteryInstructions, setBatteryInstructions] = useState("The 3C Platform");
  const [language, setLanguage] = useState("EN");
  const [runAudioTest, setRunAudioTest] = useState(true);
  const [footer, setFooter] = useState("©NCM Lab 2023");

  const saveAsBattery = async () => {
    setSaveError(null);
    setSaveResult(null);

    if (!batteryIndex || !/^\d+$/.test(String(batteryIndex))) {
      setSaveError('"Battery index" must be a whole number, and must not already be in use.');
      return;
    }
    if (selectedItems.length === 0) {
      setSaveError("Add at least one form to the battery first.");
      return;
    }
    if (selectedItems.some((item) => !item.parameterId)) {
      setSaveError(
        "Every selected form must have a saved parameter set (open it and click Save) before the battery can be created."
      );
      return;
    }

    setSaving(true);
    try {
      const result = await api.createBattery(csrfToken, {
        battery_index: Number(batteryIndex),
        battery_name: batteryName,
        description,
        battery_instructions: batteryInstructions,
        language,
        run_audio_test: runAudioTest,
        footer,
        tasks: selectedItems.map((item) => ({
          task_type_id: item.taskTypeId,
          parameter_id: item.parameterId,
          instruction_id: item.instructionId || null,
          icon_name: item.iconName || item.parameterName,
        })),
      });
      setSaveResult(result);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Signed in as {username}</span>
        <button onClick={logout}>Log out</button>
      </div>

      <div className="selected-list">
        <h2>Selected Forms</h2>
        {loadError && <p style={{ color: "red" }}>{loadError}</p>}
        <div className="selected-items">
          {selectedItems.map((item) => {
            const tt = taskTypeById(item.taskTypeId);
            return (
              <div className="selected-item" key={item.id}>
                <img src={iconForTaskType(tt?.icon_file)} alt="" />
                <span>
                  {item.name}
                  {item.parameterName ? ` — ${item.parameterName}` : " (not saved yet)"}
                </span>
                <button onClick={() => navigate(`/settings/${item.taskTypeId}/${item.id}`)}>Edit</button>
                <button onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>
          {"Battery index (unique number)"}:
          <input type="text" value={batteryIndex} onChange={(e) => setBatteryIndex(e.target.value)} />
        </label>

        <label>
          {" Battery name"}:
          <input type="text" value={batteryName} onChange={(e) => setBatteryName(e.target.value)} />
        </label>

        <label>
          {" Battery Description"}:
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          {" Battery Instructions"}:
          <input
            type="text"
            value={batteryInstructions || ""}
            onChange={(e) => setBatteryInstructions(e.target.value)}
          />
        </label>

        <label>
          {" Footer"}:
          <input type="text" value={footer} onChange={(e) => setFooter(e.target.value)} />
        </label>

        <label>
          {" Language"}:
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="EN">EN</option>
            <option value="FR">FR</option>
            <option value="KR">KR</option>
          </select>
        </label>

        <label>
          {" RunAudioTest"}:
          <select value={runAudioTest ? "true" : "false"} onChange={(e) => setRunAudioTest(e.target.value === "true")}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        <button onClick={saveAsBattery} disabled={saving}>
          {saving ? "Saving..." : "Save as Battery"}
        </button>
        {saveError && <p style={{ color: "red" }}>{saveError}</p>}
        {saveResult && (
          <p style={{ color: "green" }}>
            Saved battery_index {saveResult.battery_index} with {saveResult.task_count} task(s).
          </p>
        )}
      </div>

      <div className="available-forms">
        <h2>Select Forms</h2>
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
