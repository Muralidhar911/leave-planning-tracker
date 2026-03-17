import { useGetMe, useUpdateProfile, useChangePassword, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { UserCircle2, KeyRound } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });

  // Prefill profile form when user loads
  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name });
    }
  }, [user, profileForm.reset]);

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "Profile updated", type: "success" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  const changePasswordMutation = useChangePassword({
    mutation: {
      onSuccess: () => {
        toast({ title: "Password changed successfully", type: "success" });
        passwordForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (e: any) => toast({ title: "Error", description: e?.data?.error, type: "error" })
    }
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-primary" /> Profile Details
            </CardTitle>
            <CardDescription>Update your public facing name.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate({ data }))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Email</label>
                <Input value={user?.email || ""} disabled className="opacity-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Full Name</label>
                <Input {...profileForm.register("name")} />
                {profileForm.formState.errors.name && (
                  <p className="text-destructive text-xs mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <Button type="submit" variant="primary" className="mt-2" isLoading={updateProfileMutation.isPending}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className={user?.mustChangePassword ? "border-destructive/50 shadow-[0_0_30px_rgba(225,29,72,0.15)]" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-accent" /> Change Password
            </CardTitle>
            <CardDescription>
              {user?.mustChangePassword 
                ? <span className="text-destructive font-medium">Action required: Change your temporary password.</span>
                : "Ensure your account is using a long, random password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate({ data }))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">Current Password</label>
                <Input type="password" {...passwordForm.register("currentPassword")} />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 ml-1">New Password</label>
                <Input type="password" {...passwordForm.register("newPassword")} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-destructive text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <Button type="submit" variant="primary" className="mt-2" isLoading={changePasswordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
