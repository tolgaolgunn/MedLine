import React from "react";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");

    let user: any = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        user = null;
    }

    if (!token || !user || user.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AdminRoute;
