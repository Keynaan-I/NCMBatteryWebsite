import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "./api";
import { draftFromBattery } from "./draft";
import { iconForTaskType } from "./iconMap";

/** Read-only view of one battery: its settings and ordered task list. */
function BatteryView({ draft, setDraft }) {
  const { batteryId } = useParams();
  const navigate = useNavigate();
  const [battery, setBattery] = useState(null);
  const [error, setError] = useState(null);
  // "<sort_order>-<type>" -> loaded JSON, for the per-task "Show" toggles
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    api
      .getRecord("battery", batteryId)
      .then((b) => !cancelled && setBattery(b))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [batteryId]);

  const toggle = async (sortOrder, type, id) => {
    const key = `${sortOrder}-${type}`;
    if (expanded[key]) {
      setExpanded(({ [key]: _, ...rest }) => rest);
      return;
    }
    try {
      const rec = await api.getRecord(type, id);
      setExpanded((e) => ({ ...e, [key]: type === "parameter" ? rec.parameters : rec.instructions }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = () => {
    if (draft.items.length > 0 && !window.confirm("Replace the battery currently in the builder?")) return;
    setDraft(draftFromBattery(battery));
    navigate("/");
  };

  if (error) return <p className="app-container error-text">{error}</p>;
  if (!battery) return <p className="app-container">Loading...</p>;

  const list = (arr) => (arr && arr.length ? arr.join(", ") : "—");
  const fields = [
    ["Battery index", battery.battery_index],
    ["Status", battery.active ? "Active" : "Inactive"],
    ["Name", battery.battery_name],
    ["Description", battery.description],
    ["Battery instructions", battery.battery_instructions],
    ["Language", battery.language],
    ["Run audio test", battery.run_audio_test ? "Yes" : "No"],
    ["Footer", battery.footer],
    ["Short name", battery.short_name],
    ["Header buttons", list(battery.header_buttons)],
    ["Languages to show", list(battery.languages_to_show)],
    ["Redirect URL", battery.redirect_url],
    ["Created", battery.created_at],
  ];

  const jsonToggle = (sortOrder, type, id, label) => {
    if (!id) return <i>none</i>;
    const key = `${sortOrder}-${type}`;
    return (
      <>
        {label}{" "}
        <button className="link-button" onClick={() => toggle(sortOrder, type, id)}>
          {expanded[key] ? "Hide" : "Show"}
        </button>
      </>
    );
  };

  return (
    <div className="app-container">
      <p>
        <Link to="/batteries">← Batteries</Link>
      </p>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>
          Battery {battery.battery_index}: {battery.battery_name}
        </h2>
        <span className="nav-spacer" />
        <button onClick={handleCopy}>Edit as copy</button>
      </div>

      <table className="data-table details-table">
        <tbody>
          {fields.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value === null || value === undefined || value === "" ? "—" : String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Tasks ({battery.tasks.length})</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Task</th>
            <th>Label</th>
            <th>Parameter set</th>
            <th>Instruction set</th>
          </tr>
        </thead>
        <tbody>
          {battery.tasks.map((t) => {
            const pKey = `${t.sort_order}-parameter`;
            const iKey = `${t.sort_order}-instruction`;
            return (
              <React.Fragment key={t.sort_order}>
                <tr>
                  <td>{t.sort_order}</td>
                  <td className="task-cell">
                    <img src={iconForTaskType(t.icon_file)} alt="" />
                    {t.task_name}
                  </td>
                  <td>{t.icon_name}</td>
                  <td>{jsonToggle(t.sort_order, "parameter", t.parameter_id, t.parameter_name)}</td>
                  <td>
                    {jsonToggle(
                      t.sort_order,
                      "instruction",
                      t.instruction_id,
                      t.instruction_name && `${t.instruction_name} (${t.instruction_language})`
                    )}
                  </td>
                </tr>
                {(expanded[pKey] || expanded[iKey]) && (
                  <tr>
                    <td />
                    <td colSpan={4}>
                      {expanded[pKey] && <pre className="json-view">{JSON.stringify(expanded[pKey], null, 2)}</pre>}
                      {expanded[iKey] && <pre className="json-view">{JSON.stringify(expanded[iKey], null, 2)}</pre>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default BatteryView;
