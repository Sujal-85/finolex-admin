import { useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Edit, Download, Bell, Share2, MoreHorizontal } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/api/client";
import { toast } from "sonner";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { Loader } from "@/components/ui/loader";

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNo: string;
  department: string;
  year: string;
  hostelDetails: {
    hostelName: string;
    roomNo: string;
  };
  phone?: string;
  status: 'Active' | 'Inactive';
  balance: number;
  currentPlan?: string;
  createdAt: string;
  profileImage?: string;
  dob?: string;
  activePlans?: {
    name: string;
    price: number;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'paid';
  }[];
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [planPrice, setPlanPrice] = useState<number>(0);

  const fetchStudent = async () => {
    try {
      // Parallelize fetches to reduce loading time
      const [studentRes, paymentsRes, complaintsRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/payments?studentId=${id}`),
        api.get(`/complaints?studentId=${id}`)
      ]);

      const studentData = studentRes.data;
      setStudent(studentData);
      setPayments(paymentsRes.data);
      setComplaints(complaintsRes.data);

      if (studentData.currentPlan) {
        fetchPlanPrice(studentData.currentPlan);
      }
    } catch (error) {
      console.error("Failed to fetch student details", error);
      toast.error("Failed to fetch student details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanPrice = async (planName: string) => {
    try {
      const response = await api.get('/plans');
      const plans = response.data;
      let plan = plans.find((p: any) => p.name === planName);

      if (!plan && plans.length === 1) {
        plan = plans[0];
      }

      if (plan) {
        setPlanPrice(plan.price);
      }
    } catch (error) {
      console.error("Failed to fetch plans");
    }
  };

  useEffect(() => {
    if (id) {
      fetchStudent();
    }
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!student) return;

    try {
      const doc = new jsPDF();

      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          // Add crossOrigin usually for CORS but public files are local
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
        });
      };

      let logoImg: HTMLImageElement | null = null;
      let signatureImg: HTMLImageElement | null = null;

      try {
        logoImg = await loadImage("/famt-logo.png");
        signatureImg = await loadImage("/manager_signature.png");
      } catch (e) {
        console.error("Failed to load images for PDF", e);
      }

      // -- Header --
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 14, 10, 25, 25);
      }

      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185); // Primary Blue
      doc.text("Finolex Academy of Management & Technology", 115, 20, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text("Student Profile Report", 115, 28, { align: "center" });

      doc.setDrawColor(200);
      doc.line(14, 38, 196, 38); // Horizontal line

      // -- Student Details Section --
      let yPos = 50;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Personal Information", 14, yPos);

      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(80);

      // Left Column
      doc.text(`Name: ${student.name}`, 14, yPos);
      doc.text(`Roll No: ${student.rollNo}`, 14, yPos + 8);
      doc.text(`Email: ${student.email}`, 14, yPos + 16);
      doc.text(`Phone: ${student.phone || "N/A"}`, 14, yPos + 24);

      // Right Column
      doc.text(`Year: ${student.year}`, 110, yPos);
      doc.text(`Display Status: ${student.status}`, 110, yPos + 8);
      doc.text(`Hostel: ${student.hostelDetails?.hostelName || "N/A"}`, 110, yPos + 16);
      doc.text(`Room No: ${student.hostelDetails?.roomNo || "N/A"}`, 110, yPos + 24);

      yPos += 35;

      // -- Financial Summary Section --
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Financial Summary", 14, yPos);

      yPos += 10;
      doc.setFontSize(11);
      doc.setTextColor(80);

      const totalPaid = payments
        .filter((p: any) => p.status === 'Completed')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      doc.text(`Current Plan: ${student.currentPlan || "None"}`, 14, yPos);
      doc.text(`Plan Price: Rs. ${planPrice.toLocaleString()}`, 14, yPos + 8);

      doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString()}`, 110, yPos);

      // Highlight Outstanding if > 0
      if (student.balance > 0) {
        doc.setTextColor(231, 76, 60); // Red
      } else {
        doc.setTextColor(39, 174, 96); // Green
      }
      doc.text(`Outstanding Balance: Rs. ${student.balance.toLocaleString()}`, 110, yPos + 8);

      yPos += 20;

      // -- Transaction History Table --
      doc.setTextColor(0);
      doc.setFontSize(14);
      doc.text("Transaction History", 14, yPos);

      const tableBody = payments.map(p => [
        new Date(p.date).toLocaleDateString(),
        `Rs. ${p.amount}`,
        p.type,
        p.status
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Date', 'Amount', 'Type', 'Status']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // -- Footer (Signature) --
      const pageCount = (doc as any).internal.getNumberOfPages();
      const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

      if (finalY > doc.internal.pageSize.height - 60) {
        doc.addPage();
      }

      const signatureY = doc.internal.pageSize.height - 50;

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text("Authorized Signature:", 140, signatureY - 15);

      if (signatureImg) {
        doc.addImage(signatureImg, 'PNG', 140, signatureY - 10, 40, 20);
      }

      doc.text("MR. Sandeep Tambe", 140, signatureY + 15);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Manager, FAMT Mess", 140, signatureY + 20);

      // Page Numbers
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }

      doc.save(`${student.name.replace(/\s+/g, '_')}_Profile.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDeactivate = async () => {
    if (!student) return;

    if (!window.confirm("Are you sure you want to deactivate this student?")) {
      return;
    }

    try {
      await api.patch(`/students/${student._id}`, { status: 'Inactive' });
      toast.success("Student deactivated successfully");
      fetchStudent();
    } catch (error) {
      toast.error("Failed to deactivate student");
    }
  };

  const handleReminder = async () => {
    if (!student) return;
    try {
      await api.post(`/students/${student._id}/reminder`);
      toast.success(`Payment reminder sent to ${student.name}`);
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/students")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Student Details</h1>
            <p className="text-muted-foreground">
              View and manage student information
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            Download Profile
          </Button>
          <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={handleReminder}>
            <Bell className="h-4 w-4" />
            Send Reminder
          </Button>
          <Button className="gap-2 flex-1 md:flex-none" onClick={() => setIsEditOpen(true)}>
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
                <AvatarImage src={student.profileImage} alt={student.name} />
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
                  {student.rollNo}
                </p>
              </div>
              <StatusBadge status={student.status === 'Inactive' ? 'inactive' : 'active'} />
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
              {student.dob && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">DOB:</span>
                  <span>{new Date(student.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{student.year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hostel</span>
                <span className="font-medium">{student.hostelDetails?.hostelName}</span>
              </div>
              {student.hostelDetails?.roomNo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">{student.hostelDetails.roomNo}</span>
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
                  <div className="space-y-4">
                    {(student.activePlans && student.activePlans.length > 0) ? (
                      student.activePlans.map((plan, index) => (
                        <div key={index} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                          <div>
                            <p className="font-semibold">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Start TBD'} - {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'End TBD'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">₹{plan.price}</p>
                            <StatusBadge status={plan.status === 'paid' ? 'active' : 'pending'} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {student.currentPlan || "No Plan Active"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Monthly subscription
                          </p>
                        </div>
                        <p className="text-xl font-bold">
                          ₹{planPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
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
                    <span className="font-semibold">
                      ₹{payments
                        .filter((p: any) => p.status === 'Completed')
                        .reduce((sum: number, p: any) => sum + p.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Outstanding Amount
                    </span>
                    <span className="font-semibold text-success">
                      ₹{student.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Due Date</span>
                    <span className="font-medium">
                      {(() => {
                        const dueDate = (student as any).nextDueDate ? new Date((student as any).nextDueDate) : null;
                        const isOverdue = dueDate && new Date() > dueDate && student.balance > 0;

                        if (!dueDate) return "No Due Date";
                        if (isOverdue) return <span className="text-destructive font-bold">Overdue ({dueDate.toLocaleDateString()})</span>;
                        return dueDate.toLocaleDateString();
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              {payments.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>
                            {new Date(payment.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>₹{payment.amount}</TableCell>
                          <TableCell>{payment.type}</TableCell>
                          <TableCell>
                            <StatusBadge status={payment.status.toLowerCase()} />
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'Completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-primary"
                                onClick={async () => {
                                  try {
                                    toast.info("Downloading receipt...");
                                    const response = await api.post('/receipts/generate', {
                                      transaction: {
                                        ...payment,
                                        transactionId: payment.transactionId || payment._id
                                      },
                                      studentId: student?._id
                                    }, {
                                      responseType: 'blob'
                                    });

                                    // Create Blob URL
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `Receipt_${payment._id.slice(-6)}.pdf`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);

                                    toast.success("Download complete");
                                  } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to download receipt");
                                  }
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" /> Receipt
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No payment history available
                </div>
              )}
            </TabsContent>

            <TabsContent value="complaints">
              {complaints.length > 0 ? (
                <div className="space-y-4">
                  {complaints.map((complaint) => (
                    <Card key={complaint._id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{complaint.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={complaint.status.toLowerCase() === 'resolved' ? 'active' : 'inactive'} />
                        </div>
                        <p className="text-sm">{complaint.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No complaints filed
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <AddStudentDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onStudentAdded={fetchStudent}
        studentToEdit={student}
      />
    </div>
  );
}
