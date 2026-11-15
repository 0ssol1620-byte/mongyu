"""Inspect numeric presentation metadata from a separately obtained research JAR.
No images, dialogue, audio events or commercial files are emitted. Not an authenticity check.
"""
from pathlib import Path
import argparse,hashlib,json,re,struct,zipfile,zlib
parser=argparse.ArgumentParser();parser.add_argument('jar',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
rows=[];audio=[]
with zipfile.ZipFile(args.jar) as jar:
 for name in jar.namelist():
  data=jar.read(name)
  if re.fullmatch(r'(?:nom|dog|gm|nyun)[1-4]r?\.pzx',name):
   assert data[:4]==b'PZX\x01';states=struct.unpack_from('<H',data,17)[0];offsets=struct.unpack_from('<'+'I'*states,data,19);frameRows=[data[i] for i in offsets];frameTable=struct.unpack_from('<I',data,8)[0];frames=struct.unpack_from('<H',data,frameTable+1)[0];imageTable=struct.unpack_from('<I',data,4)[0];images=struct.unpack_from('<H',data,imageTable+1)[0];idat=data.index(b'IDAT');width,height=struct.unpack_from('<HH',data,idat-12);raw=zlib.decompress(data[idat+4:]);assert len(raw)==(width+1)*height
   dimensions=[]
   for i in range(images):
    flag,x,y,w,h=struct.unpack_from('<BHHHH',data,len(data)-9*images+9*i);assert x+w<=width and y+h<=height;dimensions.append([w,h])
   rows.append({'file':name,'sha256':hashlib.sha256(data).hexdigest(),'states':states,'stateFrameCounts':frameRows,'composedFrames':frames,'atlasImages':images,'atlasSize':[width,height],'firstFourImageBounds':dimensions[:4]})
  elif name.endswith('.mmf'):
   assert data.startswith(b'MMMD');audio.append({'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'container':'Yamaha SMAF (MMMD)','containsSequence':b'Mtsq' in data,'containsVoiceSetup':b'Mtsu' in data})
report={'scope':'Numeric metadata only from unauthenticated third-party KTF V1.0.1 candidate. Private rendering inspected separately; does not establish every state, every story, real-device timbre or official provenance. No commercial pixels, music events or dialogue are published.','jarSha256':hashlib.sha256(args.jar.read_bytes()).hexdigest(),'spriteResources':rows,'audioResources':audio}
args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'sprites':len(rows),'audioResources':len(audio),'bgmResources':len([x for x in audio if x['file'].startswith('Bgm')]),'metadataOnly':True}))
