import { useToast, dismissToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 flex flex-col gap-3 w-full max-w-[420px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex items-start gap-4 p-4 rounded-xl glass-panel shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-l-4 overflow-hidden relative"
            style={{
              borderLeftColor: 
                t.type === 'success' ? 'hsl(142, 71%, 45%)' : 
                t.type === 'error' ? 'hsl(350, 100%, 60%)' : 
                'hsl(270, 100%, 60%)'
            }}
          >
            <div className="mt-1 flex-shrink-0">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
              {t.type === 'default' && <Info className="w-5 h-5 text-primary" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
              {t.description && (
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              )}
            </div>

            <button
              onClick={() => dismissToast(t.id)}
              className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
