import {
  Settings, LogOut, UserCircle, Share2, Sun, Moon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Wallet, MapPin } from "lucide-react";

export function AppSidebar() {
  const { isOwner, activeTrip, setActiveTripId, createInvite } = useTrip();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleLeaveTrip = () => {
    setActiveTripId(null);
    setOpenMobile(false);
    navigate("/");
  };

  const handleShareTrip = async () => {
    if (!activeTrip) return;
    const token = await createInvite("");
    if (!token) { toast.error("Failed to create share link"); return; }
    const url = `${window.location.origin}/invite/${token}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Join "${activeTrip.name}" on TripFund`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied!");
    }
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shrink-0">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm truncate">{activeTrip?.name || "TripFund"}</p>
            <p className="text-xs text-sidebar-foreground/50">{activeTrip?.members.length || 0} members</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {isOwner && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
              Manage
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/settings"
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      onClick={() => setOpenMobile(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Trip Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      onClick={handleShareTrip}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share Trip Link</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs text-sidebar-foreground/50">Theme</span>
          <ThemeToggle />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/account"
                end
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                onClick={() => setOpenMobile(false)}
              >
                <UserCircle className="h-4 w-4" />
                <span>Account</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={handleLeaveTrip}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Trip</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
