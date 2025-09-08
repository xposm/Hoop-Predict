import { Outlet, useLocation } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { CommandDialogDemo } from "@/components/popover-command"

const Layout = () => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    return (
        <div className="app-layout">
           <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    {!isLandingPage && (
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                         </div>
                        </header>
                    )}
                    <CommandDialogDemo />
                    <Outlet />
                </SidebarInset>
            </SidebarProvider>
        </div>);
};

export default Layout;