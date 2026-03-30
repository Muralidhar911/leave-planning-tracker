import { useState } from "react";
import { useListAllLeaves } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { getUserColor } from "@/lib/utils";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isWithinInterval, parseISO 
} from "date-fns";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const { data: leaves } = useListAllLeaves();

  const isCurrentMonth = isSameMonth(currentDate, today);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Get unique users for legend
  const uniqueUsers = Array.from(new Set(leaves?.map(l => JSON.stringify({ id: l.userId, name: l.userName }))))
    .map(str => JSON.parse(str));

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Team Calendar</h1>
          <p className="text-muted-foreground mt-1">See when your team is away</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-9 px-3 text-primary gap-1">
              <RotateCcw className="w-3 h-3" />
              Today
            </Button>
          )}
          <div className="flex items-center gap-4 bg-card/60 border border-white/10 rounded-xl p-1 backdrop-blur-md">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="w-32 text-center font-display font-semibold text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-1">
        <div className="grid grid-cols-7 border-b border-white/5 bg-black/20 rounded-t-xl">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            // Find leaves that fall on this day
            const dayLeaves = leaves?.filter(leave => 
              isWithinInterval(day, { 
                start: parseISO(leave.startDate), 
                end: parseISO(leave.endDate) 
              })
            ) || [];

            return (
              <div 
                key={day.toString()} 
                className={cn(
                  "min-h-[120px] p-2 border-r border-b border-white/5 relative group transition-colors",
                  !isCurrentMonth && "bg-black/40",
                  dayIdx % 7 === 6 && "border-r-0",
                  dayIdx >= days.length - 7 && "border-b-0"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isToday ? "bg-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]" : 
                    isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayLeaves.map((leave) => {
                    const colorClass = getUserColor(leave.userId);
                    return (
                      <div 
                        key={leave.id} 
                        className={cn(
                          "px-2 py-1 rounded text-[10px] font-semibold truncate bg-opacity-20 border border-transparent shadow-sm",
                          colorClass.replace('bg-', 'bg-').replace('500', '500/20'),
                          colorClass.replace('bg-', 'text-').replace('500', '400')
                        )}
                        style={{
                          borderColor: `hsl(var(--accent) / 0.1)` // Generic fallback border
                        }}
                        title={`${leave.userName}: ${leave.reason}`}
                      >
                        {leave.userName.split(' ')[0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {uniqueUsers.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {uniqueUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", getUserColor(u.id))} />
                <span className="text-sm font-medium text-foreground">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
