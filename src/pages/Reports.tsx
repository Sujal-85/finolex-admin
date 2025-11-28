import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const revenueData = [
  { month: "Jul", revenue: 145000 },
  { month: "Aug", revenue: 152000 },
  { month: "Sep", revenue: 168000 },
  { month: "Oct", revenue: 175000 },
  { month: "Nov", revenue: 182000 },
  { month: "Dec", revenue: 189000 },
  { month: "Jan", revenue: 195000 },
];

const planDistribution = [
  { name: "Basic", value: 150, color: "#3b82f6" },
  { name: "Standard", value: 320, color: "#10b981" },
  { name: "Premium", value: 85, color: "#f59e0b" },
];

const complaintCategories = [
  { category: "Food Quality", count: 25 },
  { category: "Service", count: 18 },
  { category: "Hygiene", count: 12 },
  { category: "Other", count: 8 },
];

const monthlyEnrollment = [
  { month: "Jul", students: 520 },
  { month: "Aug", students: 535 },
  { month: "Sep", students: 548 },
  { month: "Oct", students: 555 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [reportType, setReportType] = useState("revenue");

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `${type} report is being generated...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: `${type} report downloaded successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and view reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Report</SelectItem>
                <SelectItem value="enrollment">Enrollment Report</SelectItem>
                <SelectItem value="complaints">Complaints Report</SelectItem>
                <SelectItem value="plans">Plan Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹1.95L</p>
                <p className="text-xs text-success">+7.2% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">555</p>
                <p className="text-xs text-success">+1.3% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Plan Value</p>
                <p className="text-2xl font-bold">₹4,890</p>
                <p className="text-xs text-success">+3.5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Open Complaints</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-destructive">-2 from last week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("Revenue")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Active subscriptions by plan type</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("Plan Distribution")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
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

        {/* Complaint Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Complaint Categories</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("Complaints")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complaintCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Enrollment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Enrollment</CardTitle>
                <CardDescription>Monthly enrollment trend</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExport("Enrollment")}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyEnrollment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="hsl(var(--success))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Reports</CardTitle>
          <CardDescription>Download predefined reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Payment Summary")}>
              <Download className="h-4 w-4 mr-2" />
              Payment Summary (CSV)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Student Enrollment")}>
              <Download className="h-4 w-4 mr-2" />
              Student Enrollment (PDF)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Complaint Report")}>
              <Download className="h-4 w-4 mr-2" />
              Complaint Report (CSV)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Menu History")}>
              <Download className="h-4 w-4 mr-2" />
              Menu History (PDF)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Revenue Report")}>
              <Download className="h-4 w-4 mr-2" />
              Revenue Report (PDF)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => handleExport("Full Analytics")}>
              <Download className="h-4 w-4 mr-2" />
              Full Analytics (XLSX)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
