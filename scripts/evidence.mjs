#!/usr/bin/env node
// Evidence for health claims. Search PubMed (or Europe PMC) for systematic reviews, trials or guidelines, read
// each abstract's conclusion, and verify the sources a reel cites: the DOI or PMID exists, the year matches,
// and the paper is not retracted. Free services; set ncbi.email in setup to be a polite client.
// Usage: node evidence.mjs search "<topik, bahasa Inggris>" [--type review|rct|guideline|any] [--since 2015] [--n 8]
//                                  [--db pubmed|europepmc] [--slug <slug>]
//        node evidence.mjs verify <slug>     cek setiap sumber di reel.json, tandai "verified"
//        node evidence.mjs cite <doi|pmid>   entri sumber siap pakai (id, short, cite, doi, pmid, year)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs, workspace, fail, slugify } from './lib/common.mjs';
import { request, sleep, UA } from './lib/http.mjs';
import { get } from './lib/config.mjs';

const args = parseArgs();
const root = workspace(args);
const cmd = args._[0];
const HELP = 'Pakai: node evidence.mjs search "<topik>" | verify <slug> | cite <doi|pmid>';
if (!cmd) fail(HELP);
const EU = () => process.env.CONTENT_STUDIO_NCBI_BASE || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const CR = () => process.env.CONTENT_STUDIO_CROSSREF_BASE || 'https://api.crossref.org';
const email = get('ncbi.email'), ncbiKey = get('ncbi.apiKey');
const polite = { 'user-agent': `${UA}${email ? ` (mailto:${email})` : ''}` };
let last = 0;
/* NCBI allows 3 requests a second without a key, 10 with one */
async function ncbi(path, params, expect = 'json') {
  const wait = (ncbiKey ? 110 : 360) - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  last = Date.now();
  const qs = new URLSearchParams({ ...params, tool: 'content-studio', ...(email ? { email } : {}), ...(ncbiKey ? { api_key: ncbiKey } : {}) });
  return (await request('PubMed', `${EU()}/${path}?${qs}`, { expect })).data;
}
const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const yearOf = s => Number((String(s || '').match(/\b(19|20)\d{2}\b/) || [])[0]) || null;
/* "Hayden dkk., 2021", "Lee & Kim, 2020", "Smith, 2019" */
function shortCite(authors, year) {
  const last = a => String(a || '').trim().split(/\s+/)[0].replace(/,$/, '');
  const n = authors.length;
  const who = n === 0 ? 'Anonim' : n === 1 ? last(authors[0]) : n === 2 ? `${last(authors[0])} & ${last(authors[1])}` : `${last(authors[0])} dkk.`;
  return `${who}, ${year || 't.t.'}`;
}
const TYPE = {
  review: ' AND (systematic[sb] OR "meta-analysis"[pt] OR "systematic review"[pt])',
  rct: ' AND "randomized controlled trial"[pt]',
  guideline: ' AND (guideline[pt] OR "practice guideline"[pt])',
  any: '',
};

