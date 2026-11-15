"""MONGYU original electronic suite. Offline synthesis, no third-party samples.
NumPy and FFmpeg required; generated files are pinned by the music manifest.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'web/assets/music';SR=32000
# Title, BPM, tonic, mode, melodic contour, bass rhythm and percussion grammar.
SUITE=[
 ('사탕 미로',120,45,[0,2,3,5,7,8,10],[0,4,7,4,2,5,4,1],[0,1.5,2,3.5],0),
 ('유리 파도',126,50,[0,2,3,5,7,9,10],[0,2,5,4,7,5,2,3],[0,.75,2,2.75],1),
 ('뒤집힌 하늘',108,48,[0,2,4,6,7,9,11],[7,4,2,6,4,1,5,2],[0,2.5],2),
 ('자석 정원',132,43,[0,2,3,5,7,8,10],[0,0,4,2,6,4,3,2],[0,1,2.75,3.5],3),
 ('액체 계단',124,41,[0,2,3,5,7,9,10],[2,4,5,2,7,5,4,1],[0,1.75,2.5],1),
 ('잠든 기계',140,45,[0,1,3,5,7,8,10],[0,4,1,4,7,5,3,1],[0,.75,1.5,2.5,3.25],3),
 ('거울의 반대편',116,46,[0,2,3,5,7,8,10],[7,5,3,1,0,4,2,6],[0,1.5,3.25],2),
 ('기억의 접힘',112,50,[0,2,3,5,7,8,10],[0,2,4,6,4,3,1,2],[0,2,3.5],0),
 ('궤도 밖으로',138,48,[0,2,3,5,7,9,10],[0,4,6,7,4,2,5,3],[0,.5,1.75,2.5,3.25],3),
 ('마지막 사각',128,45,[0,2,3,5,7,8,10],[0,4,7,9,7,6,4,2],[0,1.5,2.75,3.5],1),
 ('심장 회로',144,38,[0,1,3,5,7,8,10],[0,0,4,1,0,6,4,1],[0,.75,1.5,2,2.75,3.5],3),
]
def compose(index,spec):
 title,bpm,tonic,scale,motif,bass_rhythm,grammar=spec
 beat=60/bpm;duration=64*beat;n=round(duration*SR);out=np.zeros((n,2));rng=np.random.default_rng(8200+index)
 def add(sig,start,pan=0,echo=False):
  at=(round(start*SR)+np.arange(len(sig)))%n
  out[at,0]+=sig*np.sqrt((1-pan)/2);out[at,1]+=sig*np.sqrt((1+pan)/2)
  if echo:
   for delay,gain in [(beat*.75,.2),(beat*1.5,.09)]:
    delayed=(at+round(delay*SR))%n;out[delayed,0]+=sig*gain*np.sqrt((1+pan)/2);out[delayed,1]+=sig*gain*np.sqrt((1-pan)/2)
 def tone(midi,start,length,amp,voice='pluck',pan=0):
  t=np.arange(round(length*SR))/SR;f=440*2**((midi-69)/12);phase=2*np.pi*f*t
  if voice=='pad':
   signal=(np.sin(phase)+.24*np.sin(phase*1.002)+.16*np.sin(phase*.998));env=np.minimum(1,t/.25)*np.minimum(1,(length-t)/.5)
  elif voice=='bass':
   signal=np.sin(phase)+.27*np.sin(2*phase)*np.exp(-t*7)+.12*np.sin(3*phase)*np.exp(-t*12);env=(1-np.exp(-t*250))*np.exp(-t*4)*np.minimum(1,(length-t)/.035)
  else:
   modulation=(.55+index%3*.5)*np.sin(phase*(2 if grammar!=2 else 3.01))*np.exp(-t*8)
   signal=np.sin(phase+modulation)+.13*np.sin(phase*2);env=(1-np.exp(-t*420))*np.exp(-t*(6 if grammar==3 else 3.8))*np.minimum(1,(length-t)/.05)
  add(signal*env*amp,start,pan,voice=='pluck')
 def drum(start,kind,amp):
  length={'kick':.24,'snare':.15,'hat':.055,'open':.15}[kind];t=np.arange(round(length*SR))/SR
  noise=rng.uniform(-1,1,len(t));bright=np.diff(noise,prepend=noise[0])
  if kind=='kick':signal=np.sin(2*np.pi*(48*t+2.8*(1-np.exp(-t*25))))*np.exp(-t*21)+noise*.08*np.exp(-t*130)
  elif kind=='snare':signal=bright*.36*np.exp(-t*36)+np.sin(2*np.pi*175*t)*.35*np.exp(-t*42)
  else:signal=bright*.24*np.exp(-t*(85 if kind=='hat' else 28))
  signal*=np.minimum(1,t/.001)*np.minimum(1,(length-t)/.008);add(signal*amp,start,.25 if kind in ('hat','open') else 0)
 progression=[0,5,3,6] if grammar!=2 else [0,3,5,4]
 for bar in range(16):
  degree=progression[(bar//2)%4];root=tonic+scale[degree];base=bar*4*beat
  if bar%2==0:
   for k in [0,2,4]:tone(tonic+12+scale[(degree+k)%7]+(12 if degree+k>=7 else 0),base,beat*8.4,.018,'pad',(k-2)*.22)
  for onset in bass_rhythm:tone(root-12,base+onset*beat,beat*.65,.18,'bass')
  for j in range(8):
   if grammar==2 and j%3==1:continue
   step=motif[(j+bar//4)%len(motif)];midi=tonic+24+scale[step%7]+12*(step//7)
   if bar>=8 and j in (3,7):midi+=12
   onset=j*.5+(.08 if j%2 and grammar in (0,1) else 0)
   tone(midi,base+onset*beat,beat*1.6,.038 if j%2 else .052,'pluck',(-1 if j%2 else 1)*.42)
  kicks=[0,2] if grammar==2 else [0,1,2,3] if grammar==0 else [0,1.75,2.5] if grammar==1 else [0,.75,2,2.75]
  for k in kicks:drum(base+k*beat,'kick',.34)
  for k in [1,3]:drum(base+k*beat,'snare',.16)
  for j in range(8):drum(base+(j*.5+.04*(j%2))*beat,'open' if j==7 and bar%2 else 'hat',.11 if j%2 else .07)
 # Fixed mastering gain with soft limiting; no hard-clipped samples.
 out=np.tanh(out*1.5);out*=.82/max(.82,np.max(np.abs(out)))
 ident='chapter-'+str(index+1).zfill(2) if index<10 else 'heart-circuit'
 target=FOLDER/(ident+'.mp3')
 with tempfile.TemporaryDirectory() as td:
  wav=Path(td)/'score.wav'
  with wave.open(str(wav),'wb') as f:
   f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((out*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar',str(SR),'-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)],check=True)
 data=target.read_bytes();return {'id':ident,'role':'main' if index==0 else 'stage' if index<10 else 'boss','musicRoles':['stage'+str(index+1).zfill(2)] if index<10 else ['boss'],'file':target.name,'mime':'audio/mpeg','title':title,'artist':'MONGYU · original electronic suite','license':'Project-original composition','licenseUrl':'https://github.com/0ssol1620-byte/mongyu','sourceUrl':'https://github.com/0ssol1620-byte/mongyu','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'bpm':bpm,'duration':duration,'beatAligned':False,'loopFade':.04,'changes':'Original score synthesized by tools/compose_chapter_scores.py. No third-party samples or original NOM recordings. Runtime crossfades and looping.'}
if __name__=='__main__':
 FOLDER.mkdir(exist_ok=True);manifest=json.loads((FOLDER/'manifest.json').read_text());tracks=[]
 for i,spec in enumerate(SUITE):
  track=compose(i,spec);tracks.append(track);print(track['id'],track['bytes'],flush=True)
 manifest['tracks']=[t for t in manifest['tracks'] if t['id']=='night-corners']+tracks
 (FOLDER/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
