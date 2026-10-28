'use strict';
(() => {
  const KEY = 'little-about-you:v1';
  const questions = TOPICS.flatMap(t => t.questions);
  const app = document.querySelector('#app');
  const validIds = new Set(questions.map(q => q.id));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let storageAvailable = true;
  let state = { version: 1, screen: 'welcome', topic: 0, question: 0, answers: {}, extra: '', flowerPhotos: false };
  let loadedProgress = false;
  let noticeTimer;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.version === 1 && saved.answers && typeof saved.answers === 'object') {
      state.answers = Object.fromEntries(Object.entries(saved.answers).filter(([id,a]) => validIds.has(id) && a && typeof a === 'object').map(([id,a]) => [id, { status: ['answered','unknown','skipped','draft'].includes(a.status) ? a.status : 'draft', selections: Array.isArray(a.selections) ? a.selections.filter(v => typeof v === 'string').slice(0,30) : [], text: typeof a.text === 'string' ? a.text.slice(0,6000) : '' }]));
      state.topic = Number.isInteger(saved.topic) && saved.topic >= 0 && saved.topic < TOPICS.length ? saved.topic : 0;
      state.question = Number.isInteger(saved.question) && saved.question >= 0 && saved.question < 5 ? saved.question : 0;
      state.extra = typeof saved.extra === 'string' ? saved.extra.slice(0,6000) : '';
      state.flowerPhotos = !!saved.flowerPhotos;
      state.resumeScreen = ['question','checkpoint','finish','poem'].includes(saved.resumeScreen) ? saved.resumeScreen : 'question';
      loadedProgress = Object.keys(state.answers).length > 0 || !!state.extra;
    }
  } catch { storageAvailable = false; }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { if (storageAvailable) toast('Не получилось сохранить в браузере. Перед закрытием страницы скачай ответы.'); storageAvailable = false; }
  }
  function toast(message) {
    const notice = document.querySelector('#notice'); notice.textContent = message; notice.classList.add('visible');
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.classList.remove('visible'), 6000);
  }
  const getQuestion = () => TOPICS[state.topic].questions[state.question];
  const answer = id => state.answers[id] || { status: 'draft', selections: [], text: '' };
  const hasContent = a => a.selections.length > 0 || a.text.trim().length > 0;
  const count = status => Object.values(state.answers).filter(a => a.status === status || (status === 'answered' && a.status === 'draft' && hasContent(a))).length;
  const flowerArt = `<svg class="hero-art" viewBox="0 0 220 165" fill="none" aria-hidden="true"><path d="M110 154C96 120 115 85 103 54M110 154c5-32 26-54 41-70M109 153c-18-22-36-39-49-54" stroke="#9c9d80" stroke-width="1.6"/><path d="M105 118C80 118 72 105 73 95c20-2 30 9 32 23Zm7 14c4-22 17-30 30-28-2 20-15 28-30 28Z" fill="#b6ba9e"/><path d="M84 119c-17 1-30-9-32-21 15-4 28 6 32 21Z" fill="#c9c8b0"/><g fill="#e4aabb" stroke="#c88ca1" stroke-width=".8"><path d="M103 68C78 67 70 46 84 35c-3-20 14-29 27-19 18-9 33 7 27 20 16 14 4 35-17 34Z"/><path d="M101 61c-16-4-20-18-9-24-1-13 14-17 21-8 14-3 22 11 14 21-1 12-17 16-26 11Z" fill="#efbdca"/><path d="M104 51c-7-5-7-14 0-17 9-3 16 5 11 12-2 4-7 7-11 5Z" fill="#d597ab"/></g><g fill="#f4d5dd" stroke="#d8a8b9" stroke-width=".8"><path d="M145 91c-15-4-19-18-9-25-2-14 11-20 20-12 13-6 25 5 20 16 11 9 2 25-12 24Z"/><path d="M149 83c-11-6-8-16 0-18 9-4 19 6 13 14-3 5-8 7-13 4Z"/></g><g fill="#e9b8c7" stroke="#d4a0b1" stroke-width=".7"><path d="M56 103c-14-1-22-13-14-22-3-11 8-19 16-13 10-5 21 4 17 13 11 8 2 23-10 23Z"/><path d="M54 93c-8-4-8-12-1-15 7-3 14 4 10 10-1 4-5 6-9 5Z" fill="#f6d3dd"/></g><path d="M124 41c10-9 18-13 25-13M72 58c-8-5-13-6-20-5" stroke="#d4acb8" stroke-width=".8"/><circle cx="154" cy="27" r="2" fill="#d8b5bf"/><circle cx="46" cy="53" r="2" fill="#d8b5bf"/></svg>`;
  const divider = '<div class="divider" aria-hidden="true">✧</div>';
  const button = (action, label, secondary=false, extra='') => `<button class="button${secondary?' secondary':''}" data-action="${action}" ${extra}>${label}</button>`;
  function render() {
    clearTimeout(noticeTimer);
    document.querySelector('#notice').classList.remove('visible');
    const views = {welcome, topics, question: questionView, checkpoint, finish, poem};
    app.innerHTML = `<div class="screen">${(views[state.screen] || welcome)()}</div>`;
    if (!storageAvailable) app.insertAdjacentHTML('afterbegin','<p class="storage-warning">Браузер не сохраняет прогресс. Перед закрытием страницы скачай ответы через «Закончить».</p>');
    const heading = app.querySelector('h1'); if (heading) { heading.setAttribute('tabindex','-1'); heading.focus({preventScroll:true}); }
    window.scrollTo({top:0,behavior:'instant'});
  }
  function go(screen) { state.screen = screen; if (['question','checkpoint','finish','poem'].includes(screen)) state.resumeScreen = screen; persist(); render(); }
  function welcome() {
    loadedProgress = Object.keys(state.answers).length > 0 || !!state.extra;
    return `<section class="hero">${flowerArt}<p class="eyebrow">Маленькие детали. Большие смыслы.</p><h1>Немного<br><em>о тебе</em></h1><p class="lead">О любимых цветах и важных вещах.<br>О том, что радует, во что ты веришь<br>и как мне лучше быть рядом.</p><div class="button-row">${button(loadedProgress?'continue':'start',loadedProgress?'Продолжить с того же места <span aria-hidden="true">→</span>':'Начнём? <span aria-hidden="true">→</span>')}</div><p class="fine">Можно отвечать как хочется, пропускать вопросы<br>и остановиться в любой момент.</p>${divider}<div class="intro-notes"><div><div class="note-number">01</div><strong>Без спешки</strong><p>Восемь небольших тем. Выбирай любую.</p></div><div><div class="note-number">02</div><strong>Без обязательств</strong><p>Не хочется отвечать — просто пропусти.</p></div><div><div class="note-number">03</div><strong>Ответы у тебя</strong><p>В конце можно скачать их и отправить мне.</p></div></div><details><summary>Как сохраняются ответы?</summary><p>Только в этом браузере, на этом устройстве. Сайт не отправляет ответы автоматически. В конце ты сама выберешь: скачать файл или скопировать текст и отправить его в личном сообщении. В приватном режиме и после очистки данных браузера прогресс может исчезнуть.</p><a href="credits.html">Источники фотографий</a></details>${loadedProgress?'<button class="quiet" data-action="reset">Начать заново</button>':''}</section>`;
  }
  function topics() {
    return `<div class="topics-head"><p class="eyebrow">Можно в любом порядке</p><h1 class="screen-heading">С чего хочется начать?</h1><p class="screen-copy">В каждой теме пять вопросов. Более личные темы — только если сейчас хочется об этом говорить.</p></div><div class="topic-grid">${TOPICS.map((t,i) => {const n=t.questions.filter(q=>['answered','unknown','skipped'].includes(answer(q.id).status)||hasContent(answer(q.id))).length;return `<button class="topic-card" data-action="topic" data-index="${i}"><span class="number">0${i+1}</span><span><strong>${escape(t.title)}</strong><small>${escape(t.subtitle)}</small><small class="topic-status">${t.personal?'Чуть личнее · ':''}${n?`${n} из 5 просмотрено`:'5 вопросов'}</small></span></button>`;}).join('')}</div><div class="section-bottom">${button('finish','На сегодня хватит',true)}</div>`;
  }
  function option(q,label,index) {const selected=answer(q.id).selections.includes(label);return `<button class="option" data-action="option" data-index="${index}" aria-pressed="${selected}">${escape(label)}</button>`;}
  function questionView() {
    const t=TOPICS[state.topic],q=getQuestion(),a=answer(q.id);
    let content='';
    if(q.type==='flowers') {
      content=`<div class="flowers-toggle"><button data-action="flower-photos" aria-pressed="${state.flowerPhotos}">Не знаю названий — покажи фото</button><button data-action="flower-names" aria-pressed="${!state.flowerPhotos}">Выбрать по названиям</button></div>`;
      if(state.flowerPhotos) content+=`<div class="flower-grid">${FLOWERS.map((file,i)=>`<button class="flower-card" data-action="option" data-index="${i}" aria-pressed="${a.selections.includes(q.options[i])}"><img src="assets/flowers/${file}.jpg" alt="${escape(q.options[i])}" width="300" height="240"><span class="flower-name">${escape(q.options[i])}</span></button>`).join('')}</div><p class="photo-note">На фото — примеры: сорта и оттенки бывают разными. <a href="credits.html" target="_blank" rel="noopener">Источники фото</a></p><div class="options">${q.options.slice(8).map((label,i)=>option(q,label,i+8)).join('')}</div>`;
      else content+=`<div class="options">${q.options.map((label,i)=>option(q,label,i)).join('')}</div>`;
    } else if(q.type==='colors') content=`<div class="color-grid">${q.options.map((label,i)=>`<button class="color-option" data-action="option" data-index="${i}" aria-pressed="${a.selections.includes(label)}" style="--swatch:${COLOR_VALUES[i]}"><span class="swatch" aria-hidden="true"></span><span>${escape(label)}</span></button>`).join('')}</div>`;
    else if(q.options) content=`<div class="options ${q.type==='single'?'single':''}">${q.options.map((label,i)=>option(q,label,i)).join('')}</div>`;
    content+=`<label class="answer-label" for="answer-input">${q.type==='text'?'Твой ответ':'Свой вариант или дополнение — если хочется'}</label><textarea id="answer-input" class="answer-input ${q.type==='text'?'large':''}" maxlength="6000" placeholder="${escape(q.placeholder||'Можно добавить что-то от себя…')}">${escape(a.text)}</textarea>`;
    return `<div class="question-top"><span>${escape(t.title)}</span><span>${state.question+1} / 5 в этой теме</span></div><div class="progress-track" role="progressbar" aria-label="Просмотрено вопросов в теме" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${state.question}"><span style="width:${state.question*20}%"></span></div><section class="question-paper"><p class="eyebrow">Тема ${state.topic+1} из 8${t.personal?' · Чуть личнее':''}</p><h1 class="screen-heading">${escape(q.title)}</h1>${q.hint?`<p class="screen-copy">${escape(q.hint)}</p>`:''}${a.status==='unknown'?'<p class="saved-answer">Сейчас отмечено: «Пока не знаю». Можно изменить ответ.</p>':a.status==='skipped'?'<p class="saved-answer">Этот вопрос был пропущен. Можно ответить сейчас.</p>':''}${content}<div class="question-actions"><button class="quiet" data-action="back">← Назад</button>${button('next','Дальше <span aria-hidden="true">→</span>')}</div><div class="skip-actions"><button class="quiet" data-action="unknown">Пока не знаю</button><button class="quiet" data-action="skip">Пропустить</button></div></section><div class="question-outside"><button class="quiet" data-action="topics">Выбрать другую тему</button><button class="quiet" data-action="finish">Закончить на сегодня</button></div>`;
  }
  function checkpoint() {
    const last=state.topic===TOPICS.length-1;
    return `<section class="center-screen"><p class="eyebrow">${escape(TOPICS[state.topic].title)} · Всё</p><div class="checkpoint-number" aria-hidden="true">${state.topic+1}<span style="font-size:30px"> / 8</span></div><h1 class="screen-heading">${last?'На этом всё.<br>Или ещё что-нибудь?':'Идём дальше<br>или уже заебалась<br>проходить тест?'}</h1><p class="screen-copy">${last?'Можно вернуться к любому вопросу или закончить здесь.':'Можно сделать паузу, выбрать другую тему или остановиться здесь. Ответы уже сохранены в этом браузере.'}</p><div class="button-row">${last?'':button('next-topic','Давай дальше →')}${button('topics','Выбрать другую тему',true)}<button class="quiet" data-action="finish">На сегодня хватит</button></div></section>`;
  }
  function finish() {
    const answered=count('answered'),unknown=count('unknown'),skipped=count('skipped');
    return `<section><div class="finish-intro"><p class="eyebrow">Можно остановиться здесь</p><h1 class="screen-heading">Столько, сколько захотелось.</h1><p class="screen-copy">Сохрани ответы и отправь мне файл или текст в нашем чате. Можно отправить даже несколько ответов — допроходить всё не нужно.</p><div class="finish-stats"><span>С ответом: ${answered}</span><span>Пока не знаю: ${unknown}</span><span>Пропущено: ${skipped}</span></div></div><label class="answer-label" for="extra-input">Есть что-то ещё, что стоит о тебе знать? Или вопрос ко мне?</label><textarea id="extra-input" class="answer-input" maxlength="6000" placeholder="Если хочется что-то добавить…">${escape(state.extra)}</textarea><div class="finish-card"><h2>Забрать свои ответы</h2><p>TXT удобно читать и отправлять. JSON сохраняет структуру для подробного разбора. Достаточно одного из них. Файлы содержат твои ответы обычным текстом.</p><div class="button-row">${button('download-txt','Скачать TXT')}${button('copy','Скопировать текст',true)}</div><div style="margin-top:12px"><button class="quiet" data-action="download-json">Скачать JSON</button> <button class="quiet" data-action="share" id="share-results">Отправить через…</button></div><p class="fine">Ничего не отправляется без твоего действия. Выбор «Отправить через…» откроет меню устройства, если оно поддерживается.</p></div><div class="button-row">${button('poem','И ещё кое-что для тебя →')}${button('topics','Вернуться к вопросам',true)}</div><div class="section-bottom"><button class="quiet" data-action="reset">Удалить ответы из этого браузера</button></div></section>`;
  }
  function poem() {
    return `<section class="poem-screen">${flowerArt}<p class="eyebrow">Несколько слов для тебя</p><h1 class="screen-heading">Без маски.</h1><div class="poem"><p>Мне трудно кому-то сказать «я люблю»,<br>Ведь страшно открыться и снова сломаться.<br>Но всё же тебе я сейчас говорю —<br>Люблю. И не стану за маской скрываться.</p><p>Ты достойна услышать всю правду мою,<br>Даже ту, что годами скрывал за молчаньем.<br>Я верю: поймёшь, почему я люблю,<br>И примешь меня вместе с этим признаньем.</p></div>${divider}<p class="fine">На это не нужно отвечать прямо сейчас.</p>${button('finish','Вернуться к своим ответам',true)}</section>`;
  }
  function finalizeCurrent(status) {
    const q=getQuestion(),a=answer(q.id);
    if(status==='unknown'||status==='skipped') state.answers[q.id]={status,selections:[],text:''};
    else state.answers[q.id]={...a,status:hasContent(a)?'answered':'skipped'};
    persist();
    if(state.question<4){state.question++;go('question');}else go('checkpoint');
  }
  function selectOption(index) {
    const q=getQuestion(),label=q.options?.[index];if(!label)return;
    const a={...answer(q.id),selections:[...answer(q.id).selections]};
    if(a.selections.includes(label)) a.selections=a.selections.filter(v=>v!==label);
    else if(q.type==='single') a.selections=[label];
    else {
      if(q.max&&a.selections.length>=q.max){toast(`Здесь можно выбрать до ${q.max} вариантов. Остальное можно дописать.`);return;}
      const exclusive = q.id==='flowers'?['Цветы — не моё','Ничего из этого']:q.id==='sensory'?['Ничего особенного']:[];
      if(exclusive.includes(label))a.selections=[label];else{a.selections=a.selections.filter(v=>!exclusive.includes(v));a.selections.push(label);}
    }
    a.status=hasContent(a)?'answered':'draft'; state.answers[q.id]=a;persist();
    // Update selection in place so keyboard and screen-reader focus stay on the chosen option.
    app.querySelectorAll('[data-action="option"]').forEach(el=>el.setAttribute('aria-pressed',String(a.selections.includes(q.options[Number(el.dataset.index)]))));
    app.querySelector('.saved-answer')?.remove();
  }
  function exportData() {
    return { schema:'a-little-about-you', version:1, exportedAt:new Date().toISOString(), note:'Пропуск не означает отрицательный ответ. Не делайте выводов о мотивах пропуска. Ответы отражают слова автора, а не диагноз или оценку совместимости.', answers:TOPICS.flatMap((topic,ti)=>topic.questions.map((q,qi)=>{const a=answer(q.id);return {id:q.id,topic:topic.title,number:ti*5+qi+1,question:q.title,status:a.status==='draft'?(hasContent(a)?'answered':'not-viewed'):a.status,selections:[...a.selections],text:a.text};})),additional:state.extra };
  }
  function exportText() {
    const data=exportData();const labels={answered:'Ответ',unknown:'Пока не знаю',skipped:'Пропущено','not-viewed':'Без ответа / не просмотрено'};
    let result=`НЕМНОГО О ТЕБЕ\nОтветы от ${new Date(data.exportedAt).toLocaleString('ru-RU')}\n\n${data.note}\n`;
    for(const topic of TOPICS){result+=`\n${topic.title.toUpperCase()}\n`;for(const a of data.answers.filter(a=>a.topic===topic.title)){result+=`\n${a.number}. ${a.question}\nСтатус: ${labels[a.status]}\n`;if(a.selections.length)result+=`Выбрано: ${a.selections.join('; ')}\n`;if(a.text.trim())result+=`${a.text.trim()}\n`;}}
    result+=`\nДОПОЛНЕНИЕ ИЛИ ВОПРОС В ОТВЕТ\n${data.additional.trim()||'Без дополнения'}\n`;return result;
  }
  function fileName(ext){return `nemnogo-o-tebe-${new Date().toISOString().slice(0,10)}.${ext}`;}
  function download(ext) {
    const body=ext==='json'?JSON.stringify(exportData(),null,2):'\uFEFF'+exportText();
    const blob=new Blob([body],{type:ext==='json'?'application/json;charset=utf-8':'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=fileName(ext);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Файл подготовлен. Если браузер спросит, подтверди скачивание.');
  }
  function copyFallback() {const el=document.querySelector('#copy-output');el.value=exportText();document.querySelector('#copy-dialog').showModal();el.focus();el.select();}
  async function copy() {try{await navigator.clipboard.writeText(exportText());toast('Ответы скопированы. Теперь можно вставить их в сообщение.');}catch{copyFallback();}}
  async function share() {
    try {const file=new File(['\uFEFF'+exportText()],fileName('txt'),{type:'text/plain'});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Немного о тебе'});else if(navigator.share)await navigator.share({title:'Немного о тебе',text:exportText()});else{toast('Меню отправки здесь недоступно. Можно скачать файл или скопировать текст.');}}
    catch(e){if(e.name!=='AbortError')toast('Не удалось открыть отправку. Можно скачать файл или скопировать текст.');}
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el)return;event.preventDefault();
    const action=el.dataset.action;
    if(action==='home')go('welcome');
    else if(action==='topics')go('topics');
    else if(action==='start'){state.topic=0;state.question=0;go('question');}
    else if(action==='continue')go(state.resumeScreen || 'question');
    else if(action==='topic'){state.topic=Number(el.dataset.index);const first=TOPICS[state.topic].questions.findIndex(q=>!['answered','unknown','skipped'].includes(answer(q.id).status));state.question=first<0?0:first;go('question');}
    else if(action==='option')selectOption(Number(el.dataset.index));
    else if(action==='flower-photos'||action==='flower-names'){state.flowerPhotos=action==='flower-photos';persist();render();}
    else if(action==='next')finalizeCurrent('answered');
    else if(action==='unknown'||action==='skip')finalizeCurrent(action==='skip'?'skipped':'unknown');
    else if(action==='back'){if(state.question>0){state.question--;go('question');}else go('topics');}
    else if(action==='next-topic'){state.topic++;state.question=0;go('question');}
    else if(action==='finish'||action==='poem')go(action);
    else if(action==='download-txt')download('txt');
    else if(action==='download-json')download('json');
    else if(action==='copy')void copy();
    else if(action==='share')void share();
    else if(action==='reset')document.querySelector('#reset-dialog').showModal();
    else if(action==='cancel-reset')document.querySelector('#reset-dialog').close();
    else if(action==='confirm-reset'){document.querySelector('#reset-dialog').close();state={version:1,screen:'welcome',topic:0,question:0,answers:{},extra:'',flowerPhotos:false};loadedProgress=false;persist();render();toast('Ответы в этом браузере удалены.');}
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='answer-input') {const q=getQuestion(),a={...answer(q.id),text:event.target.value};a.status=hasContent(a)?'answered':'draft';state.answers[q.id]=a;app.querySelector('.saved-answer')?.remove();persist();}
    else if(event.target.id==='extra-input'){state.extra=event.target.value;persist();}
  });
  document.querySelector('#select-copy').addEventListener('click',()=>{const el=document.querySelector('#copy-output');el.focus();el.select();});
  render();
})();
