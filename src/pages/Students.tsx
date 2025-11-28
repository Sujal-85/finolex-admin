import { useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useNavigate } from "react-router-dom";

const mockStudents = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@college.edu",
    roll: "CS2021001",
    department: "Computer Science",
    year: "3rd",
    hostel: "Block A",
    messStatus: "active" as const,
    outstanding: 0,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@college.edu",
    roll: "EE2021045",
    department: "Electrical Engineering",
    year: "3rd",
    hostel: "Block B",
    messStatus: "active" as const,
    outstanding: 1500,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike.j@college.edu",
    roll: "ME2021078",
    department: "Mechanical Engineering",
    year: "2nd",
    hostel: "Block A",
    messStatus: "inactive" as const,
    outstanding: 0,
  },
  {
    id: "4",
    name: "Sarah Williams",
    email: "sarah.w@college.edu",
    roll: "CS2021023",
    department: "Computer Science",
    year: "3rd",
    hostel: "Block C",
    messStatus: "active" as const,
    outstanding: 5000,
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.b@college.edu",
    roll: "EE2021067",
    department: "Electrical Engineering",
    year: "2nd",
    hostel: "Block B",
    messStatus: "active" as const,
    outstanding: 3500,
  },
];

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage student profiles and mess enrollment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll number, or email..."
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Mess Status</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
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
                      {student.roll}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.department}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.year} Year
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{student.hostel}</TableCell>
                    <TableCell>
                      <StatusBadge status={student.messStatus} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {student.outstanding > 0 ? (
                        <span className="text-danger">
                          ₹{student.outstanding.toLocaleString()}
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
                              navigate(`/students/${student.id}`);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                          >
                            Send Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                            className="text-danger"
                          >
                            Deactivate
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
              <p className="text-muted-foreground">No students found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
