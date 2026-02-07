import { useState, useEffect } from "react";
import api from "@/api/client";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle, Clock, FileText, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
    _id: string;
    student: {
        _id: string;
        name: string;
        rollNo: string;
        department: string;
        year: string;
    };
    date: string;
    meal: string;
    status: 'present' | 'absent';
    state: 'pending' | 'verified';
    createdAt: string;
}

interface MonthlyReportItem {
    student: {
        name: string;
        rollNo: string;
        department: string;
    };
    totalPresent: number;
    totalAbsent: number;
    daysPresent: number;
}

const AttendanceStatus = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [meal, setMeal] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("present"); // Default to present as requested
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Reporting state
    const [reportOpen, setReportOpen] = useState(false);
    const [reportMonth, setReportMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [reportYear, setReportYear] = useState<string>(String(new Date().getFullYear()));
    const [reportData, setReportData] = useState<MonthlyReportItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    const { toast } = useToast();

    // Passcode State
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passcode, setPasscode] = useState("");

    useEffect(() => {
        const unlocked = sessionStorage.getItem("attendance_unlocked");
        if (unlocked === "true") {
            setIsUnlocked(true);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [date, meal]); // Removed statusFilter dependency as it's now client-side

    const fetchAttendance = async () => {
        try {
            setLoading(true);

            const params: any = {};
            if (date) params.date = format(date, 'yyyy-MM-dd');
            if (meal !== "all") params.meal = meal;
            // Removed status param to fetch all and filter client-side

            const res = await api.get('/attendance', { params });
            setRecords(res.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load attendance records.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, meal: string) => {
        try {
            await api.patch(`/attendance/${id}`, {
                state: "verified",
                meal: meal
            });

            setRecords(prev => prev.map(rec =>
                (rec._id === id && rec.meal === meal) ? { ...rec, state: "verified" } : rec
            ));

            toast({
                title: "Success",
                description: "Attendance record verified.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to verify record.",
                variant: "destructive",
            });
        }
    };

    const handleStatusUpdate = async (id: string, meal: string, newStatus: string) => {
        try {
            await api.patch(`/attendance/${id}`, {
                status: newStatus,
                meal: meal
            });

            setRecords(prev => prev.map(rec =>
                (rec._id === id && rec.meal === meal) ? { ...rec, status: newStatus as 'present' | 'absent' } : rec
            ));

            toast({
                title: "Updated",
                description: `Status changed to ${newStatus}.`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive",
            });
        }
    };

    const generateReport = async () => {
        try {
            setLoadingReport(true);
            const res = await api.get(`/attendance/report/monthly`, {
                params: {
                    month: reportMonth,
                    year: reportYear
                }
            });
            setReportData(res.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate report.",
                variant: "destructive",
            });
        } finally {
            setLoadingReport(false);
        }
    };

    // Aggregation Logic
    const groupedRecords = records.reduce((acc, record) => {
        const key = `${record.student._id}-${format(new Date(record.date), 'yyyy-MM-dd')}`;
        if (!acc[key]) {
            acc[key] = {
                id: record.student._id, // grouping key
                student: record.student,
                date: record.date,
                meals: {
                    breakfast: null,
                    lunch: null,
                    dinner: null
                }
            };
        }
        // Normalize meal key
        const mKey = record.meal.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
        if (['breakfast', 'lunch', 'dinner'].includes(mKey)) {
            acc[key].meals[mKey] = record;
        }
        return acc;
    }, {} as Record<string, { id: string, student: AttendanceRecord['student'], date: string, meals: Record<'breakfast' | 'lunch' | 'dinner', AttendanceRecord | null> }>);

    const consolidatedList = Object.values(groupedRecords)
        .filter(row => {
            if (statusFilter === 'all') return true;
            // Include row if ANY meal matches the status filters
            return Object.values(row.meals).some(m => m && m.status === statusFilter);
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const verifiedCount = records.filter(r => r.state === 'verified').length;
    const pendingCount = records.filter(r => r.state === 'pending').length;

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (passcode === "942085") {
            setIsUnlocked(true);
            sessionStorage.setItem("attendance_unlocked", "true");
            toast({
                title: "Access Granted",
                description: "Welcome to Attendance Logs.",
            });
        } else {
            toast({
                title: "Access Denied",
                description: "Incorrect passcode.",
                variant: "destructive"
            });
        }
    };

    if (!isUnlocked) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Restricted Access</CardTitle>
                        <CardDescription>Enter passcode to view attendance</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleUnlock}>
                        <CardContent>
                            <Input
                                type="password"
                                placeholder="Enter Passcode"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Unlock</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        Attendance Logs
                    </h1>
                    <p className="text-slate-500 pl-14">View and verify student attendance.</p>
                </div>

                <div className="flex gap-3">
                    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-white border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
                                <FileText className="mr-2 h-4 w-4" />
                                Monthly Report
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Monthly Attendance Report</DialogTitle>
                                <DialogDescription className="text-slate-500">Select month and year to view attendance summary.</DialogDescription>
                            </DialogHeader>

                            <div className="flex gap-4 py-4 border-b border-slate-100">
                                <Select value={reportMonth} onValueChange={setReportMonth}>
                                    <SelectTrigger className="w-[180px] bg-white border-slate-300"><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        {[...Array(12)].map((_, i) => (
                                            <SelectItem key={i} value={String(i + 1)}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={reportYear} onValueChange={setReportYear}>
                                    <SelectTrigger className="w-[120px] bg-white border-slate-300"><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-900">
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2026">2026</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={generateReport} disabled={loadingReport} className="ml-auto bg-blue-600 hover:bg-blue-700 text-white">
                                    {loadingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                                </Button>
                            </div>

                            <div className="flex-1 overflow-auto p-1">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200">
                                            <TableHead className="text-slate-500">Student</TableHead>
                                            <TableHead className="text-center text-slate-500">Days Present</TableHead>
                                            <TableHead className="text-center text-slate-500">Total Meals</TableHead>
                                            <TableHead className="text-center text-slate-500">Missed Meals</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.map((item, idx) => (
                                            <TableRow key={idx} className="border-slate-100 hover:bg-slate-50">
                                                <TableCell className="font-medium text-slate-900">
                                                    <div>{item.student.name}</div>
                                                    <div className="text-xs text-slate-500">{item.student.rollNo}</div>
                                                </TableCell>
                                                <TableCell className="text-center text-slate-700 font-bold">{item.daysPresent}</TableCell>
                                                <TableCell className="text-center text-green-600">{item.totalPresent}</TableCell>
                                                <TableCell className="text-center text-red-500">{item.totalAbsent}</TableCell>
                                            </TableRow>
                                        ))}
                                        {reportData.length === 0 && !loadingReport && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center h-32 text-slate-500">
                                                    No data generated. Click Generate to view report.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-xs font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 items-center w-full sm:w-auto">
                        <span className="text-green-600 px-2 border-r border-slate-300 flex justify-center sm:justify-start">{verifiedCount} Verified</span>
                        <span className="text-orange-500 px-2 sm:border-r border-none border-slate-300 flex justify-center sm:justify-start">{pendingCount} Pending</span>
                        <span className="text-blue-600 px-2 border-r border-slate-300 flex justify-center sm:justify-start">
                            {records.filter(r => r.status === 'present').length} Present
                        </span>
                        <span className="text-red-500 px-2 flex justify-center sm:justify-start">
                            {records.filter(r => r.status === 'absent').length} Absent
                        </span>
                    </div>
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-80" />
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1 w-full">
                            <div className="hidden sm:block"><Filter className="h-4 w-4 text-slate-400" /></div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full sm:w-[200px] justify-start text-left font-normal bg-white border-slate-300 text-slate-900 hover:bg-slate-50",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-purple-600" />
                                        {date ? format(date, "PPP") : <span>All Dates</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white border-slate-200 text-slate-900">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        className="bg-white text-slate-900"
                                    />
                                    <div className="p-3 border-t border-slate-100">
                                        <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900" onClick={() => setDate(undefined)}>Clear Date</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Select value={meal} onValueChange={setMeal}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-300 text-slate-900"><SelectValue placeholder="All Meals" /></SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900">
                                    <SelectItem value="all">All Meals</SelectItem>
                                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                                    <SelectItem value="Lunch">Lunch</SelectItem>
                                    <SelectItem value="Dinner">Dinner</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px] bg-white border-slate-300 text-slate-900"><SelectValue placeholder="All Status" /></SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-900">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                        </div>
                    ) : (
                        <>
                            {/* Mobile View */}
                            <div className="md:hidden space-y-4">
                                {consolidatedList.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">
                                        No records found.
                                    </div>
                                ) : (
                                    consolidatedList.map((row) => (
                                        <Card key={`${row.id}-${row.date}`} className="bg-white border-slate-200 shadow-sm">
                                            <CardHeader className="p-4 pb-2 border-b border-slate-100">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{row.student?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-slate-500">{row.student?.rollNo}</div>
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                        {format(new Date(row.date), 'MMM dd')}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 grid gap-3">
                                                {['breakfast', 'lunch', 'dinner'].map((m) => {
                                                    const mRec = row.meals[m as 'breakfast' | 'lunch' | 'dinner'];
                                                    if (!mRec) return null;

                                                    return (
                                                        <div key={m} className="flex items-center justify-between">
                                                            <span className="text-sm font-medium capitalize text-slate-600 w-20">{m}</span>
                                                            <div className="flex items-center gap-2 flex-1 justify-end">
                                                                <Badge
                                                                    variant="outline"
                                                                    onClick={() => handleStatusUpdate(mRec._id, mRec.meal, mRec.status === 'present' ? 'absent' : 'present')}
                                                                    className={cn(
                                                                        "border-0 px-2 py-0.5 text-[10px] cursor-pointer hover:opacity-80 transition-opacity active:scale-95 select-none w-16 justify-center",
                                                                        mRec.status === 'present'
                                                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                            : "bg-red-100 text-red-700 hover:bg-red-200"
                                                                    )}
                                                                >
                                                                    {mRec.status.toUpperCase()}
                                                                </Badge>

                                                                {mRec.state === 'verified' ? (
                                                                    <div className="flex items-center text-emerald-600 text-[10px] gap-0.5 w-16 justify-center">
                                                                        <CheckCircle className="h-4 w-4" />
                                                                        <span>Verified</span>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleVerify(mRec._id, mRec.meal)}
                                                                        className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 w-16"
                                                                    >
                                                                        Verify
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-slate-100/50">
                                            <TableHead className="text-slate-500 pl-6">Date</TableHead>
                                            <TableHead className="text-slate-500">Student</TableHead>
                                            <TableHead className="text-center text-slate-500">Breakfast</TableHead>
                                            <TableHead className="text-center text-slate-500">Lunch</TableHead>
                                            <TableHead className="text-center text-slate-500">Dinner</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {consolidatedList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-48 text-slate-500">
                                                    No records found. Try adjusting filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            consolidatedList.map((row) => (
                                                <TableRow key={`${row.id}-${row.date}`} className="border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <span className="text-slate-900 font-medium">{format(new Date(row.date), 'MMM dd, yyyy')}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                {row.student?.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-slate-900 font-medium">{row.student?.name || 'Unknown'}</div>
                                                                <div className="text-xs text-slate-500">{row.student?.rollNo}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Meal Columns */}
                                                    {['breakfast', 'lunch', 'dinner'].map((m) => {
                                                        const mRec = row.meals[m as 'breakfast' | 'lunch' | 'dinner'];

                                                        if (!mRec) {
                                                            return <TableCell key={m} className="text-center"><span className="text-slate-300">-</span></TableCell>;
                                                        }

                                                        return (
                                                            <TableCell key={m} className="text-center">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Badge
                                                                        variant="outline"
                                                                        onClick={() => handleStatusUpdate(mRec._id, mRec.meal, mRec.status === 'present' ? 'absent' : 'present')}
                                                                        className={cn(
                                                                            "border-0 px-2 py-0.5 text-[10px] cursor-pointer hover:opacity-80 transition-opacity active:scale-95 select-none w-16 justify-center",
                                                                            mRec.status === 'present'
                                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                                : "bg-red-100 text-red-700 hover:bg-red-200"
                                                                        )}
                                                                    >
                                                                        {mRec.status.toUpperCase()}
                                                                    </Badge>

                                                                    {mRec.state === 'verified' ? (
                                                                        <div className="flex items-center text-emerald-600 text-[10px] gap-0.5">
                                                                            <CheckCircle className="h-3 w-3" />
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleVerify(mRec._id, mRec.meal)}
                                                                            className="h-5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                                                                        >
                                                                            Verify
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceStatus;
