import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const token = localStorage.getItem("token");

  let user: any = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const path = location.pathname;

  if (path === "/dashboard") {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "doctor") return <Navigate to="/doctor/dashboard" replace />;
  }

  if (path.startsWith("/doctor") && user.role !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (path.startsWith("/admin") && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
