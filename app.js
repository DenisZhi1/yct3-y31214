(function(){
'use strict';
const DATA=JSON.parse(document.getElementById('testdata').textContent),KEY='yct3-y31214-standalone-attempt-v1',E=TestEngine;
const el=id=>document.getElementById(id),letter=i=>String.fromCharCode(65+i);
let attempt,pending=null;
try{attempt=JSON.parse(localStorage.getItem(KEY));if(!E.validAttempt(DATA,attempt))attempt=null;}catch{}
if(!attempt)attempt=E.createAttempt(DATA);
// Existing attempts retain their original option order and answers after a key correction.
attempt.view=attempt.finished?(attempt.view==='review'?'review':'results'):'questions';
const questions=()=>attempt.questionOrder.map(n=>DATA.questions.find(q=>q.n===n));
const pool=q=>q.bank?DATA.banks[q.bank]:q.options;
function options(q){return attempt.orders[q.n].map(id=>pool(q).find(o=>o.id===id));}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(attempt));}catch{}}
function stopAudio(){document.querySelectorAll('audio').forEach(a=>a.pause());}
function atTop(){window.scrollTo({top:0,behavior:'auto'});}
function textContent(node,text){const [zhText,pyText]=text.split('|');const zh=document.createElement('div');zh.className='zh';zh.textContent=zhText;node.append(zh);if(pyText){const py=document.createElement('div');py.className='py';py.textContent=pyText;node.append(py);}}

function navigation(){
 const answered=Object.keys(attempt.answers).length;
 el('progress').replaceChildren();const amount=document.createElement('strong');amount.textContent=answered;el('progress').append(amount,document.createTextNode(' из 60 ответов'));
 el('fill').style.width=(answered/60*100)+'%';el('nav').replaceChildren();
 questions().forEach((q,index)=>{
  const b=document.createElement('button');b.textContent=index+1;b.dataset.questionId=q.n;
  b.className='navq'+(attempt.answers[q.n]?' answered':'')+(index===attempt.index?' current':'');
  if(attempt.finished)b.className+=' '+(!attempt.answers[q.n]?'skipped':attempt.answers[q.n]===q.key?'right':'wrong');
  b.setAttribute('aria-label',`Задание ${index+1}`);if(index===attempt.index)b.setAttribute('aria-current','step');
  b.onclick=()=>go(index);el('nav').append(b);
 });
 el('finish').hidden=attempt.finished;el('save').hidden=!attempt.finished;
 el('aside-note').textContent=attempt.finished?'Выберите номер, чтобы разобрать ответ.':'Возвращайтесь к заданиям и меняйте ответы до завершения.';
}
function drawOptions(q){
 const container=el('choices');container.replaceChildren();container.className='options'+(q.bank?' pictures':'');
 options(q).forEach((o,index)=>{
  const b=document.createElement('button');b.className='option'+(o.image?' picture':'')+(attempt.answers[q.n]===o.id?' selected':'');
  b.dataset.value=o.id;b.setAttribute('aria-pressed',String(attempt.answers[q.n]===o.id));b.disabled=attempt.finished;
  if(!q.fixed){const label=document.createElement('span');label.className='letter';label.textContent=letter(index);b.append(label);}
  if(o.image){const im=document.createElement('img');im.src=o.image;im.alt=`Вариант ${letter(index)}`;b.append(im);}else{const text=document.createElement('div');textContent(text,o.text);b.append(text);}
  if(attempt.finished){if(o.id===q.key)b.classList.add('right');else if(o.id===attempt.answers[q.n])b.classList.add('wrong');}
  b.onclick=()=>{if(attempt.finished)return;attempt.answers[q.n]=o.id;persist();drawOptions(q);navigation();};
  container.append(b);
 });
 el('clear').disabled=attempt.finished||!attempt.answers[q.n];
}
function renderQuestion(){
 const q=questions()[attempt.index];
 el('section').textContent=q.section+(q.fixed?' · запись №'+q.n:'');
 el('question-counter').textContent=`${attempt.index+1} / 60`;
 el('questionTitle').textContent=`Задание ${attempt.index+1} из 60`;
 el('stage').replaceChildren();el('feedback').replaceChildren();
 if(q.prompt){const [text,py]=q.prompt.split('|');const p=document.createElement('div');p.className='prompt';p.textContent=text;el('stage').append(p);if(py){const div=document.createElement('div');div.className='pinyin';div.textContent=py;el('stage').append(div);}}
 if(q.image){const im=document.createElement('img');im.src=q.image;im.alt='Картинка к заданию';im.className='question-pic';el('stage').append(im);}
 if(q.audio){
  const block=document.createElement('div');block.className='audioarea';
  const play=document.createElement('button');play.textContent='Слушать запись';play.className='primary';play.id='play';
  const audio=document.createElement('audio');audio.controls=true;audio.preload='none';audio.src=q.audio;audio.setAttribute('aria-label',`Аудио задания ${q.n}`);
  play.onclick=()=>audio.play().catch(()=>{play.textContent='Включите запись в плеере';});block.append(play,audio);el('stage').append(block);
 }
 const choices=document.createElement('div');choices.id='choices';el('stage').append(choices);drawOptions(q);
 el('prev').disabled=attempt.index===0;el('next').disabled=attempt.index===59;
 el('review-toolbar').hidden=!attempt.finished;
 if(attempt.finished){
  const box=document.createElement('div'),ok=attempt.answers[q.n]===q.key,skipped=!attempt.answers[q.n];
  box.className='review'+(skipped?' skipped-review':ok?'':' bad');
  const opts=options(q),correct=opts.find(o=>o.id===q.key),correctLetter=letter(opts.indexOf(correct));
  const selected=q.fixed?(attempt.answers[q.n]==='T'?'Верно':'Неверно'):letter(opts.findIndex(o=>o.id===attempt.answers[q.n]));
  const correctText=q.fixed?(q.key==='T'?'Верно':'Неверно'):correctLetter+(correct.text?' — '+correct.text.split('|')[0]:'');
  box.textContent=ok?'Верно.':`Ваш ответ: ${skipped?'не выбран':selected}. Правильный ответ: ${correctText}.`;el('feedback').append(box);
 }
}
function renderResults(){
 const correct=E.grade(DATA,attempt),answered=Object.keys(attempt.answers).length;
 const listening=DATA.questions.filter(q=>q.n<=35&&attempt.answers[q.n]===q.key).length,reading=correct-listening;
 el('score-value').textContent=correct;el('correct-value').textContent=correct;el('wrong-value').textContent=answered-correct;el('skipped-value').textContent=60-answered;
 el('score-percent').textContent=`${Math.round(correct/60*100)}% верных ответов`;
 el('listening-score').textContent=`${listening} / 35`;el('reading-score').textContent=`${reading} / 25`;
 el('listening-progress').value=listening;el('reading-progress').value=reading;
 el('result-summary').textContent=`${correct} / 60. Аудирование: ${listening} / 35. Чтение: ${reading} / 25. Верных: ${correct}. Неверных: ${answered-correct}. Пропущено: ${60-answered}.`;
 el('result-message').textContent=correct===60?'Все ответы верные. Отличная работа!':answered===0?'Попытка сохранена. В разборе можно посмотреть каждое задание.':'Попытка сохранена. Посмотрите, что получилось, и разберите ответы.';
}
function render(){
 stopAudio();const showResults=attempt.finished&&attempt.view==='results';
 el('practice-screen').hidden=showResults;el('results-screen').hidden=!showResults;el('topbuttons').hidden=showResults;
 document.body.classList.toggle('results-mode',showResults);document.body.classList.toggle('review-mode',attempt.finished&&!showResults);
 navigation();renderResults();renderQuestion();persist();
}
function go(index){
 attempt.index=Math.max(0,Math.min(59,index));attempt.view=attempt.finished?'review':'questions';render();
 if(window.matchMedia('(max-width:850px)').matches)el('question-picker').open=false;
 el('question-panel').scrollIntoView?.({block:'start',behavior:'auto'});
}
function confirmAction(title,text,fn){el('dialogTitle').textContent=title;el('dialogText').textContent=text;pending=fn;el('dialog').showModal();}
el('cancel').onclick=()=>{el('dialog').close();pending=null;};
el('dialog').addEventListener('cancel',()=>{pending=null;});
el('confirm').onclick=()=>{el('dialog').close();const fn=pending;pending=null;if(fn)fn();};
el('prev').onclick=()=>go(attempt.index-1);el('next').onclick=()=>go(attempt.index+1);
el('clear').onclick=()=>{if(attempt.finished)return;delete attempt.answers[questions()[attempt.index].n];persist();drawOptions(questions()[attempt.index]);navigation();};
el('finish').onclick=()=>{if(attempt.finished)return;const count=Object.keys(attempt.answers).length;confirmAction('Завершить тест?',`Вы ответили на ${count} из 60 заданий.${count<60?' Пропущено: '+(60-count)+'.':''} После проверки изменить ответы нельзя.`,()=>{
 if(attempt.finished)return;
 attempt.finished=true;attempt.view='results';attempt.completed=new Date().toISOString();

 render();atTop();el('result-title').focus({preventScroll:true});
 });};
