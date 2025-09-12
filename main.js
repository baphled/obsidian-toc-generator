// main.js
// MDNav Obsidian Plugin (JavaScript). Frontmatter/H1, ^top, nested TOC, Back-to-Top footers.

const { Plugin, PluginSettingTab, Setting, Notice, TFile } = require('obsidian');

import Utils from '@/Utils.js';

const DEFAULT_SETTINGS = {
  max_depth: 4,
  footer_levels: "2",
  prettify_h1: true,
  debounce_ms: 250,
  hr: "---",
  excludedFolders: []
};

// Use Obsidian/Electron's Node require safely
const nodeRequire = (typeof window !== 'undefined' && window.require) ? window.require : require;

/** Prefer new `transform`, gracefully fall back to legacy export shapes */
function pickTransform(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.transform === 'function') return mod.transform;
  if (mod.default && typeof mod.default === 'function') return mod.default;
  return null;
}

/** Try to load transform from live plugin dir; fall back to bundled */
function loadTransformFromPluginDir(app, manifestId) {
  const path = nodeRequire('path');
  const fs = nodeRequire('fs');

  try {
    const pluginDir = path.join(app?.vault?.adapter?.basePath || '', '.obsidian', 'plugins', manifestId);
    const abs = path.join(pluginDir, 'src', 'Transform.js');
    if (fs.existsSync(abs)) return nodeRequire(abs);
  } catch (_) { /* ignore and fall back */ }

  // Fallbacks to bundled module
  try { return nodeRequire('./src/Transform.js'); } catch (_) {}
  try { return nodeRequire('./src/Transform');   } catch (_) {}

  throw new Error('[MDNav] transform.js not found (dynamic or bundled)');
}

class TOCGeneratorSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'MDNav Settings' });

    new Setting(containerEl)
      .setName('Max depth')
      .setDesc('Include headings up to this level (2..6) in the TOC.')
      .addText(t => t
        .setPlaceholder('4')
        .setValue(String(this.plugin.settings.max_depth))
        .onChange(async (value) => {
          const n = Number(value);
          this.plugin.settings.max_depth = Number.isFinite(n) ? Math.min(6, Math.max(1, n)) : 4;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Footer levels')
      .setDesc('Comma-separated heading levels that should get a Back-to-Top footer, e.g., "2,3".')
      .addText(t => t
        .setPlaceholder('2')
        .setValue(String(this.plugin.settings.footer_levels ?? '2'))
        .onChange(async (value) => {
          this.plugin.settings.footer_levels = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Prettify H1 from filename')
      .setDesc('Set the first H1 from the note filename when missing.')
      .addToggle(t => t
        .setValue(!!this.plugin.settings.prettify_h1)
        .onChange(async (v) => {
          this.plugin.settings.prettify_h1 = !!v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Horizontal rule text')
      .setDesc('Text used for HR before Back-to-Top footers (usually ---).')
      .addText(t => t
        .setPlaceholder('---')
        .setValue(String(this.plugin.settings.hr ?? '---'))
        .onChange(async (value) => {
          this.plugin.settings.hr = value || '---';
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Debounce (ms)')
      .setDesc('Delay after a file change before processing.')
      .addText(t => t
        .setPlaceholder('250')
        .setValue(String(this.plugin.settings.debounce_ms ?? 250))
        .onChange(async (value) => {
          const n = Number(value);
          this.plugin.settings.debounce_ms = Number.isFinite(n) ? Math.max(0, n) : 250;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Excluded folders')
      .setDesc('One vault-relative folder per line. Files in these folders will be ignored.')
      .addTextArea((ta) => {
        ta.setValue((this.plugin.settings.excludedFolders || []).join('\n'))
          .onChange(async (v) => {
            this.plugin.settings.excludedFolders = v.split('\n').map(s => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          });
        ta.inputEl.rows = 4;
        ta.inputEl.addClass('toc-excluded-folders');
      });
  }
}

module.exports = class TOCGenerator extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new TOCGeneratorSettingTab(this.app, this));

    // Prime transform at startup; if it fails, we'll lazy-load in processFile
    try {
      const mod = loadTransformFromPluginDir(this.app, this.manifest.id);
      const fn = pickTransform(mod);
      if (typeof fn === 'function') this._transform = fn;
    } catch (e) {
      console.warn('[MDNav] transform not ready at startup; will lazy-load on first use:', e?.message);
    }

    this.writing = new Set();

    const debounce = (fn, ms) => {
      let t = null;
      return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    const debounced = debounce(async (file) => {
      try {
        await this.processFile(file);
      } catch (e) {
        console.error('[MDNav] error while processing file:', e);
      }
    }, this.settings.debounce_ms);

    // Re-run on file modifies
    this.registerEvent(this.app.vault.on('modify', (file) => {
      if (!(file instanceof TFile) || file.extension !== 'md') return;
      if (Array.isArray(this.settings.excludedFolders) && Utils.isExcludedPath(file.path, this.settings.excludedFolders)) return;
      debounced(file);
    }));

    // Manual command
    this.addCommand({
      id: 'mdnav-toc-run-on-active',
      name: 'Run on active file',
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!(file instanceof TFile) || file.extension !== 'md') {
          new Notice('MDNav: No active Markdown file');
          return;
        }
        if (Array.isArray(this.settings.excludedFolders)
          && Utils.isExcludedPath(file.path, this.settings.excludedFolders)) {
          new Notice('MDNav: Folder excluded');
          return;
        }
        await this.processFile(file);
      }
    });
  }

  onunload() {
    // nothing special
  }

  async processFile(file) {
    const path = file.path;
    if (this.writing.has(path)) return; // prevent modify-loop

    // Lazy-load transform if not available yet
    if (!this._transform) {
      const mod = loadTransformFromPluginDir(this.app, this.manifest.id);
      const fn = pickTransform(mod);
      if (typeof fn === 'function') this._transform = fn;
    }
    if (typeof this._transform !== 'function') {
      console.error('[MDNav] transform function not available');
      return;
    }

    const raw = await this.app.vault.read(file);
    const cfg = {
      max_depth: Number(this.settings.max_depth ?? 4),
      footer_levels: Array.isArray(this.settings.footer_levels)
        ? this.settings.footer_levels
        : String(this.settings.footer_levels ?? '2')
          .split(',')
          .map(s => Number(s.trim()))
          .filter(n => Number.isFinite(n)),
      prettify_h1: !!this.settings.prettify_h1,
      hr: this.settings.hr || '---'
    };

    const out = this._transform(raw, file.basename, cfg);
    if (out !== raw) {
      this.writing.add(path);
      await this.app.vault.modify(file, out);
      setTimeout(() => this.writing.delete(path), 500);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
