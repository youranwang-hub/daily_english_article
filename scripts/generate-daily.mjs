import { readFile, writeFile } from 'node:fs/promises';

const provider = process.env.AI_PROVIDER || (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai');
if (!['deepseek', 'openai'].includes(provider)) throw new Error('AI_PROVIDER must be deepseek or openai');
const keyName = provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 'OPENAI_API_KEY';
const required = [keyName, 'RESEND_API_KEY', 'MAIL_FROM', 'MAIL_TO'];
const absent = required.filter(key => !process.env[key]);
if (absent.length) throw new Error(`Missing secrets: ${absent.join(', ')}`);
const html = (value) => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const ai = provider === 'deepseek'
  ? { key: process.env.DEEPSEEK_API_KEY, endpoint: 'https://api.deepseek.com/responses', model: process.env.AI_MODEL || 'deepseek-v4-flash' }
  : { key: process.env.OPENAI_API_KEY, endpoint: 'https://api.openai.com/v1/responses', model: process.env.AI_MODEL || 'gpt-5-mini' };

const schema = {
  name: 'cet6_daily_article', strict: true,
  schema: { type: 'object', additionalProperties: false, required: ['title','deck','topic','article','vocabulary','sentences','questions','sources'], properties: {
    title:{type:'string'}, deck:{type:'string'}, topic:{type:'string'},
    article:{type:'array',minItems:5,maxItems:6,items:{type:'string'}},
    vocabulary:{type:'array',minItems:8,maxItems:12,items:{type:'object',additionalProperties:false,required:['word','pos','meaning','collocation','example'],properties:{word:{type:'string'},pos:{type:'string'},meaning:{type:'string'},collocation:{type:'string'},example:{type:'string'}}}},
    sentences:{type:'array',minItems:2,maxItems:3,items:{type:'object',additionalProperties:false,required:['sentence','backbone','structure','translation'],properties:{sentence:{type:'string'},backbone:{type:'string'},structure:{type:'string'},translation:{type:'string'}}}},
    questions:{type:'array',minItems:4,maxItems:4,items:{type:'object',additionalProperties:false,required:['question','options','answer','explanation'],properties:{question:{type:'string'},options:{type:'array',minItems:4,maxItems:4,items:{type:'string'}},answer:{type:'integer',minimum:0,maximum:3},explanation:{type:'string'}}}},
    sources:{type:'array',minItems:1,maxItems:2,items:{type:'object',additionalProperties:false,required:['label','url'],properties:{label:{type:'string'},url:{type:'string'}}}}
  }}
};
const prompt = `Create one ORIGINAL CET-6 English reading practice article for Chinese learners. Date: ${new Date().toISOString().slice(0,10)}. Choose a current but enduring topic from science, society, environment, education, economics or culture. Do not reproduce any source. Write 500-700 English words in 5-6 paragraphs, natural quality journalism style, CEFR B2/C1. Include 8-12 genuinely useful CET-6 words. Select 2-3 exact long sentences from your article. All explanations, translations and question explanations must be concise Chinese. Write four different multiple-choice reading questions. Cite 1-2 stable, public, authoritative reference URLs only.`;
const response = await fetch(ai.endpoint, { method:'POST', headers:{'Authorization':`Bearer ${ai.key}`,'Content-Type':'application/json'}, body:JSON.stringify({model:ai.model,input:prompt,text:{format:{type:'json_schema',...schema}}}) });
if (!response.ok) throw new Error(`${provider} request failed: ${response.status} ${await response.text()}`);
const output = await response.json();
const generated = JSON.parse(output.output_text);
const date = new Date().toISOString().slice(0,10);
const entry = { id:date, date, level:`CET-6 · 约 ${generated.article.join(' ').trim().split(/\s+/).length} 词`, minutes:15, ...generated };
const file = new URL('../content/articles.json', import.meta.url);
const articles = JSON.parse(await readFile(file, 'utf8')).filter(article => article.date !== date);
articles.unshift(entry);
await writeFile(file, `${JSON.stringify(articles.slice(0,60), null, 2)}\n`);

const site = (process.env.SITE_URL || '你的 CET-6 Daily 网站').replace(/\/$/, '');
const words = entry.vocabulary.map(v => `<li><b>${html(v.word)}</b> (${html(v.pos)})：${html(v.meaning)}；${html(v.collocation)}</li>`).join('');
const text = entry.article.map(p => `<p>${html(p)}</p>`).join('');
const mail = `<div style="max-width:680px;margin:auto;font-family:Arial,sans-serif;color:#19342f;line-height:1.7"><p style="color:#dd673f;font-weight:bold">CET-6 DAILY · ${date}</p><h1>${html(entry.title)}</h1><p style="color:#667772">${html(entry.deck)}</p>${text}<hr><h2>今日核心词</h2><ul>${words}</ul><p><a href="${site}/?date=${date}" style="display:inline-block;background:#dd673f;color:white;padding:12px 18px;border-radius:6px;text-decoration:none">查看长难句与练习 →</a></p></div>`;
const sent = await fetch('https://api.resend.com/emails', { method:'POST', headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'}, body:JSON.stringify({from:process.env.MAIL_FROM,to:[process.env.MAIL_TO],subject:`CET-6 Daily｜${entry.title}`,html:mail}) });
if (!sent.ok) throw new Error(`Email request failed: ${sent.status} ${await sent.text()}`);
console.log(`Published ${entry.id} and sent the daily email.`);
