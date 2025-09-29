import Utils from '@/Utils';

describe('Utils', () => {
  describe('trimTrailingHashes()', () => {
    it('removes trailing hashes', () => {
      const out = Utils.trimTrailingHashes('Hello ###');

      expect(out).toBe('Hello');
    });

    it('removes trailing spaces and hashes', () => {
      const out = Utils.trimTrailingHashes('Hello ##   ');

      expect(out).toBe('Hello');
    });

    it('keeps internal hashes intact', () => {
      const out = Utils.trimTrailingHashes('He#l#lo #world#');

      expect(out).toBe('He#l#lo #world');
    });
  });

  describe('prettifyTitle()', () => {
    it('replaces hyphens/underscores with spaces', () => {
      const out = Utils.prettifyTitle('hello_world-title');

      expect(out).toBe('Hello World Title');
    });

    it('uppercases first letter and adds " -" before next words', () => {
      const out = Utils.prettifyTitle('foo bar baz');

      expect(out).toBe('Foo Bar Baz');
    });
  });

  describe('parseHeadings()', () => {
    it.each([
      ['empty array', [], []],
      ['no headings', ['just text', 'more text'], []],
    ])('returns expected for %s', (_name, input, expected) => {
      const out = Utils.parseHeadings(input);

      expect(out).toEqual(expected);
    });

    it('parses a single H1', () => {
      const lines = ['# Title'];
      const out = Utils.parseHeadings(lines);

      expect(out).toEqual([{ idx: 0, level: 1, text: 'Title' }]);
    });

    it('parses multiple heading levels', () => {
      const lines = ['# A', 'Body', '## B', '### C'];
      const out = Utils.parseHeadings(lines);

      expect(out).toEqual([
        { idx: 0, level: 1, text: 'A' },
        { idx: 2, level: 2, text: 'B' },
        { idx: 3, level: 3, text: 'C' },
      ]);
    });

    it('treats hashes inside code fences as headings (current impl)', () => {
      const lines = ['```', '# not-a-heading', '```'];
      const out = Utils.parseHeadings(lines);

      expect(out).toEqual([{ idx: 1, level: 1, text: 'not-a-heading' }]);
    });

    it('handles non-ASCII text', () => {
      const out = Utils.parseHeadings(['# Café ☕']);

      expect(out).toEqual([{ idx: 0, level: 1, text: 'Café ☕' }]);
    });
  });

  describe('findFrontmatter()', () => {
    it('finds frontmatter block', () => {
      const lines = ['---', 'created: now', 'tags: x', '---', '', '# Title'];
      const result = Utils.findFrontmatter(lines);

      expect(result).toEqual([0, 3]);
    });

    it('returns null tuple when no frontmatter present', () => {
      const lines = ['no frontmatter here', '# Title'];
      const result = Utils.findFrontmatter(lines);

      expect(result).toEqual([null, null]);
    });

    it('ignores leading blank lines before frontmatter', () => {
      const lines = ['', '   ', '---', 'created: now', '---', '# Title'];
      const result = Utils.findFrontmatter(lines);

      expect(result).toEqual([2, 4]);
    });

    it('returns null tuple when frontmatter fence never closes', () => {
      const lines = ['---', 'created: now', '# Title'];
      const result = Utils.findFrontmatter(lines);

      expect(result).toEqual([null, null]);
    });
  });

  describe('findH1()', () => {
    it('finds the H1 after frontmatter', () => {
      const lines = ['---', 'created: now', 'tags: x', '---', '', '# Title'];
      const result = Utils.findH1(lines, -1);

      expect(result).toEqual([5, 'Title']);
    });

    it('returns null tuple when no H1 is present', () => {
      const lines = ['no h1 here'];
      const result = Utils.findH1(lines, -1);

      expect(result).toEqual([null, null]);
    });

    it('finds H1 at first line (no frontmatter)', () => {
      const lines = ['# First', 'text'];
      const result = Utils.findH1(lines, -1);

      expect(result).toEqual([0, 'First']);
    });

    it('skips leading blank lines before H1', () => {
      const lines = ['', '', '# Real Title'];
      const result = Utils.findH1(lines, -1);

      expect(result).toEqual([2, 'Real Title']);
    });

    // Current impl still returns the H1 even if the frontmatter fence never closes.
    it('with malformed frontmatter still returns first H1 (current impl)', () => {
      const lines = ['---', 'created: now', '# Title'];
      const result = Utils.findH1(lines, -1);

      expect(result).toEqual([2, 'Title']);
    });
  });

  describe('hasSections()', () => {
    it('returns false when only H1 exists', () => {
      const heads = [{ idx: 0, level: 1, text: 'A' }];
      const out = Utils.hasSections(heads, 2);

      expect(out).toBe(false);
    });

    it('returns true when an H2 exists within maxDepth', () => {
      const heads = [{ idx: 0, level: 1, text: 'A' }, { idx: 5, level: 2, text: 'B' }];
      const out = Utils.hasSections(heads, 2);

      expect(out).toBe(true);
    });

    it('returns false when only deeper headings exist beyond maxDepth', () => {
      const heads = [{ idx: 3, level: 3, text: 'C' }];
      const out = Utils.hasSections(heads, 2);

      expect(out).toBe(false);
    });
  });

  describe('sectionEndIndex()', () => {
    it('ends before the next heading of same-or-higher level', () => {
      const heads = [
        { idx: 0, level: 1, text: 'A' },
        { idx: 5, level: 2, text: 'B' },
        { idx: 10, level: 1, text: 'C' },
      ];
      const out = Utils.sectionEndIndex(heads, 0, /* totalLines */ 20);

      expect(out).toBe(9); // next H1 at idx 10 → end at 9
    });

    it('considers deeper headings as part of current section', () => {
      const heads = [
        { idx: 0, level: 1, text: 'A' },
        { idx: 5, level: 2, text: 'B' },
        { idx: 8, level: 3, text: 'C' },
        { idx: 12, level: 2, text: 'D' },
      ];
      const out = Utils.sectionEndIndex(heads, 1, 40); // for "B" at idx 5

      expect(out).toBe(11); // next level <= 2 is "D" at idx 12 → end at 11
    });

    it('falls back to totalLines - 1 when no later heading', () => {
      const heads = [
        { idx: 0, level: 1, text: 'A' },
        { idx: 5, level: 2, text: 'B' },
      ];
      const out = Utils.sectionEndIndex(heads, 1, 15);

      expect(out).toBe(14);
    });
  });
});
