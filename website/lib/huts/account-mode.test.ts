import {describe,it,expect} from 'vitest';
import {canRegisterLocally} from './account-mode';
describe('hut account registration release boundary',()=>{
 it('permits synthetic accounts in HTTP loopback previews',()=>{
  for(const origin of ['http://localhost:3026','http://127.0.0.1:3026','http://[::1]:3026'])expect(canRegisterLocally(origin)).toBe(true);
 });
 it('blocks public and HTTPS account registration until verified mail is implemented',()=>{
  for(const origin of ['https://verticalmoment.com','https://preview.verticalmoment.com','https://localhost:3026','http://localhost.example.com','http://localhost@evil.example','http://192.168.1.1:3026','invalid'])expect(canRegisterLocally(origin)).toBe(false);
 });
});
