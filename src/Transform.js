import Frontmatter from '@/Frontmatter';
import BackToTop from '@/BackToTop';
import TableOfContents from '@/TableOfContents';
import Utils from '@/Utils';

/**
 * Transforms the given markdown text by ensuring frontmatter, H1 heading, TOC, and back-to-top links.
 *
 * @param {string} text - The input markdown text.
 * @param {string} filenameBase - The base name of the file (used for H1 if missing).
 * @param {Object} cfg - Configuration options.
 * @param {boolean} [cfg.prettify_h1=false] - Whether to prettify the H1 heading if added.
 * @param {number} [cfg.max_depth=4] - Maximum depth of headings to include in the TOC.
 * @param {number[]} [cfg.footer_levels=[2]] - Heading levels to append back-to-top links to.
 * @param {string} [cfg.hr="---"] - Horizontal rule string to use before back-to-top links.
 * @returns {string} The transformed markdown text.
 *
 * @example
 * const inputText = `
 * ---
 * title: Sample Document
 * ---
 *
 * # Sample Document
 *
 * ## Section 1
 * Content here.
 *
 * ## Section 2
 * More content.
 * `;
 *
 * const outputText = transform(inputText, 'sample-document', {
 *   prettify_h1: true,
 *   max_depth: 3,
 *   footer_levels: [2],
 *   hr: '---'
 * });
 *
 * console.log(outputText);
 *
 * // Output:
 * // ---
 * // title: Sample Document
 * // ---
 * //
 * // # Sample Document
 * //
 * // [[#^top|↩️ Back to Top]]
 * //
 * // ---
 * //
 * // > - [[#Section 1|Section 1]]
 * // > - [[#Section 2|Section 2]]
 * //
 * // ## Section 1
 * // Content here.
 * //
 * // [[#^top|↩️ Back to Top]]
 * //
 * // ---
 * //
 * // ## Section 2
 * // More content.
 * //
 * // [[#^top|↩️ Back to Top]]
 * //
 * // ---
 *
 */
function transform(text, filenameBase, cfg){
  const lines = text.split(/\r?\n/);
  const heads = Utils.parseHeadings(lines);
  if (heads.length <= 1) return lines.join("\n"); // only H1 or less, no TOC needed
  const fmEnd = Frontmatter.ensureFrontmatter(lines);
  const [h1Idx] = Frontmatter.ensureH1(lines, fmEnd, filenameBase, !!cfg.prettify_h1);
  Frontmatter.ensureBlankAfter(lines, h1Idx);
  const topAt = h1Idx + 2;
  BackToTop.ensureSingleTop(lines, topAt);
  TableOfContents.upsertTOC(lines, topAt, cfg.max_depth||4);
  BackToTop.upsertSectionFooters(lines, cfg.footer_levels||[2], cfg.hr||"---");
  return lines.join("\n");
}


/**
 *
 * @module Transform
 *
 * This module provides a function to transform markdown text by ensuring the
 * presence of frontmatter, a top-level heading (H1), a table of contents
 * (TOC), and back-to-top links at specified heading levels.
 *
 */
export default { transform };
