import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Users,
  CreditCard,
  UtensilsCrossed,
  Megaphone,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Tag,
  Star,
  Receipt,
  LogOut,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open, setOpenMobile, isMobile } = useSidebar();

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const role = user.role || 'admin';

  const mainNavItems = role === 'manager' ? [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Students", url: "/students", icon: Users },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Settlement", url: "/settlement", icon: CreditCard },
    { title: "Transactions", url: "/transactions", icon: Receipt },
    { title: "Plans & Pricing", url: "/plans", icon: Tag },
  ] : [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Mess Orders", url: "/admin/orders", icon: UtensilsCrossed },
    { title: "Settlement", url: "/settlement", icon: CreditCard },
  ];

  const managementItems = role === 'manager' ? [
    { title: "Mess Orders", url: "/admin/orders", icon: UtensilsCrossed },
    { title: "Daily Attendance", url: "/attendance/entry", icon: Users },
    { title: "Attendance Status", url: "/attendance/status", icon: FileText },
    { title: "Menu", url: "/menu", icon: UtensilsCrossed },
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "Complaints", url: "/complaints", icon: MessageSquare },
    { title: "Feedback", url: "/feedback", icon: Star },
    { title: "Inventory", url: "/inventory", icon: UtensilsCrossed },
  ] : [];

  const systemItems = role === 'manager' ? [
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Activity Log", url: "/activity", icon: FileText },
    { title: "Settings", url: "/settings", icon: Settings },
  ] : [
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Sidebar is wrapped in a dark container via generic styling or here explicitly */}
      <div className="flex h-full flex-col bg-[#0f172a] text-slate-300 w-full" data-theme="dark">
        {/* Header */}
        {/* Header - Fixed Height & Padding adjustments */}
        <div className={`flex items-center gap-3 transition-all duration-300 ${open ? 'px-6 py-8' : 'px-2 py-6 justify-center'}`}>
          <div className="relative flex items-center justify-center shrink-0">
            <div className={`absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full ${!open && 'hidden'}`}></div>
            <img
              src={role === 'manager' ? "/logo.png" : "/famt-logo.png"}
              className={`relative rounded-xl object-contain bg-white/10 p-1 border border-white/10 shadow-lg transition-all duration-300 ${open ? 'w-10 h-10' : 'w-8 h-8'}`}
              alt="Logo"
            />
          </div>
          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${open ? 'w-auto opacity-100 ml-0' : 'w-0 opacity-0 ml-[-10px]'}`}>
            <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
              {role === 'manager' ? 'Finolex' : 'FAMT Admin'}
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase whitespace-nowrap">
              {role === 'manager' ? 'Canteen Manager' : 'Portal'}
            </span>
          </div>
        </div>

        <SidebarContent className={`space-y-6 transition-all duration-300 ${open ? 'px-3' : 'px-2'}`}>
          <SidebarGroup>
            <SidebarGroupLabel className={`text-slate-500 text-xs font-bold tracking-wider uppercase mb-2 transition-all duration-300 ${open ? 'px-4 opacity-100' : 'px-0 opacity-0 h-0 hidden'}`}>
              Main Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-11 w-full">
                      <NavLink
                        to={item.url}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group text-sm font-medium hover:bg-white/10 text-slate-400 hover:text-white"
                        activeClassName="bg-blue-600 text-white shadow-lg shadow-blue-900/50 hover:bg-blue-700"
                      >
                        <item.icon className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="group-hover:translate-x-0.5 transition-transform">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {managementItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-slate-500 text-xs font-bold tracking-wider uppercase px-4 mb-2">Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-11 w-full">
                        <NavLink
                          to={item.url}
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group text-sm font-medium hover:bg-white/10 text-slate-400 hover:text-white"
                          activeClassName="bg-blue-600 text-white shadow-lg shadow-blue-900/50 hover:bg-blue-700"
                        >
                          <item.icon className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100 transition-opacity" />
                          <span className="group-hover:translate-x-0.5 transition-transform">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-500 text-xs font-bold tracking-wider uppercase px-4 mb-2">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-11 w-full">
                      <NavLink
                        to={item.url}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group text-sm font-medium hover:bg-white/10 text-slate-400 hover:text-white"
                        activeClassName="bg-blue-600 text-white shadow-lg shadow-blue-900/50 hover:bg-blue-700"
                      >
                        <item.icon className="h-[18px] w-[18px] opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="group-hover:translate-x-0.5 transition-transform">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Profile Footer */}
        <div className={`mt-auto transition-all duration-300 ${open ? 'p-4' : 'p-2'}`}>
          <div className={`flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all duration-300 ${open ? 'p-3' : 'p-2 justify-center'}`}>
            <Avatar className="h-10 w-10 border-2 border-slate-700 shadow-md shrink-0">
              <AvatarImage src={user.avatar} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white font-bold text-sm">
                {user.name && user.name[0] ? user.name[0].toUpperCase() : 'A'}
              </AvatarFallback>
            </Avatar>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name || 'Admin User'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email || 'admin@finolex.edu'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
