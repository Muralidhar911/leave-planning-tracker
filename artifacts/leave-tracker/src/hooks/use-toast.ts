import { useState, useEffect } from 'react';

export type ToastType = 'default' | 'success' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

let toasts: Toast[] = [];
let listeners: React.Dispatch<React.SetStateAction<Toast[]>>[] = [];

export const toast = ({ title, description, type = 'default' }: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, title, description, type };
  
  toasts = [...toasts, newToast];
  listeners.forEach(listener => listener(toasts));

  setTimeout(() => {
    dismissToast(id);
  }, 5000);
};

export const dismissToast = (id: string) => {
  toasts = toasts.filter(t => t.id !== id);
  listeners.forEach(listener => listener(toasts));
};

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter(l => l !== setState);
    };
  }, []);

  return { toasts: state, dismiss: dismissToast, toast };
}
