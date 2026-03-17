import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        toast({ title: "Welcome back!", description: data.message, type: "success" });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ 
          title: "Login failed", 
          description: error?.data?.error || "Invalid credentials", 
          type: "error" 
        });
      }
    }
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      {/* Cinematic background image layered with gradients */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`}
          alt="Abstract Background" 
          className="w-full h-full object-cover opacity-60 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 sm:p-12 rounded-3xl glass-panel shadow-[0_0_100px_rgba(168,85,247,0.15)] border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-glow text-center">Leave Tracker</h1>
          <p className="text-muted-foreground mt-2 text-center font-medium">Log in to manage your schedule</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Email</label>
            <Input 
              {...register("email")}
              placeholder="you@company.com" 
              className="h-12 bg-black/40"
            />
            {errors.email && <p className="text-destructive text-xs mt-1.5 ml-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 ml-1">Password</label>
            <Input 
              {...register("password")}
              type="password" 
              placeholder="••••••••" 
              className="h-12 bg-black/40"
            />
            {errors.password && <p className="text-destructive text-xs mt-1.5 ml-1">{errors.password.message}</p>}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full h-12 text-base mt-4"
            isLoading={loginMutation.isPending}
          >
            Secure Access
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
