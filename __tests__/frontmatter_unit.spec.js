// __tests__/frontmatter_unit.spec.js
const fm = require('../lib/frontmatter');
const utils = require('../lib/utils');
function set(lines){ return lines.slice(); }
function one(ok,msg){ expect(ok).toBe(true); if(!ok) console.error(msg); }

test("ensure_frontmatter creates when absent", ()=>{
  const lines = set(["# Title"]);
  fm.ensureFrontmatter(lines, true);
  one(lines[0]==="---" && lines[1]==="---", "Frontmatter not created: "+lines.slice(0,3).join("\\n"));
});

test("ensure_h1 creates under frontmatter", ()=>{
  const lines = set(["---","---",""]);
  const fmEnd = 1;
  fm.ensureH1(lines, fmEnd, "sample-note", true);
  const [h1,_] = utils.findH1(lines, fmEnd);
  one((h1===fmEnd+1)||(h1===fmEnd+2), `H1 wrong position: fmEnd=${fmEnd}, h1=${h1}\n`+lines.join("\\n"));
});

test("ensure_blank_after inserts one blank", ()=>{
  const lines = set(["---","---","","# T","no-blank"]);
  fm.ensureBlankAfter(lines, 3);
  one(lines[4]==="", "No blank after H1: "+lines.join("\\n"));
});
