// Feature: todo-life-dashboard, Property 9: Quick Link URL validation

import { describe, test } from 'vitest';
import fc from 'fast-check';
import { validateUrl } from '../../js/helpers.js';

/**
 * Property 9: Quick Link URL validation
 *
 * validateUrl(raw) MUST return true if and only if:
 *   1. raw is a string
 *   2. raw starts with "http://" or "https://"
 *   3. raw.length <= 2048
 *
 * Validates: Requirements 11.4
 */

describe('Property 9: Quick Link URL validation', () => {

  // ---------------------------------------------------------------------------
  // Property: biconditional — result matches expected formula for any string
  // ---------------------------------------------------------------------------
  test('validateUrl returns true iff starts with http:// or https:// and length <= 2048', () => {
    fc.assert(
      fc.property(fc.string(), (url) => {
        const result = validateUrl(url);
        const expected =
          (url.startsWith('http://') || url.startsWith('https://')) &&
          url.length <= 2048;
        return result === expected;
      }),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property: valid http:// URLs (length <= 2048) always return true
  // ---------------------------------------------------------------------------
  test('valid http:// URLs with length <= 2048 always return true', () => {
    fc.assert(
      fc.property(
        // suffix max 2041 chars so that "http://" (7) + suffix <= 2048
        fc.string({ maxLength: 2041 }),
        (suffix) => {
          const url = 'http://' + suffix;
          // Guard: only assert for URLs that actually satisfy the length constraint
          if (url.length > 2048) return true;
          return validateUrl(url) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property: valid https:// URLs (length <= 2048) always return true
  // ---------------------------------------------------------------------------
  test('valid https:// URLs with length <= 2048 always return true', () => {
    fc.assert(
      fc.property(
        // suffix max 2040 chars so that "https://" (8) + suffix <= 2048
        fc.string({ maxLength: 2040 }),
        (suffix) => {
          const url = 'https://' + suffix;
          if (url.length > 2048) return true;
          return validateUrl(url) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property: URLs exceeding 2048 chars always return false
  // ---------------------------------------------------------------------------
  test('URLs exceeding 2048 chars always return false', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('http://', 'https://'),
        // suffix must be long enough to push the total past 2048
        fc.string({ minLength: 2042 }),
        (prefix, suffix) => {
          const url = prefix + suffix;
          // Guard: only assert when we've actually crossed the limit
          if (url.length <= 2048) return true;
          return validateUrl(url) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property: strings not starting with http:// or https:// always return false
  // ---------------------------------------------------------------------------
  test('strings not starting with http:// or https:// always return false', () => {
    fc.assert(
      fc.property(
        fc.string().filter(
          (s) => !s.startsWith('http://') && !s.startsWith('https://')
        ),
        (url) => validateUrl(url) === false
      ),
      { numRuns: 100 }
    );
  });

  // ---------------------------------------------------------------------------
  // Property: non-string inputs always return false
  // ---------------------------------------------------------------------------
  test('non-string inputs always return false', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer(),
          fc.float(),
          fc.boolean(),
          fc.constant(null),
          fc.constant(undefined),
          fc.object()
        ),
        (nonString) => validateUrl(nonString) === false
      ),
      { numRuns: 100 }
    );
  });

});
