import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  tone: "info" | "error";
}

interface ToastState {
  toasts: Toast[];
  show(message: string, tone?: Toast["tone"]): void;
  dismiss(id: number): void;
}

let nextId = 1;
const MAX_VISIBLE = 3;
const DURATION_MS = 3500;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show(message, tone = "info") {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }].slice(-MAX_VISIBLE) }));
    setTimeout(() => get().dismiss(id), DURATION_MS);
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = (message: string, tone?: Toast["tone"]) =>
  useToastStore.getState().show(message, tone);
