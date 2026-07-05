"use client";

import React from "react";

interface IconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const defaults: Required<Pick<IconProps, "size" | "strokeWidth">> = { size: 24, strokeWidth: 1.8 };

// ─── Logo Bolt ────────────────────────────────────────
export function EPFLogoBolt({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// ─── Cable ────────────────────────────────────────────
export function EPFCable({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" />
      <path d="M14 12c0-2 1-4 3-4s3 2 3 4-1 4-3 4-3-2-3-4z" />
      <path d="M10 12h4" />
    </svg>
  );
}

// ─── Circuit Breaker ──────────────────────────────────
export function EPFCircuitBreaker({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="8" width="18" height="8" rx="2" />
      <path d="M8 8v8" />
      <path d="M16 8v8" />
      <path d="M10 12h4" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

// ─── LED / Lightbulb ──────────────────────────────────
export function EPFLightbulb({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
      <path d="M12 2v1" />
    </svg>
  );
}

// ─── Switch / Socket ──────────────────────────────────
export function EPFSwitch({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <path d="M9 14v3" />
      <path d="M15 14v3" />
    </svg>
  );
}

// ─── Safety Shield ────────────────────────────────────
export function EPFSafetyShield({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// ─── Motor ────────────────────────────────────────────
export function EPFMotor({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 4v2" />
      <path d="M12 18v2" />
      <path d="M4 12h2" />
      <path d="M18 12h2" />
    </svg>
  );
}

// ─── Solar / Sun ──────────────────────────────────────
export function EPFSolar({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2" />
      <path d="M12 21v2" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h2" />
      <path d="M21 12h2" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

// ─── Cart ─────────────────────────────────────────────
export function EPFCart({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="20" cy="21" r="1.5" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.95-1.57L22 6H6" />
    </svg>
  );
}

// ─── Search ───────────────────────────────────────────
export function EPFSearch({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeWidth={strokeWidth + 0.4} />
    </svg>
  );
}

// ─── User ─────────────────────────────────────────────
export function EPFUser({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 10-16 0" />
    </svg>
  );
}

// ─── Heart / Wishlist ─────────────────────────────────
export function EPFHeart({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

// ─── Wrench / Tool ────────────────────────────────────
export function EPFWrench({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

// ─── Phone / Contact ──────────────────────────────────
export function EPFPhone({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

// ─── Location ─────────────────────────────────────────
export function EPFLocation({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

// ─── Truck / Delivery ─────────────────────────────────
export function EPFTruck({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

// ─── Star ─────────────────────────────────────────────
export function EPFStar({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={strokeWidth * 0.5} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ─── Chevron Left ─────────────────────────────────────
export function EPFChevronLeft({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// ─── Chevron Right ────────────────────────────────────
export function EPFChevronRight({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ─── Arrow Right ──────────────────────────────────────
export function EPFArrowRight({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Calculator ───────────────────────────────────────
export function EPFCalculator({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="7" y="5" width="10" height="4" rx="1" />
      <circle cx="8.5" cy="13" r="0.8" fill="currentColor" />
      <circle cx="12" cy="13" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="13" r="0.8" fill="currentColor" />
      <circle cx="8.5" cy="17" r="0.8" fill="currentColor" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="17" r="0.8" fill="currentColor" />
    </svg>
  );
}

// ─── Menu / Hamburger ─────────────────────────────────
export function EPFMenu({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12h18" />
      <path d="M3 6h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

// ─── Close / X ────────────────────────────────────────
export function EPFClose({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

// ─── Eye ──────────────────────────────────────────────
export function EPFEye({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── Eye Off (for password toggle) ────────────────────
export function EPFEyeOff({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

// ─── Package / Box ────────────────────────────────────
export function EPPackage({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

// ─── File Text ────────────────────────────────────────
export function EPFFileText({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

// ─── Flame ────────────────────────────────────────────
export function EPFFlame({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
    </svg>
  );
}

// ─── Timer / Clock ────────────────────────────────────
export function EPFTimer({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6" />
      <path d="M22 6l-3-3" />
      <path d="M12 2v3" />
    </svg>
  );
}

// ─── Check Circle ─────────────────────────────────────
export function EPFCheckCircle({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// ─── Plug ─────────────────────────────────────────────
export function EPFPlug({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a6 6 0 01-6 6v0a6 6 0 01-6-6V8h12z" />
    </svg>
  );
}

// ─── Tag ──────────────────────────────────────────────
export function EPFTag({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth={strokeWidth + 0.5} />
    </svg>
  );
}

// ─── Home ─────────────────────────────────────────────
export function EPFHome({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

// ─── Mail ─────────────────────────────────────────────
export function EPFMail({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

// ─── Lock ─────────────────────────────────────────────
export function EPFLock({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

// ─── Factory ──────────────────────────────────────────
export function EPFFactory({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7 5V8l-7 5V4a2 2 0 00-2-2H4a2 2 0 00-2 2z" />
    </svg>
  );
}

// ─── Smartphone ───────────────────────────────────────
export function EPFSmartphone({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

// ─── Book Open ────────────────────────────────────────
export function EPFBookOpen({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

// ─── Cpu / Chip ───────────────────────────────────────
export function EPFCpu({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </svg>
  );
}

// ─── Battery ──────────────────────────────────────────
export function EPFBattery({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="6" width="18" height="12" rx="2" />
      <path d="M23 13v-2" strokeWidth={strokeWidth + 1} />
    </svg>
  );
}

// ─── Gauge ────────────────────────────────────────────
export function EPFGauge({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

// ─── Cog ──────────────────────────────────────────────
export function EPFCog({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ─── Ruler ────────────────────────────────────────────
export function EPFRuler({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.3 15.3a2.4 2.4 0 010 3.4l-2.6 2.6a2.4 2.4 0 01-3.4 0L2.7 8.7a2.41 2.41 0 010-3.4l2.6-2.6a2.41 2.41 0 013.4 0z" />
      <path d="M14.5 12.5L18 9" />
      <path d="M9.5 7.5L13 4" />
      <path d="M12 10l2-2" />
    </svg>
  );
}

// ─── Download ─────────────────────────────────────────
export function EPFDownload({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

// ─── Chevron Down ─────────────────────────────────────
export function EPFChevronDown({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Clock ────────────────────────────────────────────
export function EPFClock({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

// ─── Hard Hat / Safety ────────────────────────────────
export function EPFHardHat({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 18h20" />
      <path d="M4 18v-3a8 8 0 0116 0v3" />
      <path d="M12 2v2" />
    </svg>
  );
}

// ─── Arrow Left ───────────────────────────────────────
export function EPFArrowLeft({ className, size = defaults.size, strokeWidth = defaults.strokeWidth }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

// ─── Account (circular filled) ─────────────────────────
// Source: user-01.svg — dark circle background + white user silhouette inside.
// `currentColor` colors the outer circle so callers can theme it via text-* classes.
export function EPFAccountIcon({ className, size = defaults.size }: IconProps) {
  // Unique clip-path id to avoid collisions when multiple instances are rendered.
  const clipId = "epf-account-clip";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11.65" fill="currentColor" />
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M12,1.22A10.79,10.79,0,1,1,4.38,4.38,10.74,10.74,0,0,1,12,1.22ZM9.92,14.55c0-.05.11-.43.15-.49a2,2,0,0,1-.8-1.48h0a.6.6,0,0,1-.29-.08.77.77,0,0,1-.32-.39c-.15-.34-.63-1.46.11-1.37C8.3,10,9.24,8.65,7.63,8.16,9,6.48,11.75,3.9,13.79,6.49a2.5,2.5,0,0,1,1.43,4.34.51.51,0,0,1,.25.06.62.62,0,0,1,.22.75c-.08.23-.17.39-.26.61s-.26.36-.56.32a2,2,0,0,1-.82,1.55l.13.43C13.56,15.86,11,15.92,9.92,14.55ZM4.54,17.82c.51-2.17,1.92-1.41,4.64-3.11,1,2,4.9,2.16,5.71,0,2.33,1.49,4.16.88,4.63,3a9.46,9.46,0,1,0-15,.07Z"
          fill="#fff"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect x="1.22" y="1.22" width="21.55" height="21.55" fill="none" />
        </clipPath>
      </defs>
    </svg>
  );
}

// ─── Wishlist (filled heart) ───────────────────────────
// Source: wishlist-01.svg — solid filled heart shape.
export function EPFHeartFilled({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M11.31,3.24l.69.6.69-.6a6.53,6.53,0,0,1,8.93,9.53h0l-6.36,6.36h0L12,22.39,3.88,14.27h0l-1.5-1.5h0a6.53,6.53,0,0,1,8.93-9.53Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Cart (filled) ─────────────────────────────────────
// Source: shop icon-01.svg — solid shopping cart with wheels.
export function EPFCartFilled({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.63,3.49a1.49,1.49,0,0,1,.44.39,1.63,1.63,0,0,1,.25.57,1.67,1.67,0,0,1,0,.63l-1.52,8.64a1.46,1.46,0,0,1-.44.83,1.15,1.15,0,0,1-.8.33H7.81l.3,1.92h12.8a.79.79,0,0,1,.6.28,1,1,0,0,1,.25.68,1,1,0,0,1-.25.68.79.79,0,0,1-.6.28H7.4a.79.79,0,0,1-.54-.22,1,1,0,0,1-.29-.57L4.16,2.4H1.49a.77.77,0,0,1-.6-.29,1,1,0,0,1-.25-.67A1,1,0,0,1,.89.76a.79.79,0,0,1,.6-.28H4.87A.75.75,0,0,1,5.41.7a1.07,1.07,0,0,1,.29.57L6,3.36H22.09A1.13,1.13,0,0,1,22.63,3.49Zm-14.3,20A1.92,1.92,0,1,0,6.41,21.6,1.92,1.92,0,0,0,8.33,23.52Zm11.52,0a1.92,1.92,0,1,0-1.92-1.92A1.92,1.92,0,0,0,19.85,23.52Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Named export map for easy import
export const EPFIcons = {
  LogoBolt: EPFLogoBolt,
  Cable: EPFCable,
  CircuitBreaker: EPFCircuitBreaker,
  Lightbulb: EPFLightbulb,
  Switch: EPFSwitch,
  SafetyShield: EPFSafetyShield,
  Motor: EPFMotor,
  Solar: EPFSolar,
  Cart: EPFCart,
  Search: EPFSearch,
  User: EPFUser,
  Heart: EPFHeart,
  Wrench: EPFWrench,
  Phone: EPFPhone,
  Location: EPFLocation,
  Truck: EPFTruck,
  Star: EPFStar,
  ChevronLeft: EPFChevronLeft,
  ChevronRight: EPFChevronRight,
  ArrowRight: EPFArrowRight,
  ArrowLeft: EPFArrowLeft,
  Calculator: EPFCalculator,
  Menu: EPFMenu,
  Close: EPFClose,
  Eye: EPFEye,
  EyeOff: EPFEyeOff,
  Package: EPPackage,
  FileText: EPFFileText,
  Flame: EPFFlame,
  Timer: EPFTimer,
  CheckCircle: EPFCheckCircle,
  Plug: EPFPlug,
  Tag: EPFTag,
  Home: EPFHome,
  Mail: EPFMail,
  Lock: EPFLock,
  Factory: EPFFactory,
  Smartphone: EPFSmartphone,
  BookOpen: EPFBookOpen,
  Cpu: EPFCpu,
  Battery: EPFBattery,
  Gauge: EPFGauge,
  Cog: EPFCog,
  Ruler: EPFRuler,
  Download: EPFDownload,
  ChevronDown: EPFChevronDown,
  Clock: EPFClock,
  HardHat: EPFHardHat,
  AccountIcon: EPFAccountIcon,
  HeartFilled: EPFHeartFilled,
  CartFilled: EPFCartFilled,
};

export type EPFIconName = keyof typeof EPFIcons;