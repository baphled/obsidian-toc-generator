import Frontmatter from '@/Frontmatter.js';
import Utils from '@/Utils.js';

function set(lines) { return lines.slice(); }

describe("Frontmatter", () => {
  describe("ensureFrontmatter", () => {
    const lines = [
      "---",
      "created: now",
      "---",
      "",
      "# Title"
    ];

    it("returns end of existing frontmatter", () => {
      const fmEnd = Frontmatter.ensureFrontmatter(lines, false);

      expect(fmEnd).toBe(2);
    });
  });

  describe("ensureH1", () => {
    const lines = [
      "---",
      "---",
      ""
    ];

    it("ensure_h1 creates under frontmatter", () => {
      const fmEnd = 1;
      Frontmatter.ensureH1(lines, fmEnd, "sample-note", true);
      const [h1, _] = Utils.findH1(lines, fmEnd);

      expect((h1 === fmEnd + 1) || (h1 === fmEnd + 2)).toBe(true);
    });
  });

  describe("ensureBlankAfter", () => {
    const lines = set(["---", "---", "", "# T", "no-blank"]);

    it("ensure_blank_after inserts one blank", () => {
      Frontmatter.ensureBlankAfter(lines, 3);

      expect(lines[4]).toBe("")
    });
  });
});
