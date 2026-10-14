import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("el-GR").format(n);
}

export function formatVathmologia(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toFixed(2).replace(".", ",");
}

export function formatPercent(v: number): string {
  return `${v.toFixed(1).replace(".", ",")}%`;
}