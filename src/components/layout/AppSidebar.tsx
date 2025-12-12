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
} from "lucide-react";
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

  // Dynamic role check on render
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'admin';

  const mainNavItems = role === 'manager' ? [
    // Manager (Canteen Owner) - Needs Full Access
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Students", url: "/students", icon: Users },
    { title: "Payments", url: "/payments", icon: CreditCard },
    { title: "Settlement", url: "/settlement", icon: CreditCard },
    { title: "Transactions", url: "/transactions", icon: Receipt },
    { title: "Plans & Pricing", url: "/plans", icon: Tag },
  ] : [
    // Admin (College Staff) - Limited View (Orders & Settlement only)
    { title: "Admin Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Mess Orders", url: "/admin/orders", icon: UtensilsCrossed },
    { title: "Settlement", url: "/settlement", icon: CreditCard },
  ];

  const managementItems = role === 'manager' ? [
    // Manager (Canteen Owner) - Needs Full Access
    { title: "Mess Orders", url: "/admin/orders", icon: UtensilsCrossed }, // They need to see/act on orders
    { title: "Menu", url: "/menu", icon: UtensilsCrossed },
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "Complaints", url: "/complaints", icon: MessageSquare },
    { title: "Feedback", url: "/feedback", icon: Star },
    { title: "Inventory", url: "/inventory", icon: UtensilsCrossed }, // Assuming Inventory exists or should be here
  ] : [
    // Admin (College Staff) - Restricted
  ];

  const systemItems = role === 'manager' ? [
    // Manager (Canteen Owner) - Needs Full Access
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Activity Log", url: "/activity", icon: FileText },
    { title: "Settings", url: "/settings", icon: Settings },
  ] : [
    // Admin (College Staff) - Restricted
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex items-center justify-center rounded-lg">
            {/* <UtensilsCrossed className="h-4 w-4 text-primary-foreground" /> */}
            <img
              src={role === 'manager' ? "/logo.png" : "/famt-logo.png"}
              className={`rounded-full w-12 h-18 ${role !== 'manager' ? 'rounded-xl bg-white w-14 h-18' : ''}`}
              alt="Logo"
            />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {role === 'manager' ? 'Canteen Admin' : 'FAMT Admin'}
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
