# Mistakes Log — DO NOT REPEAT

## Mistake 1: NativeWind
- **Date:** 2026-07-14
- **Task:** Mobile app development
- **What I did:** Used NativeWind for styling
- **What user wanted:** Inline styles only (style={{}})
- **Rule:** NEVER use NativeWind. Always use inline styles in mobile app.

## Mistake 2: Color mismatch
- **Date:** 2026-07-14
- **Task:** Mobile app design
- **What I did:** Used amber/yellow colors initially
- **What user wanted:** epf-500 (#0EA5E9) sky blue — matching website
- **Rule:** Always use epf-500 as primary color. Check design-system.ts.

## Mistake 3: Missing Footer
- **Date:** 2026-07-14
- **Task:** Mobile app Home screen
- **What I did:** Forgot to add Footer component
- **What user wanted:** Footer matching website Footer.tsx
- **Rule:** Always match website layout: Header → Content → Footer

## Mistake 4: Double header
- **Date:** 2026-07-14
- **Task:** Mobile app tab navigation
- **What I did:** Showed both tab navigator header AND custom header
- **What user wanted:** Only custom header (headerShown: false)
- **Rule:** Set headerShown: false in tabs when screen has custom header

## Mistake 5: Wrong import paths
- **Date:** 2026-07-14
- **Task:** Mobile app screens
- **What I did:** Used ../theme/ instead of ../src/theme/
- **What user wanted:** Correct relative paths
- **Rule:** Always verify import paths. Check folder structure first.

## Mistake 6: Multiple fixes in one go
- **Date:** 2026-07-14
- **Task:** Bug fixing
- **What I did:** Tried to fix many things at once, missed some
- **What user wanted:** One fix at a time, carefully
- **Rule:** One task at a time. Test before moving to next.
