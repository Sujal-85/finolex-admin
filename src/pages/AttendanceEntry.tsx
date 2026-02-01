import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle, Search, Users, Utensils, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Interface for Student
interface Student {
    _id: string;
    name: string;
    rollNo: string;
    department: string;
    year: string;
    status: string;
}

// New state structure: { studentId: { Breakfast: bool, Lunch: bool, Dinner: bool } }
interface StudentMeals {
    Breakfast: boolean;
    Lunch: boolean;
    Dinner: boolean;
}

interface AttendanceState {
    [studentId: string]: StudentMeals;
}

const AttendanceEntry = () => {
    const [date, setDate] = useState<Date>(new Date());
    // Removed 'meal' state as we now show all
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceState>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (students.length > 0) {
            checkExistingAttendance();
        }
    }, [date, students.length]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/students", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch students");
            const data = await res.json();
            const activeStudents = data.filter((s: Student) => s.status === 'Active');
            setStudents(activeStudents);

            const initialState: AttendanceState = {};
            activeStudents.forEach((s: Student) => {
                initialState[s._id] = { Breakfast: false, Lunch: false, Dinner: false };
            });
            setAttendance(initialState);

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load students.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const checkExistingAttendance = async () => {
        try {
            const token = localStorage.getItem("token");
            const dateStr = format(date, 'yyyy-MM-dd');
            // Fetch ALL meals for the date, unpopulated (raw IDs) for robust matching
            const res = await fetch(`http://localhost:5000/api/attendance?date=${dateStr}&meal=all&populate=false`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json(); // Returns flattened records array

                const newAttendance: AttendanceState = {};
                // Reset all to false first
                students.forEach(s => {
                    newAttendance[s._id] = { Breakfast: false, Lunch: false, Dinner: false };
                });

                if (data && data.length > 0) {
                    data.forEach((record: any) => {
                        if (record.status === 'present') {
                            // With populate=false, record.student IS the student ID string/object
                            const sId = typeof record.student === 'object' ? record.student._id : record.student;
                            const mealType = record.meal; // 'Breakfast', 'Lunch', 'Dinner'

                            if (sId && newAttendance[sId] && (mealType === 'Breakfast' || mealType === 'Lunch' || mealType === 'Dinner')) {
                                newAttendance[sId][mealType as keyof StudentMeals] = true;
                            }
                        }
                    });
                    setAttendance(newAttendance);
                    // toast({ title: "Loaded existing attendance", description: `Updated from records.` });
                } else {
                    setAttendance(newAttendance);
                }
            }
        } catch (e) {
            console.warn("Failed to check existing", e);
        }
    }

    const handleToggle = (studentId: string, mealType: keyof StudentMeals) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [mealType]: !prev[studentId][mealType]
            },
        }));
    };

    const handleBulkMark = (mealType: keyof StudentMeals, status: boolean) => {
        setAttendance(prev => {
            const newState = { ...prev };
            // Use filtered students to apply bulk action only on visible list if searching?
            // Or apply to ALL? Usually applies to visible list in search context.
            const targets = filteredStudents.map(s => s._id);

            targets.forEach(id => {
                if (newState[id]) {
                    newState[id] = { ...newState[id], [mealType]: status };
                }
            });
            return newState;
        });
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem("token");

            // Construct unified payload
            // Map: { studentId, breakfast: 'status', lunch: 'status', dinner: 'status' }
            const attendanceData = Object.entries(attendance).map(([studentId, mealsState]) => ({
                studentId,
                breakfast: mealsState.Breakfast ? "present" : "absent",
                lunch: mealsState.Lunch ? "present" : "absent",
                dinner: mealsState.Dinner ? "present" : "absent"
            }));

            // Filter out empty ones if needed? No, we likely want to sync full state "absent" too.
            // But maybe we only send students who have AT LEAST one modified/tracked state?
            // Actually, syncing "absent" is important if they were previously present.
            // Sending all students in `attendance` state is safe.

            const response = await fetch("http://localhost:5000/api/attendance/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    date: format(date, 'yyyy-MM-dd'),
                    // No 'meal' param needed anymore, implicit in data objects
                    attendanceData,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit");
            }

            toast({
                title: "Success",
                description: "Attendance saved successfully.",
            });

            // Re-fetch to confirm consistency (Optional but good)
            // checkExistingAttendance();

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to submit attendance.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(
        (s) => {
            const name = s.name || "";
            const rollNo = s.rollNo || "";
            const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rollNo.toLowerCase().includes(searchTerm.toLowerCase());

            // If showAll is true, return matchesSearch
            // If showAll is false, return matchesSearch AND hasAttendance
            if (showAll) return matchesSearch;

            const sMeals = attendance[s._id];
            const hasAttendance = sMeals && (sMeals.Breakfast || sMeals.Lunch || sMeals.Dinner);

            return matchesSearch && hasAttendance;
        }
    );

    // Calculate generic stats
    const totalStudents = students.length;
    // For Quick Stats, maybe show average attendance today? Or count per meal?
    const countB = Object.values(attendance).filter(s => s?.Breakfast).length;
    const countL = Object.values(attendance).filter(s => s?.Lunch).length;
    const countD = Object.values(attendance).filter(s => s?.Dinner).length;

    return (
        <div className="space-y-6 p-1">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Utensils className="h-6 w-6 text-blue-600" />
                        </div>
                        Daily Matrix
                    </h1>
                    <p className="text-slate-500 pl-14">Mark attendance for all meals simultaneously.</p>
                </div>

                <div className="flex gap-3">
                    <Card className="bg-white border-slate-200 shadow-sm w-24">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Breakfast</p>
                            <p className="text-xl font-bold text-orange-500">{countB}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200 shadow-sm w-24">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Lunch</p>
                            <p className="text-xl font-bold text-blue-500">{countL}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-200 shadow-sm w-24">
                        <CardContent className="p-3 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Dinner</p>
                            <p className="text-xl font-bold text-indigo-500">{countD}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Controls Section */}
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal bg-white border-slate-300 text-slate-900 hover:bg-slate-50",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-slate-900">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && setDate(d)}
                                    initialFocus
                                    className="bg-white text-slate-900"
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="relative w-full md:w-[300px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search student name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-slate-300"
                            />
                        </div>

                        <Button
                            variant={showAll ? "secondary" : "outline"}
                            onClick={() => setShowAll(!showAll)}
                            className={cn("bg-white text-slate-600 border-slate-300", showAll && "bg-slate-100 text-slate-900 border-slate-400")}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            {showAll ? "Showing All" : "Showing Marked"}
                        </Button>
                    </div>

                    <div className="text-sm text-slate-500">
                        {filteredStudents.length} Students Active
                    </div>
                </CardContent>
            </Card>

            {/* Matrix Table */}
            <Card className="bg-white border-slate-200 shadow-sm flex-1 min-h-[500px] flex flex-col overflow-hidden">
                <CardContent className="p-0 flex-1 flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <p className="text-slate-500">Loading matrix...</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-0 bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <div className="col-span-3 p-4 border-r border-slate-100">Student</div>
                                <div className="col-span-3 p-4 border-r border-slate-100">Info</div>

                                {/* Meal Columns Header with Bulk Actions */}
                                {['Breakfast', 'Lunch', 'Dinner'].map((m) => (
                                    <div key={m} className="col-span-2 p-2 px-1 border-r border-slate-100 flex flex-col gap-2 items-center justify-center">
                                        <span>{m}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleBulkMark(m as keyof StudentMeals, true)}
                                                className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                title="Mark All Present"
                                            >
                                                P
                                            </button>
                                            <button
                                                onClick={() => handleBulkMark(m as keyof StudentMeals, false)}
                                                className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                title="Mark All Absent"
                                            >
                                                A
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => {
                                    const studentMeals = attendance[student._id] || { Breakfast: false, Lunch: false, Dinner: false };

                                    return (
                                        <div key={student._id} className="grid grid-cols-12 gap-0 items-center hover:bg-slate-50 transition-colors group">
                                            <div className="col-span-3 p-4 border-r border-slate-50">
                                                <p className="font-medium text-slate-900 text-sm">{student.name}</p>
                                                <p className="text-xs text-slate-400 group-hover:text-slate-500">{student.rollNo}</p>
                                            </div>
                                            <div className="col-span-3 p-4 border-r border-slate-50">
                                                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 bg-white">
                                                    {student.department} • {student.year}
                                                </Badge>
                                            </div>

                                            {/* Meal Toggles */}
                                            {['Breakfast', 'Lunch', 'Dinner'].map((m) => {
                                                const mealKey = m as keyof StudentMeals;
                                                const isPresent = studentMeals[mealKey];

                                                return (
                                                    <div key={m} className="col-span-2 p-4 flex justify-center border-r border-slate-50/50">
                                                        <div
                                                            onClick={() => handleToggle(student._id, mealKey)}
                                                            className={cn(
                                                                "cursor-pointer w-full h-8 rounded-md flex items-center justify-center transition-all duration-200 select-none border",
                                                                isPresent
                                                                    ? "bg-green-500 text-white border-green-600 shadow-sm shadow-green-200"
                                                                    : "bg-slate-50 text-slate-300 border-slate-200 hover:border-slate-300"
                                                            )}
                                                        >
                                                            {isPresent ? <CheckCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="sticky bottom-4 z-50">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl flex justify-between items-center max-w-4xl mx-auto">
                    <span className="text-slate-500 text-sm">Review matrix before saving.</span>
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg px-8 active:scale-95 transition-all"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving Matrix...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                Save All Attendance
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceEntry;
