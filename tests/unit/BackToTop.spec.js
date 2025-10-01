import BackToTop from '@/BackToTop';

const asText = (lines) => (Array.isArray(lines) ? lines.join('\n') : String(lines));
const count = (lines, re) => {
  const m = asText(lines).match(re);
  return m ? m.length : 0;
};

describe('BackToTop', () => {
  describe('ensureSingleTop', () => {
    it('inserts ^top at the canonical index when absent', () => {
      const lines = ['---', '---', '', '# Title', ''];
      BackToTop.ensureSingleTop(lines, 2);

      expect(lines[2]).toBe('^top');
    });

    it('ensures exactly one ^top', () => {
      const lines = ['^top', 'A', 'B', '^top', 'C', ''];

      BackToTop.ensureSingleTop(lines, 2);
      expect(count(lines, /^\^top$/gm)).toBe(1);
    });

    it('keeps a blank line immediately after ^top', () => {
      const lines = ['A', 'B', 'C'];

      BackToTop.ensureSingleTop(lines, 1);

      expect(lines[2]).toBe('');
    });

    it('does not add extra blanks when one already follows ^top', () => {
      const lines = ['A', '^top', '', 'B'];
      BackToTop.ensureSingleTop(lines, 1);

      expect(lines.slice(1, 3).join('\n')).toBe('^top\n');
    });
  });

  describe('upsertSectionFooters', () => {
    it('inserts a footer after a qualifying H2 section', () => {
      const lines = ['# H1', '', '## Alpha', 'content a', '', '## Beta', 'content b', ''];
      BackToTop.upsertSectionFooters(lines, [2], '---');

      expect(count(lines, /^\[\[#\^top\|↩️ Back to Top\]\]$/m)).toBe(1);
    });

    it('places the footer before the next same-level heading', () => {
      const lines = ['# H1', '', '## Alpha', 'content a', '## Beta', 'content b'];
      BackToTop.upsertSectionFooters(lines, [2], '---');
      const s = asText(lines);
      const footerAt = s.indexOf('[[#^top|↩️ Back to Top]]');
      const nextH2At = s.indexOf('## Beta');

      expect(footerAt > -1 && footerAt < nextH2At).toBe(true);
    });

    it('makes the footer block canonical shape', () => {
      const lines = ['# H1', '## Alpha', 'content a', '## Beta', 'content b'];
      BackToTop.upsertSectionFooters(lines, [2], '---');
      const s = asText(lines);

      expect(/\n\[\[#\^top\|↩️ Back to Top\]\]\n\n---/.test(s)).toBe(true);
    });

    it('uses the provided HR line', () => {
      const lines = ['# H1', '## A', 'body'];
      BackToTop.upsertSectionFooters(lines, [2], '***');
      const s = asText(lines);

      expect(s.includes('\n***')).toBe(true);
    });

    it('is idempotent', () => {
      const lines = ['# H1', '## A', 'body'];
      BackToTop.upsertSectionFooters(lines, [2], '---');
      const once = asText(lines);
      BackToTop.upsertSectionFooters(lines, [2], '---');
      const twice = asText(lines);

      expect(twice).toBe(once);
    });

    it('targets only the specified levels', () => {
      const lines = ['# H1', '## A', 'body', '### A.1', 'body', '## B', 'body', '### B.1', 'body'];
      BackToTop.upsertSectionFooters(lines, [3], '---');

      expect(count(lines, /^\[\[#\^top\|↩️ Back to Top\]\]$/m)).toBe(1);
    });
  });
});
