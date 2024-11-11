import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Home from "./Home";
import FormSettings from "./FormSettings";
import './App.css';
import { v4 as uuidv4 } from 'uuid';  // To generate unique IDs

function App() {
  const [selectedItems, setSelectedItems] = useState([]);

  const saveFormSettings = (formData) => {
    const existingItem = selectedItems.find((item) => item.id === formData.id);
    if (existingItem) {
      // Update the form settings
      setSelectedItems(
        selectedItems.map((item) => (item.id === formData.id ? formData : item))
      );
    } else {
      // Add a new form with unique settings
      setSelectedItems([...selectedItems, formData]);
    }
  };

  return (
    <Router>
      <Routes>
        {/* Home page with form selection */}
        <Route path="/" element={<Home selectedItems={selectedItems} setSelectedItems={setSelectedItems} />} />
        {/* Form settings page */}
        <Route
          path="/settings/:formName/:id"
          element={<FormSettings selectedItems={selectedItems} saveFormSettings={saveFormSettings} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
