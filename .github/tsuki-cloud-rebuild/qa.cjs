const { chromium } = require('playwright');
const assert = require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});
 const page=await context.newPage(); const errors=[]; const requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>requests.push(r.url()));
 page.on('console',m=>{if(m.type()==='error'&&!/firebase|gstatic|ERR_FAILED/i.test(m.text()))errors.push(m.text())});
 await page.route(/googleapis|gstatic|firebaseio|firebaseapp/,r=>r.abort());
 await page.addInitScript(()=>{
   localStorage.setItem('tsuki-data-v4',JSON.stringify({mode:'cycle',periods:[],logs:{},pregnancy:{active:false},postpartum:{active:false},personalHealth:{fertilitySigns:[{date:'2026-08-15',bbt:36.6}],concerns:[]}}));
   localStorage.setItem('tsuki-tutorial-complete-v1','true'); localStorage.setItem('tsuki-whats-new-seen-v1','true');
 });
 await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.TsukiCloudBackup?.test?.chunkBytes,{timeout:10000});
 await page.waitForTimeout(800);
 const state=await page.evaluate(()=>({
   enabled:window.TsukiCloudBackup.enabled,
   chunks:window.TsukiCloudBackup.test.chunkBytes(new Uint8Array(1200000)).map(x=>x.byteLength),
   keys:window.TsukiCloudBackup.test.collectAssetKeys({settings:{wallpaperEnabled:true},pregnancy:{photos:[{assetKey:'photo:1'}],documents:[{assetKey:'doc:1'}]}}),
   panel:!!document.querySelector('#firebaseCloudBackupPanel'),
   script:[...document.scripts].some(s=>/firebase-backup\.js/.test(s.src)),
   appVersion:typeof APP_VERSION!=='undefined'?APP_VERSION:null,
   storage:localStorage.getItem('tsuki-data-v4'),
   width:document.documentElement.scrollWidth,viewport:innerWidth,
   duplicates:[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,a)=>a.indexOf(id)!==i)
 }));
 assert.equal(state.enabled,false,'sign-in independent default must stay off');
 assert.equal(state.panel,true); assert.equal(state.script,true); assert.equal(state.appVersion,'1.0.0');
 assert.ok(state.chunks.length>=3); assert.ok(state.keys.includes('wallpaper')&&state.keys.includes('photo:1')&&state.keys.includes('doc:1'));
 assert.ok(JSON.parse(state.storage).personalHealth.fertilitySigns.length===1);
 assert.equal(state.duplicates.length,0); assert.ok(state.width<=state.viewport);
 const firestoreCalls=requests.filter(x=>/firestore\.googleapis\.com/i.test(x));
 assert.equal(firestoreCalls.length,0,'signed-out/default-off boot must not call Firestore');
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({enabled:state.enabled,chunks:state.chunks,assetKeys:state.keys,firestoreCalls:firestoreCalls.length,layout:{width:state.width,viewport:state.viewport}}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
