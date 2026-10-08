import {createHash} from 'node:crypto';

export const researchChecksumFormat='utf8-lf';

/** Hash reviewed UTF-8 text with Git's LF line endings on every platform.
 * @param {string|Uint8Array} contents
 */
export function researchSha256(contents){
 const text=typeof contents==='string'?contents:Buffer.from(contents).toString('utf8');
 return createHash('sha256').update(text.replace(/\r\n/g,'\n'),'utf8').digest('hex');
}
