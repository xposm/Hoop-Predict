import { House } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function GoHome() {
  const navigate = useNavigate()

  const handleNavigation = () => {
    navigate("/firstTeam")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          onClick={handleNavigation}
          tooltip="Home"
          
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <House className="size-4" />
          </div>
          Home
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
