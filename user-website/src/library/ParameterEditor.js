import React, { useEffect, useState } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import { getDefaultFormState } from "@rjsf/utils";
import JsonEditor from "./JsonEditor";

/**
 * Edits a parameter set as a generated form -- Yes/No radios, pull-downs, number boxes --
 * when the task type has a parameter schema (task_types.parameter_schema, built from
 * NCMBattery's MySQL/ConfigurationDatabase/schemas/), with a toggle to the raw JSON editor.
 * Without a schema it is just the JSON editor.
 *
 * The parent owns the JSON *text* (same contract as JsonEditor), so switching between the
 * form and JSON never loses edits.
 */

/** A form field for values the generated form can't describe (objects, nested lists, mixed types). */
function JsonField({ formData, onChange, schema, name, readonly, disabled }) {
  const [text, setText] = useState(() => JSON.stringify(formData ?? null, null, 2));
  const [error, setError] = useState(null);

  // Pick up changes made elsewhere, but don't reformat what the user is typing: only reset
  // when the value no longer matches the text.
  useEffect(() => {
    setText((current) => {
      const same = (() => {
        try {
          return JSON.stringify(JSON.parse(current)) === JSON.stringify(formData ?? null);
        } catch {
          return false;
        }
      })();
      return same ? current : JSON.stringify(formData ?? null, null, 2);
    });
  }, [formData]);

  const handle = (value) => {
    setText(value);
    try {
      onChange(JSON.parse(value));
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-group json-field">
      <label className="control-label">{schema.title || name}</label>
      {schema.description && <p className="field-description">{schema.description}</p>}
      <textarea
        value={text}
        onChange={(e) => handle(e.target.value)}
        readOnly={readonly || disabled}
        rows={Math.min(10, Math.max(2, text.split("\n").length))}
        spellCheck={false}
        className={error ? "invalid" : ""}
      />
      {error && <span className="error-text">Invalid JSON: {error}</span>}
    </div>
  );
}

const FIELDS = { json: JsonField };

function withCatchAllOrder(uiSchema) {
  const order = uiSchema?.["ui:order"];
  if (!order || order.includes("*")) return uiSchema;
  return { ...uiSchema, "ui:order": [...order, "*"] }; // fields the schema doesn't list go last
}

/** Errors for a parameter object against the task's schema; [] when there is no schema. */
export function validateParameters(schemaDef, value) {
  if (!schemaDef) return [];
  return validator.validateFormData(value, schemaDef.schema).errors.map((e) => e.stack);
}

/** A starting parameter object filled with the schema's defaults (for "new from scratch"). */
export function defaultParameters(schemaDef) {
  if (!schemaDef) return {};
  return getDefaultFormState(validator, schemaDef.schema, {});
}

function ParameterEditor({ schemaDef, text, onChange, readOnly = false }) {
  const [view, setView] = useState(schemaDef ? "form" : "json");
  useEffect(() => setView(schemaDef ? "form" : "json"), [schemaDef]);

  if (!schemaDef) return <JsonEditor text={text} onChange={onChange} readOnly={readOnly} rows={readOnly ? 14 : 24} />;

  // The form can show any JSON object, including an empty one (parseJson rejects that).
  let formData = null;
  try {
    const value = JSON.parse(text);
    if (value && typeof value === "object" && !Array.isArray(value)) formData = value;
  } catch {
    // stays null: the JSON view shows the error
  }
  const canShowForm = formData !== null;
  const formView = view === "form" && canShowForm;

  return (
    <div className="parameter-editor">
      <div className="view-toggle">
        <button type="button" className={formView ? "selected" : ""} onClick={() => setView("form")} disabled={!canShowForm}>
          Form
        </button>
        <button type="button" className={!formView ? "selected" : ""} onClick={() => setView("json")}>
          JSON
        </button>
        {!canShowForm && <span className="hint">Fix the JSON to return to the form.</span>}
        {!schemaDef.reviewed && (
          <span className="warn-text">
            Draft form: options are based on values already in use. If a value you need is missing, use the JSON view.
          </span>
        )}
      </div>

      {formView ? (
        <Form
          schema={schemaDef.schema}
          uiSchema={withCatchAllOrder(schemaDef.uiSchema)}
          formData={formData}
          validator={validator}
          fields={FIELDS}
          readonly={readOnly}
          liveValidate
          showErrorList={false}
          onChange={({ formData }) => onChange(JSON.stringify(formData, null, 2))}
        >
          <></>
        </Form>
      ) : (
        <JsonEditor text={text} onChange={onChange} readOnly={readOnly} rows={readOnly ? 14 : 24} />
      )}
    </div>
  );
}

export default ParameterEditor;
