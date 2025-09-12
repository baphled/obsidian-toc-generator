/**
 * Utility functions for parsing markdown headings and frontmatter.
 * @module Utils
 *
 * @param {string} s - Input string to trim.
 *
 * @returns {string} - String with trailing spaces and hashes removed.
 *
 * @example
 * const trimmed = trimTrailingHashes('Heading ###   ');
 * console.log(trimmed); // Output: 'Heading'
 *
 */
function trimTrailingHashes(s){ return s.replace(/\s*#*\s*$/, ''); }

/**
 * Prettify a string by replacing dashes/underscores with spaces and capitalizing words.
 *
 * @param {string} s - Input string to prettify.
 *
 * @returns {string} - Prettified string.
 *
 * @example
 * const pretty = prettifyTitle('my-awesome_title');
 * console.log(pretty); // Output: 'My Awesome Title'
 *
 **/
function prettifyTitle(s){
  s = s.replace(/[-_]+/g, ' ');
  s = s.replace(/^\w/, (c)=>c.toUpperCase());
  s = s.replace(/ (\w)/g, (_,c)=>' '+c.toUpperCase());
  return s;
}

/**
 * Parse markdown headings from lines of text.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 *
 * @returns {Array<{idx: number, level: number, text: string}>} - Array of heading objects with index, level, and text.
 *
 * @example
 * const lines = [
 *   '# Title',
 *   'Some text',
 *   '## Subtitle',
 *   'More text',
 *   '### Subsubtitle'
 * ];
 * const headings = parseHeadings(lines);
 * console.log(headings);
 * // Output:
 * // [
 * //   { idx: 0, level: 1, text: 'Title' },
 * //   { idx: 2, level: 2, text: 'Subtitle' },
 * //   { idx: 4, level: 3, text: 'Subsubtitle' }
 * // ]
 *
 **/
function parseHeadings(lines){
  const heads=[];
  lines.forEach((line,i)=>{
    const m = line.match(/^(#+)\s+(.+)/);
    if (m){ heads.push({ idx:i, level:m[1].length, text: trimTrailingHashes(m[2]) }); }
  });
  return heads;
}

/**
 * Find frontmatter section in markdown lines.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 *
 * @returns {[number|null, number|null]} - Start and end indices of frontmatter, or [null, null] if not found.
 *
 * @example
 * const lines = [
 *   '---',
 *   'title: My Document',
 *   'author: John Doe',
 *   '---',
 *   '# Heading'
 * ];
 * const [start, end] = findFrontmatter(lines);
 * console.log(start, end); // Output: 0 3
 *
 **/
function findFrontmatter(lines){
  let i=0; while(i<lines.length && /^\s*$/.test(lines[i])) i++;
  if (i<lines.length && /^---\s*$/.test(lines[i])){
    const s=i; i++;
    while(i<lines.length && !/^---\s*$/.test(lines[i])) i++;
    if (i<lines.length) return [s,i];
  }
  return [null,null];
}

/**
 * Find first H1 heading in markdown lines starting from a given index.
 *
 * @param {string[]} lines - Array of lines from a markdown file.
 * @param {number} [fromIdx=-1] - Index to start searching from (default is -1, meaning start from the beginning).
 *
 * @returns {[number|null, string|null]} - Index and text of the first H1 heading found, or [null, null] if not found.
 *
 * @example
 * const lines = [
 *   'Some text',
 *   '# My Heading',
 *   'More text'
 * ];
 * const [idx, text] = findH1(lines);
 * console.log(idx, text); // Output: 1 'My Heading'
 *
 **/
function findH1(lines, fromIdx){
  const start = (fromIdx ?? -1) + 1;
  for(let i=start;i<lines.length;i++){
    const m = lines[i].match(/^#\s+(.+)/);
    if (m) return [i, trimTrailingHashes(m[1])];
  }
  return [null,null];
}

/**
 * Check if there are any sections (headings level 2 to maxDepth) in the parsed headings.
 *
 * @param {Array<{idx: number, level: number, text: string}>} heads - Array of heading objects.
 * @param {number} maxDepth - Maximum heading level to consider as a section.
 *
 * @returns {boolean} - True if there are sections, false otherwise.
 *
 * @example
 * const heads = [
 *   { idx: 0, level: 1, text: 'Title' },
 *   { idx: 2, level: 2, text: 'Subtitle' },
 *   { idx: 4, level: 3, text: 'Subsubtitle' }
 * ];
 * const hasSecs = hasSections(heads, 3);
 * console.log(hasSecs); // Output: true
 *
 **/
function hasSections(heads, maxDepth){
  return heads.some(h => h.level >= 2 && h.level <= maxDepth);
}

/**
 * Find the end index of a section starting from a given heading index.
 *
 * @param {Array<{idx: number, level: number, text: string}>} heads - Array of heading objects.
 * @param {number} i - Index of the current heading in the heads array.
 * @param {number} totalLines - Total number of lines in the markdown file.
 *
 * @returns {number} - Index of the last line of the section.
 *
 * @example
 * const heads = [
 *  { idx: 0, level: 1, text: 'Title' },
 *   { idx: 2, level: 2, text: 'Subtitle' },
 *   { idx: 4, level: 3, text: 'Subsubtitle' }
 * ];
 * const endIdx = sectionEndIndex(heads, 1, 6);
 * console.log(endIdx); // Output: 3
**/
function sectionEndIndex(heads, i, totalLines){
  const cur = heads[i].level;
  for (let j=i+1;j<heads.length;j++){
    if (heads[j].level <= cur) return heads[j].idx - 1;
  }
  return totalLines - 1;
}


function _normalizePath(p){
  if (!p) return '';
  return String(p)
    .replace(/\\/g,'/')
    .replace(/\/+/g,'/')
    .replace(/^\.\//,'')
    .replace(/\/+$/,'');
}

/**
 * Check if a file path is within any of the excluded folders.
 *
 * @param {string} filePath - The file path to check.
 * @param {string[]} excludedFolders - Array of folder paths to exclude.
 *
 * @returns {boolean} - True if the file path is in an excluded folder, false otherwise.
 *
 * @example
 * const isExcluded = isExcludedPath('docs/notes/file.md', ['docs/notes', 'archive']);
 * console.log(isExcluded); // Output: true
 **/
function isExcludedPath(filePath, excludedFolders){
  if (!filePath || !Array.isArray(excludedFolders) || excludedFolders.length === 0) return false;
  const p = _normalizePath(filePath);
  for (let raw of excludedFolders){
    const base = _normalizePath(raw);
    if (!base) continue;
    if (p === base) return true;
    const prefix = base + '/';
    if (p.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Check if any of the file's tags are in the list of excluded tags.
 *
 * @param {string[]} fileTags - Array of tags associated with the file (e.g., ['#tag1', '#tag2']).
 * @param {string[]} isIgnoredTags - Array of tags to exclude (e.g., ['tag1', 'tag3']).
 *
 * @returns {boolean} - True if any file tag is in the excluded tags, false otherwise.
 *
 * @example
 * const isExcluded = isIgnoredTags(['#tag1', '#tag2'], ['tag1', 'tag3']);
 * console.log(isExcluded); // Output: true
 **/
function isIgnoredTags(fileTags, isIgnoredTags) {
  if (!Array.isArray(fileTags) || fileTags.length === 0) return false;
  if (!Array.isArray(isIgnoredTags) || isIgnoredTags.length === 0) return false;

  const excluded = isIgnoredTags.map(t => t.replace(/^#/,''));
  for (let t of fileTags){
    const tag = t.replace(/^#/,'');
    if (excluded.includes(tag)) return true;
  }
  return false;
}

/**
 *
 * @module Utils
 *
 * Utility functions for parsing markdown headings and frontmatter.
 *
 */
export default {
  trimTrailingHashes,
  prettifyTitle,
  parseHeadings,
  findFrontmatter,
  findH1,
  hasSections,
  sectionEndIndex,
  isExcludedPath,
  isIgnoredTags
};
