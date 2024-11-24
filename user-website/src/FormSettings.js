import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { StroopWord_Default } from "./configFiles/StroopWord_Setup";
import { StroopColorWord_Default } from "./configFiles/StroopColorWord_Setup";
import { StroopColor_Default } from "./configFiles/StroopColor_Setup";
import { IntakeForm } from "./configFiles/IntakeForm_Setup";
import { PatternComparison_Default } from "./configFiles/PatternComparison_Setup";
import { Cancellation_Default } from "./configFiles/Cancellation_Setup";
import { MatrixReasoning_Default } from "./configFiles/MatrixReasoning_Setup";
import { TrailMakingA_Default, TrailMakingB_Default } from "./configFiles/TrailMaking_Setup";
import { SerialSubtract_Default } from "./configFiles/SerialSubtraction_Setup";
import { vDMS_Default } from "./configFiles/vDMS_setup";
import { SpatialDMS_Default } from "./configFiles/SpatialDMS_setup";
import { RAVLT_Default, Questionnaire_default } from "./configFiles/WordRecall_Setup";
import { WordRecog_Default } from "./configFiles/WordRecog_Setup";
import { ImageCopy_Default } from "./configFiles/ImageCopy_Setup";

function FormSettings({ saveFormSettings }) {
  const { formName, id } = useParams();
  const navigate = useNavigate();

  const getDefaultConfig = (formName) => {
    switch (formName) {
      case "Word":
        return StroopWord_Default;
      case "Color":
        return StroopColor_Default;
      case "ColorWord":
        return StroopColorWord_Default;
      case "Intake Form":
        return IntakeForm;
      case "RAVLT, imm (Spoken)":
        return RAVLT_Default;
      case "RAVLT, Recog":
        return WordRecog_Default;
      case "Pattern comparison":
        return PatternComparison_Default;
      case "Cancellation":
        return Cancellation_Default;
      case "Subtract":
        return SerialSubtract_Default;
      case "Verbal DMS":
        return vDMS_Default;
      case "Spatial DMS":
        return SpatialDMS_Default;
      case "Questionnaire":
        return Questionnaire_default;
      default:
        return {};
    }
  };

  const defaultSettings = getDefaultConfig(formName);
  const savedSettings = JSON.parse(localStorage.getItem(`${formName}-${id}`)) || {};
  const initialData = { id, name: formName, settings: { ...defaultSettings, ...savedSettings } };

  const [formData, setFormData] = useState(initialData);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      settings: {
        ...prevFormData.settings,
        [name]: Array.isArray(prevFormData.settings[name]) ? value : value === "true" ? true : value === "false" ? false : value,
      },
    }));
  };

  const handleSave = () => {
    localStorage.setItem(`${formName}-${id}`, JSON.stringify(formData.settings));
    saveFormSettings(formData);
    navigate("/");
  };

  const renderFormFields = () => {
    return Object.entries(formData.settings).map(([key, value]) => (
      <div key={key} style={{ marginBottom: "10px" }}>
        {typeof value === "boolean" ? (
          <label>
            {key}:
            <select
              name={key}
              value={formData.settings[key] ? "true" : "false"}
              onChange={(e) =>
                handleChange({
                  target: { name: key, value: e.target.value },
                })
              }
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        ) : typeof value === "number" ? (
          <label>
            {key}:
            <input
              type="number"
              name={key}
              value={formData.settings[key]}
              onChange={handleChange}
            />
          </label>
        ) : Array.isArray(defaultSettings[key]) ? (
          <label>
            {key}:
            <select
              name={key}
              value={formData.settings[key]}
              onChange={(e) =>
                handleChange({
                  target: { name: key, value: e.target.value },
                })
              }
            >
              {defaultSettings[key].map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            {key}:
            <input
              type="text"
              name={key}
              value={formData.settings[key] || ""}
              onChange={handleChange}
            />
          </label>
        )}
        <br />
      </div>
    ));
  };

  return (
    <div className="form-settings">
      <h2>{formName} Settings</h2>
      {renderFormFields()}
      <br />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}

export default FormSettings;
