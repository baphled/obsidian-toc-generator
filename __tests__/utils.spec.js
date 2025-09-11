// __tests__/utils.spec.js
const utils = require('../lib/utils');
function one(ok,msg){ expect(ok).toBe(true); if(!ok) console.error(msg); }

test("collect_headings returns correct levels", ()=>{
  const lines = ["# H1","## H2","### H3","text"];
  const heads = utils.parseHeadings(lines);
  const ok = heads.length===3 && heads[0].level===1 && heads[1].level===2 && heads[2].level===3;
  one(ok, "Levels/count wrong: "+JSON.stringify(heads));
});

test("section_end_index boundary before next <= level", ()=>{
  const lines = ["# Top","## A","text","### sub","t","t","## B","text"];
  const heads = utils.parseHeadings(lines);
  const end0 = utils.sectionEndIndex(heads, 1, lines.length);
  one(end0===5, "Expected end0=5, got "+end0);
});

test("findFrontmatter and findH1", ()=>{
  const lines = ["---","created: now","---","","# Title"];
  const [s,e] = utils.findFrontmatter(lines);
  const [h1,_] = utils.findH1(lines, e);
  one(s===0 && e===2 && h1===4, `fm=[${s},${e}] h1=${h1}`);
});
