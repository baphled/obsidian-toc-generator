// tests/integration/plugin.smoke.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest) { this.app = app; this.manifest = manifest; } addSettingTab(tab){ this.__settingTab = tab; } registerEvent(){ } addCommand(){ } async loadData(){ return {}; } async saveData(){} }
  class PluginSettingTab { constructor(app, plugin){ this.app = app; this.plugin = plugin; this.containerEl = { empty(){}, createEl(){ return {}; } }; } display(){} }
  class Setting { constructor(){ } setName(){ return this; } setDesc(){ return this; } addText(fn){ fn({ setPlaceholder(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } addToggle(fn){ fn({ setValue(){return this;}, onChange(){return this;} }); return this; } addSlider(fn){ fn({ setLimits(){return this;}, setDynamicTooltip(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } }
  class Notice { constructor(){} }
  class TFile {}
  return { Plugin, PluginSettingTab, Setting, Notice, TFile };
}, { virtual: true });

describe('main.js – smoke', () => {
  it('constructs and onload() completes without throwing', async () => {
    const PluginCtor = require('../../main.js');
    const app = {
      workspace: { on(){}, getActiveFile(){ return null; } },
      metadataCache: { on(){} },
      vault: { on(){}, adapter:{ basePath:'/tmp' } }
    };
    const manifest = { id: 'obsidian-toc-generator', name: 'TOC', version: '0.0.0' };
    const plugin = new PluginCtor(app, manifest);

    // speed up debounce
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });

    await expect(plugin.onload()).resolves.not.toThrow();
    expect(plugin.settings).toBeTruthy();
    expect(plugin.__settingTab).toBeTruthy();
  });
});
