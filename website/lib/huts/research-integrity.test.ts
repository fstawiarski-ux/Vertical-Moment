import {describe,expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {researchSha256,researchChecksumFormat} from '../../scripts/hut-research-integrity.mjs';

const lf='{\n  "hut": "Brünnsteinhaus",\n  "year": 1894,\n  "note": "Quoted\\r\\ncontent stays unchanged"\n}\n';
describe('Reviewed research checksums',()=>{
 it('uses the same UTF-8 LF checksum for Windows and Git checkout text',()=>{
  const expected=createHash('sha256').update(lf,'utf8').digest('hex');
  expect(researchChecksumFormat).toBe('utf8-lf');
  expect(researchSha256(lf)).toBe(expected);
  expect(researchSha256(lf.replace(/\n/g,'\r\n'))).toBe(expected);
 });
 it('handles file buffers without changing Unicode or escaped string content',()=>{
  expect(researchSha256(Buffer.from(lf.replace(/\n/g,'\r\n'),'utf8'))).toBe(researchSha256(lf));
 });
 it('still rejects a change to reviewed content',()=>{
  expect(researchSha256(lf.replace('1894','1895'))).not.toBe(researchSha256(lf));
 });
});
