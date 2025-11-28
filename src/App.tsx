import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import PlaceholderPage from "./pages/Placeholder";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import {
  CreditCard,
  Tag,
  UtensilsCrossed,
  Megaphone,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/payments" element={<Payments />} />
            <Route
              path="/plans"
              element={
                <PlaceholderPage
                  title="Plans & Pricing"
                  description="Configure mess plans and pricing"
                  icon={Tag}
                />
              }
            />
            <Route
              path="/menu"
              element={
                <PlaceholderPage
                  title="Menu Management"
                  description="Manage daily and weekly menu"
                  icon={UtensilsCrossed}
                />
              }
            />
            <Route
              path="/announcements"
              element={
                <PlaceholderPage
                  title="Announcements & News"
                  description="Create and manage announcements"
                  icon={Megaphone}
                />
              }
            />
            <Route
              path="/complaints"
              element={
                <PlaceholderPage
                  title="Complaints & Feedback"
                  description="Handle student complaints and feedback"
                  icon={MessageSquare}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <PlaceholderPage
                  title="Reports & Analytics"
                  description="Generate and view reports"
                  icon={BarChart3}
                />
              }
            />
            <Route
              path="/activity"
              element={
                <PlaceholderPage
                  title="Activity Log"
                  description="View system activity and audit trail"
                  icon={FileText}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  description="Configure system settings"
                  icon={Settings}
                />
              }
            />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
