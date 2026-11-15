"""Prepare pinned CC-BY 4.0 recordings; never synthesize a replacement for a missing master.
Source: Eric Skiff / Resistor Anthems, https://ericskiff.com/music/.
Usage: --masters DIR to create the editorial catalog, or --restore-only for missing assets.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess,tempfile,urllib.request
ROOT=Path(__file__).resolve().parents[1];FOLDER=ROOT/'web/assets/music'
# Album number, runtime id, role(s). Roles are MONGYU editorial assignments, not NOM3 restoration.
ASSIGNMENTS=[(15,'night-corners',['title','story3']),
 (3,'chapter-01',['stage01']),(1,'chapter-02',['stage02']),(2,'chapter-03',['stage03']),
 (4,'chapter-04',['stage04']),(5,'chapter-05',['stage05']),(6,'chapter-06',['stage06']),
 (8,'chapter-07',['stage07']),(10,'chapter-08',['stage08']),(13,'chapter-09',['stage09']),(14,'chapter-10',['stage10']),
 (7,'heart-circuit',['boss']),(11,'boss-glass',['boss']),(12,'boss-motor',['boss']),(18,'boss-orbit',['boss']),
 (9,'menu-score',['menu','skin']),(16,'story-moon',['story1']),(17,'story-waterfall',['story2'])]
TEMPOS={1:145,2:105,3:130,4:122,5:110,6:108,7:145,8:150,9:110,10:120,11:152,12:152,13:137,14:140,15:110,16:90,17:95,18:125}
def digest(b):return hashlib.sha256(b).hexdigest()
def transcode(source,target,edit):
 args=['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-y','-ss',str(edit['startSeconds']),'-i',str(source),'-t',str(edit['durationSeconds']),'-af',f"loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:st=0:d=0.04,afade=t=out:st={edit['durationSeconds']-.08}:d=0.08",'-ar','32000','-ac','2','-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)]
 subprocess.run(args,check=True)
def restore(track):
 target=FOLDER/track['file']
 if target.exists():assert digest(target.read_bytes())==track['sha256'];return
 with tempfile.TemporaryDirectory() as folder:
  master=Path(folder)/'master.mp3';request=urllib.request.Request(track['downloadUrl'],headers={'User-Agent':'MONGYU licensed-asset builder'})
  with urllib.request.urlopen(request,timeout=120) as response:master.write_bytes(response.read())
  assert digest(master.read_bytes())==track['masterSha256'],'Pinned master changed'
  transcode(master,target,track['edit']);assert digest(target.read_bytes())==track['sha256'],'Encoding environment changed; do not silently replace pinned audio'
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--masters',type=Path);parser.add_argument('--restore-only',action='store_true');args=parser.parse_args()
 if args.restore_only:
  for track in json.loads((FOLDER/'manifest.json').read_text())['tracks']:restore(track)
  return
 assert args.masters,'Original downloaded masters are required for editorial changes'
 rows=json.loads((args.masters/'sources.json').read_text());sources={int(r['name'][:2]):r for r in rows};tracks=[]
 for number,ident,roles in ASSIGNMENTS:
  row=sources[number];master=args.masters/row['name'];assert digest(master.read_bytes())==row['sha256'];target=FOLDER/(ident+'.mp3')
  info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(master)],text=True));full=float(info['format']['duration']);duration=min(64.,round(full-.2,3));edit={'startSeconds':0.,'durationSeconds':duration,'processing':'Stereo excerpt, loudness normalization (-18 LUFS/-2 dBTP target), 40ms entry and 80ms exit fades, MP3 96kb/s at 32kHz. Not a sample-accurate musical loop.'};transcode(master,target,edit);data=target.read_bytes();title=row['name'][3:-4]
  tracks.append({'id':ident,'role':'main' if ident=='chapter-01' else roles[0],'musicRoles':roles,'file':target.name,'mime':'audio/mpeg','title':title,'artist':'Eric Skiff','album':'Resistor Anthems','license':'CC-BY-4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','sourceUrl':'https://ericskiff.com/music/','downloadUrl':row['url'],'masterSha256':row['sha256'],'masterBytes':row['bytes'],'bytes':len(data),'sha256':digest(data),'bpm':TEMPOS[number],'bpmSource':'Editorial approximate tempo; not beat tracking','duration':duration,'beatAligned':False,'loopFade':.08,'instrument':'Recorded chiptune ensemble','edit':edit,'changes':edit['processing']+' Original artist: Eric Skiff. Not NOM3 original audio.'});print(ident,title,len(data),flush=True)
 (FOLDER/'manifest.json').write_text(json.dumps({'schema':1,'tracks':tracks},ensure_ascii=False,indent=2)+'\n')
 credits=['MONGYU R92 music credits','Music: Eric Skiff — Resistor Anthems','Available at https://ericskiff.com/music/','License: Creative Commons Attribution 4.0 International (CC BY 4.0)','https://creativecommons.org/licenses/by/4.0/','','The artist website explicitly permits use in products with attribution.','These are licensed recordings, not MONGYU compositions and not the original NOM3 soundtrack.','Edits: excerpting, loudness normalization, edge fades, sample-rate conversion and MP3 encoding.','Role and map assignments are authored for MONGYU; tempo metadata is approximate.','All source and output hashes and exact edits are pinned in manifest.json.','']
 for t in tracks:credits.append(f"{t['id']}: {t['title']} — Eric Skiff / Resistor Anthems. Source: {t['downloadUrl']}")
 (FOLDER/'MUSIC-CREDITS.txt').write_text('\n'.join(credits)+'\n')
if __name__=='__main__':main()
