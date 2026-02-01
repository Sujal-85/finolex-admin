import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import api from "@/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Mail, Shield, User } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Profile() {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : {
            name: 'Admin User',
            email: 'admin@finolex.edu',
            role: 'Super Admin',
            avatar: '/avatars/admin.png'
        };
    });

    const [avatarUrl, setAvatarUrl] = useState(user.avatar || "/avatars/admin.png");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            try {
                // Update localStorage
                const updatedUser = { ...user, avatar: avatarUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);

                // Dispatch event to update navbar
                window.dispatchEvent(new Event('userUpdated'));

                setIsLoading(false);
                toast.success("Profile updated successfully!");
            } catch (error) {
                console.error("Storage error:", error);
                setIsLoading(false);
                toast.error("Failed to save profile locally (Storage Full). Try a smaller image.");
            }
        }, 1000);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image is too large. Please select an image under 5MB.");
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);

            const toastId = toast.loading("Uploading avatar...");

            try {
                // Use api client which handles baseURL and auth
                const response = await api.post('/upload/avatar', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });

                const data = response.data;

                // Update state
                setAvatarUrl(data.avatar);
                const updatedUser = { ...user, avatar: data.avatar };
                setUser(updatedUser);

                // Update local storage
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Dispatch event
                window.dispatchEvent(new Event('userUpdated'));

                toast.success("Avatar uploaded and profile updated!", { id: toastId });

            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload avatar", { id: toastId });
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profile & Settings</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 overflow-x-auto flex-nowrap whitespace-nowrap custom-scrollbar">
                    <TabsTrigger value="general" className="flex-1 sm:flex-initial">General</TabsTrigger>
                    <TabsTrigger value="security" className="flex-1 sm:flex-initial">Security</TabsTrigger>
                    <TabsTrigger value="notifications" className="flex-1 sm:flex-initial">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Update your personal information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <Avatar className="h-20 w-20 border-2 border-primary/10">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">{user.name?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-2 w-full sm:w-auto">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <Button variant="outline" size="sm" onClick={handleAvatarClick} className="w-full sm:w-auto">Change Avatar</Button>
                                    <p className="text-[10px] sm:text-xs text-center sm:text-left text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={user.name}
                                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                                            className="pl-9 h-10 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={user.email}
                                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                                            className="pl-9 h-10 text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-xs sm:text-sm">Role</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="role" value={user.role || 'Admin'} className="pl-9 h-10 text-sm sm:text-base bg-muted/30" disabled />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-lg sm:text-xl">Security Settings</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Manage your password and security preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4 sm:p-6">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="current-password" type="password" className="pl-9 h-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="new-password" type="password" className="pl-9 h-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="confirm-password" type="password" className="pl-9 h-10" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Choose what you want to be notified about.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4 sm:p-6">
                            <div className="flex items-center justify-between space-x-2 p-1">
                                <div className="space-y-0.5">
                                    <Label className="text-sm sm:text-base">New Payments</Label>
                                    <p className="text-xs text-muted-foreground">Receive notifications when a new payment is recorded.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2 p-1">
                                <div className="space-y-0.5">
                                    <Label className="text-sm sm:text-base">New Complaints</Label>
                                    <p className="text-xs text-muted-foreground">Receive notifications when a new complaint is filed.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2 p-1">
                                <div className="space-y-0.5">
                                    <Label className="text-sm sm:text-base">System Updates</Label>
                                    <p className="text-xs text-muted-foreground">Receive notifications about system maintenance and updates.</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
