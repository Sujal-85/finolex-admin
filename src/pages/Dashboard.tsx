import { useState, useEffect } from "react";
import { Users, IndianRupee, AlertCircle, MessageSquare, Utensils, FileText } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { AddPaymentDialog } from "@/components/dashboard/AddPaymentDialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StatusBadge } from "@/components/shared/StatusBadge";
import api from "@/api/client";
import { toast } from "sonner";

const revenueData = [
  { month: "Jan", revenue: 45000, transactions: 320 },
  { month: "Feb", revenue: 52000, transactions: 380 },
  { month: "Mar", revenue: 48000, transactions: 340 },
  { month: "Apr", revenue: 61000, transactions: 420 },
  { month: "May", revenue: 58000, transactions: 395 },
  { month: "Jun", revenue: 67000, transactions: 450 },
];

const paymentStatus = [
  { name: "Paid", value: 65, color: "#10b981" },
  { name: "Pending", value: 25, color: "#f59e0b" },
  { name: "Overdue", value: 10, color: "#ef4444" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    pendingComplaints: 0,
    lowStockItems: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, paymentsRes, complaintsRes] = await Promise.all([
        api.get('/stats'),
        api.get('/payments'),
        api.get('/complaints')
      ]);

      setStats(statsRes.data);
      setRecentTransactions(paymentsRes.data.slice(0, 5));
      setRecentComplaints(complaintsRes.data.slice(0, 3));
    } catch (error: any) {
      console.error("Failed to fetch dashboard data", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
        toast.error(`Failed to load dashboard data: ${error.response.status} ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        toast.error("Failed to load dashboard data: No response from server. Check network connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        toast.error(`Failed to load dashboard data: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <AddStudentDialog />
          <AddPaymentDialog onPaymentAdded={fetchDashboardData} />
          <Button onClick={() => navigate("/menu")} variant="outline" className="gap-2 shadow-sm">
            <Utensils className="h-4 w-4" /> Update Menu
          </Button>
          <Button onClick={() => navigate("/reports")} variant="ghost" className="gap-2">
            <FileText className="h-4 w-4" /> View Reports
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          change={`${stats.activeStudents} active`}
          changeType="positive"
          icon={Users}
          iconBgColor="bg-primary-light"
          iconColor="text-primary"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change="Lifetime"
          changeType="positive"
          icon={IndianRupee}
          iconBgColor="bg-success-light"
          iconColor="text-success"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          change="Needs attention"
          changeType="negative"
          icon={AlertCircle}
          iconBgColor="bg-warning-light"
          iconColor="text-warning"
        />
        <StatsCard
          title="Pending Complaints"
          value={stats.pendingComplaints.toString()}
          change="Requires action"
          changeType="negative"
          icon={MessageSquare}
          iconBgColor="bg-danger-light"
          iconColor="text-danger"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{transaction.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">₹{transaction.amount}</p>
                      <StatusBadge status={transaction.status.toLowerCase()} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComplaints.length > 0 ? (
                recentComplaints.map((complaint: any) => (
                  <div
                    key={complaint._id}
                    className="flex items-start justify-between border-b pb-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{complaint.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {complaint.studentName} • {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={complaint.status.toLowerCase()} />
                      <span
                        className={`text-xs font-medium ${complaint.priority === "High"
                          ? "text-danger"
                          : complaint.priority === "Medium"
                            ? "text-warning"
                            : "text-muted-foreground"
                          }`}
                      >
                        {complaint.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent complaints</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
