import { AppSidebar } from "@/components/app-sidebar"
import { ComboboxDemo } from "@/components/combobox"
import { CommandDialogDemo } from "@/components/popover-command"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>
        {/* Command dialog box for choices and search */}
        <CommandDialogDemo />
        {/* Two comboboxes side by side */}
        <div className="flex flex-1 items-center justify-center gap-10">
          <ComboboxDemo />
          <ComboboxDemo />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}