import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../AuthContext";
import { KINDS } from "./kinds";

/** Lists every parameter or instruction set, with copy-on-edit and delete actions. */
function ConfigLibrary() {
  const { kind } = useParams();
  const cfg = KINDS[kind];
  const location = useLocation();
  const { csrfToken } = useAuth();

  const [rows, setRows] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [taskFilter, setTaskFilter] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!cfg) return;
    setLoading(true);
    Promise.all([cfg.list(), api.listTaskTypes()])
      .then(([r, t]) => {
        setRows(r);
        setTaskTypes(t);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [cfg]);

  useEffect(reload, [reload]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!taskFilter || String(r.task_type_id) === taskFilter) &&
        (!q || r[cfg.nameKey].toLowerCase().includes(q) || r.task_name.toLowerCase().includes(q))
    );
  }, [rows, taskFilter, search, cfg]);

  if (!cfg) return <p className="error-text">Unknown library "{kind}".</p>;

  const handleDelete = async (row) => {
    if (!window.confirm(`Permanently delete ${cfg.label} "${row[cfg.nameKey]}" (${row.task_name}, ${row.language})?`)) {
      return;
    }
    setError(null);
    try {
      await api.deleteRecord(csrfToken, kind, row[cfg.idKey]);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <h2>{cfg.title}</h2>
      <p className="hint">
        Sets are never changed in place. <b>Edit as copy</b> opens a set and saves your changes under a new
        name, so batteries that already use the original are unaffected. A set can only be deleted when no
        battery uses it.
      </p>
      {location.state?.message && <p className="ok-text">{location.state.message}</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="toolbar">
        <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
          <option value="">All task types</option>
          {taskTypes.map((t) => (
            <option key={t.task_type_id} value={t.task_type_id}>
              {t.task_name}
            </option>
          ))}
        </select>
        <input type="search" placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Link className="button" to={`/library/${kind}/new${taskFilter ? `?task_type_id=${taskFilter}` : ""}`}>
          + New {cfg.label}
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Name</th>
              <th>Lang</th>
              <th>Used by</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r[cfg.idKey]}>
                <td>{r.task_name}</td>
                <td>{r[cfg.nameKey]}</td>
                <td>{r.language}</td>
                <td>{r.used_by === 0 ? "—" : `${r.used_by} battery task${r.used_by === 1 ? "" : "s"}`}</td>
                <td>{r.created_at?.slice(0, 10)}</td>
                <td className="row-actions">
                  <Link className="button" to={`/library/${kind}/${r[cfg.idKey]}`}>
                    View
                  </Link>
                  <Link className="button" to={`/library/${kind}/${r[cfg.idKey]}/copy`}>
                    Edit as copy
                  </Link>
                  <button
                    className="danger"
                    onClick={() => handleDelete(r)}
                    disabled={r.used_by > 0}
                    title={r.used_by > 0 ? "In use by a battery; cannot be deleted" : ""}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6}>No {cfg.title.toLowerCase()} match.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ConfigLibrary;
