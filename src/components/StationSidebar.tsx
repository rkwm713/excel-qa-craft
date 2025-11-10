import { List, Layers } from "lucide-react";
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
  currentStation: string | null;
  onStationChange: (station: string | null) => void;
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
            {!isCollapsed && "Station Navigator"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* View All option */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => onStationChange(null)}
                  isActive={currentStation === null}
                  className={cn(
                    "hover:bg-primary/10 transition-colors",
                    currentStation === null && "bg-primary/20 font-bold text-primary"
                  )}
                  tooltip="View All Stations"
                >
                  <List className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>View All Stations</span>}
                  {!isCollapsed && (
                    <Badge variant="secondary" className="ml-auto font-bold">
                      {Object.values(stationCounts).reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

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
                    tooltip={`Station ${station}`}
                  >
                    <Layers className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="font-saira">Station {station}</span>
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
