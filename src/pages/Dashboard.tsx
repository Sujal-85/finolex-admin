import { Users, IndianRupee, AlertCircle, MessageSquare } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const revenueData = [
  { month: "Jan", revenue: 45000, transactions: 320 },
  { month: "Feb", revenue: 52000, transactions: 380 },
  { month: "Mar", revenue: 48000, transactions: 340 },
  { month: "Apr", revenue: 61000, transactions: 420 },
  { month: "May", revenue: 58000, transactions: 395 },
  { month: "Jun", revenue: 67000, transactions: 450 },
];

const planDistribution = [
  { name: "Basic", value: 245, color: "#3b82f6" },
  { name: "Standard", value: 432, color: "#10b981" },
  { name: "Premium", value: 189, color: "#f59e0b" },
];

const recentTransactions = [
  {
    id: "TX001",
    student: "John Doe",
    roll: "CS2021001",
    amount: 5000,
    status: "paid" as const,
    date: "2024-01-15",
  },
  {
    id: "TX002",
    student: "Jane Smith",
    roll: "EE2021045",
    amount: 3500,
    status: "paid" as const,
    date: "2024-01-15",
  },
  {
    id: "TX003",
    student: "Mike Johnson",
    roll: "ME2021078",
    amount: 7000,
    status: "pending" as const,
    date: "2024-01-14",
  },
  {
    id: "TX004",
    student: "Sarah Williams",
    roll: "CS2021023",
    amount: 5000,
    status: "paid" as const,
    date: "2024-01-14",
  },
  {
    id: "TX005",
    student: "David Brown",
    roll: "EE2021067",
    amount: 3500,
    status: "overdue" as const,
    date: "2024-01-13",
  },
];

const recentComplaints = [
  {
    id: 1,
    title: "Food quality issue",
    student: "Anonymous",
    priority: "high",
    status: "open" as const,
    time: "15 min ago",
  },
  {
    id: 2,
    title: "Long queue wait time",
    student: "John Doe",
    priority: "medium",
    status: "in_progress" as const,
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Menu variety request",
    student: "Jane Smith",
    priority: "low",
    status: "resolved" as const,
    time: "3 hours ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value="1,248"
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconBgColor="bg-primary-light"
          iconColor="text-primary"
        />
        <StatsCard
          title="Collected This Month"
          value="₹67,420"
          change="+8.2% from last month"
          changeType="positive"
          icon={IndianRupee}
          iconBgColor="bg-success-light"
          iconColor="text-success"
        />
        <StatsCard
          title="Pending Payments"
          value="₹23,450"
          change="42 students"
          changeType="neutral"
          icon={AlertCircle}
          iconBgColor="bg-warning-light"
          iconColor="text-warning"
        />
        <StatsCard
          title="Open Complaints"
          value="8"
          change="3 high priority"
          changeType="negative"
          icon={MessageSquare}
          iconBgColor="bg-danger-light"
          iconColor="text-danger"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
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
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
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
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{transaction.student}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.roll} • {transaction.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">₹{transaction.amount}</p>
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{complaint.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {complaint.student} • {complaint.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={complaint.status} />
                    <span
                      className={`text-xs font-medium ${
                        complaint.priority === "high"
                          ? "text-danger"
                          : complaint.priority === "medium"
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      {complaint.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
