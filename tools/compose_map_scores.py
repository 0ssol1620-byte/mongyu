"""R89 authored map arrangements. No third-party samples or NOM melodies.
NumPy synthesis + FFmpeg; independent of game RNG. Regeneration changes pinned assets.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,wave
import numpy as np
from compose_chapter_scores import SUITE
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'web/assets/music';SR=32000
VOICES=['marimba','piano','glass','mallet','water','acid','glass','strings','pulse','bell','acid','glass','pulse','water']
EXTRA=[('깨진 유리의 춤',136,46,[0,1,3,5,7,8,10],[0,4,1,7,4,3,6,1],[0,1.5,2.75],2),('잠금 해제',152,38,[0,1,3,5,7,8,10],[0,0,4,1,6,4,3,1],[0,.75,1.5,2,3.25],3),('무중력 심장',132,43,[0,2,3,5,7,9,10],[0,4,6,7,4,2,1,3],[0,1.75,2.5,3.5],1)]
IDS=['chapter-'+str(i+1).zfill(2) for i in range(10)]+['heart-circuit','boss-glass','boss-motor','boss-orbit']
def compose(index,spec):
 title,bpm,tonic,scale,motif,bass_pattern,grammar=spec;beat=60/bpm;duration=64*beat;n=round(duration*SR);out=np.zeros((n,2));rng=np.random.default_rng(8900+index);voice=VOICES[index]
 def add(signal,start,pan=0,echo=0):
  at=(round(start*SR)+np.arange(len(signal)))%n;g=np.sqrt([(1-pan)/2,(1+pan)/2]);out[at]+=signal[:,None]*g
  if echo:
   for delay,gain in [(beat*.75,.16),(beat*1.5,.07)]:out[(at+round(delay*SR))%n]+=signal[:,None]*g[::-1]*gain*echo
 def note(midi,start,length,amp,kind=None,pan=0):
  kind=kind or voice;t=np.arange(max(1,round(length*SR)))/SR;f=440*2**((midi-69)/12);p=2*np.pi*f*t;attack=1-np.exp(-t*260);release=np.minimum(1,(length-t)/.04)
  if kind=='pad':
   signal=np.sin(p)+.3*np.sin(p*1.0017+.5)+.12*np.sin(p*.9984);env=np.minimum(1,t/.35)*np.minimum(1,(length-t)/.6)
  elif kind=='bass':signal=np.sin(p)+.22*np.sin(2*p)*np.exp(-t*8)+.08*np.sin(3*p)*np.exp(-t*15);env=attack*np.exp(-t*3.5)*release
  elif kind in ['marimba','mallet']:
   signal=np.sin(p)+.34*np.sin(p*3.99+.1)*np.exp(-t*18)+.12*np.sin(p*9.93)*np.exp(-t*28);env=attack*np.exp(-t*(5.3 if kind=='marimba' else 3.8))*release
  elif kind in ['piano','water','strings']:
   signal=np.sin(p+.55*np.sin(2*p)*np.exp(-t*5))+.2*np.sin(2*p)*np.exp(-t*7)+.07*np.sin(4*p)*np.exp(-t*12)
   if kind=='strings':signal+=.13*np.sin(3*p+.3)*np.exp(-t*4)
   env=attack*np.exp(-t*(2.8 if kind=='water' else 3.9))*release
  elif kind in ['glass','bell']:
   signal=np.sin(p)+.25*np.sin(p*2.76+.4)*np.exp(-t*5)+.09*np.sin(p*5.41)*np.exp(-t*9);env=attack*np.exp(-t*(2.1 if kind=='glass' else 3.3))*release
  else:
   signal=np.zeros_like(t)
   for h in range(1,10):
    if f*h>SR*.43:break
    signal+=np.sin(p*h+.15*h)/h*np.exp(-t*h*(2.5 if kind=='acid' else 1.6))*(1 if h%2 else .35)
   signal=np.tanh(signal*1.25);env=attack*np.exp(-t*6)*release
  add(signal*env*amp,start,pan,1 if kind not in ['bass','pad'] else 0)
 def drum(start,kind,amp):
  length={'kick':.23,'snare':.16,'rim':.09,'hat':.045,'open':.13,'tom':.22}[kind];t=np.arange(round(length*SR))/SR;noise=rng.uniform(-1,1,len(t));high=np.diff(noise,prepend=noise[0])
  if kind=='kick':signal=np.sin(2*np.pi*(46*t+2.7*(1-np.exp(-t*26))))*np.exp(-t*21)+noise*.045*np.exp(-t*120)
  elif kind=='snare':signal=high*.23*np.exp(-t*31)+np.sin(2*np.pi*177*t)*.32*np.exp(-t*35)
  elif kind=='rim':signal=np.sin(2*np.pi*740*t)*np.exp(-t*75)+np.sin(2*np.pi*1130*t)*.27*np.exp(-t*95)
  elif kind=='tom':signal=np.sin(2*np.pi*(95*t+1.2*(1-np.exp(-t*18))))*np.exp(-t*20)
  else:signal=high*.2*np.exp(-t*(95 if kind=='hat' else 28))
  signal*=np.minimum(1,t/.001)*np.minimum(1,(length-t)/.008);add(signal*amp,start,.3 if kind in ['hat','open','rim'] else 0)
 sparse=index in [2,6,7,11];heavy=index in [5,10,12];progression=[0,5,3,6] if grammar!=2 else [0,3,5,4]
 for bar in range(16):
  base=bar*4*beat;degree=progression[(bar//2)%4];root=tonic+scale[degree];section=.82 if bar<2 else .94 if bar<8 else 1
  if bar%2==0:
   for k in [0,2,4]:note(tonic+12+scale[(degree+k)%7]+(12 if degree+k>=7 else 0),base,beat*8.3,.017,'pad',(k-2)*.28)
  bass=[0,2.5] if sparse else bass_pattern
  for onset in bass:note(root-12,base+onset*beat,beat*(1.25 if sparse else .65),.17*section,'bass')
  for j in range(8):
   if sparse and j not in [0,3,6]:continue
   if bar<2 and j%2:continue
   if bar%8==7 and j in [5,7]:continue
   step=motif[(j+bar//4)%len(motif)];midi=tonic+24+scale[step%7]+12*(step//7)
   if bar>=8 and j==7 and not heavy:midi+=12
   swing=.07 if voice in ['piano','marimba','water'] else .025
   note(midi,base+(j*.5+(swing if j%2 else 0))*beat,beat*(2.1 if sparse else 1.4),(.038 if j%2 else .052)*section,pan=(-1 if j%2 else 1)*.48)
  kicks=[0,2.5] if sparse else [0,.75,2,2.75] if heavy else [0,1.75,2.5] if grammar==1 else [0,2]
  for k in kicks:drum(base+k*beat,'kick',(.30 if not heavy else .37)*section)
  for k in [1,3]:drum(base+k*beat,'rim' if sparse or voice in ['piano','water'] else 'snare',.095 if sparse else .15)
  for j in range(8):
   if sparse and j%2==0:continue
   drum(base+(j*.5+.045*(j%2))*beat,'open' if j==7 and bar%4==3 else 'hat',.065 if j%2 else .035)
  if bar%4==3 and not sparse:
   for j in range(3):drum(base+(3.25+j*.25)*beat,'tom',.07+j*.015)
 out=np.tanh(out*1.35);out*=.85/max(.85,np.max(np.abs(out)));ident=IDS[index];target=FOLDER/(ident+'.mp3')
 with tempfile.TemporaryDirectory() as td:
  wav=Path(td)/'score.wav'
  with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((out*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-18:TP=-2:LRA=7','-ar',str(SR),'-codec:a','libmp3lame','-b:a','112k','-map_metadata','-1',str(target)],check=True)
 data=target.read_bytes();return {'id':ident,'role':'main' if index==0 else 'stage' if index<10 else 'boss','musicRoles':['stage'+str(index+1).zfill(2)] if index<10 else ['boss'],'file':target.name,'mime':'audio/mpeg','title':title,'artist':'MONGYU / map score sessions','license':'Project-original composition','licenseUrl':'https://github.com/0ssol1620-byte/mongyu','sourceUrl':'https://github.com/0ssol1620-byte/mongyu','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'bpm':bpm,'duration':duration,'beatAligned':False,'loopFade':.08,'instrument':voice,'changes':'R89 authored map arrangement: distinct lead, groove, arrangement and stereo space. Synthesized by tools/compose_map_scores.py; no third-party samples or NOM recordings.'}
if __name__=='__main__':
 manifest=json.loads((FOLDER/'manifest.json').read_text());tracks=[]
 for i,spec in enumerate(SUITE+EXTRA):
  track=compose(i,spec);tracks.append(track);print(track['id'],track['instrument'],track['bytes'],flush=True)
 manifest['tracks']=[t for t in manifest['tracks'] if t['id']=='night-corners']+tracks;(FOLDER/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
