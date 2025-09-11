import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CommandDialogDemo } from "@/components/popover-command";
import { motion, AnimatePresence } from 'framer-motion';

const SelectionIndicator = () => {
  const location = useLocation();
  const isFirstTeam = location.pathname === '/firstTeam';
  const isSecondTeam = location.pathname === '/secondTeam';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm border rounded-full px-6 py-3 shadow-lg z-50"
    >
      <div className="flex items-center gap-4 text-sm">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ 
            scale: isFirstTeam ? 1.05 : 1,
            opacity: isFirstTeam ? 1 : 0.7 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors duration-300 ${
            isFirstTeam ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className={`transition-colors duration-300 ${
            isFirstTeam ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}>
            Team A Selection
          </span>
        </motion.div>

        <div className="w-px h-6 bg-muted-foreground/30" />

        <motion.div 
          className="flex items-center gap-3"
          animate={{ 
            scale: isSecondTeam ? 1.05 : 1,
            opacity: isSecondTeam ? 1 : 0.7 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors duration-300 ${
            isSecondTeam ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <span className={`transition-colors duration-300 ${
            isSecondTeam ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}>
            Team B Selection
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Layout = () => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';
    const showIndicator = ["/firstTeam", "/secondTeam"].includes(location.pathname);

    return (
        // Fixed height and hidden overflow to prevent any scrolling
        <div className="app-layout h-screen overflow-hidden bg-background">
           <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="h-screen overflow-hidden">
                    {!isLandingPage && (
                        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                         </div>
                        </header>
                    )}
                    <CommandDialogDemo />
                    
                    {/* Route content container with exact height control */}
                    <div className="h-full overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                            <Outlet key={location.pathname} />
                        </AnimatePresence>
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {showIndicator && <SelectionIndicator />}
                    </AnimatePresence>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
};

export default Layout;
