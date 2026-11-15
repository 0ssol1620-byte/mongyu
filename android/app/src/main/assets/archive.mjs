/* Container validation only. No original game code, images, dialogue or notes. */
export const LIMITS=Object.freeze({archive:16*1024*1024,expanded:64*1024*1024,entries:512});
const u16=(b,p)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint16(p,true),u32=(b,p)=>new DataView(b.buffer,b.byteOffset,b.byteLength).getUint32(p,true);
export async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0}
export function zipIndex(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<22||bytes.length>LIMITS.archive)throw Error('16MB 이하의 원본 ZIP 또는 JAR 파일을 선택해 주세요.');
 let end=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(bytes,p)===0x06054b50&&p+22+u16(bytes,p+20)===bytes.length){end=p;break}
 if(end<0||u16(bytes,end+4)||u16(bytes,end+6))throw Error('읽을 수 없는 ZIP입니다. 원본 파일을 다시 확인해 주세요.');
 const count=u16(bytes,end+10),size=u32(bytes,end+12),offset=u32(bytes,end+16);if(!count||count>LIMITS.entries||count!==u16(bytes,end+8)||offset+size!==end)throw Error('지원하지 않는 ZIP 구조입니다.');
 const rows=[],names=new Set();let p=offset,expanded=0;
 for(let i=0;i<count;i++){
  if(p+46>end||u32(bytes,p)!==0x02014b50)throw Error('ZIP 목차가 손상됐습니다.');
  const flags=u16(bytes,p+8),method=u16(bytes,p+10),compressed=u32(bytes,p+20),length=u32(bytes,p+24),n=u16(bytes,p+28),extra=u16(bytes,p+30),comment=u16(bytes,p+32),local=u32(bytes,p+42);
  if(p+46+n+extra+comment>end||n<1||n>240||(flags&1)||![0,8].includes(method)||compressed>LIMITS.archive||length>LIMITS.expanded)throw Error('암호화되었거나 지원하지 않는 ZIP입니다.');
  const raw=bytes.subarray(p+46,p+46+n);let name;try{name=new TextDecoder('utf-8',{fatal:true}).decode(raw)}catch(_){name=new TextDecoder('euc-kr',{fatal:true}).decode(raw)}
  if(name.includes('\\')||name.startsWith('/')||name.includes('\0')||name.split('/').some(x=>x==='..'||x==='.')||names.has(name))throw Error('ZIP 파일 경로가 올바르지 않습니다.');
  names.add(name);expanded+=length;if(expanded>LIMITS.expanded)throw Error('압축을 푼 파일 크기가 너무 큽니다.');
  if(local+30>offset||u32(bytes,local)!==0x04034b50||u16(bytes,local+8)!==method||(u16(bytes,local+6)&1))throw Error('ZIP 본문이 손상됐습니다.');
  const start=local+30+u16(bytes,local+26)+u16(bytes,local+28);if(start+compressed>offset)throw Error('ZIP 본문 범위가 올바르지 않습니다.');
  rows.push({name,method,compressed,length,start,crc:u32(bytes,p+16)});p+=46+n+extra+comment;
 }
 if(p!==offset+size)throw Error('ZIP 목차 길이가 올바르지 않습니다.');return rows;
}
export async function unzipEntry(bytes,row){
 const data=bytes.subarray(row.start,row.start+row.compressed);let result;
 if(row.method===0)result=data.slice();else{
  const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')),reader=stream.getReader(),chunks=[];let total=0;
  try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>row.length||total>LIMITS.expanded)throw Error('압축 데이터의 크기가 올바르지 않습니다.');chunks.push(value)}}catch(e){await reader.cancel().catch(()=>{});throw e}
  result=new Uint8Array(total);let at=0;for(const c of chunks){result.set(c,at);at+=c.length}
 }
 if(result.length!==row.length||crc32(result)!==row.crc)throw Error('ZIP 데이터 검사에 실패했습니다. 손상되지 않은 원본을 선택해 주세요.');return result;
}
export function storedZip(files){
 const chunks=[],directory=[];let at=0;const encoder=new TextEncoder();
 for(const [name,data]of files){const encoded=encoder.encode(name),crc=crc32(data),header=new Uint8Array(30+encoded.length),v=new DataView(header.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,encoded.length,true);header.set(encoded,30);chunks.push(header,data);
  const central=new Uint8Array(46+encoded.length),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,encoded.length,true);c.setUint32(42,at,true);central.set(encoded,46);directory.push(central);at+=header.length+data.length;
 }
 const dirLength=directory.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,files.length,true);v.setUint16(10,files.length,true);v.setUint32(12,dirLength,true);v.setUint32(16,at,true);const out=new Uint8Array(at+dirLength+22);let p=0;for(const c of [...chunks,...directory,end]){out.set(c,p);p+=c.length}return out;
}
export async function prepareOriginal(bytes,name){
 const entries=zipIndex(bytes),inner=entries.filter(r=>r.name.toLowerCase().endsWith('.jar'));let jar,archive=bytes,engineName='original.jar';
 if(inner.length){if(inner.length!==1)throw Error('게임 하나만 들어 있는 원본 ZIP을 선택해 주세요.');jar=await unzipEntry(bytes,inner[0]);engineName='original.zip'}else jar=bytes;
 const resources=zipIndex(jar),names=new Set(resources.map(r=>r.name));
 for(const required of ['nom1.pzx','dog1.pzx','gm1.pzx','nyun1.pzx','GETSKINTABLE.bin','BgmStage01.mmf','BgmStage10.mmf'])if(!names.has(required))throw Error('놈3 KTF 원본 구성으로 확인되지 않았습니다. 실행 파일과 리소스가 함께 든 파일을 선택해 주세요.');
 if(!resources.some(r=>/^client\.bin\d+$/.test(r.name)))throw Error('원본 실행 파일이 없습니다.');
 const id=await sha256(bytes),jarDigest=await sha256(jar),adf=entries.find(r=>r.name.endsWith('__adf__'));
 if(inner.length&&adf){const text=new TextDecoder('euc-kr').decode(await unzipEntry(bytes,adf));if(!/^MClass:\s*Nom3\s*$/m.test(text))throw Error('놈3 실행 정보가 일치하지 않습니다.');const prefix=adf.name.slice(0,-7);if(prefix){const files=[];for(const row of entries)if(row.name.startsWith(prefix)&&!row.name.endsWith('/'))files.push([row.name.slice(prefix.length),await unzipEntry(bytes,row)]);archive=storedZip(files)}}
 else{const aid='NOM3'+id.slice(0,8),text=`PID:${aid}\nAID:${aid}\nName:Nom3\nMClass:Nom3\nDisplaySize:240*320\n`;archive=storedZip([[aid+'.jar',jar],['__adf__',new TextEncoder().encode(text)]]);engineName='original.zip'}
 return {schema:1,id,jarDigest,name:name.slice(0,180),bytes:bytes.slice(),engineBytes:archive,engineName,resourceCount:resources.length,originalMusicFiles:resources.filter(r=>/^Bgm.*\.mmf$/.test(r.name)).length};
}
