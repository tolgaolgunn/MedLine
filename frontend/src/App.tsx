import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import { HealthAuthForm } from "./components/HealthAuthForm";
import { Dashboard } from "./components/Dashboard";
import { DoctorDashboard, DoctorAppointments, PatientManagement, DoctorPrescription, DoctorLayout, DoctorProfile } from "./components/doctor";
import Feedback from "./components/feedback";
import { Profile } from "./components/Profile";
import DoctorReports from "./components/doctor/DoctorReports";
import { Notifications } from "./components/notifications";
import { Settings } from "./components/Settings";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Toast için stil
import { Toaster } from "react-hot-toast"; // react-hot-toast için
import MedLineChatbot from "./components/MedLineChatbot";



import { NotificationProvider } from "./contexts/NotificationContext";

function App(): React.ReactElement {
  return (
    <Router>
      <NotificationProvider>
        <>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<HealthAuthForm />} />
            <Route path="/register" element={<HealthAuthForm />} />
            <Route path="/forgot-password" element={<HealthAuthForm />} />
            <Route path="/reset-password" element={<HealthAuthForm />} />
            <Route path="/reset-success" element={<HealthAuthForm />} />

            {/* Hasta Dashboard - sadece hasta rolü için */}
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Doktor Layout ve Sayfaları */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute>
                  <DoctorLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="dashboard"
                element={<DoctorDashboard />}
              />
              <Route
                path="appointments"
                element={<DoctorAppointments />}
              />
              <Route
                path="patients"
                element={<PatientManagement />}
              />
              <Route
                path="prescriptions"
                element={<DoctorPrescription />}
              />
              <Route
                path="reports"
                element={<DoctorReports />}
              />
              <Route
                path="feedback"
                element={<Feedback />}
              />
              <Route
                path="profile"
                element={<DoctorProfile />}
              />
              <Route
                path="notifications"
                element={<Notifications />}
              />
              <Route
                path="settings"
                element={<Settings />}
              />
            </Route>

            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <ToastContainer position="top-right" autoClose={3000} />
          <Toaster position="top-right" />

          {/* Chatbot Bileşeni */}
          <MedLineChatbot />
        </>
      </NotificationProvider>
    </Router>
  );
}

export default App;