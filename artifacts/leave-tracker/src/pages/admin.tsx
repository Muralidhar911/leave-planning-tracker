import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListUsers, 
  useCreateUser, 
  useDeleteUser,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, UserPlus, ShieldAlert } from "lucide-react";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password min 6 chars"),
  role: z.enum(["admin", "user"]),
});

type UserForm = z.infer<typeof userSchema>;

export default function Admin() {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListUsers();
  
  const [isOpen, setIsOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: "user" }
  });

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User created", type: "success" });
        setIsOpen(false);
        reset();
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "User removed", type: "success" });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const onSubmit = (data: UserForm) => {
    createMutation.mutate({ data });
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            Admin Panel <ShieldAlert className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">Manage team members and permissions</p>
        </div>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Role</th>
                    <th className="px-6 py-4 font-semibold">Joined</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {user.name}
                        {user.mustChangePassword && <span className="ml-2 text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">New</span>}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'admin' ? "primary" : "secondary"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => {
                            if (confirm(`Remove ${user.name} from the team?`)) {
                              deleteMutation.mutate({ id: user.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Team Member">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Full Name</label>
            <Input {...register("name")} placeholder="Jane Doe" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Email</label>
            <Input type="email" {...register("email")} placeholder="jane@company.com" />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Initial Password</label>
            <Input type="password" {...register("password")} placeholder="••••••••" />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Role</label>
            <select 
              {...register("role")}
              className="flex h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 appearance-none"
            >
              <option value="user" className="bg-background text-foreground">User</option>
              <option value="admin" className="bg-background text-foreground">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
