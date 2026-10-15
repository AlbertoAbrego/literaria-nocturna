/**
 * Story 40 viewport profiles.
 *
 * The application uses a single Tailwind breakpoint (sm: 640px). These
 * profiles cover both sides of that breakpoint plus a full desktop view:
 *
 * - MOBILE_VIEWPORT: 375x667 — below sm:, stacked single-column layouts.
 * - TABLET_VIEWPORT: 768x1024 — above sm:, sm: grid/column layouts active.
 * - Desktop stays on Playwright's "Desktop Chrome" profile (1280x720).
 *
 * Explicit viewports are used instead of iPhone/iPad device descriptors
 * because Playwright's device presets do not match these exact sizes
 * (e.g. "iPhone SE" is 320x568 in v1.63) and their defaultBrowserType
 * would override the intended chromium engine.
 */
export interface ViewportProfile {
  width: number;
  height: number;
}

export const MOBILE_VIEWPORT: ViewportProfile = { width: 375, height: 667 };
export const TABLET_VIEWPORT: ViewportProfile = { width: 768, height: 1024 };

/** Tailwind breakpoint used by the application (sm:). */
export const SM_BREAKPOINT_PX = 640;

export function isBelowSmBreakpoint(viewport: ViewportProfile): boolean {
  return viewport.width < SM_BREAKPOINT_PX;
}

export function isAtOrAboveSmBreakpoint(viewport: ViewportProfile): boolean {
  return viewport.width >= SM_BREAKPOINT_PX;
}
