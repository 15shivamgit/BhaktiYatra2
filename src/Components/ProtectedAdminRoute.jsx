import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return children;
};

export default ProtectedAdminRoute;
