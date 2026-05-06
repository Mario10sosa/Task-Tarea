import * as React from "react"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  FolderIcon,
  TerminalIcon,
  Mail,
} from "lucide-react"
import { CreateProjectDialog } from "./create-project-dialog"
import { useProjects } from "@/hooks/useProjects"
import { useUserInvitations } from "@/hooks/useInvitations"
import { useAuth } from "@/store/useAuth"
import { Link, useParams, useLocation } from "react-router-dom"
import { ModeToggle } from "./mode-toggle"
import { Badge } from "@/components/ui/badge"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: projects = [], isLoading } = useProjects()
  const { data: invitations = [] } = useUserInvitations()
  const { user } = useAuth()
  const { id: activeProjectId } = useParams()
  const location = useLocation()

  // Filter projects: only show if user is the owner OR doesn't have a pending invitation for it
  const filteredProjects = projects.filter((project: any) => {
    // If user is the owner, they always see it
    if (project.ownerId === user?.id) return true;
    
    // Check if there's a pending invitation for this project for the current user
    const hasPendingInvitation = invitations.some(
      (inv: any) => inv.projectId?._id === project?._id && inv.status === 'pending'
    );
    
    return !hasPendingInvitation;
  });

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* Primary Sidebar */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <Link to="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <TerminalIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Patrones</span>
                    <span className="truncate text-xs">App</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={location.pathname === '/'} 
                    tooltip="Proyectos" 
                    asChild 
                    className="px-2.5 md:px-2"
                  >
                     <Link to="/">
                       <FolderIcon />
                       <span>Proyectos</span>
                     </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={location.pathname === '/invitations'} 
                    tooltip="Invitaciones" 
                    asChild 
                    className="px-2.5 md:px-2"
                  >
                     <Link to="/invitations" className="flex items-center w-full">
                       <Mail />
                       <span>Invitaciones</span>
                       {invitations.length > 0 && (
                         <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] h-4 px-1 min-w-4 flex items-center justify-center rounded-full font-bold border-none">
                           {invitations.length}
                         </Badge>
                       )}
                     </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="gap-2">
          <div className="flex items-center justify-center py-2">
            <ModeToggle />
          </div>
          <NavUser user={{
            name: user?.name || "Usuario",
            email: user?.email || "",
            avatar: ""
          }} />
        </SidebarFooter>
      </Sidebar>

      {/* Secondary Sidebar */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              Tus Proyectos
            </div>
            <CreateProjectDialog />
          </div>
          <SidebarInput placeholder="Buscar proyectos..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isLoading ? (
                <div className="p-4 text-xs text-muted-foreground">Cargando proyectos...</div>
              ) : projects.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">No se encontraron proyectos.</div>
              ) : (
                filteredProjects.map((project: any) => (
                  <Link
                    to={`/projects/${project._id || project.id}`}
                    key={project._id || project.id}
                    className={`flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${activeProjectId === (project._id || project.id) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                  >
                    <span className="font-medium">{project.name}</span>
                    <span className="line-clamp-2 w-full text-xs whitespace-break-spaces text-muted-foreground">
                      {project.description}
                    </span>
                  </Link>
                ))
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
