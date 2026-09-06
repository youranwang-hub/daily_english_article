const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function articleView(item, articles) {
  document.title = `${item.title} · CET-6 Daily`;
  $('#date-label').textContent = item.date;
  const paragraphs = item.article.map(p => `<p>${esc(p)}</p>`).join('');
  const words = item.vocabulary.map(v => `<div class="word"><strong>${esc(v.word)}</strong><span class="pos">${esc(v.pos)}</span><span class="meaning">${esc(v.meaning)}</span><span class="detail">搭配：${esc(v.collocation)}</span><span class="example">${esc(v.example)}</span></div>`).join('');
  const sentences = item.sentences.map(s => `<div class="sentence"><q>${esc(s.sentence)}</q><p><span class="label">主干：</span>${esc(s.backbone)}</p><p><span class="label">结构：</span>${esc(s.structure)}</p><p><span class="label">译文：</span>${esc(s.translation)}</p></div>`).join('');
  const questions = item.questions.map((q, qi) => `<div class="question">${qi + 1}. ${esc(q.question)}<div class="choices">${q.options.map((o, oi) => `<button data-q="${qi}" data-o="${oi}">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`).join('')}</div><p id="explain-${qi}" class="explanation" hidden>${esc(q.explanation)}</p></div>`).join('');
  const archive = articles.slice(1, 8).map(a => `<a href="?date=${encodeURIComponent(a.date)}"><b>${esc(a.date)}</b>　${esc(a.title)}</a>`).join('') || '明天会有新的文章。';
  const sources = item.sources.map(s => `<li><a target="_blank" rel="noreferrer" href="${esc(s.url)}">${esc(s.label)}</a></li>`).join('');
  $('#app').innerHTML = `<div class="eyebrow">${esc(item.level)} <span class="topic">${esc(item.topic)}</span>　·　${item.minutes} min</div><h1>${esc(item.title)}</h1><p class="deck">${esc(item.deck)}</p><article class="article">${paragraphs}</article><section class="section"><h2>核心词汇</h2>${words}</section><section class="section"><h2>长难句拆解</h2>${sentences}</section><section class="section"><h2>阅读练习</h2>${questions}</section><section class="section sources"><h2>参考资料</h2><ul>${sources}</ul><p>本文为基于公开资料创作的六级练习文章。</p></section><section class="section archive"><details><summary>往期文章</summary>${archive}</details></section>`;
  document.querySelectorAll('.choices button').forEach(button => button.addEventListener('click', () => {
    const qi = Number(button.dataset.q), oi = Number(button.dataset.o), q = item.questions[qi];
    const buttons = button.parentElement.querySelectorAll('button');
    buttons.forEach((b, index) => { b.disabled = true; b.classList.add(index === q.answer ? 'correct' : index === oi ? 'wrong' : ''); });
    $(`#explain-${qi}`).hidden = false;
  }));
}

fetch('content/articles.json').then(r => r.json()).then(articles => {
  const wanted = new URLSearchParams(location.search).get('date');
  articleView(articles.find(a => a.date === wanted) || articles[0], articles);
}).catch(() => { $('#app').innerHTML = '<p class="loading">文章暂时无法加载，请稍后再试。</p>'; });
