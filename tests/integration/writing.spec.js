// tests/integration/writing.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest) { this.app = app; this.manifest = manifest; } addSettingTab(t) { this.__settingTab = t; } registerEvent(e) { return e; } registerInterval(i) { return i; } addCommand() { } async loadData() { return {}; } async saveData() { } }
  class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; const el = { innerHTML: "", empty() { this.innerHTML = ""; }, createEl() { return {}; } }; this.containerEl = el; } display() { } }
  class Setting { constructor() { } setName() { return this; } setDesc() { return this; } addText(f) { f({ setPlaceholder() { return this; }, setValue() { return this; }, onChange() { return this; } }); return this; } addToggle(f) { f({ setValue() { return this; }, onChange() { return this; } }); return this; } addSlider(f) { f({ setLimits() { return this; }, setDynamicTooltip() { return this; }, setValue() { return this; }, onChange() { return this; } }); return this; } }
  class Notice { constructor() { } }
  class TFile { }
  return { Plugin, PluginSettingTab, Setting, Notice, TFile };
}, { virtual: true });

const PluginCtor = require('../../main.js');

const makeApp = () => {
  const listeners = {};
  const on = (n, cb) => { (listeners[n] || (listeners[n] = [])).push(cb); return { n, cb }; };
  const trigger = (n, ...a) => { (listeners[n] || []).forEach(cb => cb(...a)); };
  return {
    workspace: { on, getActiveFile() { return null; } },
    metadataCache: { on },
    vault: { adapter: { basePath: '/tmp/vault' }, on, trigger, read: jest.fn(async () => ''), modify: jest.fn(async () => { }) }
  };
};

describe('main.js writing', () => {
  let app, plugin, TFileCtor, file;

  beforeEach(async () => {
    app = makeApp();
    plugin = new PluginCtor(app, { id: 'obsidian-toc-generator', name: 'TOC', version: '0.0.0' });
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });
    await plugin.onload();
    TFileCtor = require('obsidian').TFile;
    file = Object.assign(new TFileCtor(), { path: 'a.md', basename: 'a', extension: 'md' });
    app.vault.read.mockResolvedValue('');
    app.vault.modify.mockClear();
  });

  it('no-op when transform missing', async () => {
    plugin._transform = null;
    await plugin.processFile(file);
    expect(app.vault.modify).toHaveBeenCalledTimes(0);
  });

  it('no write when output equals input', async () => {
    plugin._transform = (t) => t;
    await plugin.processFile(file);
    expect(app.vault.modify).toHaveBeenCalledTimes(0);
  });

  it('guard prevents reentry', async () => {
    plugin._transform = (t) => t + '\nX';
    plugin.writing.add(file.path);
    await plugin.processFile(file);
    expect(app.vault.modify).toHaveBeenCalledTimes(0);
  });

  it('debounces modify events', async () => {
    jest.useFakeTimers();

    const app2 = (() => {
      const listeners = {}; const on = (n, cb) => { (listeners[n] || (listeners[n] = [])).push(cb); return { n, cb }; };
      const trigger = (n, ...a) => { (listeners[n] || []).forEach(cb => cb(...a)); };
      return {
        workspace: { on, getActiveFile() { return null; } },
        metadataCache: { on },
        vault: { adapter: { basePath: '/tmp/vault' }, on, trigger, read: jest.fn(async () => ''), modify: jest.fn(async () => { }) }
      };
    })();

    const PluginCtor = require('../../main.js');
    const plugin2 = new PluginCtor(app2, { id: 'obsidian-toc-generator', name: 'TOC', version: '0.0.0' });
    jest.spyOn(plugin2, 'loadData').mockResolvedValue({ debounce_ms: 20 });
    await plugin2.onload();

    const { TFile } = require('obsidian');
    const f = Object.assign(new TFile(), { path: 'b.md', basename: 'b', extension: 'md' });
    plugin2._transform = (t) => t + '\nX';
    app2.vault.read.mockResolvedValue('');

    app2.vault.trigger('modify', f);
    app2.vault.trigger('modify', f);
    app2.vault.trigger('modify', f);

    await jest.advanceTimersByTimeAsync(25);
    await Promise.resolve();
    await Promise.resolve();

    expect(app2.vault.modify).toHaveBeenCalledTimes(1);
  });
});
