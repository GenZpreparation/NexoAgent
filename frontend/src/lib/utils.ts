import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const whole = new Intl.NumberFormat("en-IN");

export const formatInr = (n: number) => inr.format(n);
export const formatNumber = (n: number) => whole.format(n);
export const formatCompact = (n: number) => (Math.abs(n) >= 10000 ? compact.format(n) : whole.format(n));
export const formatPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

export function formatDuration(totalSec: number): string {
  if (!totalSec || totalSec < 0) return "0:00";
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDurationLong(totalSec: number): string {
  if (!totalSec) return "0s";
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return m ? `${m}m ${s}s` : `${s}s`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

function toDate(value: string | Date): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | null | undefined): string {
  const d = value ? toDate(value) : null;
  return d ? dateFmt.format(d) : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  const d = value ? toDate(value) : null;
  return d ? dateTimeFmt.format(d) : "—";
}

export function formatTime(value: string | null | undefined): string {
  const d = value ? toDate(value) : null;
  return d ? timeFmt.format(d) : "—";
}

export function formatRelative(value: string | null | undefined, now: number = Date.now()): string {
  const d = value ? toDate(value) : null;
  if (!d) return "—";
  const diff = Math.round((now - d.getTime()) / 1000);
  const abs = Math.abs(diff);
  const future = diff < 0;
  const wrap = (s: string) => (future ? `in ${s}` : `${s} ago`);
  if (abs < 45) return future ? "in a moment" : "just now";
  if (abs < 3600) return wrap(`${Math.round(abs / 60)}m`);
  if (abs < 86400) return wrap(`${Math.round(abs / 3600)}h`);
  if (abs < 86400 * 7) return wrap(`${Math.round(abs / 86400)}d`);
  return dateFmt.format(d);
}

/** Formats an Indian E.164 number for display: +91 98765 43210. Other numbers pass through. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  const m = digits.match(/^\+91(\d{5})(\d{5})$/);
  return m ? `+91 ${m[1]} ${m[2]}` : phone;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Light phone validation: E.164-ish, 8–15 digits with optional leading +. */
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, ""));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname));
  } catch {
    return false;
  }
}
