import { useState, useEffect } from "react";
import * as htmlToImage from 'html-to-image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, DollarSign, AlertCircle, Loader2, FileText, Calendar, BarChart3, PieChart as PieChartIcon, Filter, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";
import { generatePDFReport, generateMultiSectionReport, ReportSection } from "@/utils/pdfGenerator";
import { generateDOCXReport, generateMultiSectionDOCXReport } from "@/utils/docxGenerator";
import { generateBusinessInsights } from "@/utils/analyticsEngine";

export default function Reports() {
  const [dateRange, setDateRange] = useState("last-30-days");
  const [reportType, setReportType] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    planDistribution: [],
    complaintCategories: [],
    monthlyEnrollment: []
  });
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    activeStudents: 0,
    pendingComplaints: 0,
    avgPlanValue: 0
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, summaryRes] = await Promise.all([
          api.get('/stats/analytics'),
          api.get('/stats')
        ]);

        setAnalyticsData(analyticsRes.data);
        setSummaryStats(summaryRes.data);
      } catch (error) {
        console.error("Failed to fetch reports data:", error);
        toast({
          title: "Error",
          description: "Failed to load analytics data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleExport = async (type: string, format: 'PDF' | 'DOCX' = 'PDF') => {
    setIsExporting(true);
    toast({
      title: "Export Started",
      description: `Generating ${type} report as ${format}...`,
    });

    try {
      let data: any[] = [];
      let columns: string[] = [];
      let fileName = `${type.replace(/\s+/g, '_')}_Report`;
      let reportTitle = `${type} Report`;

      switch (type) {
        case "Payment Summary":
        case "Revenue Report":
          const paymentsRes = await api.get('/payments');
          // Filter for revenue report if needed, or just dump all
          const paymentList = type === "Revenue Report"
            ? paymentsRes.data.filter((p: any) => p.status === 'Completed')
            : paymentsRes.data;

          columns = ["Date", "Student", "Amount", "Type", "Status"];
          data = paymentList.map((p: any) => [
            new Date(p.date).toLocaleDateString(),
            p.studentName || p.studentId || "N/A", // Backend might not populate name, handle carefully
            `Rs. ${p.amount}`,
            p.type,
            p.status
          ]);
          break;

        case "Student Enrollment":
          const studentsRes = await api.get('/students');
          columns = ["Name", "Roll No", "Year", "Plan", "Balance", "Status"];
          data = studentsRes.data.map((s: any) => [
            s.name,
            s.rollNo,
            s.year,
            s.currentPlan || "None",
            `Rs. ${s.balance}`,
            s.status
          ]);
          reportTitle = "Student Enrollment Report";
          break;

        case "Complaint Report":
          const complaintsRes = await api.get('/complaints');
          columns = ["Date", "Subject", "Student", "Status", "Description"];
          data = complaintsRes.data.map((c: any) => [
            new Date(c.createdAt).toLocaleDateString(),
            c.subject,
            c.studentName || "N/A",
            c.status,
            c.description.substring(0, 50) + (c.description.length > 50 ? "..." : "")
          ]);
          break;

        case "Menu History":
          const menuRes = await api.get('/menu');
          columns = ["Item Name", "Category", "Price", "Available"];
          data = menuRes.data.map((m: any) => [
            m.name,
            m.category,
            `Rs. ${m.price}`,
            m.available ? "Yes" : "No"
          ]);
          reportTitle = "Menu Items Report";
          break;

        case "Full Analytics": {
          const insights = generateBusinessInsights(analyticsData, summaryStats);

          const captureChart = async (elementId: string) => {
            const element = document.getElementById(elementId);
            if (!element) return null;

            try {
              return await htmlToImage.toPng(element, {
                backgroundColor: "#ffffff",
                pixelRatio: 2, // sharper charts
              });
            } catch (err) {
              console.error("Chart capture failed:", err);
              return null;
            }
          };

          const revenueImg = await captureChart("revenue-chart");
          const planImg = await captureChart("plan-chart");
          const complaintImg = await captureChart("complaint-chart");
          const enrollmentImg = await captureChart("enrollment-chart");

          const reportSections: ReportSection[] = [

            // =============================
            // EXECUTIVE SUMMARY
            // =============================
            {
              type: "text" as const,
              title: "Executive Summary",
              content: [
                "This report presents a high-level overview of canteen performance, student engagement, and operational health.",
              ],
            },

            // =============================
            // KPI CARDS (BIG WIN 🔥)
            // =============================
            {
              type: "stats" as const,
              title: "Key Performance Indicators",
              stats: [
                { label: "Total Revenue", value: `₹ ${summaryStats.totalRevenue.toLocaleString()}` },
                { label: "Active Students", value: summaryStats.activeStudents },
                { label: "Pending Complaints", value: summaryStats.pendingComplaints },
              ],
            },

            // =============================
            // REVENUE SECTION
            // =============================
            {
              type: "section" as const,
              title: "Revenue Analysis",
              description: "Monthly revenue performance and trend analysis.",
            },

            ...(revenueImg
              ? [{ type: "image" as const, content: revenueImg, width: 220, height: 130 }]
              : []),

            {
              type: "table" as const,
              title: "Revenue Trends",
              columns: ["Month", "Revenue"],
              data: analyticsData.revenueData.map((d: any) => [
                d.month,
                `₹ ${d.revenue.toLocaleString()}`,
              ]),
            },

            // =============================
            // PLAN DISTRIBUTION
            // =============================
            {
              type: "section" as const,
              title: "Subscription Plan Distribution",
              description: "Active users grouped by subscription plans.",
            },

            ...(planImg
              ? [{ type: "image" as const, content: planImg, width: 220, height: 130 }]
              : []),

            {
              type: "table" as const,
              columns: ["Plan Name", "Active Users"],
              data: analyticsData.planDistribution.map((d: any) => [d.name, d.value]),
            },

            // =============================
            // COMPLAINTS
            // =============================
            {
              type: "section",
              title: "Complaint Analytics",
              description: "Recent complaint categories and volume.",
            },

            ...(complaintImg
              ? [{ type: "image" as const, content: complaintImg, width: 220, height: 130 }]
              : []),

            {
              type: "table" as const,
              columns: ["Category", "Count"],
              data: analyticsData.complaintCategories.map((d: any) => [
                d.category,
                d.count,
              ]),
            },

            // =============================
            // ENROLLMENT
            // =============================
            {
              type: "section" as const,
              title: "Student Enrollment Trends",
              description: "Monthly student enrollment growth.",
            },

            ...(enrollmentImg
              ? [{ type: "image" as const, content: enrollmentImg, width: 220, height: 130 }]
              : []),

            // =============================
            // AI INSIGHTS
            // =============================
            {
              type: "text" as const,
              title: "AI-Driven Business Recommendations",
              content: insights,
            },
          ];

          if (format === 'PDF') {
            await generateMultiSectionReport("Full Analytics & Business Insights", reportSections, fileName);
          } else {
            await generateMultiSectionDOCXReport("Full Analytics & Business Insights", reportSections, fileName);
          }

          toast({
            title: "Export Complete",
            description: "Professional analytics report generated successfully.",
            duration: 2500,
          });

          return;
        }

        case "Revenue":
          columns = ["Month", "Revenue"];
          data = analyticsData.revenueData.map((d: any) => [
            d.month,
            `Rs. ${d.revenue}`
          ]);
          reportTitle = "Revenue Trend Report";
          break;

        case "Plan Distribution":
          columns = ["Plan Name", "Active Users"];
          data = analyticsData.planDistribution.map((d: any) => [
            d.name,
            d.value
          ]);
          reportTitle = "Plan Distribution Report";
          break;

        case "Complaints":
          columns = ["Category", "Count"];
          data = analyticsData.complaintCategories.map((d: any) => [
            d.category,
            d.count
          ]);
          reportTitle = "Complaint Categories Report";
          break;

        case "Enrollment":
          columns = ["Month", "New Students"];
          data = analyticsData.monthlyEnrollment.map((d: any) => [
            d.month,
            d.students
          ]);
          reportTitle = "Monthly Enrollment Report";
          break;

        default:
          toast({ title: "Info", description: "This report type is not yet supported for PDF." });
          return;
      }

      if (format === 'PDF') {
        await generatePDFReport(reportTitle, columns, data, fileName);
      } else {
        await generateDOCXReport(reportTitle, columns, data, fileName);
      }

      toast({
        title: "Export Complete",
        description: `${type} downloaded successfully.`,
        duration: 2000,
      });

    } catch (error) {
      console.error("Export failed", error);
      toast({
        title: "Export Failed",
        description: "Could not fetch data for report generation.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };



  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 relative">
      {isExporting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 shadow-inner ring-1 ring-blue-100">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xl font-bold text-gray-800">Processing Report</p>
              <p className="text-sm text-gray-500 animate-pulse">Building your PDF, please wait...</p>
            </div>
          </div>
        </div>
      )}
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {/* <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" /> 
              </div> */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{summaryStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-success">+7.2% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {/* <div className="p-3 bg-success/10 rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div> */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold">{summaryStats.activeStudents}</p>
                <p className="text-xs text-success">+1.3% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {/* <div className="p-3 bg-warning/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div> */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Plan Value</p>
                <p className="text-2xl font-bold">₹{summaryStats.avgPlanValue?.toLocaleString() || 0}</p>
                <p className="text-xs text-success">+3.5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {/* <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div> */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Open Complaints</p>
                <p className="text-2xl font-bold">{summaryStats.pendingComplaints}</p>
                <p className="text-xs text-destructive">-2 from last week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card id="revenue-chart">
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
              <LineChart data={analyticsData.revenueData}>
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
        <Card id="plan-chart">
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
                  data={analyticsData.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.planDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Complaint Categories */}
        <Card id="complaint-chart">
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
              <BarChart data={analyticsData.complaintCategories}>
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
        <Card id="enrollment-chart">
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
              <LineChart data={analyticsData.monthlyEnrollment}>
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
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Payment Summary", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Payments (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Payment Summary", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Student Enrollment", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Students (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Student Enrollment", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Complaint Report", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Complaints (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Complaint Report", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Menu History", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Menu (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Menu History", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Revenue Report", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Revenue (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Revenue Report", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 justify-start" onClick={() => handleExport("Full Analytics", "PDF")}>
                <Download className="h-4 w-4 mr-2" />
                Analytics (PDF)
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleExport("Full Analytics", "DOCX")}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
