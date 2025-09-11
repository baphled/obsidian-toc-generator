// lib/transform.js
const { ensureFrontmatter, ensureH1, ensureBlankAfter } = require('./frontmatter');
const { ensureSingleTop, upsertSectionFooters } = require('./backToTop');
const { upsertTOC } = require('./toc');

function transformDocument(text, filenameBase, cfg){
  const lines = text.split(/\r?\n/);
  const fmEnd = ensureFrontmatter(lines, !!cfg.create_frontmatter);
  const [h1Idx] = ensureH1(lines, fmEnd, filenameBase, !!cfg.prettify_h1);
  ensureBlankAfter(lines, h1Idx);
  const topAt = h1Idx + 2;
  ensureSingleTop(lines, topAt);
  upsertTOC(lines, topAt, cfg.max_depth||4);
  upsertSectionFooters(lines, cfg.footer_levels||[2], cfg.hr||"---");
  return lines.join("\n");
}
module.exports = { transformDocument };
