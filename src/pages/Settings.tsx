
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, Building, Users, Bell, Sliders, X, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    collegeName: "",
    canteenName: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    logoUrl: "",
    // Include these here for API convenience, though managed in separate tab mentally
    departments: [] as string[],
    serviceTypes: [] as string[]
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    paymentReminders: true,
    complaintAlerts: true,
  });

  // Logo Preview State
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Temporary State for List Management
  const [newDepartment, setNewDepartment] = useState("");
  const [newService, setNewService] = useState("");

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
        logoUrl: data.logoUrl || "",
        departments: data.departments || ["Computer", "IT", "EXTC"],
        serviceTypes: data.serviceTypes || ["Tea & Snacks", "Lunch"]
      });

      if (data.logoUrl) setLogoPreview(data.logoUrl);
      if (data.notificationSettings) setNotificationSettings(data.notificationSettings);

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

  const handleSaveAll = async () => {
    try {
      // Save everything in one go or separate checks
      await api.patch('/settings', {
        ...generalSettings,
        notificationSettings
      });
      toast({
        title: "Settings Saved",
        description: "All configurations updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setGeneralSettings(prev => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- List Management Helpers ---
  const addDepartment = () => {
    if (!newDepartment.trim()) return;
    if (generalSettings.departments.includes(newDepartment.trim())) return;
    setGeneralSettings(prev => ({
      ...prev,
      departments: [...prev.departments, newDepartment.trim()]
    }));
    setNewDepartment("");
  };

  const removeDepartment = (dept: string) => {
    setGeneralSettings(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d !== dept)
    }));
  };

  const addService = () => {
    if (!newService.trim()) return;
    if (generalSettings.serviceTypes.includes(newService.trim())) return;
    setGeneralSettings(prev => ({
      ...prev,
      serviceTypes: [...prev.serviceTypes, newService.trim()]
    }));
    setNewService("");
  };

  const removeService = (service: string) => {
    setGeneralSettings(prev => ({
      ...prev,
      serviceTypes: prev.serviceTypes.filter(s => s !== service)
    }));
  };

  if (isLoading) return <Loader />;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-700">
              <Sliders size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
              <p className="text-slate-500">Manage application configuration</p>
            </div>
          </div>
          <Button onClick={handleSaveAll} className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white p-1 border border-slate-200 rounded-xl shadow-sm inline-flex h-auto gap-1">
            <TabsTrigger value="general" className="px-6 py-2 rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">General</TabsTrigger>
            <TabsTrigger value="orders" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Order Config</TabsTrigger>
            <TabsTrigger value="users" className="px-6 py-2 rounded-lg data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">Admin Account</TabsTrigger>
            <TabsTrigger value="notifications" className="px-6 py-2 rounded-lg data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">College Information</CardTitle>
                  <CardDescription>Details used in headers and reports</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="collegeName">College Name (Header Line 2)</Label>
                    <Input
                      id="collegeName"
                      value={generalSettings.collegeName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, collegeName: e.target.value })}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="canteenName">Canteen Name (Header Line 1)</Label>
                    <Input
                      id="canteenName"
                      value={generalSettings.canteenName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, canteenName: e.target.value })}
                      className="bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address & Footer Text</Label>
                  <Textarea
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    rows={3}
                    className="bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>College Logo</Label>
                  <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <div className="h-24 w-24 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm relative">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <span className="text-xs text-slate-400">No Logo</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Logo
                      </Button>
                      <p className="text-xs text-slate-500 mt-2">Recommended: PNG / Transparent background</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Configuration (NEW RELEVANT FEATURE) */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Departments Manager */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Departments</CardTitle>
                  <CardDescription>Manage departments listed in Create Order</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add Department (e.g. IT)"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="bg-slate-50"
                      onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                    />
                    <Button onClick={addDepartment} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {generalSettings.departments.map((dept, idx) => (
                      <div key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 group">
                        {dept}
                        <button onClick={() => removeDepartment(dept)} className="text-blue-400 hover:text-blue-800 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Types Manager */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Service Types</CardTitle>
                  <CardDescription>Define standard services offered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add Service (e.g. Lunch)"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      className="bg-slate-50"
                      onKeyDown={(e) => e.key === 'Enter' && addService()}
                    />
                    <Button onClick={addService} size="icon" className="shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {generalSettings.serviceTypes.map((service, idx) => (
                      <div key={idx} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 group">
                        {service}
                        <button onClick={() => removeService(service)} className="text-emerald-400 hover:text-emerald-800 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Admin Account</CardTitle>
                  <CardDescription>Security and access settings</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email</Label>
                    <Input id="adminEmail" type="email" defaultValue="admin@xyzcollege.edu" className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Admin Name</Label>
                    <Input id="adminName" defaultValue="Admin User" className="bg-slate-50" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <h4 className="text-sm font-medium text-slate-800 mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input type="password" placeholder="Current Password" />
                    <Input type="password" placeholder="New Password" />
                    <Input type="password" placeholder="Confirm Password" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <CardTitle className="text-lg">Notification Preferences</CardTitle>
                  <CardDescription>Manage system alerts and emails</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive daily summaries via email', key: 'emailNotifications' },
                  { id: 'sms', label: 'SMS Alerts', desc: 'Get urgent alerts on mobile (Costs apply)', key: 'smsNotifications' },
                  { id: 'push', label: 'Push Notifications', desc: 'Browser notifications for new orders', key: 'pushNotifications' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="space-y-0.5">
                      <Label htmlFor={item.id} className="text-base">{item.label}</Label>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                    <Switch
                      id={item.id}
                      checked={(notificationSettings as any)[item.key]}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
