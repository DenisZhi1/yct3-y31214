const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8'),data=JSON.parse(html.match(/<script id="testdata" type="application\/json">([\s\S]*?)<\/script>/)[1]),E=require('./engine.js');
assert.equal(data.questions.length,60);
const all=JSON.stringify(data)+html+fs.readFileSync('test.css','utf8'),media=JSON.parse(fs.readFileSync('asset-manifest.json','utf8')).embeddedMedia;
for(const row of media){const prefix='data:'+row.mime+';base64,',at=all.indexOf(prefix),uris=[...all.matchAll(new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([A-Za-z0-9+/=]+)','g'))];assert(uris.some(m=>crypto.createHash('sha256').update(Buffer.from(m[1],'base64')).digest('hex')===row.sha256),'Missing or changed embedded asset '+row.path);}
assert.equal(media.filter(m=>m.mime==='audio/mpeg').length,35);
assert(!/postMessage|window\.parent|fetch\(|speechSynthesis/.test(fs.readFileSync('app.js','utf8')));
let seed=20261104;function rng(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;}
function audit(s){for(let i=0;i+2<s.length;i++){assert(!(s[i]===s[i+1]&&s[i+1]===s[i+2]));assert(!(s[i+1]-s[i]===1&&s[i+2]-s[i+1]===1));assert(!(s[i+1]-s[i]===-1&&s[i+2]-s[i+1]===-1));}for(let width=2;width*3<=s.length&&width<=3;width++)for(let i=0;i+width*3<=s.length;i++)assert(!s.slice(i,i+width*3).every((v,j)=>v===s[i+j%width]));for(let width=4;width*2<=s.length;width++)for(let i=0;i+width*2<=s.length;i++)assert(!s.slice(i,i+width).every((v,j)=>v===s[i+width+j]));}
const seen=new Set();
for(let run=0;run<10000;run++){
 const a=E.createAttempt(data,rng);assert(E.validAttempt(data,a));seen.add(JSON.stringify(a.orders));
 audit(a.questionOrder.slice(0,10).map(n=>data.questions.find(q=>q.n===n).key==='T'?1:0));
 for(const [lo,hi]of [[11,15],[16,20],[21,35],[36,40],[41,45],[46,60]]){const qs=data.questions.filter(q=>q.n>=lo&&q.n<=hi),positions=qs.map(q=>a.orders[q.n].indexOf(q.key));audit(positions);if(qs[0].bank)for(const cols of [2,3])for(let i=0;i+2<positions.length;i++){const t=positions.slice(i,i+3);assert(new Set(t.map(n=>Math.floor(n/cols))).size>1);assert(new Set(t.map(n=>n%cols)).size>1);}}
 for(const q of data.questions){const pool=q.bank?data.banks[q.bank]:q.options;assert.deepEqual(a.orders[q.n].slice().sort(),pool.map(o=>o.id).sort());if(q.bank)assert.deepEqual(a.orders[q.n],a.banks[q.bank]);a.answers[q.n]=q.key;}
 assert.equal(E.grade(data,a),60);
}
assert.equal(seen.size,10000);console.log('PASS: 60 questions, 35 embedded recordings, intact media and 10,000 independently audited attempts.');
