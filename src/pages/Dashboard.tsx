import { useState, useEffect } from "react";
import { Users, IndianRupee, AlertCircle, MessageSquare, Utensils, FileText, ShoppingCart } from "lucide-react";
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
import { Loader } from "@/components/ui/loader";
import { toast } from "sonner";



export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    pendingComplaints: 0,
    lowStockItems: 0,
    totalOrders: 0
  });
  const [analytics, setAnalytics] = useState({
    revenueData: [],
    paymentStatus: []
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, paymentsRes, complaintsRes, analyticsRes, ordersRes] = await Promise.all([
        api.get('/stats'),
        api.get('/payments'),
        api.get('/complaints'),
        api.get('/stats/analytics'),
        api.get('/orders')
      ]);

      setStats({
        ...statsRes.data,
        totalOrders: ordersRes.data.length
      });
      setRecentTransactions(paymentsRes.data.slice(0, 5));
      setRecentComplaints(complaintsRes.data.slice(0, 3));
      setAnalytics(analyticsRes.data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data", error);
      // ... error handling ...
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return <Loader />;
  }

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
          <Button onClick={() => navigate("/reports")} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> View Reports
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents.toLocaleString()}
          change={`${stats.activeStudents} active`}
          changeType="positive"
        />
        <StatsCard
          title="Pending Complaints"
          value={stats.pendingComplaints.toString()}
          change="Requires action"
          changeType="negative"
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          change="Current session"
          changeType="positive"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change="Lifetime"
          changeType="positive"
          className={stats.totalRevenue >= 10000 ? "sm:col-span-2" : ""}
        />

      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#374151' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.paymentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.paymentStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
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
                    <div className="flex flex-col items-end gap-3">
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
