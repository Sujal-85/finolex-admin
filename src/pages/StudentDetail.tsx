import { useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Edit, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

const mockStudent = {
  id: "1",
  name: "John Doe",
  email: "john.doe@college.edu",
  phone: "+91 98765 43210",
  roll: "CS2021001",
  department: "Computer Science",
  year: "3rd",
  hostel: "Block A",
  room: "A-305",
  messStatus: "active" as const,
  enrollmentDate: "2021-08-01",
  currentPlan: "Standard Plan",
  planPrice: 5000,
  outstanding: 0,
};

const mockTransactions = [
  {
    id: "TX001",
    date: "2024-01-15",
    amount: 5000,
    mode: "UPI",
    status: "paid" as const,
  },
  {
    id: "TX002",
    date: "2023-12-15",
    amount: 5000,
    mode: "Cash",
    status: "paid" as const,
  },
  {
    id: "TX003",
    date: "2023-11-15",
    amount: 5000,
    mode: "Card",
    status: "paid" as const,
  },
];

const mockComplaints = [
  {
    id: "C001",
    date: "2024-01-10",
    title: "Menu variety request",
    status: "resolved" as const,
    priority: "low",
  },
];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/students")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Student Details</h1>
          <p className="text-muted-foreground">
            View and manage student information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Profile
          </Button>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                  {mockStudent.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{mockStudent.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {mockStudent.roll}
                </p>
              </div>
              <StatusBadge status={mockStudent.messStatus} />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{mockStudent.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{mockStudent.phone}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{mockStudent.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{mockStudent.year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hostel</span>
                <span className="font-medium">{mockStudent.hostel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">{mockStudent.room}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enrolled</span>
                <span className="font-medium">
                  {new Date(mockStudent.enrollmentDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <Button variant="outline" className="w-full">
                Deactivate Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <Tabs defaultValue="overview" className="p-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {mockStudent.currentPlan}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Monthly subscription
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      ₹{mockStudent.planPrice}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Paid (6 months)
                    </span>
                    <span className="font-semibold">₹30,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Outstanding Amount
                    </span>
                    <span className="font-semibold text-success">
                      ₹{mockStudent.outstanding}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Due Date</span>
                    <span className="font-medium">15 Feb 2024</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-mono text-sm">
                            {tx.id}
                          </TableCell>
                          <TableCell>
                            {new Date(tx.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{tx.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>{tx.mode}</TableCell>
                          <TableCell>
                            <StatusBadge status={tx.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints">
              <Card>
                <CardHeader>
                  <CardTitle>Complaints & Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  {mockComplaints.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockComplaints.map((complaint) => (
                          <TableRow key={complaint.id}>
                            <TableCell className="font-mono text-sm">
                              {complaint.id}
                            </TableCell>
                            <TableCell>
                              {new Date(complaint.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{complaint.title}</TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={complaint.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No complaints filed
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