async function pubmedSummaries(ids) {
  if (!ids.length) return [];
  const sum = await ncbi('esummary.fcgi', { db: 'pubmed', id: ids.join(','), retmode: 'json' });
  const xml = await ncbi('efetch.fcgi', { db: 'pubmed', id: ids.join(','), retmode: 'xml' }, 'text');
  const abstracts = {};
  for (const art of String(xml).split('<PubmedArticle>').slice(1)) {
    const pmid = (art.match(/<PMID[^>]*>(\d+)<\/PMID>/) || [])[1];
    const parts = [...art.matchAll(/<AbstractText(?:\s+Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/g)].map(m => ({ label: m[1] || '', text: strip(m[2]) }));
    abstracts[pmid] = parts;
  }
  return ids.map(id => {
    const r = sum.result && sum.result[id];
    if (!r || r.error) return null;
    const doi = ((r.articleids || []).find(a => a.idtype === 'doi') || {}).value || '';
    const authors = (r.authors || []).filter(a => a.authtype === 'Author').map(a => a.name);
    const year = yearOf(r.sortpubdate || r.pubdate);
    const parts = abstracts[id] || [];
    const labelled = parts.find(p => /CONCLU|INTERPRET|IMPLICATION/i.test(p.label));
    /* Unstructured abstracts: their last two sentences usually carry the conclusion */
    const concl = labelled || (parts.length ? { text: parts[parts.length - 1].text.split(/(?<=[.!?])\s+(?=[A-Z])/).slice(-2).join(' ') } : null);
    return {
      pmid: id, doi, title: strip(r.title), journal: r.fulljournalname || r.source, abbr: r.source, year, authors,
      types: r.pubtype || [], retracted: (r.pubtype || []).includes('Retracted Publication'),
      conclusion: concl ? concl.text : '', abstract: parts.map(p => (p.label ? `${p.label}: ` : '') + p.text).join(' '),
      short: shortCite(authors, year),
    };
  }).filter(Boolean);
}

async function searchPubmed(q, { type, since, n }) {
  let term = `(${q})${TYPE[type] ?? TYPE.review} NOT "retracted publication"[pt]`;
  if (since) term += ` AND ${since}:3000[dp]`;
  const s = await ncbi('esearch.fcgi', { db: 'pubmed', term, retmax: String(n), sort: 'relevance', retmode: 'json' });
  const ids = (s.esearchresult && s.esearchresult.idlist) || [];
  return { count: Number(s.esearchresult && s.esearchresult.count) || 0, items: await pubmedSummaries(ids) };
}
async function searchEpmc(q, { type, since, n }) {
  const pt = { review: ' AND (PUB_TYPE:"systematic-review" OR PUB_TYPE:"meta-analysis")', rct: ' AND PUB_TYPE:"randomized controlled trial"', guideline: ' AND PUB_TYPE:"practice guideline"', any: '' }[type] ?? '';
  const query = `(${q})${pt} AND HAS_ABSTRACT:y NOT SRC:PPR${since ? ` AND PUB_YEAR:[${since} TO 3000]` : ''}`;
  const { data } = await request('Europe PMC', `${EPMC}/search?${new URLSearchParams({ query, format: 'json', resultType: 'core', pageSize: String(n) })}`);
  const items = ((data.resultList && data.resultList.result) || []).map(r => {
    const authors = ((r.authorList && r.authorList.author) || []).map(a => `${a.lastName || a.fullName || ''} ${a.initials || ''}`.trim());
    const abs = strip(r.abstractText);
    const m = abs.match(/(?:Conclusions?|Interpretation|Implications?)[:.]?\s*(.+)$/i);
    const year = Number(r.pubYear) || null;
    return { pmid: r.pmid || '', doi: r.doi || '', title: strip(r.title), journal: r.journalInfo && r.journalInfo.journal && r.journalInfo.journal.title, year, authors, types: (r.pubTypeList && r.pubTypeList.pubType) || [], retracted: false, conclusion: m ? m[1] : abs.split(/(?<=\.)\s/).slice(-2).join(' '), abstract: abs, citedBy: r.citedByCount || 0, short: shortCite(authors, year) };
  });
  return { count: data.hitCount || 0, items };
}

/* An APA reference from doi.org (Crossref formats it), or one built from the metadata */
async function apa(doi, it) {
  try {
    const { data } = await request('doi.org', `https://doi.org/${encodeURI(doi)}`, { headers: { accept: 'text/x-bibliography; style=apa; locale=id-ID', ...polite }, expect: 'text', retries: 1, timeout: 20000 });
    const t = strip(data);
    if (t && !/<html/i.test(data)) return t;
  } catch (e) { /* fall back */ }
  const au = (it.authors || []).slice(0, 3).join(', ') + ((it.authors || []).length > 3 ? ', dkk.' : '');
  return `${au} (${it.year || 't.t.'}). ${it.title} ${it.journal || ''}.${doi ? ` https://doi.org/${doi}` : ''}`.replace(/\s+/g, ' ').trim();
}

async function crossref(doi) {
  const { status, data } = await request('Crossref', `${CR()}/works/${encodeURIComponent(doi)}${email ? `?mailto=${encodeURIComponent(email)}` : ''}`, { headers: polite, ok: [404] });
  if (status === 404) return null;
  const m = data.message || {};
  return {
    doi: m.DOI, title: strip((m.title || [])[0]), journal: strip((m['container-title'] || [])[0]),
    year: ((m.issued && m.issued['date-parts'] && m.issued['date-parts'][0]) || [])[0] || null,
    authors: (m.author || []).map(a => `${a.family || a.name || ''} ${(a.given || '').split(/\s+/).map(x => x[0]).join('')}`.trim()),
    retracted: (m['updated-by'] || []).some(u => /retraction/i.test(u.type || '')) || /retract/i.test((m.title || [])[0] || ''),
  };
}

try {
  if (cmd === 'search') {
    const q = args._.slice(1).join(' ');
    if (!q) fail('Pakai: node evidence.mjs search "<topik, bahasa Inggris>" [--type review|rct|guideline|any]');
    const opts = { type: args.type || 'review', since: Number(args.since) || null, n: Math.min(20, Number(args.n) || 8) };
    const db = args.db === 'europepmc' ? 'europepmc' : 'pubmed';
    const res = db === 'europepmc' ? await searchEpmc(q, opts) : await searchPubmed(q, opts);
    console.log(`\n${res.count.toLocaleString('id-ID')} hasil di ${db === 'pubmed' ? 'PubMed' : 'Europe PMC'} untuk "${q}"${opts.type !== 'any' ? ` (${{ review: 'tinjauan sistematis dan meta-analisis', rct: 'uji acak terkontrol', guideline: 'pedoman' }[opts.type]})` : ''}${opts.since ? `, sejak ${opts.since}` : ''}. ${res.items.length} teratas:\n`);
    res.items.forEach((it, k) => {
      const types = it.types.filter(t => !/Journal Article|Research Support|Review$/.test(t)).slice(0, 3).join(', ');
      console.log(`  [${k + 1}] ${it.short} · ${it.abbr || it.journal || ''}${types ? ` · ${types}` : ''}${it.retracted ? ' · DITARIK' : ''}`);
      console.log(`      ${it.title}`);
      console.log(`      ${[it.pmid && `PMID ${it.pmid}`, it.doi && `DOI ${it.doi}`].filter(Boolean).join(' · ')}`);
      if (it.conclusion) console.log(`      Kesimpulan: ${it.conclusion.slice(0, 420)}${it.conclusion.length > 420 ? '…' : ''}`);
      console.log('');
    });
    if (!res.items.length) console.log('  Tidak ada hasil. Coba kata kunci bahasa Inggris yang lebih umum, --type any, atau --db europepmc.\n');
    const dir = join(root, 'refs', 'evidence');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${slugify(q)}.json`);
    writeFileSync(file, JSON.stringify({ query: q, db, ...opts, at: new Date().toISOString(), items: res.items }, null, 1) + '\n');
    if (args.slug) {
      const p = join(root, 'posts', args.slug, 'evidence.json');
      const cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { items: [] };
      for (const it of res.items) if (!cur.items.some(x => (x.pmid && x.pmid === it.pmid) || (x.doi && x.doi === it.doi))) cur.items.push({ ...it, query: q });
      writeFileSync(p, JSON.stringify(cur, null, 1) + '\n');
      console.log(`  Disimpan ke posts/${args.slug}/evidence.json (${cur.items.length} makalah).`);
    }
    console.log(`  Hasil lengkap: ${relative(process.cwd(), file)}. Baca abstraknya sebelum menulis klaim; pakai: content-studio evidence cite <doi|pmid>\n`);
  } else if (cmd === 'cite') {
    const id = String(args._[1] || '').replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    if (!id) fail('Pakai: node evidence.mjs cite <doi|pmid>');
    let it;
    if (/^\d{4,9}$/.test(id)) it = (await pubmedSummaries([id]))[0];
    else { const c = await crossref(id); if (c) it = { ...c, short: shortCite(c.authors, c.year) }; }
    if (!it) fail(`Tidak ditemukan: ${id}`);
    if (it.doi && !it.pmid) { const s = await ncbi('esearch.fcgi', { db: 'pubmed', term: `${it.doi}[doi]`, retmode: 'json' }); it.pmid = ((s.esearchresult && s.esearchresult.idlist) || [])[0] || ''; }
    const entry = { id: 's1', short: it.short, cite: await apa(it.doi, it), ...(it.doi ? { doi: it.doi } : {}), ...(it.pmid ? { pmid: it.pmid } : {}), year: it.year };
    if (it.retracted) console.log('\n✗ Makalah ini DITARIK (retracted). Jangan dipakai sebagai sumber.\n');
    console.log(`\nTambahkan ke "sources" di reel.json (ganti id bila perlu):\n\n${JSON.stringify(entry, null, 2)}\n`);
  } else if (cmd === 'verify') {
    const slug = args._[1];
    const p = join(root, 'posts', String(slug), 'reel.json');
    if (!slug || !existsSync(p)) fail('Pakai: node evidence.mjs verify <slug>  (reel dengan "sources" di reel.json)');
    const reel = JSON.parse(readFileSync(p, 'utf8'));
    const sources = reel.sources || [];
    if (!sources.length) fail('reel.json belum punya "sources".');
    const today = new Date().toISOString().slice(0, 10);
    let bad = 0, changed = false;
    console.log(`\nVerifikasi ${sources.length} sumber di posts/${slug}/reel.json\n`);
    for (const s of sources) {
      const issues = [];
      let found = null;
      if (s.doi) {
        found = await crossref(s.doi);
        if (!found) {
          const { data } = await request('doi.org', `https://doi.org/api/handles/${encodeURI(s.doi)}`, { ok: [404], headers: polite });
          if (!data || data.responseCode !== 1) issues.push(`DOI ${s.doi} tidak ditemukan.`);
        }
      }
      if (s.pmid) {
        const it = (await pubmedSummaries([String(s.pmid)]))[0];
        if (!it) issues.push(`PMID ${s.pmid} tidak ditemukan.`);
        else {
          if (it.retracted) issues.push('Makalah ini ditarik (retracted).');
          if (s.doi && it.doi && it.doi.toLowerCase() !== s.doi.toLowerCase()) issues.push(`PMID dan DOI menunjuk makalah berbeda (PubMed: ${it.doi}).`);
          found = found || it;
        }
      }
      if (found && found.retracted) issues.push('Makalah ini ditarik (retracted).');
      const y = found && found.year;
      if (y && s.year && Math.abs(y - s.year) > 1) issues.push(`Tahun di sumber ${s.year}, terbit ${y}.`);
      if (y && s.short && !String(s.short).includes(String(y)) && !(s.year && String(s.short).includes(String(s.year)))) issues.push(`"short" tidak menyebut tahun terbit ${y}.`);
      if (!s.doi && !s.pmid) issues.push(s.url ? 'Hanya URL: pastikan halamannya resmi (pedoman, lembaga kesehatan).' : 'Tanpa DOI, PMID, atau URL.');
      const ok = !issues.length || (issues.length === 1 && /Hanya URL/.test(issues[0]));
      console.log(`  ${ok ? '✓' : '✗'} [${s.id}] ${s.short}${found ? `\n      ${found.title}${found.journal ? ` (${found.journal}${y ? ', ' + y : ''})` : ''}` : ''}${issues.length ? `\n      ${issues.join('\n      ')}` : ''}`);
      if (ok) { if (s.verified !== today) { s.verified = today; changed = true; } if (!s.year && y) { s.year = y; changed = true; } }
      else { bad++; if (s.verified) { delete s.verified; changed = true; } }
    }
    if (changed) writeFileSync(p, JSON.stringify(reel, null, 2) + '\n');
    console.log(`\n${bad ? `✗ ${bad} sumber bermasalah. Perbaiki atau ganti sumbernya, lalu jalankan ulang.` : '✓ Semua sumber ada dan tidak ditarik.'}${changed ? ' reel.json diperbarui (verified, year).' : ''}`);
    console.log('  Verifikasi memastikan makalahnya ada. Isi klaim tetap harus sesuai abstrak: baca kesimpulannya.\n');
    process.exitCode = bad ? 1 : 0;
  } else fail(HELP);
} catch (e) { fail(e.message); }
