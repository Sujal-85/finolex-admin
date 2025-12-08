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
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import { toast } from "sonner";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { Loader } from "@/components/ui/loader";
interface Student {
  _id: string;
  name: string;
  email: string;
  birthday?: string;
  year: string;
  hostelDetails: {
    hostelName: string;
    roomNo: string;
  };
  status: 'Active' | 'Inactive';
  balance: number;
  profileImage?: string;
  generatedPassword?: string;
}

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newlyCreatedPasswords, setNewlyCreatedPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleExport = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const headers = ["Name", "Birthday", "Email", "Year", "Hostel", "Status", "Balance"];
    const csvContent = [
      headers.join(","),
      ...students.map(student => [
        `"${student.name}"`,
        `"${student.name}"`,
        student.birthday ? format(new Date(student.birthday), "MMM dd, yyyy") : "-",
        student.email,
        student.year,
        student.hostelDetails?.hostelName || '',
        student.status,
        student.balance
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "students_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleReminder = (student: Student) => {
    // Simulation for now
    toast.success(`Reminder sent to ${student.email}`);
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

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );



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
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
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
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          <div className="rounded-md border overflow-auto custom-scrollbar max-h-[calc(100vh-250px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Birthday</TableHead>
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
                      {student.birthday ? format(new Date(student.birthday), "MMM dd, yyyy") : "-"}
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
                      <StatusBadge status={student.status === 'Active' ? 'active' : 'inactive'} />
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
