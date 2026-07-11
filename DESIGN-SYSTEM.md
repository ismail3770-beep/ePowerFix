# ePowerFix Premium Design System (FleetCart-inspired)

## Design Philosophy
Clean, minimal, generous whitespace, consistent. Every element should feel intentional and polished.

## Spacing Scale (MANDATORY — use consistently)
- Card padding: p-4 (16px) or p-5 (20px)
- Section padding: py-12 sm:py-16 (48-64px)
- Grid gaps: gap-4 (16px) or gap-6 (24px)
- Element gaps: gap-2 (8px) or gap-3 (12px)
- Container max-width: max-w-[1400px], px-4 sm:px-6 lg:px-8

## Card Design (PremiumCard pattern)
```
className="group bg-white rounded-xl border border-slate-200 overflow-hidden
  shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
```
- Border: 1px solid slate-200
- Shadow: shadow-sm default, hover:shadow-xl
- Transform: hover:-translate-y-1 (4px lift)
- Transition: duration-300 (smooth, not abrupt)
- Rounded: rounded-xl (12px)

## Button Styles (consistent everywhere)
- Primary: `bg-epf-500 hover:bg-epf-600 text-white rounded-lg h-11 px-6 font-semibold transition-colors`
- Secondary: `bg-white border border-slate-300 hover:border-epf-500 text-slate-700 rounded-lg h-11 px-6`
- Ghost: `hover:bg-slate-100 text-slate-600 rounded-lg`
- Icon: `h-9 w-9 rounded-lg hover:bg-slate-100`

## Typography Hierarchy
- Page title: text-[24px] sm:text-[28px] font-bold text-slate-900
- Section title: text-[18px] sm:text-[20px] font-bold text-slate-900
- Card title: text-[14px] font-semibold text-slate-800
- Body: text-[14px] text-slate-600
- Small/muted: text-[13px] text-slate-400
- Badge: text-[11px] font-bold

## Colors
- Primary: epf-500 (#0EA5E9), epf-600 (#0284C7)
- Background: white, slate-50 (sections)
- Text: slate-900 (headings), slate-600 (body), slate-400 (muted)
- Border: slate-200
- Success: emerald-600, Warning: amber-600, Danger: red-600

## Animations (Framer Motion — FadeIn component)
- Fade up: opacity 0→1, y 16→0, duration 0.4s, delay stagger 0.05s
- Hover: scale 1.05 on images (duration 500ms ease-out)
- Transitions: duration-300 for all hover states

## Image Handling
- Product cards: aspect-square, object-cover, p-3 (padding inside image area)
- Banners: aspect-[4/3] or h-64, object-cover
- Thumbnails: w-14 h-14 rounded-lg object-cover

## Empty States (professional)
- Large muted icon (h-16 w-16 text-slate-200)
- Clear title (text-[18px] font-medium)
- Helpful description (text-[14px] text-slate-400)
- CTA button (epf-500)

## DO NOT change
- Header component (src/components/epf/Header.tsx)
- Footer component (src/components/epf/Footer.tsx)
- Brand color (epf-500 = #0EA5E9)
- globals.css color variables
