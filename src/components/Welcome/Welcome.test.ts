import { describe, expect, it } from 'vitest';
import { formatRecentOpenedAt } from './Welcome';

describe('formatRecentOpenedAt', () => {
  const now = new Date('2026-06-18T12:30:00+08:00').getTime();

  it('shows today for files opened today', () => {
    const timestamp = new Date('2026-06-18T09:05:00+08:00').getTime();
    expect(formatRecentOpenedAt(timestamp, now)).toContain('今天');
  });

  it('shows yesterday for files opened yesterday', () => {
    const timestamp = new Date('2026-06-17T20:10:00+08:00').getTime();
    expect(formatRecentOpenedAt(timestamp, now)).toContain('昨天');
  });

  it('omits the year for older files in the current year', () => {
    const timestamp = new Date('2026-05-03T08:00:00+08:00').getTime();
    expect(formatRecentOpenedAt(timestamp, now)).toMatch(/^5\/3 /);
  });

  it('includes the year for files from another year', () => {
    const timestamp = new Date('2025-12-31T23:59:00+08:00').getTime();
    expect(formatRecentOpenedAt(timestamp, now)).toMatch(/^2025\/12\/31 /);
  });
});
