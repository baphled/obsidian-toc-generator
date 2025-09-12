import Transform from '@/Transform';

describe("Transform", () => {
  const config = {
    max_depth: 4,
    footer_levels: [2],
    prettify_h1: true,
    create_frontmatter: true,
    hr: "---"
  }

  const run = (input, cfg = {}) => {
    return Transform.transform(input, "Sample Note", Object.assign({}, config));
  };

  describe("transform", () => {
    describe("when there is only a h1 heading", () => {
      const lines = [
        "---",
        "created: today",
        "---",
        "# Only H1",
        "Some text here."
      ].join("\n");

      it("only H1 -> no TOC, but ^top ensured", () => {
        expect(run(lines)).not.toMatch(/\n\^top\n/);
      });

      it("does not have a quick jump link", () => {
        expect(run(lines)).not.toMatch(/Quick Jump/);
      });
    });

    describe("with nested headings", () => {
      const lines = [
        "# Title",
        "## Alpha",
        "Text",
        "### A.1",
        "Text",
        "## Beta",
        "Text"
      ].join("\n");

      it("has a quick jump link", () => {
        expect(run(lines)).toMatch(/Quick Jump/);
      });

      it("quick jump link is at the bottom", () => {
        const out = run(lines);

        const alphaFooterIdx = out.indexOf("[[#^top|↩️ Back to Top]]");
        const betaIdx = out.indexOf("## Beta");

        expect(alphaFooterIdx).toBeLessThan(betaIdx);
      });
    });

    describe("when called multiple times", () => {
      const input = [
        "---",
        "---",
        "# Title",
        "## One",
        "Text",
        "### One.1",
        "Text",
        "## Two",
        "Text"
      ].join("\n");

      it("idempotent", () => {
        const once = run(input);
        const twice = run(once);

        expect(twice).toBe(once);
      });
    });

    describe("when there is frontmatter, and headings", () => {
      const lines = [
        "---",
        "created: today",
        "---",
        "# Title",
        "Some text here.",
        "## Section A",
        "More text.",
        "### Subsection A.1",
        "Even more text.",
        "## Section B",
        "Final text."
      ].join("\n");

      it("has a top marker after H1", () => {
        expect(run(lines)).toMatch(/\n\^top\n/);
      });

      it("ensures single top marker", () => {
        const withExtraTop = lines.replace("Some text here.", "^top\n\nSome text here.");
        const out = run(withExtraTop);

        expect((out.match(/\n\^top\n/g) || []).length).toBe(1);
      });

      it("has a Quick Jump link", () => {
        expect(run(lines)).toMatch(/Quick Jump/);
      });

      it("ensures frontmatter is intact", () => {
        const out = run(lines);

        expect(out.startsWith("---\ncreated: today\n---")).toBe(true);
      });

      it("ensures blank line after frontmatter and H1", () => {
        const out = run(lines);

        expect(out).toMatch(/---\n# Title\n\n/);
      });

      it("creates TOC after ^top", () => {
        const out = run(lines);

        expect(out).toMatch(/\^top\n\n<!-- MDNAV:TOC START -->/);
      });

      it("creates TOC", () => {
        const out = run(lines);

        expect(out).toMatch(/- \[\[#Section A\|Section A\]\]/);
      });

      it("inserts back-to-top footers after specified levels", () => {
        const out = run(lines);

        expect(out).toMatch(/Even more text.\n\n\[\[#\^top\|↩️ Back to Top\]\]\n\n---\n/);
      });
    });

    describe("edge cases for duplication and misplacement", () => {
      it("removes duplicate TOC markers", () => {
        const input = [
          "---",
          "---",
          "# Title",
          "^top",
          "<!-- MDNAV:TOC START -->",
          "%% MDNAV:TOC START %%",
          "Quick Jump",
          "<!-- MDNAV:TOC END -->",
          "%% MDNAV:TOC END %%",
          "## Section",
          "Content"
        ].join("\n");

        const output = run(input);
        expect(output.match(/<!-- MDNAV:TOC START -->/g).length).toBe(1);
        expect(output.match(/%% MDNAV:TOC START %%/g).length).toBe(1);
      });

      it("removes duplicate back-to-top markers", () => {
        const input = [
          "---",
          "created: today",
          "---",
          "# Title",
          "## Section",
          "Content",
          "[[#^top|↩️ Back to Top]]"
        ].join("\n");

        const output = run(input);

        expect(output.match(/\[\[#\^top\|↩️ Back to Top\]\]/g).length).toBe(1);
      });

      it("corrects misaligned TOC markers", () => {
        const input = [
          "# Title",
          "Quick Jump",
          "<!-- MDNAV:TOC START -->",
          "- [[#Section|Section]]",
          "<!-- MDNAV:TOC END -->",
          "^top",
          "## Section",
          "Content"
        ].join("\n");

        const output = run(input);

        expect(output).toMatch(/\^top\n\n<!-- MDNAV:TOC START -->/);
      });
    });
  });
});

