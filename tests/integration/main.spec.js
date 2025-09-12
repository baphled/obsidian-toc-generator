// tests/integration/main.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest){ this.app=app; this.manifest=manifest; } addSettingTab(t){ this.__settingTab=t; } registerEvent(e){ return e; } registerInterval(i){ return i; } addCommand(c){ (this.__commands||(this.__commands=[])).push(c); return c; } async loadData(){ return {}; } async saveData(){} }
  class PluginSettingTab { constructor(app, plugin){ this.app=app; this.plugin=plugin; const el={ innerHTML:"", empty(){ this.innerHTML=""; }, createEl(){ return {}; } }; this.containerEl=el; } display(){} }
  class Setting {
    constructor(){ if(!Setting._text){ Setting._text=[]; Setting._toggle=[]; } }
    setName(){ return this; } setDesc(){ return this; }
    addText(f){ const api={ setPlaceholder(){return api;}, setValue(){return api;}, onChange(cb){ Setting._text.push(cb); return api; } }; f(api); return this; }
    addToggle(f){ const api={ setValue(){return api;}, onChange(cb){ Setting._toggle.push(cb); return api; } }; f(api); return this; }
    static _reset(){ Setting._text=[]; Setting._toggle=[]; }
  }
  class Notice { constructor(){} }
  class TFile {}
  return { Plugin, PluginSettingTab, Setting, Notice, TFile };
}, { virtual: true });

const makeApp = () => {
  const listeners={};
  const on=(n,cb)=>{(listeners[n]||(listeners[n]=[])).push(cb); return {n,cb};};
  const trigger=(n,...a)=>{(listeners[n]||[]).forEach(cb=>cb(...a));};
  return {
    workspace:{ on, getActiveFile(){ return null; } },
    metadataCache:{ on },
    vault:{ adapter:{ basePath:'/tmp/vault' }, on, trigger, read:jest.fn(async()=>''), modify:jest.fn(async()=>{}) }
  };
};

const PluginCtor = require('../../main.js');

describe('main.js integration', () => {
  let app, plugin, TFileCtor, file;

  beforeEach(async () => {
    require('obsidian').Setting._reset();
    app = makeApp();
    plugin = new PluginCtor(app, { id:'obsidian-toc-generator', name:'TOC', version:'0' });
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });
    await plugin.onload();
    plugin._transform = (t)=>t+'\nX';
    TFileCtor = require('obsidian').TFile;
    file = Object.assign(new TFileCtor(), { path:'n.md', basename:'n', extension:'md' });
    app.vault.read.mockResolvedValueOnce('');
    app.vault.modify.mockClear();
  });

  describe('plugin basic', () => {
    it('has settings', () => { expect(Boolean(plugin.settings)).toBe(true); });
    it('has setting tab', () => { expect(Boolean(plugin.__settingTab)).toBe(true); });
    it('registers command', () => { expect(plugin.__commands.some(c=>c.id==='mdnav-toc-run-on-active')).toBe(true); });
  });

  describe('processFile', () => {
    it('writes when transformed', async () => { await plugin.processFile(file); expect(app.vault.modify).toHaveBeenCalledTimes(1); });
    it('no-op without transform', async () => { plugin._transform=null; await plugin.processFile(file); expect(app.vault.modify).toHaveBeenCalledTimes(0); });
    it('guards reentry', async () => { plugin.writing.add(file.path); await plugin.processFile(file); expect(app.vault.modify).toHaveBeenCalledTimes(0); });
  });

  describe('modify event', () => {
    it('triggers processing (debounced=0)', async () => {
      app.vault.trigger('modify', file);
      await new Promise(r=>setTimeout(r,0));
      expect(app.vault.modify).toHaveBeenCalledTimes(1);
    });
  });

  describe('run-on-active command', () => {
    it('processes active markdown file', async () => {
      const cmd = plugin.__commands.find(c=>c.id==='mdnav-toc-run-on-active');
      app.workspace.getActiveFile = () => file;
      await cmd.callback();
      expect(app.vault.modify).toHaveBeenCalledTimes(1);
    });
  });

  describe('settings tab', () => {
    it('display empties container', () => { const el=plugin.__settingTab.containerEl; const s=jest.spyOn(el,'empty'); plugin.__settingTab.display(); expect(s).toHaveBeenCalledTimes(1); });
    it('display creates header', () => { const el=plugin.__settingTab.containerEl; const s=jest.spyOn(el,'createEl'); plugin.__settingTab.display(); expect(s).toHaveBeenCalled(); });
  });

  describe('settings handlers', () => {
    it('updates max_depth', () => { const {Setting}=require('obsidian'); plugin.__settingTab.display(); Setting._text[0]('6'); expect(plugin.settings.max_depth).toBe(6); });
    it('updates footer_levels', () => { const {Setting}=require('obsidian'); plugin.__settingTab.display(); Setting._text[1]('2,3'); expect(plugin.settings.footer_levels).toBe('2,3'); });
    it('updates prettify_h1', () => { const {Setting}=require('obsidian'); plugin.__settingTab.display(); Setting._toggle[0](true); expect(plugin.settings.prettify_h1).toBe(true); });
    it('updates hr', () => { const {Setting}=require('obsidian'); plugin.__settingTab.display(); Setting._text[2]('----'); expect(plugin.settings.hr).toBe('----'); });
    it('updates debounce_ms', () => { const {Setting}=require('obsidian'); plugin.__settingTab.display(); Setting._text[3]('0'); expect(plugin.settings.debounce_ms).toBe(0); });
  });
});
