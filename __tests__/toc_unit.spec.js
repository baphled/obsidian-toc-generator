// __tests__/toc_unit.spec.js
const toc = require('../lib/toc');

function count(s, re) {
  const m = s.match(re);
  return m ? m.length : 0;
}

test("upsertTOC builds nested TOC with markers under ^top", () => {
  const lines = [
    "---","---","",
    "# Title","","^top","",
    "## One","Text","### One.1","Text",
    "## Two","Text",
  ];
  toc.upsertTOC(lines, 5, 4);
  const s = lines.join("\n");
  expect(/MDNAV:TOC START/.test(s)).toBe(true);
  expect(/Quick Jump/.test(s)).toBe(true);
  expect(s.includes("> - [[#One|One]]")).toBe(true);
  expect(s.includes(">   - [[#One.1|One.1]]")).toBe(true);
  expect(s.includes("> - [[#Two|Two]]")).toBe(true);
});

test("upsertTOC cleans up stray duplicate END markers and yields exactly one block", () => {
  const lines = [
    "# Title","","^top","",
    "<!-- MDNAV:TOC START -->",
    "%% MDNAV:TOC START %%",
    "> [!note]- 🔗 Quick Jump",
    "> - [[#A|A]]",
    "<!-- MDNAV:TOC END -->",
    "%% MDNAV:TOC END %%",
    "%% MDNAV:TOC END %%", // stray duplicate
    "",
    "## A","text"
  ];

  // ^top at index 2 → expected = 4
  toc.upsertTOC(lines, 2, 4);
  const s = lines.join("\n");

  // Exactly one of each marker remains
  expect(count(s, /<!-- MDNAV:TOC START -->/g)).toBe(1);
  expect(count(s, /%% MDNAV:TOC START %%/g)).toBe(1);
  expect(count(s, /<!-- MDNAV:TOC END -->/g)).toBe(1);
  expect(count(s, /%% MDNAV:TOC END %%/g)).toBe(1);
});

test("upsertTOC idempotent update (no duplication)", () => {
  const lines = [
    "---","---","",
    "# Title","","^top","",
    "## One","Text","### One.1","Text",
    "## Two","Text",
  ];
  toc.upsertTOC(lines, 5, 4);
  const once = lines.join("\n");
  toc.upsertTOC(lines, 5, 4);
  const twice = lines.join("\n");
  expect(twice).toBe(once);

  // Exactly one block (one of each marker)
  expect(count(twice, /<!-- MDNAV:TOC START -->/g)).toBe(1);
  expect(count(twice, /%% MDNAV:TOC START %%/g)).toBe(1);
  expect(count(twice, /<!-- MDNAV:TOC END -->/g)).toBe(1);
  expect(count(twice, /%% MDNAV:TOC END %%/g)).toBe(1);
});
