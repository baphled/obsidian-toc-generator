import Utils from '@/Utils';

/**
 *
 * Ensure frontmatter exists in the lines of a markdown file.
 * If frontmatter is already present, return the index of its end.
 * If not present, insert empty frontmatter at the top and return the index of its end.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @returns {number} - The index of the line after the frontmatter (or 1 if none was present).
 *
 * @example
 * const lines = [
 *   'Some text',
 *   'More text'
 * ];
 * const fmEnd = ensureFrontmatter(lines);
 * console.log(lines);
 * // Output:
 * // [
 * //   '---',
 * //   '---',
 * //   '',
 * //   'Some text',
 * //   'More text'
 * // ]
 * console.log(fmEnd); // Output: 1
 *
 */
function ensureFrontmatter(lines){
  const [s,e] = Utils.findFrontmatter(lines);
  if (s != null) return e;
  return 1;
}

/**
 *
 * Ensure a top-level heading (H1) exists after the frontmatter in the lines of a markdown file.
 * If an H1 is already present, return its index and text.
 * If not present, insert an H1 using the filenameBase (prettified if specified) and return its index and text.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @param {number} fmEnd - The index of the line after the frontmatter.
 * @param {string} [filenameBase] - The base name of the file (without extension) to use for the title if no H1 is present.
 * @param {boolean} [prettify=true] - Whether to prettify the filenameBase for the title.
 * @returns {[number, string]} - The index of the H1 line and its text.
 *
 * @example
 * const lines = [
 *  '---',
 *  'title: My Document',
 *  '---',
 *  '# My Document',
 *  'Some text',
 *  'More text'
 * ];
 * const [h1Idx, h1Text] = ensureH1(lines, 2, 'my-document', true);
 * console.log(lines);
 * // Output:
 * // [
 * //   '---',
 * //   'title: My Document',
 * //   '---',
 * //   '',
 * //   '# My Document',
 * //   '',
 * //   'Some text',
 * //   'More text'
 * // ]
 * console.log(h1Idx, h1Text); // Output: 4 'My Document'
 *
 */
function ensureH1(lines, fmEnd, filenameBase, prettify){
  let [idx, text] = Utils.findH1(lines, fmEnd);
  if (idx != null) return [idx, text];
  const raw = filenameBase || 'Untitled';
  const title = prettify ? Utils.prettifyTitle(raw) : raw;
  const h1 = `# ${title}`;
  const afterFm = lines[fmEnd+1] ?? '';
  if (afterFm !== '') lines.splice(fmEnd+1, 0, '');
  lines.splice(fmEnd+2, 0, h1, '');
  return [fmEnd+2, title];
}

/**
 *
 * Ensure exactly one blank line after the specified index in the lines of a markdown file.
 * If there is no blank line after the specified index, insert one.
 * If there are multiple blank lines, reduce them to a single blank line.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @param {number} idx - The index after which to ensure a blank line.
 *
 * @example
 * const lines = [
 *   '# My Heading',
 *   'Some text',
 *   '',
 *   '',
 *   'More text'
 * ];
 * ensureBlankAfter(lines, 0);
 * console.log(lines);
 * // Output:
 * // [
 * //   '# My Heading',
 * //   '',
 * //   'Some text',
 * //   '',
 * //   'More text'
 * // ]
 *
 */
function ensureBlankAfter(lines, idx){
  const next = lines[idx+1] ?? '';
  if (next !== '') lines.splice(idx+1, 0, '');
}

/**
 * Module exporting functions to ensure frontmatter, H1 heading, and blank line after a specified index in markdown lines.
 *
 * @module Frontmatter
 *
 */
export default { ensureFrontmatter, ensureH1, ensureBlankAfter };
