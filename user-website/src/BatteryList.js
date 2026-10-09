import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as api from "./api";
import { useAuth } from "./AuthContext";
import { draftFromBattery } from "./draft";

/** Lists every battery, with copy-on-edit, activate/deactivate and delete actions. */
function BatteryList({ draft, setDraft }) {
  const navigate = useNavigate();
  const { csrfToken } = useAuth();
  const [rows, setRows] = useState([]);
  const [showInactive, setShowInactive] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    api
      .listBatteries()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = async (row) => {
    if (draft.items.length > 0 && !window.confirm("Replace the battery currently in the builder?")) return;
    setError(null);
    try {
      const record = await api.getRecord("battery", row.battery_id);
      setDraft(draftFromBattery(record));
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggle = (row) => {
    if (row.active && !window.confirm(`Deactivate battery index ${row.battery_index}? JATOS links using it will stop loading it.`)) {
      return;
    }
    run(() => api.setBatteryActive(csrfToken, row.battery_id, !row.active));
  };

  const handleDelete = (row) => {
    if (!window.confirm(`Permanently delete battery index ${row.battery_index} ("${row.battery_name}")?`)) return;
    run(() => api.deleteRecord(csrfToken, "battery", row.battery_id));
  };

  const visible = rows.filter((r) => showInactive || r.active);

  return (
    <div className="app-container">
      <h2>Batteries</h2>
      <p className="hint">
        Batteries are never changed in place. <b>Edit as copy</b> loads a battery into the builder; saving it
        creates a new battery index, and you can choose to deactivate the original. A battery must be
        deactivated before it can be deleted.
      </p>
      {error && <p className="error-text">{error}</p>}
      <div className="toolbar">
        <label>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show
          inactive
        </label>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>Name</th>
              <th>Description</th>
              <th>Lang</th>
              <th>Tasks</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.battery_id} className={r.active ? "" : "inactive"}>
                <td>{r.battery_index}</td>
                <td>{r.battery_name}</td>
                <td>{r.description}</td>
                <td>{r.language}</td>
                <td>{r.task_count}</td>
                <td>{r.active ? "Active" : "Inactive"}</td>
                <td className="row-actions">
                  <Link className="button" to={`/batteries/${r.battery_id}`}>
                    View
                  </Link>
                  <button onClick={() => handleCopy(r)}>Edit as copy</button>
                  <button onClick={() => handleToggle(r)}>{r.active ? "Deactivate" : "Activate"}</button>
                  <button
                    className="danger"
                    onClick={() => handleDelete(r)}
                    disabled={!!r.active}
                    title={r.active ? "Deactivate first" : ""}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7}>No batteries.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default BatteryList;
