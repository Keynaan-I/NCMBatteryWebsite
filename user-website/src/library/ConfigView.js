import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api";
import { useAuth } from "../AuthContext";
import { KINDS } from "./kinds";
import ParameterEditor from "./ParameterEditor";

/** Read-only view of one parameter or instruction set, and the batteries that use it. */
function ConfigView() {
  const { kind, id } = useParams();
  const cfg = KINDS[kind];
  const navigate = useNavigate();
  const { csrfToken } = useAuth();
  const [record, setRecord] = useState(null);
  const [schemaDef, setSchemaDef] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cfg) return;
    let cancelled = false;
    Promise.all([api.getRecord(kind, id), kind === "parameter" ? api.listTaskTypes() : []])
      .then(([r, types]) => {
        if (cancelled) return;
        setRecord(r);
        setSchemaDef(types.find((t) => t.task_type_id === r.task_type_id)?.parameter_schema ?? null);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [cfg, kind, id]);

  if (!cfg) return <p className="app-container error-text">Unknown library "{kind}".</p>;
  if (error && !record) return <p className="app-container error-text">{error}</p>;
  if (!record) return <p className="app-container">Loading...</p>;

  const name = record[cfg.nameKey];

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete ${cfg.label} "${name}" (${record.task_name}, ${record.language})?`)) return;
    setError(null);
    try {
      await api.deleteRecord(csrfToken, kind, record[cfg.idKey]);
      navigate(`/library/${kind}`, { state: { message: `Deleted ${cfg.label} "${name}".` } });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container">
      <p>
        <Link to={`/library/${kind}`}>← {cfg.title}</Link>
      </p>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>{name}</h2>
        <span className="nav-spacer" />
        <Link className="button" to={`/library/${kind}/${record[cfg.idKey]}/copy`}>
          Edit as copy
        </Link>
        <button
          className="danger"
          onClick={handleDelete}
          disabled={record.used_by.length > 0}
          title={record.used_by.length > 0 ? "In use by a battery; cannot be deleted" : ""}
        >
          Delete
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}

      <table className="data-table details-table">
        <tbody>
          <tr>
            <th>Task</th>
            <td>{record.task_name}</td>
          </tr>
          <tr>
            <th>Language</th>
            <td>{record.language}</td>
          </tr>
          <tr>
            <th>Created</th>
            <td>{record.created_at}</td>
          </tr>
          <tr>
            <th>Used by</th>
            <td>
              {record.used_by.length === 0
                ? "No batteries"
                : record.used_by.map((b, i) => (
                    <React.Fragment key={b.battery_id}>
                      {i > 0 && ", "}
                      <Link to={`/batteries/${b.battery_id}`}>
                        {b.battery_index} ({b.battery_name}){b.active ? "" : " — inactive"}
                      </Link>
                    </React.Fragment>
                  ))}
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Contents</h3>
      {kind === "parameter" ? (
        <ParameterEditor
          schemaDef={schemaDef}
          text={JSON.stringify(record[cfg.bodyKey], null, 2)}
          onChange={() => {}}
          readOnly
        />
      ) : (
        <pre className="json-view json-view-full">{JSON.stringify(record[cfg.bodyKey], null, 2)}</pre>
      )}
    </div>
  );
}

export default ConfigView;
