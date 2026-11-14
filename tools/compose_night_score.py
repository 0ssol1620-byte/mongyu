"""Original deterministic MONGYU title composition; no sampled recordings.
Requires numpy and ffmpeg. A four-chord, 64-second looping ambient cue.
"""
from pathlib import Path
import numpy as np, wave, subprocess, tempfile, json, hashlib
ROOT=Path(__file__).resolve().parents[1];SR=44100;DURATION=64;N=SR*DURATION
out=np.zeros((N,2),dtype=np.float64)
def note(midi):return 440*2**((midi-69)/12)
def add(midi,start,length,amp,pan,pluck=False):
 n=int(length*SR); t=np.arange(n)/SR; f=note(midi)
 env=(1-np.exp(-t/(.008 if pluck else .65)))*np.exp(-t/(1.6 if pluck else 10))*np.minimum(1,(length-t)/(.6 if pluck else 1.8))
 wave=(np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)*np.exp(-t*1.5)+.09*np.sin(2*np.pi*f*3*t)) if pluck else (np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*f*1.002*t)+.15*np.sin(2*np.pi*f*.998*t))
 sig=wave*env*amp; idx=(int(start*SR)+np.arange(n))%N
 out[idx,0]+=sig*np.sqrt((1-pan)/2);out[idx,1]+=sig*np.sqrt((1+pan)/2)
 # Soft, tempo-related echoes wrap at the loop boundary.
 if pluck:
  for delay,g in [(0.75,.24),(1.5,.13),(2.25,.06)]:
   j=(idx+int(delay*SR))%N;out[j,0]+=sig*g*np.sqrt((1+pan)/2);out[j,1]+=sig*g*np.sqrt((1-pan)/2)
for bar,chord in enumerate([(50,57,60,64),(46,53,57,60),(53,60,64,67),(48,55,60,62)]):
 for k,m in enumerate(chord):add(m,bar*16,19,.045,[-.5,.5,-.2,.2][k])
 melody=[chord[2]+12,chord[3]+12,chord[1]+12,chord[2]+12,chord[0]+24,chord[3]+12,chord[2]+12]
 for j,m in enumerate(melody):add(m,bar*16+.5+j*2,4,.025 if j%3 else .035,(-1 if j%2 else 1)*.4,True)
# Deterministic continuous stereo air; no random-number calls and no game coupling.
t=np.arange(N)/SR;air=np.sin(2*np.pi*220*t)*np.sin(2*np.pi*.125*t)*.002
out[:,0]+=air;out[:,1]-=air
out*=.72/max(.72,np.max(np.abs(out)))
folder=ROOT/'web/assets/music';folder.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as td:
 wav=Path(td)/'night.wav'
 with wave.open(str(wav),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes((out*32767).astype('<i2').tobytes())
 target=folder/'night-corners.mp3'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','loudnorm=I=-20:TP=-3:LRA=9','-ar','44100','-codec:a','libmp3lame','-b:a','160k',str(target)],check=True)
p=folder/'manifest.json';m=json.loads(p.read_text());m['tracks']=[x for x in m['tracks'] if x['id']!='night-corners']
data=target.read_bytes();m['tracks'].append({'id':'night-corners','role':'title','musicRoles':['title','menu','skin','story1','story2','story3'],'file':target.name,'mime':'audio/mpeg','title':'밤의 모서리 / Night Corners','artist':'MONGYU · procedural composition','license':'Project-original composition','licenseUrl':'https://github.com/0ssol1620-byte/mongyu','sourceUrl':'https://github.com/0ssol1620-byte/mongyu','bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'bpm':120,'duration':64,'beatAligned':False,'changes':'Original score synthesized by tools/compose_night_score.py. No third-party samples. Runtime volume and looping.'})
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');print(target.name,len(data))
