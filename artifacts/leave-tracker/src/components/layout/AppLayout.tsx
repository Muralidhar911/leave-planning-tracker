import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  CalendarDays, 
  CalendarRange, 
  Users, 
  UserCircle, 
  LogOut,
  Loader2,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        toast({ title: "Logged out", type: "success" });
        setLocation("/login");
      }
    }
  });

  useEffect(() => {
    if (!isLoading && error) {
      setLocation("/login");
    }
  }, [isLoading, error, setLocation]);

  useEffect(() => {
    if (user?.mustChangePassword && location !== "/profile") {
      setLocation("/profile");
      toast({ 
        title: "Action Required", 
        description: "Please change your password to continue.",
        type: "error"
      });
    }
  }, [user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Connecting to network...</p>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Leaves", path: "/leaves", icon: CalendarDays },
    { name: "Team Calendar", path: "/calendar", icon: CalendarRange },
    ...(user.role === 'admin' ? [{ name: "Admin", path: "/admin", icon: Users }] : []),
    { name: "Profile", path: "/profile", icon: UserCircle },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            LPT
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/30"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("w-5 h-5 relative z-10", isActive && "text-accent text-glow-cyan")} />
                  <span className={cn("font-medium relative z-10", isActive && "text-glow")}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate({})}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-white/5 hover:text-destructive transition-colors group"
          >
            {logoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background glow effects strictly for the main area */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50" />
        
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="h-full max-w-6xl mx-auto"
          >
            {user.mustChangePassword && location !== "/profile" && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">You must change your password before continuing.</p>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
