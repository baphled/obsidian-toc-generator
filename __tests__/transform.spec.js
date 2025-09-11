// __tests__/transform.spec.js
const { transformDocument } = require('../lib/transform');

function run(input, cfg={}){
  return transformDocument(input, "Sample Note", Object.assign({
    max_depth: 4,
    footer_levels: [2],
    prettify_h1: true,
    create_frontmatter: true,
    hr: "---"
  }, cfg));
}

test("only H1 -> no TOC, but ^top ensured", () => {
  const out = run(`---
created: today
---
# Title
Some text
`);
  expect(out).toMatch(/\n\^top\n/);
  expect(out).not.toMatch(/Quick Jump/);
});

test("nested TOC and H2 footer after subsections", () => {
  const out = run(`---
---
# Title
## Alpha
Text
### A.1
Text
## Beta
Text
`);
  expect(out).toMatch(/Quick Jump/);
  const alphaFooterIdx = out.indexOf("[[#^top|↩️ Back to Top]]");
  const betaIdx = out.indexOf("## Beta");
  expect(alphaFooterIdx).toBeGreaterThan(0);
  expect(alphaFooterIdx).toBeLessThan(betaIdx);
});

test("idempotent", () => {
  const input = `---
---
# Title
## One
Text
### One.1
Text
## Two
Text
`;
  const once = run(input);
  const twice = run(once);
  expect(twice).toBe(once);
});
