import Utils from '@/Utils';

/**
 *
 * Idempotently ensure exactly one "^top" at the specified line index.
 * If not present, insert it at that index.
 * If present elsewhere, remove those instances.
 * Ensure exactly one blank line after it.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @param {number} canonicalTopAt - The line index where "^top" should be ensured.
 *
 * @example
 * const lines = [
 *   'Some text',
 *   '^top',
 *   '',
 *   'More text',
 *   '^top'
 * ];
 * ensureSingleTop(lines, 0);
 * console.log(lines);
 * // Output:
 * // [
 * //   '^top',
 * //   '',
 * //   'Some text',
 * //   '',
 * //   'More text'
 * // ]
 *
 * @returns {void}
 */
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
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @param {number[]} footerLevels - Array of heading levels (e.g., [2,3]) where footers should be added.
 * @param {string} [hr="---"] - The horizontal rule string to use in the footer.
 *
 * @example
 * const lines = [
 *   '# Title',
 *   'Some text',
 *   '## Section 1',
 *   'Content here',
 *   '[[#^top|↩️ Back to Top]]',
 *   '---',
 *   'More content',
 *   '## Section 2',
 *   'Other content'
 * ];
 * upsertSectionFooters(lines, [2], '---');
 * console.log(lines);
 * // Output:
 * // [
 * //   '# Title',
 * //   'Some text',
 * //   '## Section 1',
 * //   'Content here',
 * //   '',
 * //   '[[#^top|↩️ Back to Top]]',
 * //   '',
 * //   '---',
 * //   'More content',
 * //   '## Section 2',
 * //   'Other content',
 * //   '',
 * //   '[[#^top|↩️ Back to Top]]',
 * //   '',
 * //   '---'
 * // ]
 *
 * @returns {void}
 *
 */
function upsertSectionFooters(lines, footerLevels, hr) {
  const heads = Utils.parseHeadings(lines);
  if (!heads.length || !footerLevels || !footerLevels.length) return;

  const hrLine = hr || "---";
  const hrEsc  = hrLine.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const footerRe = /^\[\[#\s*\^?top\|\s*↩️\s*Back to Top\]\]$/;
  const hrRe = new RegExp(`^${hrEsc}\\s*$`);

  for (let i = heads.length - 1; i >= 0; i--) {
    const h = heads[i];
    if (!footerLevels.includes(h.level)) continue;

    let secEnd = Utils.sectionEndIndex(heads, i, lines.length);

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

/**
 * @module BackToTop
 *
 * Exports for BackToTop module.
 *
 **/
export default { ensureSingleTop, upsertSectionFooters };
