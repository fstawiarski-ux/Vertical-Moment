/** Unverified test accounts are allowed only in an HTTP loopback preview. */
export function canRegisterLocally(baseURL:string):boolean {
 try {
  const url=new URL(baseURL);
  return url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 } catch {return false;}
}
