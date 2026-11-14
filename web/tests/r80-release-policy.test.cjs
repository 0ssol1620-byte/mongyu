const test=require('node:test'),assert=require('node:assert/strict'),P=require('../src/release-policy.js');
const good={surface:'result',outcome:'clear',sessionSeconds:240,completedRuns:3,daysActive:2,offersToday:0,now:100000000,lastOfferAt:null};
test('offers wait for learning and success; never interrupt a run or failure',()=>{
 assert.equal(P.offer(good).show,true);assert.equal(P.offer(good).automaticModal,false);
 for(const v of [{surface:'play'},{outcome:'fail'},{completedRuns:2},{sessionSeconds:120},{childMode:true},{dismissed:true},{dialogOpen:true},{offersToday:1},{lastOfferAt:good.now+1},{now:NaN}])assert.equal(P.offer({...good,...v}).show,false);
});
test('rewarded ads are unavailable without explicit choice and verified infrastructure',()=>{
 const good={explicitOptIn:true,surface:'wardrobe',providerReady:true,privacyReady:true,serverVerificationReady:true,viewsToday:0};assert.equal(P.rewardedAd(good).enabled,true);
 for(const v of [{explicitOptIn:false},{inRun:true},{surface:'result'},{providerReady:false},{privacyReady:false},{serverVerificationReady:false},{viewsToday:3},{viewsToday:-1},{childMode:true}])assert.equal(P.rewardedAd({...good,...v}).enabled,false);
 assert.equal(P.liveBillingEnabled,false);assert.equal(P.liveAdsEnabled,false);
});
test('pending, refunded, cross-account and client-only purchase claims grant no access',()=>{
 const record={accountId:'player1',status:'active',verification:'server-verified',productIds:['mongyu.founder','unknown']};assert.deepEqual(P.entitlementView(record,'player1'),['mongyu.founder']);
 for(const v of [{status:'pending'},{status:'refunded'},{verification:'client-callback'},{accountId:'another'}])assert.deepEqual(P.entitlementView({...record,...v},'player1'),[]);
 assert.deepEqual(P.entitlementView({purchaseToken:'untrusted',owned:true},'player1'),[]);
});
