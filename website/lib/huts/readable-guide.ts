import {safeUrl, text, type HutDetail} from './types';

export function guideIntroduction(value: unknown): string {
 const story = text(value);
 // A place name such as St. Bartholomä must stay in the same sentence.
 for (const match of story.matchAll(/[.!?](?:["'’”)]?)(?=\s|$)/g)) {
  const end = match.index! + match[0].length;
  const sentence = story.slice(0, end);
  if (/\b(?:St|Dr|Prof|Mr|Mrs|Ms|Sr|Jr|No|Nr|ca|approx|e\.g|i\.e)\.$/i.test(sentence)) continue;
  return sentence;
 }
 return story;
}

export function guideElevation(value: unknown): string {
 return typeof value === 'number' || (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value))
  ? text(value) + ' m' : text(value);
}

export function guideApproach(detail: HutDetail): unknown {
 const h = detail.record;
 const instructions = h.approach_details;
 const generic = typeof instructions === 'string' && instructions.startsWith('Full named approaches/times in Routes;');
 if (instructions && !generic) return instructions;
 if (detail.routes.some(r => r.kind === 'Approach')) return h.approach_summary || instructions;
 return 'Named approaches and walking times not established in checked sources.';
}

export function guideBooking(detail: HutDetail): {label: string; value: unknown; url: string | null} {
 const h = detail.record;
 // Use the published service status, not an inference from a seasonal notice.
 const restricted = /\bclosed\b|\bemergency\b|no overnight|planned overnight stays prohibited|without overnight beds/i.test(String(h.status || ''));
 if (restricted) return {label: 'Published use restriction', value: h.status, url: null};
 return {
  label: 'Reservations / access',
  value: h.booking || 'Reservation or access arrangements not established in checked sources; check contacts.',
  url: safeUrl(h.booking)
 };
}

export function guideContacts(detail: HutDetail): Array<{url: string; label: string}> {
 const h = detail.record;
 const candidates: Array<[unknown, string]> = [
  [h.website, 'Hut / operator information'],
  [h.owner_website, 'Owning section information'],
  [h.base?.directory_link, 'Directory entry'],
  [h.directory, 'Directory entry']
 ];
 const links: Array<{url: string; label: string}> = [];
 for (const [value, label] of candidates) {
  const url = safeUrl(value);
  if (!url || links.some(link => link.url === url || (label === 'Directory entry' && link.label === label))) continue;
  links.push({url, label});
 }
 return links;
}

export function guidePreviews(detail: HutDetail) {
 const approaches = detail.routes.filter(r => r.kind === 'Approach').length;
 const routes = detail.routes.length - approaches;
 const count = (n: number, label: string) => n + ' ' + label + (n === 1 ? '' : 's');
 return {
  access: approaches ? count(approaches, 'published approach') + ' · rail, bus & parking'
   : 'Travel & parking · named approaches not established',
  stay: 'Sleeping places, winter shelter, payment & visitor rules',
  food: detail.tariffs.length ? count(detail.tariffs.length, 'tariff record') + ' · full years, units & conditions'
   : 'Meals & dietary evidence · numeric tariffs not established',
  routes: routes ? count(routes, 'route reference') + ' · published times & terrain'
   : 'Regional information · route references not established',
  history: (detail.dates.length ? count(detail.dates.length, 'dated record') : 'Hut story')
   + ' · ' + (detail.contexts.length ? count(detail.contexts.length, 'regional record') + ' & research gaps' : 'regional context & research gaps'),
  events: detail.events.length ? count(detail.events.length, 'dated reference') + ' · historical status retained'
   : 'Dated events not established in checked sources',
  sources: detail.sources.length ? count(detail.sources.length, 'checked source record') + ' · contacts & full hut record'
   : 'Contacts & full hut record · source records not established'
 };
}
