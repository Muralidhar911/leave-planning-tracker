import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLeaves, 
  useCreateLeave, 
  useUpdateLeave, 
  useDeleteLeave,
  useGetMe,
  getListLeavesQueryKey,
  getListAllLeavesQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, CalendarX2, CalendarDays, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const leaveSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type LeaveForm = z.infer<typeof leaveSchema>;

// Duration calculation: endDate - startDate + 1 (inclusive)
function calcDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function Leaves() {
  const queryClient = useQueryClient();
  const { data: leaves, isLoading } = useListLeaves();
  const { data: me } = useGetMe({ query: { retry: false } as never });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema)
  });

  const watchStart = watch("startDate");
  const watchEnd = watch("endDate");
  const previewDays = watchStart && watchEnd && new Date(watchEnd) >= new Date(watchStart)
    ? calcDays(watchStart, watchEnd)
    : null;

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAllLeavesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const createMutation = useCreateLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave planned ✓", type: "success" });
        setIsCreateOpen(false);
        reset();
        invalidateCache();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const updateMutation = useUpdateLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave updated ✓", type: "success" });
        setEditingId(null);
        reset();
        invalidateCache();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const deleteMutation = useDeleteLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave cancelled", type: "success" });
        invalidateCache();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const onSubmit = (data: LeaveForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const openEdit = (leave: any) => {
    setEditingId(leave.id);
    reset({
      startDate: leave.startDate.split('T')[0],
      endDate: leave.endDate.split('T')[0],
      reason: leave.reason
    });
  };

  const openCreate = () => {
    setEditingId(null);
    reset({});
    setIsCreateOpen(true);
  };

  // Summary stats
  const totalDays = leaves?.reduce((sum, l) => sum + calcDays(l.startDate, l.endDate), 0) ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const upcoming = leaves?.filter(l => l.startDate > today).length ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Leaves</h1>
            <p className="text-muted-foreground mt-1">
              Your personal leave records{me ? ` — ${me.name}` : ""}
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Plan Leave
          </Button>
        </div>

        {/* Quick stats */}
        {!isLoading && (leaves?.length ?? 0) > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Leaves", value: leaves?.length ?? 0, icon: CalendarDays, color: "from-violet-500 to-purple-600" },
              { label: "Total Days Off", value: totalDays, icon: Clock, color: "from-cyan-500 to-blue-500" },
              { label: "Upcoming", value: upcoming, icon: CalendarDays, color: "from-emerald-500 to-green-600" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="relative overflow-hidden border-white/5 bg-black/40">
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} rounded-full blur-[35px] opacity-20`} />
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-display font-bold">{s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Leaves table */}
        <Card className="border-white/5 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">Loading your leaves...</div>
            ) : !leaves?.length ? (
              <div className="py-16 text-center flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <CalendarX2 className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">No leaves planned</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  You haven't planned any time off yet. Take a well-deserved break!
                </p>
                <Button variant="secondary" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Plan Leave
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 font-semibold">
                        <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Name</div>
                      </th>
                      <th className="px-6 py-4 font-semibold">Start Date</th>
                      <th className="px-6 py-4 font-semibold">End Date</th>
                      <th className="px-6 py-4 font-semibold text-center">Duration</th>
                      <th className="px-6 py-4 font-semibold">Reason</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {leaves.map((leave, i) => {
                        const days = calcDays(leave.startDate, leave.endDate);
                        const isPast = leave.endDate < today;
                        const isActive = leave.startDate <= today && leave.endDate >= today;
                        const isUpcoming = leave.startDate > today;

                        return (
                          <motion.tr
                            key={leave.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                              isActive && "bg-emerald-500/[0.04]",
                              isPast && "opacity-70"
                            )}
                          >
                            {/* Name */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center text-xs font-bold text-white">
                                  {(leave.userName ?? me?.name ?? "?").charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">
                                  {leave.userName ?? me?.name}
                                </span>
                                {isActive && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                                    On Leave
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {formatDate(leave.startDate)}
                            </td>

                            {/* End Date */}
                            <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                              {formatDate(leave.endDate)}
                            </td>

                            {/* Duration */}
                            <td className="px-6 py-4 text-center">
                              <Badge variant="outline" className={cn(
                                "bg-white/5 font-semibold",
                                days >= 5 && "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              )}>
                                {days} day{days > 1 ? "s" : ""}
                              </Badge>
                            </td>

                            {/* Reason */}
                            <td className="px-6 py-4 text-muted-foreground max-w-[220px] truncate">
                              {leave.reason}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEdit(leave)}
                                  className="h-8 w-8"
                                  title="Edit leave"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    if (confirm("Cancel this leave request?")) {
                                      deleteMutation.mutate({ id: leave.id });
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                  className="h-8 w-8"
                                  title="Delete leave"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
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
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingId}
        onClose={() => { setIsCreateOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Leave" : "Plan New Leave"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">
                Start Date
              </label>
              {/* Input type=date uses color-scheme:light via global CSS — visible on dark theme */}
              <Input type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">
                End Date
              </label>
              <Input type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Live duration preview */}
          {previewDays !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">{previewDays} day{previewDays > 1 ? "s" : ""} off</span>
              <span className="text-muted-foreground text-xs">({watchStart} → {watchEnd})</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">
              Reason
            </label>
            <Input {...register("reason")} placeholder="Vacation, Sick leave, Personal, etc." />
            {errors.reason && (
              <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setIsCreateOpen(false); setEditingId(null); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Save Changes" : "Submit Leave"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
