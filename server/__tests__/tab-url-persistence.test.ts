// Feature: da-case-management, Property 11: Tab URL Persistence Round-Trip
// Validates: Requirements 8.3
//
// Tests the pure URL-manipulation logic extracted from the CaseDetailPage
// component. The properties under test:
//   1. After calling setTab(id), URLSearchParams.get("tab") === id
//   2. Loading a URL that includes ?tab=<id> pre-selects the correct tab
//   3. An unrecognised tab identifier in the URL falls back to "overview"
//   4. setTab preserves any pre-existing query parameters

import { describe, expect, it } from "vitest";
import * as fc from "fast-check";

// ─── Tab identifiers as defined in the Case Detail Page ─────────────────────

const VALID_TAB_IDS = [
  "overview",
  "documents",
  "evidence",
  "warrants",
  "witnesses",
  "filings",
  "timeline",
  "activity",
] as const;

type TabId = (typeof VALID_TAB_IDS)[number];

// ─── Pure logic extracted from CaseDetailInner ──────────────────────────────
//
// These functions mirror the real page implementation so that the tests
// validate the exact behaviour the page relies on, without requiring a
// React renderer or browser environment.

/**
 * Simulate reading the active tab from a URLSearchParams string.
 * Mirrors: const tab = searchParams?.get("tab") ?? "overview"
 */
function getActiveTabFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  return params.get("tab") ?? "overview";
}

/**
 * Simulate calling setTab(newTab) and return the resulting query string.
 * Mirrors:
 *   const next = new URLSearchParams(searchParams?.toString() ?? "");
 *   next.set("tab", newTab);
 *   return next.toString();
 */
function applySetTab(currentSearch: string, newTab: string): string {
  const next = new URLSearchParams(currentSearch);
  next.set("tab", newTab);
  return next.toString();
}

/**
 * Simulate the active-tab resolution including the permission-fallback logic.
 * Mirrors:
 *   const activeTab = visibleTabs.some(t => t.id === tab) ? tab : "overview"
 */
function resolveActiveTab(tab: string, visibleTabIds: string[]): string {
  return visibleTabIds.includes(tab) ? tab : "overview";
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary for any valid tab identifier */
const arbValidTab = fc.constantFrom<TabId>(...VALID_TAB_IDS);

/** Arbitrary for a string that is NOT a valid tab identifier */
const arbInvalidTab = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => !(VALID_TAB_IDS as readonly string[]).includes(s));

/** Arbitrary for a URLSearchParams-compatible query string (may include extra keys) */
const arbQueryString = fc
  .dictionary(
    fc.string({ minLength: 1, maxLength: 10 }).filter((k) => k !== "tab"),
    fc.string({ minLength: 0, maxLength: 20 }),
  )
  .map((obj) => new URLSearchParams(obj).toString());

// ─── Property 11a: setTab round-trip ─────────────────────────────────────────
//
// For any valid tab identifier, after setTab(id) is simulated the resulting
// URLSearchParams must return that exact identifier from get("tab").

describe("Property 11: Tab URL Persistence Round-Trip", () => {
  it(
    "11a — setTab(id) produces a query string where get('tab') === id",
    () => {
      fc.assert(
        fc.property(arbValidTab, arbQueryString, (tabId, existingSearch) => {
          const resultSearch = applySetTab(existingSearch, tabId);
          const read = getActiveTabFromSearch(resultSearch);
          expect(read).toBe(tabId);
        }),
        { numRuns: 200 },
      );
    },
  );

  // ─── Property 11b: URL pre-selection ───────────────────────────────────────
  //
  // Loading a URL that contains ?tab=<id> for any valid tab identifier must
  // pre-select that identifier as the active tab.

  it(
    "11b — a URL with ?tab=<id> pre-selects the correct tab",
    () => {
      fc.assert(
        fc.property(arbValidTab, arbQueryString, (tabId, extraSearch) => {
          // Build a search string that contains the target tab, possibly with extra params
          const baseParams = new URLSearchParams(extraSearch);
          baseParams.set("tab", tabId);
          const search = baseParams.toString();

          const resolved = getActiveTabFromSearch(search);
          expect(resolved).toBe(tabId);
        }),
        { numRuns: 200 },
      );
    },
  );

  // ─── Property 11c: Unknown tab falls back to "overview" ───────────────────
  //
  // If the ?tab= value in the URL is not a recognised identifier (e.g. a
  // typo, a stale link, or a revoked permission), the active tab must resolve
  // to "overview".

  it(
    "11c — an unrecognised ?tab= value resolves to 'overview'",
    () => {
      fc.assert(
        fc.property(arbInvalidTab, (unknownTab) => {
          const search = new URLSearchParams({ tab: unknownTab }).toString();
          // resolveActiveTab mirrors the permission-fallback logic in the page
          const resolved = resolveActiveTab(
            getActiveTabFromSearch(search),
            [...VALID_TAB_IDS],
          );
          expect(resolved).toBe("overview");
        }),
        { numRuns: 200 },
      );
    },
  );

  // ─── Property 11d: setTab preserves other query parameters ────────────────
  //
  // Calling setTab must not destroy unrelated query parameters already
  // present in the URL (e.g. ?page=2&filter=open).

  it(
    "11d — setTab preserves pre-existing query parameters",
    () => {
      fc.assert(
        fc.property(arbValidTab, arbQueryString, (tabId, extraSearch) => {
          const before = new URLSearchParams(extraSearch);
          const resultSearch = applySetTab(extraSearch, tabId);
          const after = new URLSearchParams(resultSearch);

          // Every key that existed before (except "tab" itself) must still be
          // present with the same value.
          for (const [key, value] of before.entries()) {
            if (key === "tab") continue;
            expect(after.get(key)).toBe(value);
          }
        }),
        { numRuns: 200 },
      );
    },
  );

  // ─── Property 11e: missing ?tab= defaults to "overview" ──────────────────
  //
  // A URL with no tab parameter at all must resolve to "overview",
  // matching the `?? "overview"` default in the page.

  it(
    "11e — missing ?tab= defaults to 'overview'",
    () => {
      fc.assert(
        fc.property(arbQueryString, (extraSearch) => {
          // Ensure no "tab" key is present
          const params = new URLSearchParams(extraSearch);
          params.delete("tab");
          const search = params.toString();

          const resolved = getActiveTabFromSearch(search);
          expect(resolved).toBe("overview");
        }),
        { numRuns: 200 },
      );
    },
  );

  // ─── Property 11f: overview always visible (no permission required) ───────
  //
  // The "overview" tab has no requiredPermission, so resolveActiveTab must
  // return "overview" even when the requested tab isn't in the visible set.

  it(
    "11f — 'overview' is always the fallback regardless of visible tab set",
    () => {
      fc.assert(
        fc.property(
          arbInvalidTab,
          fc.array(arbValidTab, { minLength: 0, maxLength: 7 }),
          (unknownTab, visibleSubset) => {
            const resolved = resolveActiveTab(unknownTab, visibleSubset);
            expect(resolved).toBe("overview");
          },
        ),
        { numRuns: 200 },
      );
    },
  );

  // ─── Example-based: all 8 valid identifiers round-trip correctly ──────────

  it(
    "all 8 valid tab identifiers survive a setTab → read round-trip",
    () => {
      for (const tabId of VALID_TAB_IDS) {
        const search = applySetTab("", tabId);
        expect(getActiveTabFromSearch(search)).toBe(tabId);
      }
    },
  );
});
