(function(root){
'use strict';
function shuffle(items,rng=Math.random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function badPattern(a){
 for(let i=2;i<a.length;i++)if(a[i]===a[i-1]&&a[i]===a[i-2])return true;
 for(const period of [2,3])for(let i=0;i+period*3<=a.length;i++)if(a.slice(i,i+period*3).every((v,j)=>v===a[i+j%period]))return true;
 // Reject two repeated longer groups too (for example C-A-B-B / C-A-B-B).
 for(let period=4;period*2<=a.length;period++)for(let i=0;i+period*2<=a.length;i++)if(a.slice(i,i+period).every((v,j)=>v===a[i+period+j]))return true;
 for(let i=0;i+3<=a.length;i++){const s=a.slice(i,i+3);if(s[1]-s[0]===1&&s[2]-s[1]===1||s[1]-s[0]===-1&&s[2]-s[1]===-1)return true;}
 return false;
}
function gridPattern(positions){
 for(const columns of [2,3])for(let i=0;i+3<=positions.length;i++){
  const [a,b,c]=positions.slice(i,i+3);
  if(Math.floor(a/columns)===Math.floor(b/columns)&&Math.floor(b/columns)===Math.floor(c/columns))return true;
  if(a%columns===b%columns&&b%columns===c%columns)return true;
 }
 return false;
}
function createAttempt(data,rng=Math.random){
 function choose(make,accept){for(let i=0;i<10000;i++){const value=make();if(accept(value))return value;}throw Error('Не удалось подготовить новую попытку. Обновите страницу.');}
 const first=choose(()=>shuffle(data.questions.slice(0,10),rng),qs=>!badPattern(qs.map(q=>q.key==='T'?1:0)));
 const banks={},orders={};
 for(const [name,pool] of Object.entries(data.banks)){
  const qs=data.questions.filter(q=>q.bank===name);
  banks[name]=choose(()=>shuffle(pool.map(o=>o.id),rng),ids=>{const positions=qs.map(q=>ids.indexOf(q.key));return !badPattern(positions)&&!gridPattern(positions);});
 }
 for(const q of data.questions)if(q.fixed||q.bank)orders[q.n]=q.bank?banks[q.bank].slice():q.options.map(o=>o.id);
 for(const [lo,hi] of [[21,35],[41,45],[46,60]]){
  const qs=data.questions.filter(q=>q.n>=lo&&q.n<=hi);
  const prepared=choose(()=>{
   const positions=[],candidate={};
   for(const q of qs){
    const available=shuffle(q.options.map((_,i)=>i),rng).filter(i=>!badPattern(positions.concat(i)));
    // Restart the group when a random prefix has no valid continuation.
    if(!available.length)return null;
    const position=available[0],ids=shuffle(q.options.filter(o=>o.id!==q.key).map(o=>o.id),rng);
    ids.splice(position,0,q.key);candidate[q.n]=ids;positions.push(position);
   }
   return candidate;
  },value=>value!==null);
  Object.assign(orders,prepared);
 }
 return {version:2,orders,banks,questionOrder:first.concat(data.questions.slice(10)).map(q=>q.n),answers:{},index:0,finished:false,created:new Date().toISOString()};
}
function sameMembers(a,b){return Array.isArray(a)&&a.length===b.length&&a.slice().sort().join('|')===b.slice().sort().join('|');}
function validAttempt(data,a){
 if(!a||a.version!==2||!a.orders||!a.banks||!a.answers||Array.isArray(a.answers)||typeof a.answers!=='object'||!Number.isInteger(a.index)||a.index<0||a.index>=data.questions.length||typeof a.finished!=='boolean')return false;
 if(!sameMembers(a.questionOrder,data.questions.map(q=>q.n)))return false;
 if(!sameMembers(a.questionOrder.slice(0,10),data.questions.slice(0,10).map(q=>q.n)))return false;
 if(a.questionOrder.slice(10).some((n,i)=>n!==data.questions[i+10].n))return false;
 for(const q of data.questions){
  const pool=q.bank?data.banks[q.bank]:q.options;
  if(!sameMembers(a.orders[q.n],pool.map(o=>o.id)))return false;
  if(q.bank&&JSON.stringify(a.orders[q.n])!==JSON.stringify(a.banks[q.bank]))return false;
  if(q.fixed&&a.orders[q.n].join('|')!=='T|F')return false;
 }
 for(const [n,id] of Object.entries(a.answers))if(!a.orders[n]||!a.orders[n].includes(id))return false;
 return true;
}
function grade(data,attempt){return data.questions.reduce((score,q)=>score+(attempt.answers[q.n]===q.key?1:0),0);}
root.TestEngine={shuffle,badPattern,createAttempt,grade,validAttempt};
if(typeof module!=='undefined')module.exports=root.TestEngine;
})(typeof window!=='undefined'?window:globalThis);
