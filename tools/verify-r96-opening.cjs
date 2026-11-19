/* Exercise the opening without input, then with genuine play, in one fresh browser profile. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

async function run() {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium', args:['--no-sandbox']});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844}, hasTouch:true});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/web/MONGYU_R96.html');
  await page.tap('#titleContinue');
  await page.tap('#restorationSceneNext');
  await page.tap('#restorationSceneNext');
  await page.locator('#squareResult').waitFor({timeout:40000});
  assert.equal(await page.locator('#squareHeading').textContent(), '첫 점프 연습');
  assert.equal(await page.locator('#squareNext').isVisible(), false);
  assert.equal(await page.locator('#restorationRecordBadge').isVisible(), false);
  assert.equal(await page.evaluate(() => QUAD_RIFT_APP.restoration.view().status.collected), 1);
  assert.equal(await page.evaluate(() => QUAD_RIFT_APP.activeRun().inputCount), 0);
  await page.tap('#squareRetry');
  let taps = 0;
  for (let i=0; i<88 && !await page.locator('#squareResult').isVisible(); i++) {
   if (await page.evaluate(() => QUAD_RIFT_APP.activeRun().time > 2.4)) {
    await page.touchscreen.tap(195, 510);
    taps++;
   }
   await page.waitForTimeout(405);
  }
  await page.locator('#squareResult').waitFor({timeout:3500});
  assert.equal(await page.locator('#squareHeading').textContent(), '기억 획득');
  const jumps = await page.evaluate(() => QUAD_RIFT_APP.activeRun().jumps);
  assert.ok(jumps > 0);
  await page.tap('#squareNext');
  assert.equal(await page.evaluate(() => QUAD_RIFT_APP.activeRun().slot.number), 3);
  assert.equal(await page.evaluate(() => QUAD_RIFT_APP.restoration.view().status.collected), 2);
  assert.deepEqual(errors, []);
  const report = {scope:'Fresh R96 browser profile. Idle timer then real touchscreen taps, no state injection.',
                  idleEarned:false, retryReachedNextStage:true, jumps, taps, errors};
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 } finally { await browser.close(); }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
