import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl glass-panel"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
        </div>
        
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">404</h1>
          <p className="text-muted-foreground mt-2 text-lg">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        
        <Link href="/dashboard">
          <Button variant="primary" size="lg" className="w-full mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
