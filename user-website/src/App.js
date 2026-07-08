import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./Home";
import FormSettings from "./FormSettings";
import Login from "./Login";
import { AuthProvider, useAuth } from "./AuthContext";
import "./App.css";

/** Redirects to /login unless a valid admin session is confirmed. */
function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === "checking") {
    return <p style={{ padding: "20px" }}>Checking login status...</p>;
  }
  if (status === "loggedOut") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
          </RequireAuth>
        }
      />
      {/* :taskTypeId is the numeric task_types.task_type_id from the database;
          :id is a per-selection uuid, so the same task type can be added to a
          battery more than once (e.g. two Digit Span variants). */}
      <Route
        path="/settings/:taskTypeId/:id"
        element={
          <RequireAuth>
            <FormSettings saveFormSettings={saveFormSettings} />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
