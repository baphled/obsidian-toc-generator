import TableOfContents from '@/TableOfContents';

describe('TableOfContents', () => {
  describe('upsertTOC', () => {
    const joinAfter = (lines, topAt = 2, maxDepth = 6) => {
      const copy = lines.slice();
      TableOfContents.upsertTOC(copy, topAt, maxDepth);
      return copy.join('\n');
    };

    it('respects maxDepth', () => {
      const md = [
        '# Title', '', '^top', '',
        '## A', '', '### B', '', '#### C'
      ];
      const out = joinAfter(md, 2, 2);

      expect(/^\s*-\s*\[B\]/m.test(out)).toBe(false);
    });

    it('does not insert TOC when no sections under maxDepth', () => {
      const md = ['# Title', '', '^top', '', 'Body only'];
      const out = joinAfter(md, 2, 2);

      expect(out.includes(TableOfContents.MARK_START_HTML)).toBe(false);
    });


    it('creates nested bullets for nested headings', () => {
      const md = ['# T', '', '^top', '', '## A', '', '### B'];
      const out = joinAfter(md, 2, 3);

      expect(/^>\s+-\s+\[\[#A\|A\]\]/m.test(out)).toBe(true);
    });

    it('wraps block with canonical HTML markers', () => {
      const md = ['# T', '', '^top', '', '## A'];
      const out = joinAfter(md, 2, 6);

      expect(out.includes(TableOfContents.MARK_START_HTML) && out.includes(TableOfContents.MARK_END_HTML)).toBe(true);
    });

    it('is idempotent for unchanged content', () => {
      const md = ['# T', '', '^top', '', '## A'];
      const once = joinAfter(md, 2, 6);
      const twice = joinAfter(once.split('\n'), 2, 6);

      expect(twice).toBe(once);
    });

    describe('when upserting/replacing', () => {
      const joinAfter = (lines, topAt = 2, maxDepth = 6) => {
        const copy = lines.slice();
        TableOfContents.upsertTOC(copy, topAt, maxDepth);
        return copy.join('\n');
      };

      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      it('replaces existing block (no duplicates)', () => {
        const md = [
          '# T', '', '^top', '',
          TableOfContents.MARK_START_HTML,
          '- [[#Old|Old]]',
          '<!-- list … -->',
          TableOfContents.MARK_END_HTML,
          '',
          '## A'
        ];
        const out = joinAfter(md, 2, 6);
        const count = (out.match(new RegExp(esc(TableOfContents.MARK_START_HTML), 'g')) || []).length;

        expect(count).toBe(1);
      });

      it('updates items inside existing block', () => {
        const md = [
          '# T', '', '^top', '',
          TableOfContents.MARK_START_HTML,
          '- [[#Old|Old]]',
          '<!-- list … -->',
          TableOfContents.MARK_END_HTML,
          '',
          '## A'
        ];
        const out = joinAfter(md, 2, 6);

        expect(/^>\s*-\s*\[\[#A\|A\]\]/m.test(out)).toBe(true);
      });
    });
  });
});
