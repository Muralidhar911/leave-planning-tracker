import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListLeaves, 
  useCreateLeave, 
  useUpdateLeave, 
  useDeleteLeave,
  getListLeavesQueryKey,
  getListAllLeavesQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, CalendarX2 } from "lucide-react";

const leaveSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be before start date",
  path: ["endDate"],
});

type LeaveForm = z.infer<typeof leaveSchema>;

export default function Leaves() {
  const queryClient = useQueryClient();
  const { data: leaves, isLoading } = useListLeaves();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema)
  });

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAllLeavesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const createMutation = useCreateLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave planned", type: "success" });
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
        toast({ title: "Leave updated", type: "success" });
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

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Leaves</h1>
          <p className="text-muted-foreground mt-1">Manage your planned time off</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingId(null); reset({}); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Plan Leave
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !leaves?.length ? (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CalendarX2 className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">No leaves planned</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">You haven't requested any time off yet. Need a break? Plan your leave now.</p>
              <Button variant="secondary" onClick={() => { setEditingId(null); reset({}); setIsCreateOpen(true); }}>
                Plan Leave
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Dates</th>
                    <th className="px-6 py-4 font-semibold">Duration</th>
                    <th className="px-6 py-4 font-semibold">Reason</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const start = new Date(leave.startDate);
                    const end = new Date(leave.endDate);
                    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <tr key={leave.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                          {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {days} day{days > 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(leave)}>
                              <Edit2 className="w-4 h-4 text-primary" />
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
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal 
        isOpen={isCreateOpen || !!editingId} 
        onClose={() => { setIsCreateOpen(false); setEditingId(null); }}
        title={editingId ? "Edit Leave" : "Plan Leave"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Start Date</label>
              <Input type="date" {...register("startDate")} />
              {errors.startDate && <p className="text-destructive text-xs mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">End Date</label>
              <Input type="date" {...register("endDate")} />
              {errors.endDate && <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Reason</label>
            <Input {...register("reason")} placeholder="Vacation, Sick leave, etc." />
            {errors.reason && <p className="text-destructive text-xs mt-1">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setIsCreateOpen(false); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Submit Leave"}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
