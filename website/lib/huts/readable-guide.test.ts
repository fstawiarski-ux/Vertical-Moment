import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {guideApproach, guideBooking, guideContacts, guideElevation, guideIntroduction, guidePreviews} from './readable-guide';
import {type HutDetail} from './types';

const detail = (id: string): HutDetail => JSON.parse(readFileSync(new URL('../../public/huts-data/v1/' + id + '.json', import.meta.url), 'utf8'));

describe('Shared readable hut guide variations', () => {
 it('keeps St. Bartholomä and its date in the complete Watzmann introduction', () => {
  const h = detail('1799').record;
  expect(guideIntroduction(h.hut_story)).toBe('An unstaffed east-face base was established in a former forestry hut near St. Bartholomä in 1949.');
 });
 it('keeps sentence punctuation and decimal elevations intact', () => {
  expect(guideIntroduction('A 2.5 km approach is published. Check the operator.')).toBe('A 2.5 km approach is published.');
  expect(guideIntroduction('No dated history established')).toBe('No dated history established');
 });
 it('does not promise named approaches for a sparse record with no route rows', () => {
  const d = detail('1785');
  expect(d.routes).toHaveLength(0);
  expect(guideApproach(d)).toBe('Named approaches and walking times not established in checked sources.');
  expect(guidePreviews(d).access).toContain('not established');
  expect(guidePreviews(d).food).toContain('numeric tariffs not established');
  expect(guidePreviews(d).events).toContain('not established');
 });
 it('retains the operator-qualified approach and seasonal restrictions verbatim', () => {
  const d = detail('64');
  expect(guideApproach(d)).toBe(d.record.approach_details);
  expect(String(guideApproach(d))).toContain('45 minutes is runner time');
  expect(String(guideApproach(d))).toContain('2026 timetable is unfinished');
 });
 it('shows permanent closure instead of offering its older reservation URL', () => {
  const d = detail('222');
  expect(d.record.booking).toMatch(/^https:/);
  expect(guideBooking(d)).toEqual({label:'Published use restriction',value:d.record.status,url:null});
  expect(d.record.booking).toMatch(/^https:/);
 });
 it('preserves emergency-only restrictions without presenting a booking facility', () => {
  const d = detail('1664');
  expect(guideBooking(d).value).toBe('Emergency bivouac; planned overnight stays prohibited.');
  expect(guideBooking(d).url).toBeNull();
 });
 it('uses a named directory fallback when a hut has no established website', () => {
  const d = detail('1875');
  expect(d.record.website).toBe('');
  expect(guideContacts(d)).toEqual([{url:d.record.base!.directory_link,label:'Directory entry'}]);
  expect(guideBooking(d).value).toContain('not established');
 });
 it('preserves a published zero and does not attach metres to uncertain text', () => {
  expect(guideElevation(0)).toBe('0 m');
  expect(guideElevation(null)).toBe('Not established in checked sources');
  expect(guideElevation('Not verified')).toBe('Not verified');
 });
 it('derives presentation for all 630 records without changing research or losing identities', () => {
  const index: Array<{id: string; number: number}> = JSON.parse(readFileSync(new URL('../../public/huts-data/v1/index.json', import.meta.url), 'utf8'));
  expect(index).toHaveLength(630);
  expect(new Set(index.map(h => h.id)).size).toBe(630);
  for (const entry of index) {
   const d = detail(entry.id), before = JSON.stringify(d);
   expect(d.record.id).toBe(entry.id);
   expect(d.record.number).toBe(entry.number);
   expect(String(d.record.hut_story).startsWith(guideIntroduction(d.record.hut_story))).toBe(true);
   expect(Object.values(guidePreviews(d))).toHaveLength(7);
   expect(Object.values(guidePreviews(d)).every(value => value && !/^0 /.test(value))).toBe(true);
   expect(guideApproach(d)).toBeTruthy();
   expect(guideBooking(d).value).toBeTruthy();
   expect(guideContacts(d).every(link => /^https?:/.test(link.url))).toBe(true);
   expect(JSON.stringify(d)).toBe(before);
  }
 });
});
