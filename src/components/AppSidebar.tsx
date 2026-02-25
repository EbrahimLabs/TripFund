import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, PlusCircle, Receipt, Handshake, FileText,
  Settings, LogOut, UserCircle, Share2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", ownerOnly: false },
  { to: "/deposit", icon: PlusCircle, label: "Add Deposit", ownerOnly: true },
  { to: "/expense", icon: Receipt, label: "Add Expense", ownerOnly: true },
  { to: "/settle", icon: Handshake, label: "Settlement", ownerOnly: false },
  { to: "/summary", icon: FileText, label: "Summary", ownerOnly: false },
];

export function AppSidebar() {
  const { isOwner, activeTrip, setActiveTripId, createInvite } = useTrip();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  const filteredNav = navItems.filter((item) => !item.ownerOnly || isOwner);

  const handleLeaveTrip = () => {
    setActiveTripId(null);
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
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.to}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                      onClick={() => setOpenMobile(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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

      <SidebarFooter className="p-3 space-y-1">
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
