import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  House
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { GoHome } from "@/components/home-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import tonder from "@/assets/tonder.jpeg"
const data = {
  user: {
    name: "少比唐德",
    email: "你生来就是魔丸",
    avatar: tonder,
  },
  navMain: [
    {
      title: "Results",
      url: "/resultHistory",
      icon: SquareTerminal,
      
    },
    
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon"{...props}>
      <SidebarHeader>
        <GoHome />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />

      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
