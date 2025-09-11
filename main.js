// main.js
// MDNav Obsidian Plugin (JavaScript). Frontmatter/H1, ^top, nested TOC, Back-to-Top footers.
// Idempotent + no modify-loop.

const { Plugin, PluginSettingTab, Setting, Notice, TFile } = require('obsidian');

const DEFAULT_SETTINGS = {
  max_depth: 4,
  footer_levels: "2",
  prettify_h1: true,
  create_frontmatter: true,
  debounce_ms: 250,
  hr: "---"
};

// Use Obsidian/Electron's Node require safely
const nodeRequire = (typeof window !== 'undefined' && window.require) ? window.require : require;

function parseFooterLevels(s) {
  if (!s) return [];
  return s.split(',').map(x => Number(x.trim())).filter(n => Number.isFinite(n) && n >= 1 && n <= 6);
}

function debounce(fn, wait) {
  let t = null;
  return function (...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Robustly load lib/transform.js from the plugin folder (works even if folder name changes)
async function loadTransformFromPluginDir(app, manifestId) {
  const path = nodeRequire('path');
  const fs   = nodeRequire('fs');

  const pluginDir = path.join(app.vault.adapter.basePath, '.obsidian', 'plugins', manifestId);
  const abs = path.join(pluginDir, 'lib', 'transform.js');

  if (fs.existsSync(abs)) return nodeRequire(abs);

  // Fallbacks
  try { return nodeRequire('./lib/transform.js'); } catch {}
  try { return nodeRequire('./lib/transform');   } catch {}

  console.error('[MDNav] Could not resolve transform.js', { pluginDir, tries: [abs, './lib/transform.js', './lib/transform'] });
  throw new Error('MDNav: transform.js not found');
}

class MDNavSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'MDNav Settings' });

    new Setting(containerEl)
      .setName('Max depth')
      .setDesc('Include headings up to this level (2..6) in the TOC.')
      .addText(t => t.setPlaceholder('4').setValue(String(this.plugin.settings.max_depth))
        .onChange(async (value) => {
          const n = Number(value) || 4;
          this.plugin.settings.max_depth = Math.max(2, Math.min(6, n));
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Footer levels')
      .setDesc('Comma-separated heading levels that get Back-to-Top footers (e.g., "2" or "2,3").')
      .addText(t => t.setPlaceholder('2').setValue(this.plugin.settings.footer_levels)
        .onChange(async (value) => {
          this.plugin.settings.footer_levels = (value || '2').replace(/\s+/g, '');
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Prettify H1 from filename')
      .setDesc('If H1 is missing, create from filename and prettify it.')
      .addToggle(t => t.setValue(this.plugin.settings.prettify_h1)
        .onChange(async (v) => { this.plugin.settings.prettify_h1 = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Create frontmatter if missing')
      .setDesc('Insert a minimal YAML frontmatter block when missing.')
      .addToggle(t => t.setValue(this.plugin.settings.create_frontmatter)
        .onChange(async (v) => { this.plugin.settings.create_frontmatter = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Footer separator (HR)')
      .setDesc('Line used below Back-to-Top footers, default "---".')
      .addText(t => t.setPlaceholder('---').setValue(this.plugin.settings.hr)
        .onChange(async (v) => { this.plugin.settings.hr = v || '---'; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Debounce (ms)')
      .setDesc('Debounce time for auto-update on save.')
      .addText(t => t.setPlaceholder('250').setValue(String(this.plugin.settings.debounce_ms))
        .onChange(async (v) => {
          const n = Number(v) || 250;
          this.plugin.settings.debounce_ms = Math.max(0, n);
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('hr');
    new Setting(containerEl)
      .setName('Run on current file')
      .setDesc('Execute MDNav on the active Markdown file right now.')
      .addButton(b => b.setButtonText('Run').onClick(async () => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') { new Notice('MDNav: No active Markdown file'); return; }
        if (!this.plugin._transformDocument) {
          try {
            const mod = await loadTransformFromPluginDir(this.app, this.plugin.manifest.id);
            this.plugin._transformDocument = mod.transformDocument;
          } catch (e) {
            console.error('MDNav: failed to load transform for Run button', e);
            new Notice('MDNav: transform loader error (see console)');
            return;
          }
        }
        await this.plugin.processFile(file);
        new Notice('MDNav: Updated');
      }));
  }
}

module.exports = class MDNavPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MDNavSettingTab(this.app, this));

    // cache transform (ok if it fails; we lazy-load in processFile)
    try {
      const { transformDocument } = await loadTransformFromPluginDir(this.app, this.manifest.id);
      this._transformDocument = transformDocument;
    } catch (e) {
      console.warn('[MDNav] transform.js not loaded at startup; will lazy-load', e?.message);
    }

    // Prevent modify-loop: ignore our own writes for a short window
    this.writing = new Set();

    const debounced = debounce(async (file) => {
      try {
        if (this.writing.has(file.path)) return; // skip our own write
        await this.processFile(file);
      } catch (e) {
        console.error('md-nav error:', e);
      }
    }, this.settings.debounce_ms);

    this.registerEvent(this.app.vault.on('modify', (file) => {
      if (!(file instanceof TFile) || file.extension !== 'md') return;
      debounced(file);
    }));

    this.addCommand({
      id: 'md-nav-run-on-active',
      name: 'Run on active file',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (file) await this.processFile(file);
      }
    });
  }

  onunload() {}

  async processFile(file) {
    const path = file.path;
    // Ensure transform is available
    if (!this._transformDocument) {
      const mod = await loadTransformFromPluginDir(this.app, this.manifest.id);
      this._transformDocument = mod.transformDocument;
    }

    const raw = await this.app.vault.read(file);
    const cfg = {
      max_depth: Math.max(2, Math.min(6, Number(this.settings.max_depth) || 4)),
      footer_levels: parseFooterLevels(this.settings.footer_levels),
      prettify_h1: !!this.settings.prettify_h1,
      create_frontmatter: !!this.settings.create_frontmatter,
      hr: this.settings.hr || '---'
    };

    const out = this._transformDocument(raw, file.basename, cfg);
    if (out !== raw) {
      this.writing.add(path);                 // suppress the next modify for this path
      await this.app.vault.modify(file, out); // triggers 'modify' once
      // Clear suppression after a short tick (covers async write completion)
      setTimeout(() => this.writing.delete(path), 500);
    }
  }

  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
};
