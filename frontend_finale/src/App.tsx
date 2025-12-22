// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserPages/UserProfile";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import UserLayout from "./layout/UserLayout"; 
import { ScrollToTop } from "./components/common/ScrollToTop";

// Admin Dashboard
import DashboardHome from "./pages/Dashboard/Home";
import Employees from "./pages/Dashboard/ManageEmployee/Employees";
import Documents from "./pages/Dashboard/ManageDocuments/Documents";
import AddEmployee from "./pages/Dashboard/ManageEmployee/AddEmployee";
import EditEmployee from "./pages/Dashboard/ManageEmployee/EditEmployee";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";

// User Pages
import UploadDocument from "./pages/UserPages/UploadDocument";
import MyDocuments from "./pages/UserPages/MyDocuments";
import DocumentViewer from "./pages/UserPages/DocumentViewer";
import Favorites from "./pages/UserPages/Favorites";
import UserDashboard from "./pages/UserPages/UserDashboard";

import { useEffect } from 'react';
import { setupAxiosInterceptors } from './services/authService';

// Landing Page
import Home from "./pages/Home";

import { getCurrentUser, isAuthenticated } from "./services/authService";
import AdminUploadDocument from "./pages/Dashboard/ManageDocuments/AdminUploadDocument";
import AdminDashboard from "./pages/admin/AdminDashboard";

// Composant de protection des routes
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
  requiresUser?: boolean;
}

const ProtectedRoute = ({ children, requiresAdmin = false, requiresUser = false }: ProtectedRouteProps) => {
  const authenticated = isAuthenticated();
  const currentUser = getCurrentUser();

  if (!authenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (requiresAdmin && currentUser?.role !== "admin") {
    return <Navigate to="/user/dashboard" replace />;
  }

  if (requiresUser && currentUser?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default function App() {

  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password/confirm" element={<ResetPasswordForm />} />

          {/* ==================== PROTECTED ADMIN ROUTES (AppLayout) ==================== */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiresAdmin={true}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard  />} />
            <Route path="profile" element={<UserProfiles />} />
            <Route path="manage-documents" element={<Documents />} />
            <Route path="manage-documents/upload" element={<AdminUploadDocument />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="blank" element={<Blank />} />
            
            {/* Employees */}
            <Route path="manage-employees" element={<Employees />} />
            <Route path="manage-employees/add" element={<AddEmployee />} />
            <Route path="manage-employees/edit/:id" element={<EditEmployee />} />
            
            {/* Documents */}
            <Route path="manage-documents" element={<Documents />} />
            
            
            {/* Forms & Tables */}
            <Route path="form-elements" element={<FormElements />} />
            <Route path="basic-tables" element={<BasicTables />} />
            
            {/* UI Elements */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />
            
            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
          </Route>

          {/* ==================== PROTECTED USER ROUTES (UserLayout) ==================== */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="upload" element={<UploadDocument />} />
            <Route path="documents" element={<MyDocuments />} />
            <Route path="document/:id" element={<DocumentViewer />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="profile" element={<UserProfiles />} />
          </Route>

          {/* ==================== FALLBACK ROUTE ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}