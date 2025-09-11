// lib/backToTop.js
const { parseHeadings, sectionEndIndex } = require('./utils');

function ensureSingleTop(lines, canonicalTopAt) {
  const idxs = [];
  for (let i = 0; i < lines.length; i++) if (lines[i] === "^top") idxs.push(i);
  // remove all but canonical
  for (let i = idxs.length - 1; i >= 0; i--) if (idxs[i] !== canonicalTopAt) lines.splice(idxs[i], 1);
  // ensure present
  if (lines[canonicalTopAt] !== "^top") lines.splice(canonicalTopAt, 0, "^top");
  // ensure one blank after
  if ((lines[canonicalTopAt + 1] || "") !== "") lines.splice(canonicalTopAt + 1, 0, "");
}

/**
 * Strictly idempotent footers:
 * - For every section at a configured level, remove *all* existing footer instances anywhere in the section.
 * - Insert exactly one canonical footer at the end-of-section (after nested H3/H4/… but before next section).
 */
function upsertSectionFooters(lines, footerLevels, hr) {
  const heads = parseHeadings(lines);
  if (!heads.length || !footerLevels || !footerLevels.length) return;

  const hrLine = hr || "---";
  const hrEsc  = hrLine.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const footerRe = /^\[\[#\s*\^?top\|\s*↩️\s*Back to Top\]\]$/;
  const hrRe = new RegExp(`^${hrEsc}\\s*$`);

  for (let i = heads.length - 1; i >= 0; i--) {
    const h = heads[i];
    if (!footerLevels.includes(h.level)) continue;

    let secEnd = sectionEndIndex(heads, i, lines.length);

    // 1) Remove *all* existing footers within the section
    let j = secEnd;
    while (j > h.idx) {
      if (footerRe.test(lines[j] || "")) {
        // capture following blanks + HR
        let rmFrom = j, rmTo = j;
        let k = j + 1;
        while (k <= secEnd && (/^\s*$/.test(lines[k] || ""))) k++;
        if (k <= secEnd && hrRe.test(lines[k] || "")) rmTo = k; // include HR if right after
        lines.splice(rmFrom, (rmTo - rmFrom) + 1);
        secEnd -= (rmTo - rmFrom) + 1;
        j = Math.min(j, secEnd);
      }
      j--;
    }

    // 2) Insert one canonical footer
    const needBlank = !(/^\s*$/.test(lines[secEnd] || ""));
    const footer = [];
    if (needBlank) footer.push("");
    footer.push("[[#^top|↩️ Back to Top]]");
    footer.push("");
    footer.push(hrLine);
    lines.splice(secEnd + 1, 0, ...footer);
  }
}

module.exports = { ensureSingleTop, upsertSectionFooters };
