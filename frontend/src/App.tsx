import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import LandingPage from "./components/LandingPage";
import { HealthAuthForm } from "./components/HealthAuthForm";
import { Dashboard } from "./components/Dashboard";
import { Feedback } from "./components/feedback";
import { Profile } from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Toast için stil

// Doktor bileşenleri
import { DoctorDashboard, DoctorAppointments, PatientManagement, DoctorPrescription } from "./components/doctor";
import DoctorReports from "./components/DoctorReports";
import DoctorLayout from "./components/doctor/DoctorLayout";

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
            
            {/* Doktor sayfaları */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <DoctorDashboard />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <DoctorAppointments />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <PatientManagement />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <DoctorPrescription />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/reports"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <DoctorReports />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/feedback"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <Feedback />
                  </DoctorLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute>
                  <DoctorLayout>
                    <Profile />
                  </DoctorLayout>
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