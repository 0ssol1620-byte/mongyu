/* R39: embedded, attributed recordings. Media time is independent of simulation time. */
(function(root){'use strict';
// Reserve headroom for the existing eight-voice effect budget (8 * .055 = .44).
// This is a conservative envelope budget, not a measured MP3 true-peak claim.
const CROSSFADE=1.2,LEVEL=.50;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function packaged(){return root.MONGYU_EMBEDDED_MUSIC||{}}
function credits(tracks=packaged()){return Object.values(tracks).map(({src,...credit})=>({...credit}))}
function createPlayer(context,options={}){
 const tracks=options.tracks||packaged(),catalog=Object.values(tracks),destination=options.musicDestination||context.destination;
 const Policy=root.MongyuRestorationAudioPolicy||(typeof require==='function'?require('./restoration-audio-policy.js'):null);
 const policy=Policy?.createPolicy({tracks,rng:options.rng||Math.random});let musicRequest=null,entryKey=null;
 const makeAudio=options.audioFactory||(()=>new root.Audio()),decks=[],positions=new Map();
 let current=null,retiring=null,lastTrack=null,fadeUntil=0,status='idle',error='',authorized=false,allowed=false,scheduled=0,transitions=0,analyser=null,samples=null;
 function gain(deck,value,seconds=0){const p=deck.gain.gain,t=context.currentTime;p.cancelScheduledValues?.(t);p.setValueAtTime?.(p.value,t);if(seconds&&p.linearRampToValueAtTime)p.linearRampToValueAtTime(value,t+seconds);else if(p.setValueAtTime)p.setValueAtTime(value,t);else p.value=value}
 function halt(deck){if(!deck)return;deck.epoch++;deck.pending=false;deck.started=false;gain(deck,0);try{deck.media.pause()}catch(e){}}
 function stop(){allowed=false;if(current?.track&&Number.isFinite(current.media.currentTime))positions.set(current.track.id,current.media.currentTime);for(const deck of decks)halt(deck);retiring=null;if(!['unsupported','blocked','idle'].includes(status))status='paused'}
 function release(){stop();lastTrack=current?.track||lastTrack;current=null;for(const deck of decks){deck.track=null;try{if(deck.media.removeAttribute)deck.media.removeAttribute('src');else deck.media.src='';deck.media.load?.()}catch(e){}}}
 function fail(reason,kind='unsupported'){stop();error=String(reason?.message||reason||'Media unavailable').slice(0,180);status=kind}
 try{
  if(!catalog.length||typeof context.createMediaElementSource!=='function')throw Error('Embedded media playback unavailable');
  if(context.createAnalyser){analyser=context.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(analyser.fftSize);analyser.connect(destination)}
  for(let i=0;i<2;i++){
   const media=makeAudio();if(!media||typeof media.play!=='function')throw Error('HTMLAudio unavailable');
   media.preload='none';media.loop=true;media.autoplay=false;media.volume=1;media.setAttribute?.('playsinline','');
   const node=context.createMediaElementSource(media),mix=context.createGain();mix.gain.value=0;node.connect(mix);mix.connect(analyser||destination);
   const deck={media,node,gain:mix,track:null,epoch:0,pending:false,started:false};decks.push(deck);
   media.addEventListener?.('error',()=>{if(allowed&&deck===current)fail(media.error||'Recording decode failed')});
  }
 }catch(e){fail(e)}
 function begin(track,{restart=false}={}){
  if(!authorized||!allowed||status==='unsupported'||status==='blocked')return;
  const old=current,deck=decks.find(d=>d!==old)||decks[0];if(!deck)return;
  // Keep an outgoing recording until the new recording has actually begun.
  halt(deck);const epoch=++deck.epoch;deck.track=track;deck.pending=true;
  const changed=deck.media.src!==track.src;
  if(changed){deck.media.src=track.src;deck.media.load?.()}
  const offset=restart?0:positions.get(track.id)||0;
  try{deck.media.currentTime=offset}catch(e){/* Metadata may not be ready; retry before the play promise resolves. */}
  gain(deck,0);current=deck;status='loading';
  const valid=()=>allowed&&authorized&&deck.epoch===epoch&&current===deck;
  try{Promise.resolve(deck.media.play()).then(()=>{
   if(!valid()){if(deck.epoch===epoch||!deck.pending&&!deck.started)halt(deck);return}
   deck.pending=false;deck.started=true;status='playing';error='';scheduled++;
   if(offset>0&&Math.abs(deck.media.currentTime-offset)>1)try{deck.media.currentTime=offset}catch(e){}
   const fade=old?.track?.id===track.id?(track.loopFade??CROSSFADE):CROSSFADE;gain(deck,LEVEL,old?.started?fade:.15);
   if(old&&old!==deck){positions.set(old.track.id,Number(old.media.currentTime)||0);if(old.started&&!old.media.paused){retiring=old;gain(old,0,fade);fadeUntil=context.currentTime+fade;transitions++}else halt(old)}
  }).catch(e=>{if(valid())fail(e,e?.name==='NotAllowedError'?'blocked':'unsupported')})}catch(e){if(valid())fail(e,e?.name==='NotAllowedError'?'blocked':'unsupported')}
 }
 function update(values={}){
  authorized=values.authorized===true;
  const permitted=authorized&&values.allowed===true&&Number(values.musicVolume)>0;
  if(!permitted){stop();return inspect()}
  if(status==='unsupported'||status==='blocked')return inspect();allowed=true;
  if(retiring&&context.currentTime>=fadeUntil){halt(retiring);retiring=null}
  // Explicit context opts into restoration roles; legacy boss/main callers retain
  // their existing transport behavior. Role changes need not mean a new recording.
  musicRequest=values.musicContext&&policy?policy.update(values.musicContext):null;
  const desired=(musicRequest&&catalog.find(t=>t.id===musicRequest.trackId))||catalog.find(t=>t.role===(values.boss?'boss':'main'))||catalog[0];
  const keyed=values.entryKey!==undefined&&values.entryKey!==null,entryChanged=keyed&&values.entryKey!==entryKey;
  if(keyed)entryKey=values.entryKey;else entryKey=null;
  // Explicit scene/attempt entries restart. Authored map-only transitions retain
  // the clock when native roles share one substitute recording. Legacy unchanged.
  if(entryChanged&&!(values.preserveTrackOnEntry===true&&current?.track.id===desired.id)){for(const deck of decks)halt(deck);retiring=null;begin(desired,{restart:true})}
  else if(!current||current.track.id!==desired.id){if(current?.pending)halt(current);if(retiring){halt(retiring);retiring=null}begin(desired,{restart:values.restartOnResume===true})}
  else if(!current.pending&&(!current.started||current.media.paused||current.media.ended)){begin(desired,{restart:values.restartOnResume===true})}
  else if(!current.pending&&!retiring&&Number.isFinite(current.media.duration)&&current.media.duration>CROSSFADE*4&&current.media.currentTime>=current.media.duration-(current.track.loopFade??CROSSFADE)){begin(desired,{restart:true})}
  return inspect();
 }
 function inspect(){
  const track=current?.track||lastTrack||catalog[0]||null,position=current?Number(current.media.currentTime)||0:positions.get(track?.id)||0;
  const playing=allowed&&authorized&&status==='playing'&&current?.started===true&&!current.media.paused&&!current.media.ended&&context.state==='running';
  let pulse=0;if(playing&&analyser&&samples){try{analyser.getByteTimeDomainData(samples);let sum=0;for(const n of samples)sum+=Math.pow((n-128)/128,2);pulse=clamp(Math.sqrt(sum/samples.length)*3,0,1)}catch(e){}}
  const bpm=Number(track?.bpm)||null,beatPhase=bpm?(position*bpm/60)%1:0;
  return {backend:'licensed-media',status,error,trackId:track?.id||null,title:track?.title||'',artist:track?.artist||'',license:track?.license||'',playing,position,duration:Number.isFinite(current?.media.duration)?current.media.duration:track?.duration||null,bpm,beatPhase,beatAligned:false,pulse,active:decks.filter(d=>d.started&&!d.media.paused).length,scheduled,transitions,clock:'media-current-time',musicRole:musicRequest?.musicRole||null,musicAssignment:musicRequest?.assignment||null,stageMusicIndex:musicRequest?.stageIndex??null,roleCoverage:policy?.coverage||null};
 }
 return {update,stop,release,inspect,retry(){if(status==='blocked'){error='';status='paused'}}};
}
const api=Object.freeze({createPlayer,credits,CROSSFADE});root.MongyuLicensedScore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
