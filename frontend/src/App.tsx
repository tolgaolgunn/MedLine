import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import LandingPage from "./components/LandingPage";
import { HealthAuthForm } from "./components/HealthAuthForm";
import { Dashboard } from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Toast için stil

function App(): React.ReactElement {
  return (
    <ThemeProvider defaultTheme="system" storageKey="medicare-ui-theme">
      <Router>
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />    
            <Route path="/login" element={<HealthAuthForm />} />    
            <Route path="/register" element={<HealthAuthForm />} /> 
            <Route path="/forgot-password" element={<HealthAuthForm />} />
            <Route path="/reset-password" element={<HealthAuthForm />} />
            <Route path="/reset-success" element={<HealthAuthForm />} />

            {/* Korumalı kullanıcı sayfası */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>

          <ToastContainer position="top-right" autoClose={3000} />
        </>
      </Router>
    </ThemeProvider>
  );
}

export default App;
