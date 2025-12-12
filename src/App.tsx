import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { Loader } from "./components/ui/loader";
import { SocketProvider } from "./components/providers/SocketProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Payments from "./pages/Payments";
import Transactions from "./pages/Transactions";
import Plans from "./pages/Plans";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";
import Complaints from "./pages/Complaints";
import Feedback from "./pages/Feedback";
import Reports from "./pages/Reports";
import ActivityLog from "./pages/ActivityLog";
import Announcements from "./pages/Announcements";
import SettingsPage from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { ChatAssistant } from "./components/ChatAssistant";
import AdminOrders from "./pages/AdminOrders";
import CreateOrder from "./pages/CreateOrder";
import OrderDetails from "./pages/OrderDetails";
import AdminDashboard from "./pages/AdminDashboard";
import Settlement from "./pages/Settlement";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loader

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SocketProvider>
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
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/complaints" element={<Complaints />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/activity" element={<ActivityLog />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/create-order" element={<CreateOrder />} />
                <Route path="/admin/orders/:id" element={<OrderDetails />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/settlement" element={<Settlement />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatAssistant />
          </BrowserRouter>
        </SocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
