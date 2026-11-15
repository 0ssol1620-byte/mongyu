import {crc32} from './archive.mjs';
export const SAVE_LIMIT=180*1024;
const base='mongyu.r93.original.';
export function toBase64(bytes){let result='';for(let p=0;p<bytes.length;p+=8192)result+=String.fromCharCode(...bytes.subarray(p,p+8192));return btoa(result)}
export function fromBase64(value){const s=atob(value),bytes=new Uint8Array(s.length);for(let i=0;i<s.length;i++)bytes[i]=s.charCodeAt(i);return bytes}
export function saveStore(){const native=globalThis._MongyuStore;return native?{getItem(key){const value=native.read(key);return value==='d'?null:value?.startsWith('v')?value.slice(1):value},setItem(key,value){if(native.write(key,value)!==true)throw Error('기기에 저장하지 못했습니다. 앱을 닫기 전에 저장 공간을 확인해 주세요.')}}:localStorage}
export function parseSave(raw,id){
 if(raw===null||raw===undefined)return null;const row=JSON.parse(raw);if(Number.isInteger(row?.schema)&&row.schema>1){const error=Error('새 버전의 저장 기록입니다. 기록을 지우거나 이전 기록으로 덮지 않았습니다.');error.code='FUTURE_SAVE';throw error}
 if(row?.schema!==1||row.id!==id||typeof row.payload!=='string'||row.payload.length>SAVE_LIMIT*4/3+4||!Number.isSafeInteger(row.sequence)||row.sequence<1)throw Error('저장 기록이 손상됐습니다.');
 const bytes=fromBase64(row.payload);if(bytes.length<8||bytes.length>SAVE_LIMIT||new TextDecoder().decode(bytes.subarray(0,8))!=='WIESAV01'||crc32(bytes)!==row.checksum)throw Error('저장 기록 검사에 실패했습니다.');return {...row,bytes};
}
export class SaveJournal{
 constructor(id,storage=saveStore()){if(!/^[a-f0-9]{64}$/.test(id))throw Error('게임 식별자가 올바르지 않습니다.');this.id=id;this.storage=storage;this.key=base+id;this.last=null;this.sequence=0}
 load(){const first=this.storage.getItem(this.key),backup=this.storage.getItem(this.key+'.backup');let error;
  for(const raw of [first,backup])if(raw!=null){try{parseSave(raw,this.id)}catch(e){if(e.code==='FUTURE_SAVE')throw e}}
  for(const [raw,recovered]of [[first,false],[backup,true]]){if(raw==null)continue;try{const row=parseSave(raw,this.id);this.last=row;this.sequence=row.sequence;if(recovered)this.damaged=first;return {bytes:row.bytes,recovered}}catch(e){error=e}}
  if(error)throw Error('저장 기록과 백업을 읽지 못했습니다. 기록은 지우지 않았습니다.');return null;
 }
 write(bytes){if(!(bytes instanceof Uint8Array)||bytes.length>SAVE_LIMIT||new TextDecoder().decode(bytes.subarray(0,8))!=='WIESAV01')throw Error('저장 기록 크기 또는 형식이 올바르지 않습니다.');const checksum=crc32(bytes);if(this.last?.checksum===checksum&&this.last?.bytes.length===bytes.length&&this.last.bytes.every((v,i)=>v===bytes[i]))return false;
  const row={schema:1,id:this.id,sequence:this.sequence+1,checksum,payload:toBase64(bytes)};if(this.last)this.storage.setItem(this.key+'.backup',JSON.stringify({schema:1,id:this.id,sequence:this.last.sequence,checksum:this.last.checksum,payload:this.last.payload}));const raw=JSON.stringify(row);if(this.damaged!=null){const archived=this.storage.getItem(this.key+'.damaged');if(archived!==null&&archived!==this.damaged)throw Error('기존 손상 기록을 보존하기 위해 덮어쓰기를 중지했습니다.');this.storage.setItem(this.key+'.damaged',this.damaged);this.damaged=null}this.storage.setItem(this.key,raw);if(this.storage.getItem(this.key)!==raw)throw Error('저장 내용을 다시 읽지 못했습니다.');this.last={...row,bytes:bytes.slice()};this.sequence=row.sequence;return true;
 }
}
let database;
function db(){if(!database)database=new Promise((resolve,reject)=>{const request=indexedDB.open('mongyu-original-files-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('files');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('이 기기의 파일 보관함을 열지 못했습니다.'))});return database}
export async function readBrowserGame(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files'),request=tx.objectStore('files').get('active');request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(Error('보관한 원본 파일을 읽지 못했습니다.'))})}
export async function writeBrowserGame(game){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put({bytes:game.bytes,name:game.name,id:game.id},'active');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('원본 파일을 이 기기에 보관하지 못했습니다.'));tx.onabort=()=>reject(Error('파일 보관이 중단됐습니다. 기존 파일은 유지됩니다.'))})}
