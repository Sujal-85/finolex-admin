import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

export default function Settings() {
  // Helper to load from localStorage
  const loadFromStorage = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [generalSettings, setGeneralSettings] = useState(() =>
    loadFromStorage('settings_general', {
      collegeName: "",
      canteenName: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
    })
  );

  const [notificationSettings, setNotificationSettings] = useState(() =>
    loadFromStorage('settings_notifications', {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      paymentReminders: true,
      complaintAlerts: true,
    })
  );

  const [systemSettings, setSystemSettings] = useState(() =>
    loadFromStorage('settings_system', {
      currency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "dd/MM/yyyy",
      language: "en",
    })
  );

  // const [logoName, setLogoName] = useState<string | null>(localStorage.getItem('settings_logoName'));
  // Don't load from localStorage - fetch from server instead to avoid QuotaExceededError
  const [logoName, setLogoName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    // Exclude logoUrl from localStorage as it can be too large (Base64)
    const { logoUrl, ...settingsToSave } = generalSettings as any;
    localStorage.setItem('settings_general', JSON.stringify(settingsToSave));
  }, [generalSettings]);

  useEffect(() => {
    localStorage.setItem('settings_notifications', JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    localStorage.setItem('settings_system', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Removed logoName localStorage useEffect to prevent crash

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      const data = response.data;

      setGeneralSettings({
        collegeName: data.collegeName || "",
        canteenName: data.canteenName || "",
        address: data.address || "",
        contactEmail: data.contactEmail || "",
        contactPhone: data.contactPhone || "",
      });

      if (data.notificationSettings) {
        setNotificationSettings(data.notificationSettings);
      }

      setSystemSettings({
        currency: data.currency || "INR",
        timezone: data.timezone || "Asia/Kolkata",
        dateFormat: data.dateFormat || "dd/MM/yyyy",
        language: data.language || "en",
      });

      if (data.logoUrl) {
        setLogoName(data.logoUrl);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      await api.patch('/settings', generalSettings);
      toast({
        title: "Settings Saved",
        description: "General settings updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save general settings",
        variant: "destructive",
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await api.patch('/settings', { notificationSettings });
      toast({
        title: "Settings Saved",
        description: "Notification preferences updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    }
  };

  const handleSaveSystem = async () => {
    try {
      await api.patch('/settings', systemSettings);
      toast({
        title: "Settings Saved",
        description: "System settings updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    }
  };

  const handleLogoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoName(base64String); // Using logoName state to store the preview/base64 for now
        setGeneralSettings(prev => ({ ...prev, logoUrl: base64String } as any));

        toast({
          title: "Logo Selected",
          description: `${file.name} selected. Save general settings to apply.`,
        });
      };
      reader.readAsDataURL(file);
    }
  };



  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system settings</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>College Information</CardTitle>
              <CardDescription>Basic information about your college and canteen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  value={generalSettings.collegeName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, collegeName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="canteenName">Canteen/Mess Name</Label>
                <Input
                  id="canteenName"
                  value={generalSettings.canteenName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, canteenName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={generalSettings.address}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>College Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative border">
                    {logoName ? (
                      <img
                        src={logoName}
                        alt="College Logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No Logo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  <Button variant="outline" onClick={handleLogoUploadClick}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>Manage administrator account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin Name</Label>
                <Input id="adminName" defaultValue="Admin User" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input id="adminEmail" type="email" defaultValue="admin@xyzcollege.edu" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
              </div>

              <div className="pt-4">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Update Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Configure user roles and permissions (Coming Soon)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Role management features will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-notif">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  id="sms-notif"
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notif">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-reminders">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Send automatic payment reminders to students
                  </p>
                </div>
                <Switch
                  id="payment-reminders"
                  checked={notificationSettings.paymentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, paymentReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="complaint-alerts">Complaint Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new complaints are submitted
                  </p>
                </div>
                <Switch
                  id="complaint-alerts"
                  checked={notificationSettings.complaintAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, complaintAlerts: checked })
                  }
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveNotifications}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={systemSettings.currency} onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, currency: value })
                  }>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={systemSettings.timezone} onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, timezone: value })
                  }>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={systemSettings.dateFormat} onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, dateFormat: value })
                  }>
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={systemSettings.language} onValueChange={(value) =>
                    setSystemSettings({ ...systemSettings, language: value })
                  }>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveSystem}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Backup and data retention settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data Retention Period</Label>
                <Select defaultValue="365">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                    <SelectItem value="730">2 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">Create Backup</Button>
                <Button variant="outline">Restore Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
