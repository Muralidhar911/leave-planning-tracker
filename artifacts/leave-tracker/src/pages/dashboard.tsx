import { useGetStats, useListAllLeaves } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, CalendarDays, CalendarClock, ActivitySquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: leaves, isLoading: leavesLoading } = useListAllLeaves();

  const cards = [
    { title: "Total Members", value: stats?.totalMembers ?? 0, icon: Users, color: "from-purple-500 to-indigo-500", glow: "rgba(168,85,247,0.3)" },
    { title: "Leaves Today", value: stats?.leavesToday ?? 0, icon: ActivitySquare, color: "from-cyan-500 to-blue-500", glow: "rgba(6,182,212,0.3)" },
    { title: "Upcoming Leaves", value: stats?.upcomingLeaves ?? 0, icon: CalendarClock, color: "from-pink-500 to-rose-500", glow: "rgba(236,72,153,0.3)" },
    { title: "Monthly Leaves", value: stats?.monthlyLeaves ?? 0, icon: CalendarDays, color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  ];

  const recentLeaves = leaves?.slice(0, 5) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of team activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <h3 className="text-4xl font-display font-bold mt-2 text-foreground">
                        {statsLoading ? "-" : card.value}
                      </h3>
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

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentLeaves.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">No recent leaves</p>
                <p className="text-sm text-muted-foreground">Your team is fully present.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-lg font-semibold">Employee</th>
                      <th className="px-6 py-4 font-semibold">Duration</th>
                      <th className="px-6 py-4 font-semibold">Reason</th>
                      <th className="px-6 py-4 rounded-tr-lg font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((leave, i) => {
                      const isPast = new Date(leave.endDate) < new Date();
                      return (
                        <motion.tr 
                          key={leave.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-foreground">
                            {leave.userName}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {leave.reason}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge variant={isPast ? "outline" : "primary"}>
                              {isPast ? "Completed" : "Upcoming"}
                            </Badge>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
