import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Search, Filter, Download, UserPlus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/client";
import { toast } from "sonner";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { Loader } from "@/components/ui/loader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
interface Student {
  _id: string;
  name: string;
  email: string;
  dob?: string;
  year: string;
  hostelDetails: {
    hostelName: string;
    roomNo: string;
  };
  status: 'Active' | 'Inactive';
  balance: number;
  generatedPassword?: string;
  currentPlan?: string;
  phone?: string;
}

export default function Students() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newlyCreatedPasswords, setNewlyCreatedPasswords] = useState<Record<string, string>>({});

  // Filter State
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      toast.error("Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const headers = ["Name", "DOB", "Email", "Phone", "Year", "Hostel", "Status", "Plan", "Balance"];
    const csvContent = [
      headers.join(","),
      ...students.map(student => [
        `"${student.name}"`,
        student.dob ? format(new Date(student.dob), "MMM dd, yyyy") : "-",
        student.email,
        student.phone || "-",
        student.year,
        student.hostelDetails?.hostelName || '',
        student.status,
        `"${student.currentPlan || '-'}"`,
        student.balance
      ].join(","))
    ].join("\n");

    downloadCSV(csvContent, "students_all.csv");
  };

  const handleExportDues = () => {
    const studentsWithDues = students.filter(s => s.balance > 0);

    if (studentsWithDues.length === 0) {
      toast.error("No students with outstanding dues found");
      return;
    }

    // Group by plan
    const groupedByPlan: Record<string, Student[]> = {};
    studentsWithDues.forEach(student => {
      const plan = student.currentPlan || "No Plan";
      if (!groupedByPlan[plan]) {
        groupedByPlan[plan] = [];
      }
      groupedByPlan[plan].push(student);
    });

    // Build CSV content with sections
    let csvContent = "Plan,Name,Email,Phone,Hostel,Room,Balance\n";

    Object.keys(groupedByPlan).forEach(planName => {
      // Add a header/separator row for the plan
      // csvContent += `\n--- ${planName} ---\n`; 
      // Actually, keeping it tabular is better for Excel, but user asked for "separate".
      // Let's list them with the Plan column filled, but maybe sorted?
      // Or we can add a row "Plan: X" then the students.
      // Let's stick to standard CSV with Plan column, but let's confirm the user's "separate list" request.
      // "list will be made accordingly separate for each plan" -> This implies visual separation or separate files.
      // Separate files is bad UX for web (multiple downloads). 
      // Let's do a single file with groupings.

      const studentsInPlan = groupedByPlan[planName];
      studentsInPlan.forEach(student => {
        csvContent += [
          `"${planName}"`,
          `"${student.name}"`,
          student.email,
          student.phone || "-",
          student.hostelDetails?.hostelName || '',
          student.hostelDetails?.roomNo || '',
          student.balance
        ].join(",") + "\n";
      });
    });

    downloadCSV(csvContent, "students_outstanding_dues.csv");
    toast.success(`Exported ${studentsWithDues.length} records with dues`);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (student: Student) => {
    try {
      await api.patch(`/students/${student._id}`, { status: 'Inactive' });
      toast.success(`${student.name} has been deactivated`);
      fetchStudents();
    } catch (error) {
      toast.error("Failed to deactivate student");
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/students/${student._id}`);
      toast.success(`${student.name} has been deleted`);
      fetchStudents();
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const handleReminder = async (student: Student) => {
    try {
      await api.post(`/students/${student._id}/reminder`);
      toast.success(`Payment reminder sent to ${student.name}`);
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };

  const handleStudentAdded = async (newStudent?: any) => {
    await fetchStudents();
    if (newStudent && newStudent.generatedPassword) {
      setNewlyCreatedPasswords(prev => ({
        ...prev,
        [newStudent._id]: newStudent.generatedPassword
      }));
      toast.success(`Student added. Password: ${newStudent.generatedPassword}`, {
        duration: Infinity,
        action: {
          label: 'Copy',
          onClick: () => navigator.clipboard.writeText(newStudent.generatedPassword)
        }
      });
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesYear = yearFilter === "all" || student.year === yearFilter;

    return matchesSearch && matchesStatus && matchesYear;
  });



  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage student profiles and mess enrollment
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAll}>
                Export All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDues}>
                Export Dues
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2" onClick={handleAddStudent}>
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
          <AddStudentDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onStudentAdded={handleStudentAdded}
            studentToEdit={selectedStudent}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {(statusFilter !== "all" || yearFilter !== "all") && (
                    <Badge variant="secondary" className="ml-1 px-1 h-5 min-w-5 flex items-center justify-center rounded-full text-xs">
                      {(statusFilter !== "all" ? 1 : 0) + (yearFilter !== "all" ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter Students</h4>
                    <p className="text-sm text-muted-foreground">
                      Refine the student list by status or year
                    </p>
                  </div>
                  <div className="grid gap-4">
                    {/* Status Filter */}
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="status">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="col-span-2 h-8">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Year Filter */}
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="year">Year</Label>
                      <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="col-span-2 h-8">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          <SelectItem value="First">First Year</SelectItem>
                          <SelectItem value="Second">Second Year</SelectItem>
                          <SelectItem value="Third">Third Year</SelectItem>
                          <SelectItem value="Fourth">Fourth Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStatusFilter("all");
                      setYearFilter("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="rounded-md border overflow-auto custom-scrollbar max-h-[calc(100vh-250px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Mess Status</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/students/${student._id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.profileImage} alt={student.name} />
                          <AvatarFallback className="bg-primary-light text-primary">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {student.dob ? format(new Date(student.dob), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-blue-600 font-bold">
                      {newlyCreatedPasswords[student._id] || student.generatedPassword || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {student.year} Year
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{student.hostelDetails?.hostelName}</TableCell>
                    <TableCell>
                      <StatusBadge status={student.status === 'Inactive' ? 'inactive' : 'active'} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {student.balance > 0 ? (
                        <span className="text-danger">
                          ₹{student.balance.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/students/${student._id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(student);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReminder(student);
                            }}
                          >
                            Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeactivate(student);
                            }}
                            className="text-danger"
                          >
                            Deactivate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(student);
                            }}
                            className="text-danger"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">{isLoading ? "Loading students..." : "No students found"}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
