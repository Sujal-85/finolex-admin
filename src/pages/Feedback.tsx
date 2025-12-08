import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Star, MessageCircle, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";

interface FeedbackItem {
    _id: string;
    studentId?: {
        _id: string;
        name: string;
        profileImage?: string;
    };
    studentName?: string;
    title?: string;
    message?: string;
    description?: string;
    rating: number;
    category?: string;
    type?: string;
    images?: string[];
    createdAt: string;
}

export default function Feedback() {
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const response = await api.get('/feedback');
            setFeedbackList(response.data);
        } catch (error) {
            toast.error("Failed to fetch feedback");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/feedback/${id}`);
            setFeedbackList(feedbackList.filter(item => item._id !== id));
            toast.success("Feedback deleted successfully");
        } catch (error) {
            toast.error("Failed to delete feedback");
        }
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
            />
        ));
    };

    // Calculate Stats
    const totalFeedback = feedbackList.length;
    const avgRating = totalFeedback > 0
        ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(1)
        : "0.0";

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: feedbackList.filter(f => f.rating === star).length,
        percentage: totalFeedback > 0 ? (feedbackList.filter(f => f.rating === star).length / totalFeedback) * 100 : 0
    }));



    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-black bg-clip-text text-transparent">Student Feedback</h1>
                    <p className="text-muted-foreground mt-1">Insights and ratings from your students</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                            <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                            <h3 className="text-2xl font-bold">{totalFeedback}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background border-yellow-100 dark:border-yellow-900">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                            <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400 fill-yellow-600 dark:fill-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                            <h3 className="text-2xl font-bold">{avgRating} / 5.0</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-100 dark:border-green-900">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            {ratingCounts.slice(0, 3).map((item) => (
                                <div key={item.star} className="flex items-center gap-2 text-xs">
                                    <span className="w-3">{item.star}</span>
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <Progress value={item.percentage} className="h-1.5" />
                                    <span className="w-8 text-right text-muted-foreground">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-48 animate-pulse bg-muted/50" />
                    ))}
                </div>
            ) : feedbackList.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="text-center py-16">
                        <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">No feedback yet</h3>
                        <p className="text-muted-foreground">When students submit feedback, it will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {feedbackList.map((item) => {
                        const displayName = item.studentId?.name || item.studentName || "Unknown Student";
                        const displayCategory = item.category || item.type || "Other";
                        const displayMessage = item.message || item.description || "No content";
                        const displayTitle = item.title || "Feedback";

                        return (
                            <Card key={item._id} className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                <AvatarImage src={item.studentId?.profileImage} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                    {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-base font-semibold line-clamp-1">{displayName}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {format(new Date(item.createdAt), "MMM dd, yyyy")}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="font-normal bg-secondary/50">
                                            {displayCategory}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {renderStars(item.rating)}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <h4 className="font-medium mb-2 text-foreground/90">{displayTitle}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-4">
                                        {displayMessage}
                                    </p>

                                    {/* Images Section */}
                                    {item.images && item.images.length > 0 && (
                                        <div className="mt-auto pt-2">
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {item.images.map((img, idx) => (
                                                    <Dialog key={idx}>
                                                        <DialogTrigger asChild>
                                                            <div className="relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border hover:opacity-90">
                                                                <img
                                                                    src={img}
                                                                    alt={`Attachment ${idx + 1}`}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            </div>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                                                            <img
                                                                src={img}
                                                                alt="Full size attachment"
                                                                className="w-full h-auto rounded-lg"
                                                            />
                                                        </DialogContent>
                                                    </Dialog>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(item._id)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
