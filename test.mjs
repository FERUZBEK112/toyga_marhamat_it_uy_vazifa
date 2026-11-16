import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
test('Invitation API: content, validation, persistence, privacy and calendar',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'visol-test-'));
  const port=13479;
  const launch=()=>spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,PORT:String(port),DATA_DIR:directory,ADMIN_TOKEN:'test-only-admin-token'},stdio:['ignore','pipe','pipe']});
  const ready=child=>new Promise((resolve,reject)=>{child.stdout.on('data',data=>{if(data.toString().includes('Visol ready'))resolve();});child.on('error',reject);child.on('exit',code=>reject(new Error('Early exit '+code)));});
  let child=launch();
  const request=(path,options)=>fetch(`http://127.0.0.1:${port}${path}`,options);
  const post=value=>request('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
  try{
    await ready(child);
    assert.equal((await request('/api/health')).status,200);
    const page=await request('/');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await page.text(),/Ishtirokni tasdiqlash/);
    assert.equal((await request('/server.mjs')).status,404);
    assert.equal((await request('/data/guests.sqlite')).status,404);
    assert.equal((await request('/api/guests')).status,401);
    assert.equal((await post({name:'X',attendance:'yes',count:1})).status,400);
    assert.equal((await post({name:'Test Guest',attendance:'yes',count:99})).status,400);
    assert.equal((await post({name:'Test Guest',attendance:'yes',count:1,website:'spam'})).status,400);
    assert.equal((await request('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://other.example'},body:'{}'})).status,403);
    const response=await post({name:'Test Guest',attendance:'yes',count:2,note:'Baxtli bo‘ling!'});assert.equal(response.status,200);const saved=await response.json();assert.match(saved.token,/^[a-f0-9]{48}$/);
    assert.equal((await post({name:'Test Guest',attendance:'no',count:1,note:'Updated',token:saved.token})).status,200);
    const read=()=>request('/api/guests',{headers:{Authorization:'Bearer test-only-admin-token'}}).then(r=>r.json());
    let list=await read();assert.equal(list.guests.length,1);assert.equal(list.guests[0].attendance,'no');assert.equal(list.guests[0].count,0);assert.equal(list.guests[0].token,undefined);
    const calendar=await request('/event.ics');assert.equal(calendar.status,200);assert.match(await calendar.text(),/DTSTART:20270522T130000Z/);
    child.kill();await once(child,'exit');child=launch();await ready(child);list=await read();assert.equal(list.guests.length,1);assert.equal(list.guests[0].note,'Updated');
  }finally{if(child.exitCode===null){child.kill();await once(child,'exit');}await rm(directory,{recursive:true,force:true});}
});
