# TOC Generator (Obsidian Plugin)

Frontmatter-aware TOC + Back-to-Top automation for Obsidian. Pure JavaScript (no TypeScript), with Jest tests.

## Install
1. Copy this folder to your vault: `<Vault>/.obsidian/plugins/obsidian-toc-generator/`.
2. In Obsidian: Settings → Community plugins → Enable **TOC Generator**.

## Settings
- **Max depth**: include headings up to this level (2..6) in the TOC (default: 4).
- **Footer levels**: comma-separated levels that get Back-to-Top footers (default: `"2"`).
- **Prettify H1**: generate H1 from filename with nicer casing (default: on).
- **Create frontmatter**: insert minimal YAML when missing (default: on).
- **Footer separator (HR)**: line used under footers (default: `---`).
- **Debounce (ms)**: delay for auto-update on save (default: 250).

## Development
```bash
npm install
npm test
```

