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
import { useEffect, useState } from "react";
import api from "@/api/client";
import { toast } from "sonner";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  hostel: string;
  room?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  balance: number;
  currentPlan?: string;
  createdAt: string;
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`);
      setStudent(response.data);
    } catch (error) {
      toast.error("Failed to fetch student details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDeactivate = async () => {
    if (!student) return;

    // Simple confirmation
    if (!window.confirm("Are you sure you want to deactivate this student?")) {
      return;
    }

    try {
      await api.patch(`/students/${student._id}`, { status: 'Inactive' });
      toast.success("Student deactivated successfully");
      fetchStudent(); // Refresh data
    } catch (error) {
      toast.error("Failed to deactivate student");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!student) {
    return <div>Student not found</div>;
  }

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
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Profile
          </Button>
          <Button className="gap-2" onClick={() => setIsEditOpen(true)}>
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
                  {student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {student.rollNumber}
                </p>
              </div>
              <StatusBadge status={student.status === 'Active' ? 'active' : 'inactive'} />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{student.email}</span>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{student.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{student.year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hostel</span>
                <span className="font-medium">{student.hostel}</span>
              </div>
              {student.room && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">{student.room}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enrolled</span>
                <span className="font-medium">
                  {new Date(student.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t pt-6">
              <Button
                variant="outline"
                className="w-full text-danger hover:text-danger hover:bg-danger/10"
                onClick={handleDeactivate}
                disabled={student.status === 'Inactive'}
              >
                {student.status === 'Inactive' ? 'Account Deactivated' : 'Deactivate Account'}
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
                        {student.currentPlan || "No Plan Active"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Monthly subscription
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      ₹5,000
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
                      Total Paid (Lifetime)
                    </span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Outstanding Amount
                    </span>
                    <span className="font-semibold text-success">
                      ₹{student.balance}
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
              <div className="py-8 text-center text-muted-foreground">
                No payment history available
              </div>
            </TabsContent>

            <TabsContent value="complaints">
              <div className="py-8 text-center text-muted-foreground">
                No complaints filed
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <AddStudentDialog
        open={isEditOpen}
        setOpen={setIsEditOpen}
        onStudentAdded={fetchStudent}
        studentToEdit={student}
      />
    </div>
  );
}
