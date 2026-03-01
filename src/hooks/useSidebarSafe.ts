import { useSidebar } from "@/components/ui/sidebar";

/**
 * Safe wrapper around useSidebar that returns null when used
 * outside the SidebarProvider instead of throwing an error.
 */
export function useSidebarSafe(): ReturnType<typeof useSidebar> | null {
    try {
        return useSidebar();
    } catch {
        return null;
    }
}
