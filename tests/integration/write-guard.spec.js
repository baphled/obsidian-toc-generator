// tests/integration/write-guard.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest){ this.app=app; this.manifest=manifest; } addSettingTab(t){ this.__settingTab=t; } registerEvent(e){ return e; } registerInterval(i){ return i; } addCommand(){} async loadData(){ return {}; } async saveData(){} }
  class PluginSettingTab { constructor(app, plugin){ this.app=app; this.plugin=plugin; const el={ innerHTML:"", empty(){ this.innerHTML=""; }, createEl(){ return {}; } }; this.containerEl=el; } display(){} }
  class Setting { constructor(){} setName(){return this;} setDesc(){return this;} addText(f){ f({ setPlaceholder(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } addToggle(f){ f({ setValue(){return this;}, onChange(){return this;} }); return this; } addSlider(f){ f({ setLimits(){return this;}, setDynamicTooltip(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } }
  class Notice { constructor(){} }
  class TFile {}
  return { Plugin, PluginSettingTab, Setting, Notice, TFile };
}, { virtual: true });

const PluginCtor = require('../../main.js');

const appFactory = () => {
  const listeners={};
  const on=(n,cb)=>{(listeners[n]||(listeners[n]=[])).push(cb); return {n,cb};};
  const trigger=(n,...a)=>{(listeners[n]||[]).forEach(cb=>cb(...a));};
  return {
    workspace:{ on, getActiveFile(){ return null; } },
    metadataCache:{ on },
    vault:{ adapter:{ basePath:'/tmp/vault' }, on, trigger, read:jest.fn(async()=>''), modify:jest.fn(async()=>{}) }
  };
};

describe('main.js write guard', () => {
  let app, plugin, TFileCtor, file;

  beforeEach(async () => {
    jest.useFakeTimers();
    app = appFactory();
    plugin = new PluginCtor(app, { id:'obsidian-toc-generator', name:'TOC', version:'0' });
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });
    await plugin.onload();
    TFileCtor = require('obsidian').TFile;
    file = Object.assign(new TFileCtor(), { path:'a.md', basename:'a', extension:'md' });
    plugin._transform = (t)=>t+'\nX';
    app.vault.read.mockResolvedValue('');
  });

  it('clears path from writing set after timeout', async () => {
    await plugin.processFile(file);
    jest.advanceTimersByTime(600);
    expect(plugin.writing.has(file.path)).toBe(false);
  });
});
