"""Decode the packaged MP3s and measure EBU loudness and true peak with FFmpeg."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
root=Path(__file__).resolve().parents[1];folder=root/'web/assets/music';rows=[]
for track in json.loads((folder/'manifest.json').read_text())['tracks']:
    path=folder/track['file'];data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==track['sha256']
    decoded=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
    summary=decoded.stderr.rsplit('Summary:',1)[1]
    loudness=float(re.search(r'I:\s*([-\d.]+) LUFS',summary)[1]);peak=float(re.search(r'Peak:\s*([-\d.]+) dBFS',summary)[1])
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=channels,sample_rate:format=duration','-of','json',str(path)],text=True))
    assert info['streams'][0]['channels']==2
    if track['id']!='night-corners':assert -20<=loudness<=-16 and peak<=-1, (track['id'],loudness,peak)
    rows.append({'id':track['id'],'integratedLufs':loudness,'truePeakDbfs':peak,'channels':2,'duration':float(info['format']['duration']),'sha256':track['sha256']})
report={'scope':'Decoded stereo files, EBU R128 integrated loudness and true peak. New 14 arrangements must measure -20..-16 LUFS and at most -1 dBFS true peak. Does not certify subjective listening quality or handset speaker playback.','rows':rows}
out=Path(sys.argv[1] if len(sys.argv)>1 else root/'evidence/r89-audio-decode.json');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'decoded':len(rows),'newArrangements':14,'passed':True}))
