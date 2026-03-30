import { useState, useMemo, useEffect } from "react";
import { useGetInsights, useListUsers, GetInsightsPeriod } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ButtonGroup } from "@/components/ui/button-group";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, CalendarDays, CalendarClock, History, ChevronLeft, ChevronRight, ActivitySquare, RotateCcw } from "lucide-react";
import { cn, formatDate, getUserColor } from "@/lib/utils";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isWithinInterval, parseISO 
} from "date-fns";

export default function Insights() {
  const [userId, setUserId] = useState<string>("all");
  const [period, setPeriod] = useState<GetInsightsPeriod>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customApplied, setCustomApplied] = useState<{ start: string; end: string } | null>(null);

  // Calendar state — always initializes to current month
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);

  const { data: users } = useListUsers();

  // ─── Reactive API params ────────────────────────────────────────────────
  // Auto-applies whenever userId or period changes. Custom range only applies
  // after "Apply Filters" is clicked to avoid mid-typing calls.
  const fetchParams = useMemo(() => {
    const params: Record<string, string> = {};

    if (userId !== "all") params.userId = userId;

    if (period === "custom") {
      if (customApplied?.start) params.startDate = customApplied.start;
      if (customApplied?.end) params.endDate = customApplied.end;
    } else {
      params.period = period;
    }

    return params;
  }, [userId, period, customApplied]);

  // Reset calendar to current month whenever the active filter changes
  useEffect(() => {
    setCurrentDate(new Date());
  }, [fetchParams]);

  const { data: insights, isLoading } = useGetInsights(fetchParams as any, {
    query: { retry: false },
  });

  const handleApplyCustom = () => {
    if (!startDate || !endDate) return;
    setCustomApplied({ start: startDate, end: endDate });
  };

  const handleUserChange = (value: string) => {
    setUserId(value);
    // Calendar will auto-reset via useEffect above
  };

  const handlePeriodChange = (value: GetInsightsPeriod) => {
    setPeriod(value);
    setCustomApplied(null);
    setCurrentDate(new Date()); // Reset calendar immediately
  };

  // ─── Summary metrics ───────────────────────────────────────────────────
  const cards = [
    { title: "Total Leaves", value: insights?.totalLeaves ?? 0, icon: ActivitySquare, color: "from-purple-500 to-indigo-500", glow: "rgba(168,85,247,0.3)" },
    { title: "Upcoming Leaves", value: insights?.upcomingLeaves ?? 0, icon: CalendarClock, color: "from-cyan-500 to-blue-500", glow: "rgba(6,182,212,0.3)" },
    { title: "Past Leaves", value: insights?.pastLeaves ?? 0, icon: History, color: "from-pink-500 to-rose-500", glow: "rgba(236,72,153,0.3)" },
  ];

  // ─── Calendar logic ────────────────────────────────────────────────────
  const isCurrentMonth = isSameMonth(currentDate, today);
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Selected user name for display
  const selectedUser = users?.find(u => u.id === userId);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Insights</h1>
          <p className="text-muted-foreground mt-1">Analyze team leave patterns and trends</p>
        </div>

        {/* Filter Panel */}
        <div className="glass-panel p-5 rounded-2xl sticky top-0 z-30">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">

            {/* User Selector — auto-applies on change */}
            <div className="w-full md:w-64 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</label>
              <Select value={userId} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Buttons — auto-applies on change */}
            <div className="w-full md:w-auto space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Period</label>
              <ButtonGroup>
                <Button 
                  variant={period === "week" ? "primary" : "secondary"} 
                  onClick={() => handlePeriodChange("week")}
                  className={cn(period === "week" ? "shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "")}
                >
                  This Week
                </Button>
                <Button 
                  variant={period === "month" ? "primary" : "secondary"} 
                  onClick={() => handlePeriodChange("month")}
                  className={cn(period === "month" ? "shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "")}
                >
                  This Month
                </Button>
                <Button 
                  variant={period === "custom" ? "primary" : "secondary"} 
                  onClick={() => handlePeriodChange("custom")}
                  className={cn(period === "custom" ? "shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "")}
                >
                  Custom Range
                </Button>
              </ButtonGroup>
            </div>

            {/* Custom date range (requires Apply click to avoid mid-type refetching) */}
            {period === "custom" && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex gap-2 w-full md:w-auto overflow-hidden items-end"
                >
                  <div className="space-y-1.5 w-full md:w-36">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 w-full md:w-36">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                  <Button 
                    onClick={handleApplyCustom} 
                    variant="primary"
                    className="shrink-0"
                    disabled={!startDate || !endDate}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Active filter indicator */}
          {(userId !== "all" || period !== "month") && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {userId !== "all" && selectedUser && (
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
                  {selectedUser.name}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-white/5">
                {period === "week" ? "This Week" : period === "month" ? "This Month" : "Custom Range"}
              </Badge>
              <button 
                onClick={() => { setUserId("all"); handlePeriodChange("month"); setStartDate(""); setEndDate(""); setCustomApplied(null); }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden group border-white/5 bg-black/40 backdrop-blur-sm">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <h3 className="text-4xl font-display font-bold mt-2 text-foreground">
                        {isLoading ? "-" : card.value}
                      </h3>
                      {userId !== "all" && selectedUser && (
                        <p className="text-xs text-muted-foreground mt-1">{selectedUser.name}</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-[0_0_15px_${card.glow}]`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Details Table */}
        <Card className="border-white/5 bg-black/40 backdrop-blur-sm">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-display font-semibold text-foreground">
              Detailed Leaves
              {userId !== "all" && selectedUser && (
                <span className="ml-2 text-sm font-normal text-primary">— {selectedUser.name}</span>
              )}
            </h3>
            {!isLoading && (
              <Badge variant="outline" className="bg-white/5">
                {insights?.leaves?.length ?? 0} records
              </Badge>
            )}
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground animate-pulse">Loading insights...</div>
            ) : !insights?.leaves?.length ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium text-lg">No leaves found</p>
                <p className="text-sm text-muted-foreground">
                  {userId !== "all" && selectedUser
                    ? `${selectedUser.name} has no leaves in this period.`
                    : "No leaves found for the selected period."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-semibold">User Name</th>
                      <th className="px-6 py-4 font-semibold">Start Date</th>
                      <th className="px-6 py-4 font-semibold">End Date</th>
                      <th className="px-6 py-4 font-semibold text-center">No. of Days</th>
                      <th className="px-6 py-4 font-semibold">Reason</th>
                      <th className="px-6 py-4 font-semibold text-right">Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {insights.leaves.map((leave, i) => {
                        const colorClass = getUserColor(leave.userId);
                        return (
                          <motion.tr 
                            key={leave.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.04 }}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-4 font-medium">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", colorClass)} />
                                <span className="text-foreground">{leave.userName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(leave.startDate)}</td>
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{formatDate(leave.endDate)}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className="bg-white/5">{leave.numberOfDays}</Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{leave.reason}</td>
                            <td className="px-6 py-4 text-muted-foreground text-right whitespace-nowrap text-xs">
                              {formatDate(leave.createdAt)}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Calendar — always starts on current month, resets with filter changes */}
        <Card className="border-white/5 bg-black/40 backdrop-blur-sm p-1">
          <div className="flex justify-between items-center p-4">
            <h3 className="text-lg font-display font-semibold text-foreground">
              Trend Calendar
              {userId !== "all" && selectedUser && (
                <span className="ml-2 text-sm font-normal text-primary">— {selectedUser.name}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {!isCurrentMonth && (
                <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs h-8 px-3 text-primary gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Today
                </Button>
              )}
              <div className="flex items-center gap-2 bg-card/60 border border-white/10 rounded-xl p-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="w-28 text-center text-sm font-semibold text-foreground">
                  {format(currentDate, "MMM yyyy")}
                </span>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-b border-white/5 bg-black/20">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, dayIdx) => {
              const isCurrentMonthDay = isSameMonth(day, monthStart);
              const isTodayDay = isSameDay(day, new Date());

              // Only show leaves from the filtered dataset (auto-filtered by user via API)
              const dayLeaves = insights?.leaves?.filter(leave =>
                isWithinInterval(day, {
                  start: parseISO(leave.startDate),
                  end: parseISO(leave.endDate),
                })
              ) || [];

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[80px] p-1.5 border-r border-b border-white/5 relative transition-colors",
                    !isCurrentMonthDay && "bg-black/40",
                    dayIdx % 7 === 6 && "border-r-0",
                    dayIdx >= days.length - 7 && "border-b-0"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                      isTodayDay ? "bg-primary text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]" :
                      isCurrentMonthDay ? "text-foreground" : "text-muted-foreground/50"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[9px] text-muted-foreground bg-white/5 px-1 rounded">
                        {dayLeaves.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 mt-1">
                    {dayLeaves.slice(0, 3).map((leave) => {
                      const colorClass = getUserColor(leave.userId);
                      return (
                        <div
                          key={leave.id}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-medium truncate",
                            colorClass.replace("bg-", "bg-").replace("500", "500/20"),
                            colorClass.replace("bg-", "text-").replace("500", "400")
                          )}
                          title={`${leave.userName}: ${leave.reason}`}
                        >
                          {leave.userName.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayLeaves.length > 3 && (
                      <div className="text-[9px] text-muted-foreground px-1">
                        +{dayLeaves.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
