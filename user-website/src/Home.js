import React,  { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
// import FormSettings from "./FormSettings"

//Images
import MultiChoice from "./assets/Icons/MultiChoice.png"
import StroopColor from "./assets/Icons/StroopColor.png"
import StroopWord from "./assets/Icons/StroopWord.png"
import StroopColorWord from "./assets/Icons/StroopColorWord.png"
import WordRecall from "./assets/Icons/WordRecall.png"
import WordRecog from "./assets/Icons/WordRecog.png"
import YesNo from "./assets/Icons/YesNo.png"
import Cancellation from "./assets/Icons/Cancellation.png"
import CardSort from "./assets/Icons/CardSort.png"
import ClockDrawing from "./assets/Icons/ClockDrawing.png"
import Fluency from "./assets/Icons/Fluency.png"
import SerialSubtraction from "./assets/Icons/SerialSubtraction.png"
import ShapeCopy from "./assets/Icons/ShapeCopy.png"
import SpatialDMS from "./assets/Icons/SpatialDMS.png"
import VerbalDMS from "./assets/Icons/VerbalDMS.png"
import TrailMaking from "./assets/Icons/TrailMaking.png"
import MatrixReasoning from "./assets/Icons/MatrixReasoning.png"
import DigitSpan from "./assets/Icons/DigitSpan.png"
import PatternComparison from "./assets/Icons/PatternComparison.png"





function Home({ selectedItems, setSelectedItems }) {
  const navigate = useNavigate();


  //Adds images to the forms. Also changes the name under the images
  const forms = [
    { name: "Intake Form", imgSrc: MultiChoice },
    { name: "Color", imgSrc: StroopColor },
    { name: "Word", imgSrc: StroopWord },
    { name: "ColorWord", imgSrc: StroopColorWord },
    { name: "RAVLT, imm (Spoken)", imgSrc: WordRecall },
    { name: "RAVLT, Recog", imgSrc: WordRecog },
    { name: "Card Sort", imgSrc: CardSort },
    { name: "Pattern comparison", imgSrc: PatternComparison },
    { name: "Cancellation", imgSrc: Cancellation },
    { name: "Cube copy", imgSrc: ShapeCopy },
    { name: "Cube draw", imgSrc: ClockDrawing },
    { name: "Matrix reas", imgSrc: MatrixReasoning },
    { name: "DS, Forward", imgSrc: DigitSpan },
    { name: "DS, Backwards", imgSrc: DigitSpan },
    { name: "Trails A", imgSrc: TrailMaking },
    { name: "Trails B", imgSrc: TrailMaking },
    { name: "Subtract", imgSrc: SerialSubtraction },
    { name: "Fluency, Animals", imgSrc: YesNo },
    { name: "Verbal DMS", imgSrc: VerbalDMS },
    { name: "Spatial DMS", imgSrc: SpatialDMS },
    { name: "Questionnaire", imgSrc: MultiChoice }
  ];

  // Function to get the image from a forms name
  function getImageSource(formName) {
    const formImages = {
      "Intake Form": MultiChoice,
      "Color": StroopColor,
      "Word": StroopWord,
      "Color/Word": StroopColorWord,
      "RAVLT, imm (Spoken)": WordRecall,
      "RAVLT, Recog": WordRecog,
      "Card Sort": CardSort,
      "Pattern comparison": PatternComparison,
      "Cancellation": Cancellation,
      "Cube copy": ShapeCopy,
      "Cube draw": ClockDrawing,
      "Matrix reas": MatrixReasoning,
      "DS, Forward": DigitSpan,
      "DS, Backwards": DigitSpan,
      "Trails A": TrailMaking,
      "Trails B": TrailMaking,
      "Subtract": SerialSubtraction,
      "Fluency, Animals": YesNo,
      "Verbal DMS": VerbalDMS,
      "Spatial DMS": SpatialDMS,
      "Questionnaire": MultiChoice,
    };
  
    return formImages[formName]
  }


  //Handles clicking a form and going to a new page
  const handleFormClick = (formName) => {
    const uniqueId = uuidv4();  // Generate a unique ID for each form instance
    navigate(`/settings/${formName}/${uniqueId}`);
  };

  // Handles when removing an added/edited form.
  const handleRemove = (id) => {
    const updatedItems = selectedItems.filter(item => item.id !== id);
    setSelectedItems(updatedItems);
  };


  //Adds the battery to the battery.json, meaning it saves the forms and 
  //all their edited parameters etc.
  const saveAsBattery = () => {
    const batteryData = {
      batteryName,
      description,
      BatteryInstructions,
      Language,
      RunAudioTest,
      Footer,
      forms: selectedItems.map((item) => {
        const savedSettings =
          JSON.parse(localStorage.getItem(`${item.name}-${item.id}`)) || {};
        return {
          id: item.id,
          name: item.name,
          settings: savedSettings,
        };
      }),
    };

    const jsonString = JSON.stringify(batteryData, null, 2); // Pretty print JSON
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "battery.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global battery variables
  const [batteryName, setBatteryName] = useState("The 3C Platform");
  const [description, setDescription] = useState("The 3C Platform");
  const [BatteryInstructions, setBatteryInstructions] = useState("The 3C Platform");
  const [Language, setLanguage] = useState("EN");
  const [RunAudioTest, setRunAudioTest] = useState(true);
  const [Footer, setFooter] = useState("©NCM Lab 2023");    


//The following sets up the buttons and looks
  return (
    <div className="app-container">
      <div className="selected-list">
        {/* Displayes the forms you've selected/edited */}
        <h2>Selected Forms</h2>
        <div className="selected-items">
          {selectedItems.map((item, index) => (
            <div className="selected-item" key={index}>
              <img src={getImageSource(item.name)} alt="" />
              <span>{item.name}</span>
              {/* Edit button to go back to the settings page */}
              <button onClick={() => navigate(`/settings/${item.name}/${item.id}`)}>Edit</button>
                {/* Remove button */}
              <button onClick={() => handleRemove(item.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Displays all the global variables to be able to edit them */}
      <div style={{ marginTop: "10px" }}>
      <label>
        {"Battery name"}:
        <input
          type="text"
          name="Battery name"
          value={batteryName}
          onChange={(e) => setBatteryName(e.target.value)}
        />
      </label>

      <label>
        {" Battery Description"}:
        <input
          type="text"
          name="Battery Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label>
        {" BatteryInstructions"}:
        <input
          type="text"
          name="BatteryInstructions"
          value={BatteryInstructions || ""}
          onChange={(e) => setBatteryInstructions(e.target.value)}
        />
      </label>

      <label>
        {" Footer"}:
        <input
          type="text"
          name="Footer"
          value={Footer}
          onChange={(e) => setFooter(e.target.value)}
        />
      </label>
        
        {/* Can change to a dropdown with the options.
        Need list of the options */}
      <label>
        {" Language"}:
        <select
          type="text"
          name="Language"
        >
          <option value="EN">EN</option>
          onChange={(e) => setLanguage(e.target.value)}
        </select>
      </label>

      <label>
        {" RunAudioTest"}:
        <select
          type="text"
          name="RunAudioTest"
          >  
          <option value="true">True</option>
          <option value="false">False</option> 
          onChange={(e) => setRunAudioTest(e.target.value)}   
        </select>
        
      </label>
      </div>
      {/* Save battery button to add the abttery to the battery.json */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={saveAsBattery}>Save as Battery</button>
      </div>
      
      <div className="available-forms">
        <h2>Select Forms</h2>
        <div className="forms-grid">
          {/* Displays all the forms */}
          {forms.map((form, index) => (
            <div className="form-item" key={index} onClick={() => handleFormClick(form.name)}>
              <img src={form.imgSrc} alt={form.name} />
              <p>{form.name}</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

export default Home;
