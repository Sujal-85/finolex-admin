import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <TopNavbar />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
