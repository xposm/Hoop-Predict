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

// This is sample data.
const data = {
  user: {
    name: "少比唐德",
    email: "tonder@example.com",
    avatar: "src/assets/tonder.jpeg",
  },
  navMain: [
    {
      title: "Predictions",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Ongoing",
          url: "#",
        },
        {
          title: "History",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
      ],
    },
    {
      title: "Model",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Documentation",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Model",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
        {
          title: "Placeholder",
          url: "#",
        },
      ],
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
