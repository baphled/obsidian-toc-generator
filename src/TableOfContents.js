import Utils from '@/Utils';

const MARK_START_HTML = "<!-- MDNAV:TOC START -->";
const MARK_END_HTML   = "<!-- MDNAV:TOC END -->";
const MARK_START_OBS  = "%% MDNAV:TOC START %%";
const MARK_END_OBS    = "%% MDNAV:TOC END %%";
const QUICK_JUMP = "> - [Quick Jump to Top](#top)";

function isStartMarker(s){ return /<!--\s*MDNAV:TOC START\s*-->/.test(s) || /%\s*MDNAV:TOC START\s*%/.test(s); }
function isEndMarker(s){   return /<!--\s*MDNAV:TOC END\s*-->/.test(s)   || /%\s*MDNAV:TOC END\s*%/.test(s); }

/**
 * Finds Table of Contents (TOC) blocks in the given lines.
 * @param {string[]} lines - An array of strings representing the lines in a document.
 * @returns {Array<{s: number, e: number}>} - An array of objects indicating start (s) and end (e) indices of TOC blocks.
 **/
function findTocBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    // Look for the first start marker
    if (!isStartMarker(lines[i])) { i++; continue; }

    const s = i;
    let e = null;

    // Walk forward, remember the *last* end marker we see.
    // If we hit another start marker and we already saw at least one END,
    // close the current block at the last END before that new START.
    i++;
    for (; i < lines.length; i++) {
      if (isEndMarker(lines[i])) {
        e = i;         // keep extending to the last END we see
        continue;
      }
      if (isStartMarker(lines[i]) && e != null) {
        // Next block begins; close the current one at the last END
        break;
      }
    }

    if (e != null) {
      blocks.push({ s, e });
    } else {
      // No end found; treat start line as a degenerate block to be cleaned
      blocks.push({ s, e: s });
    }
  }

  return blocks;
}

/**
 * Builds TOC lines for a Markdown document.
 *
 * @param {string[]} lines - An array of strings representing the lines in a document.
 * @param {number} [maxDepth=4] - The maximum heading depth to include in the TOC.
 *
 * @returns {string[]} An array of strings representing the TOC.
 **/
function buildTocLines(lines, maxDepth) {
  const heads = Utils.parseHeadings(lines);
  const maxd = Math.min(maxDepth || 4, 6);
  const out = [];
  if (heads.length === 0) return out;
  out.push(MARK_START_HTML);
  out.push(MARK_START_OBS);
  out.push(QUICK_JUMP);
  let any = false;
  for (const h of heads) {
    if (h.level >= 2 && h.level <= maxd) {
      any = true;
      const indent = "  ".repeat(h.level - 2);
      out.push(`> ${indent}- [[#${h.text}|${h.text}]]`);
    }
  }
  out.push(MARK_END_HTML);
  out.push(MARK_END_OBS);
  out.push("");
  return out;
}

/**
 * Canonical behavior:
 * - If no sections → remove any existing TOC blocks.
 * - If TOC exists but is not exactly ONE block at expected index (topAt+2) with identical content → remove ALL blocks and insert fresh one.
 * - If exists and identical at expected position → do nothing.
 *
 * @param {string[]} lines - An array of strings representing the lines in a document.
 * @param {number} topAt - The index position of the top line.
 * @param {number} [maxDepth=4] - The maximum heading depth to include in the TOC.
 **/
function upsertTOC(lines, topAt, maxDepth) {
  const heads = Utils.parseHeadings(lines);
  const maxd = Math.min(maxDepth || 4, 6);
  const any = Utils.hasSections(heads, maxd);
  const expected = topAt + 2; // after "^top" and its blank line

  const blocks = findTocBlocks(lines);

  if (!any) {
    // remove all TOC blocks if present
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      lines.splice(b.s, (b.e - b.s) + 1);
    }
    return;
  }

  const fresh = buildTocLines(lines, maxd);

  if (blocks.length === 1 && blocks[0].s === expected) {
    const existing = lines.slice(blocks[0].s, blocks[0].e + 1).join('\n');
    const rebuilt  = fresh.slice(0, fresh.length - 1).join('\n'); // exclude trailing blank when comparing region
    if (existing === rebuilt) return; // identical → idempotent
  }

  // Remove any and all blocks
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    lines.splice(b.s, (b.e - b.s) + 1);
  }
  // Insert one canonical block
  lines.splice(expected, 0, ...fresh);
}

/**
 *
 * Table of Contents (TOC) management for Markdown documents.
 * This module provides functions to find, build, and upsert TOC blocks in a Markdown file.
 * TOC blocks are delimited by specific start and end markers in both HTML comment and Obsidian comment formats.
 * The TOC includes a "Quick Jump to Top" link and lists headings from level 2 up to a specified maximum depth.
 *
 * Markers:
 * - HTML Comment Start: `<!-- MDNAV:TOC START -->`
 * - HTML Comment End: `<!-- MDNAV:TOC END -->`
 * - Obsidian Comment Start: `%% MDNAV:TOC START %%`
 * - Obsidian Comment End: `%% MDNAV:TOC END %%`
 * Quick Jump Link: `> - [Quick Jump to Top](#top)`
 *
 * Example TOC Block:
 * ```
 * <!-- MDNAV:TOC START -->
 * %% MDNAV:TOC START %%
 * > - [Quick Jump to Top](#top)
 * > - [[#Section 1|Section 1]]
 * >   - [[#Subsection 1.1|Subsection 1.1]]
 * > - [[#Section 2|Section 2]]
 * <!-- MDNAV:TOC END -->
 * %% MDNAV:TOC END %%
 * ```
 *
 **/
export default {
  MARK_START_HTML: MARK_START_HTML,
  MARK_END_HTML: MARK_END_HTML,
  MARK_START_OBS: MARK_START_OBS,
  MARK_END_OBS: MARK_END_OBS,
  upsertTOC: upsertTOC
};
