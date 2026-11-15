import {SaveJournal} from './storage.mjs';
const moduleUrl=new URL('./vendor/wie_web.js',import.meta.url).href,wasmUrl=new URL('./vendor/wie_web_bg.wasm',import.meta.url).href;
let engineModule;
export function loadEngine(){return engineModule||(engineModule=import(moduleUrl).then(async m=>{await m.default({module_or_path:wasmUrl});m.init?.();return m}).catch(e=>{engineModule=null;throw e}))}
export class OriginalRuntime{
 constructor({canvas,onState=()=>{},onError=()=>{},onSaveError=()=>{},factory,storage}={}){this.canvas=canvas;this.onState=onState;this.onError=onError;this.onSaveError=onSaveError;this.factory=factory;this.storage=storage;this.state='idle';this.held=new Set();this.frame=null;this.generation=0;this.frames=0;this.lastSaved=0;this.lastError=null}
 async start(game,{volume=1}={}){
  this.stop();const token=++this.generation;this.state='loading';this.onState(this.state);this.journal=new SaveJournal(game.id,this.storage);const save=this.journal.load();
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(Audio){this.audio=new Audio();this.gain=this.audio.createGain();this.gain.gain.value=volume;this.gain.connect(this.audio.destination);await this.audio.resume()}
  const factory=this.factory||(await loadEngine()).WieEmulator;if(token!==this.generation)return false;
  this.emulator=new factory(game.engineName,game.engineBytes,this.canvas,this.audio,this.gain,240,320,undefined);
  if(save&&!this.emulator.import_saves(save.bytes))throw Error('엔진이 저장 기록을 읽지 못했습니다. 기록은 보존했습니다.');
  this.game=game;this.state='play';this.lastSaved=performance.now();this.frames=0;this.lastError=null;this.onState(this.state,{recovered:save?.recovered===true});this.schedule();return true;
 }
 schedule(){if(this.frame!==null||this.state!=='play')return;this.frame=requestAnimationFrame(now=>{this.frame=null;if(this.state!=='play')return;try{this.emulator.tick();this.frames++;if(now-this.lastSaved>=2000){this.persist();this.lastSaved=now}if(this.emulator.has_exited()){this.persist();this.state='ended';this.clearHeld();this.audio?.suspend();this.onState(this.state);return}this.schedule()}catch(e){this.fail(e)}})}
 press(key){if(this.state!=='play'||this.held.has(key))return false;this.emulator.key_down(key);this.held.add(key);return true}
 release(key){if(!this.held.delete(key))return false;this.emulator?.key_up(key);return true}
 tap(key){if(!this.press(key))return false;this.release(key);return true}
 clearHeld(){for(const key of [...this.held])try{this.release(key)}catch(_){this.held.delete(key)}}
 persist(){try{if(!this.emulator?.has_saves())return false;const written=this.journal.write(this.emulator.export_saves());this.lastError=null;return written}catch(e){this.lastError=String(e.message||e);this.onSaveError(this.lastError);return false}}
 pause(){if(this.state!=='play')return false;this.clearHeld();this.state='pause';if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.persist();this.audio?.suspend().catch(()=>{});this.onState(this.state);return true}
 async resume(){if(this.state!=='pause')return false;await this.audio?.resume();if(this.state!=='pause')return false;this.state='play';this.onState(this.state);this.schedule();return true}
 setVolume(volume){if(this.gain)this.gain.gain.value=Math.max(0,Math.min(1,volume))}
 stop(){this.generation++;if(this.frame!==null)cancelAnimationFrame(this.frame);this.frame=null;this.clearHeld();this.persist();this.emulator?.free();this.emulator=null;this.audio?.close().catch(()=>{});this.audio=null;this.gain=null;this.state='idle'}
 fail(error){this.lastError=String(error.message||error);this.pause();this.state='error';this.onState(this.state);this.onError(this.lastError)}
 inspect(){return {state:this.state,frames:this.frames,held:[...this.held],gameId:this.game?.id||null,platform:this.emulator?.platform_kind()||null,speed:this.emulator?.speed()||1,achievedSpeed:this.emulator?.achieved_speed()??null,savedSequence:this.journal?.sequence||0,saveError:this.lastError,audio:this.audio?.state||null}}
}