function newAttempt(){confirmAction('Начать новую попытку?','Текущие ответы будут сброшены. Варианты перемешаются заново.',()=>{stopAudio();attempt=E.createAttempt(DATA);attempt.view='questions';el('question-picker').open=window.matchMedia('(min-width:851px)').matches;render();atTop();});}
el('new').onclick=newAttempt;el('result-new').onclick=newAttempt;
el('review-all').onclick=()=>{let index=questions().findIndex(q=>attempt.answers[q.n]!==q.key);go(index<0?0:index);};
el('show-results').onclick=()=>{attempt.view='results';render();atTop();el('result-title').focus({preventScroll:true});};
function saveResult(){
 const result={test:'YCT3 Y31214',date:attempt.completed,correct:E.grade(DATA,attempt),total:60,answers:questions().map((q,index)=>{const opts=options(q),selected=attempt.answers[q.n];return {question:q.n,presentedNumber:index+1,selectedID:selected||null,selectedLetter:selected&&!q.fixed?letter(opts.findIndex(o=>o.id===selected)):null,correctID:q.key,correctLetter:q.fixed?null:letter(opts.findIndex(o=>o.id===q.key)),displayedOrder:opts.map(o=>o.id),correct:selected===q.key};})};
 const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Y31214-result.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
el('save').onclick=saveResult;el('result-save').onclick=saveResult;
el('question-picker').open=window.matchMedia('(min-width:851px)').matches;
window.TESTAPP={getAttempt:()=>attempt,getData:()=>DATA,go,render};render();
})();
