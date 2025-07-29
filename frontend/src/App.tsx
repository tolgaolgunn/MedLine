import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import LandingPage from "./components/LandingPage";
import { HealthAuthForm } from "./components/HealthAuthForm";
import { Dashboard } from "./components/Dashboard";
import { DoctorDashboard, DoctorAppointments, PatientManagement, DoctorPrescription } from "./components/doctor";
import { Feedback } from "./components/feedback";
import { Profile } from "./components/Profile";
import DoctorReports from "./components/DoctorReports";
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
            
            {/* Doktor Dashboard */}
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Doktor Sayfaları */}
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute>
                  <DoctorAppointments />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute>
                  <PatientManagement />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute>
                  <DoctorPrescription />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/reports"
              element={
                <ProtectedRoute>
                  <DoctorReports />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/feedback"
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute>
                  <Profile />
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