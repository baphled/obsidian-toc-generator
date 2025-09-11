// __tests__/back_to_top_unit.spec.js
const btt = require('../lib/backToTop');

function count(lines, re) {
  const s = Array.isArray(lines) ? lines.join('\n') : String(lines);
  const m = s.match(re);
  return m ? m.length : 0;
}

it("ensureSingleTop keeps a single ^top at canonical position", () => {
  // canonicalTopAt is 5 (0-based)
  const lines = ["---","---","","# T","","^top","","^top"];
  btt.ensureSingleTop(lines, 5);

  const idx = lines.indexOf("^top");
  expect(count(lines, /^\^top$/gm)).toBe(1);
  expect(idx).toBe(5);
  expect(lines[idx + 1]).toBe(""); // one blank after ^top
});

it("upsertSectionFooters places H2 footer after nested subsections (one per H2)", () => {
  const lines = [
    "---","---","","# T","","^top","",
    "## A","text","### A.1","text",
    "## Beta","text"
  ];
  btt.upsertSectionFooters(lines, [2], "---");
  const s = lines.join("\n");

  // One footer per H2 (A and Beta): 2 in total
  expect(count(s, /\[\[#\^top\|↩️ Back to Top\]\]/g)).toBe(2);

  // Footer for A must occur before "## Beta"
  const aFooter = s.indexOf("[[#^top|↩️ Back to Top]]");
  const betaIdx = s.indexOf("## Beta");
  expect(aFooter).toBeGreaterThan(0);
  expect(aFooter).toBeLessThan(betaIdx);

  // Each footer followed by '---' (canonical HR)
  const afterFooter = s.slice(aFooter);
  expect(/^\[\[#\^top\|↩️ Back to Top\]\]\n\n---/m.test(afterFooter)).toBe(true);
});
