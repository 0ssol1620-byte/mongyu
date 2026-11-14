/* Release rules for an eventual store integration. Offline builds grant nothing. */
(function(root){'use strict';
const DAY=86400000;
const products=Object.freeze([
 {id:'mongyu.moonwardrobe',kind:'cosmetic',priceHypothesisKRW:3900,recurring:false},
 {id:'mongyu.founder',kind:'supporter-cosmetic',priceHypothesisKRW:6900,recurring:false},
 {id:'mongyu.nextdream',kind:'expansion',priceHypothesisKRW:6900,recurring:false}
].map(Object.freeze));
function offer(context={}){
 const {surface,outcome,sessionSeconds,completedRuns,daysActive,offersToday,now,lastOfferAt}=context;
 if(surface!=='result'||outcome!=='clear')return {show:false,reason:'success-only'};
 if(!Number.isFinite(sessionSeconds)||sessionSeconds<180||!Number.isInteger(completedRuns)||completedRuns<3)return {show:false,reason:'learn-first'};
 if(context.childMode||context.interrupted||context.dialogOpen||context.dismissed||context.paid)return {show:false,reason:'respect-player'};
 if(!Number.isSafeInteger(now)||now<0||!Number.isInteger(offersToday)||offersToday<0||offersToday>=1)return {show:false,reason:'frequency-cap'};
 if(lastOfferAt!==null&&lastOfferAt!==undefined&&(!Number.isSafeInteger(lastOfferAt)||now-lastOfferAt<DAY))return {show:false,reason:'cooldown'};
 return {show:true,automaticModal:false,productId:Number.isInteger(daysActive)&&daysActive>=3?'mongyu.founder':'mongyu.moonwardrobe'};
}
function rewardedAd(context={}){
 if(context.explicitOptIn!==true||context.surface!=='wardrobe'||context.inRun||context.childMode)return {enabled:false,reason:'optional-wardrobe-only'};
 if(context.providerReady!==true||context.privacyReady!==true||context.serverVerificationReady!==true)return {enabled:false,reason:'not-configured'};
 if(!Number.isInteger(context.viewsToday)||context.viewsToday<0||context.viewsToday>=3)return {enabled:false,reason:'daily-cap'};
 return {enabled:true,reward:'temporary-cosmetic-trial',affectsScore:false,requiresServerVerifiedTransaction:true};
}
// Client callbacks, purchase tokens, pending purchases and local storage are not receipts.
function entitlementView(serverRecord,accountId){
 if(!serverRecord||serverRecord.accountId!==accountId||typeof accountId!=='string'||!accountId||serverRecord.status!=='active'||serverRecord.verification!=='server-verified')return [];
 return products.filter(p=>Array.isArray(serverRecord.productIds)&&serverRecord.productIds.includes(p.id)).map(p=>p.id);
}
const api=Object.freeze({products,offer,rewardedAd,entitlementView,liveBillingEnabled:false,liveAdsEnabled:false});
root.MongyuReleasePolicy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
