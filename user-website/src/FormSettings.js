import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { StroopWord_Default } from "./configFiles/StroopWord_Setup";
import { StroopColorWord_Default } from "./configFiles/StroopColorWord_Setup";
import { StroopColor_Default } from "./configFiles/StroopColor_Setup";
import { IntakeForm } from "./configFiles/IntakeForm_Setup";
import { PatternComparison_Default } from "./configFiles/PatternComparison_Setup";
import { Cancellation_Default } from "./configFiles/Cancellation_Setup";
import { MatrixReasoning_Default } from "./configFiles/MatrixReasoning_Setup";
import { TrailMakingA_Default, TrailMakingB_Default } from "./configFiles/TrailMaking_Setup";
import {SerialSubtract_Default} from "./configFiles/SerialSubtraction_Setup"
import {vDMS_Default} from "./configFiles/vDMS_setup"
import {SpatialDMS_Default} from "./configFiles/SpatialDMS_setup"


function FormSettings({ saveFormSettings }) {
  const { formName, id } = useParams();
  const navigate = useNavigate();


  //Have to make each default variable "export var/const" in the config files, 
  //some variables in config files needed to be commented out because they didnt have the var/const
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
//RAVLT imm and spoken which setup file? word recall and recog files
//Card sort no default      
      case "Pattern comparison":
        return PatternComparison_Default;
      case "Cancellation":
        return Cancellation_Default;
        //Cube draw and copy which setup file? Image copy file
      case "Matrix reas":
        return MatrixReasoning_Default;
// Digital span defualt contains variable with more paramater which causes issues when reading
//TrailsA and B default both have more variables within which makes it harder to read
      case "Subtract":
        return SerialSubtract_Default;
// No YesNo default ignore
      case "Verbal DMS":
        return vDMS_Default;
      case "Spatial DMS":
        return SpatialDMS_Default;
      // "STAI-T" Which? questionnaire form, ignore criteria and variable, Questionnaire dropdown of options, add default in quesstionnare setup
      // "STAI-S" Combine these three into one questionnare button
      // "BDI"  


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
    const fieldType = typeof formData.settings[name];

    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        [name]:
          fieldType === "boolean"
            ? value === "true"
            : fieldType === "number"
            ? parseFloat(value)
            : value,
      },
    });
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
        ) : Array.isArray(value) ? (
          <label>
            {key} (comma-separated values):
            <textarea
              name={key}
              value={formData.settings[key].join(", ")}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: key,
                    value: e.target.value.split(",").map((val) => val.trim()),
                  },
                })
              }
            />
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
