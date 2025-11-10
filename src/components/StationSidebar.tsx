import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface StationSidebarProps {
  stations: string[];
  currentStation: string;
  onStationChange: (station: string) => void;
  stationCounts: Record<string, number>;
}

export function StationSidebar({
  stations,
  currentStation,
  onStationChange,
  stationCounts,
}: StationSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider">
            {!isCollapsed && "WP Navigator"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Individual stations */}
              {stations.map((station) => (
                <SidebarMenuItem key={station}>
                  <SidebarMenuButton
                    onClick={() => onStationChange(station)}
                    isActive={currentStation === station}
                    className={cn(
                      "hover:bg-primary/10 transition-colors",
                      currentStation === station && "bg-primary/20 font-bold text-primary"
                    )}
                    tooltip={`WP ${station}`}
                  >
                    <Layers className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="font-saira">WP {station}</span>
                        <Badge 
                          variant={currentStation === station ? "default" : "secondary"} 
                          className="ml-auto font-bold"
                        >
                          {stationCounts[station] || 0}
                        </Badge>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
