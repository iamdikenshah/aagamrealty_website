// =============================================================================
// ADMIN APP — lazy-loaded entry point mounted at /admin/*
// =============================================================================
// This is the ONLY module tree that imports react-router-dom, firebase/auth and
// firebase/storage, so all of that ships in the code-split admin chunk and is
// never downloaded by public visitors (App.jsx lazy-imports this file behind a
// path.startsWith("/admin") guard).
//
// The whole admin surface is single-admin: there is no signup/registration UI.
// =============================================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "./AdminLayout";
import AdminLogin from "./AdminLogin";
import Dashboard from "./pages/Dashboard";
import PropertiesManager from "./pages/PropertiesManager";
import TestimonialsManager from "./pages/TestimonialsManager";
import EnquiriesInbox from "./pages/EnquiriesInbox";
import ListsManager from "./pages/ListsManager";
import FaqsManager from "./pages/FaqsManager";
import Settings from "./pages/Settings";
import "./admin.css";

export default function AdminApp() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<PropertiesManager />} />
          <Route path="testimonials" element={<TestimonialsManager />} />
          <Route path="enquiries" element={<EnquiriesInbox />} />
          <Route path="lists" element={<ListsManager />} />
          <Route path="faqs" element={<FaqsManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Unknown admin path → dashboard (which itself bounces to login if needed). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
