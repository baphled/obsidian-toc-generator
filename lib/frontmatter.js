// lib/frontmatter.js
const { findFrontmatter, findH1, prettifyTitle } = require('./utils');

function ensureFrontmatter(lines, create){
  const [s,e] = findFrontmatter(lines);
  if (s != null) return e;
  if (!create) return -1;
  lines.splice(0,0,'---','---','');
  return 1;
}

function ensureH1(lines, fmEnd, filenameBase, prettify){
  let [idx, text] = findH1(lines, fmEnd);
  if (idx != null) return [idx, text];
  const raw = filenameBase || 'Untitled';
  const title = prettify ? prettifyTitle(raw) : raw;
  const h1 = `# ${title}`;
  const afterFm = lines[fmEnd+1] ?? '';
  if (afterFm !== '') lines.splice(fmEnd+1, 0, '');
  lines.splice(fmEnd+2, 0, h1, '');
  return [fmEnd+2, title];
}

function ensureBlankAfter(lines, idx){
  const next = lines[idx+1] ?? '';
  if (next !== '') lines.splice(idx+1, 0, '');
}

module.exports = { ensureFrontmatter, ensureH1, ensureBlankAfter };
