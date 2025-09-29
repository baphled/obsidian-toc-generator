// tests/integration/dynamic-path.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest){ this.app=app; this.manifest=manifest; } addSettingTab(t){ this.__settingTab=t; } registerEvent(e){ return e; } registerInterval(i){ return i; } addCommand(){ } async loadData(){ return {}; } async saveData(){} }
  class PluginSettingTab { constructor(app, plugin){ this.app=app; this.plugin=plugin; const el={ innerHTML:"", empty(){ this.innerHTML=""; }, createEl(){ return {}; } }; this.containerEl=el; } display(){} }
  class Setting { constructor(){} setName(){return this;} setDesc(){return this;} addText(f){ f({ setPlaceholder(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } addToggle(f){ f({ setValue(){return this;}, onChange(){return this;} }); return this; } addSlider(f){ f({ setLimits(){return this;}, setDynamicTooltip(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } }
  class Notice { constructor(){} }
  class TFile {}
  return { Plugin, PluginSettingTab, Setting, Notice, TFile };
}, { virtual: true });

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

const manifest = { id:'obsidian-toc-generator', name:'TOC', version:'0' };

const buildWithDynamicTransform = async (impl) => {
  jest.resetModules();
  const path = require('path');
  const abs = path.join('/tmp/vault','.obsidian','plugins','obsidian-toc-generator','src','Transform.js');
  jest.doMock('fs', () => ({ existsSync: jest.fn(() => true) }), { virtual: true });
  jest.doMock(abs, () => impl, { virtual: true });
  let PluginCtor;
  jest.isolateModules(() => { PluginCtor = require('../../main.js'); });
  const app = appFactory();
  const plugin = new PluginCtor(app, manifest);
  jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });
  await plugin.onload();
  return { plugin, app, abs };
};

describe('main.js dynamic transform path', () => {
  it('loads transform from plugin dir', async () => {
    const { plugin } = await buildWithDynamicTransform({ transform: (s)=>s+'\nZ' });
    expect(typeof plugin._transform).toBe('function');
  });

  it('passes basename to transform', async () => {
    let seen;
    const { plugin, app } = await buildWithDynamicTransform({ transform: (s, base)=>{ seen=base; return s+'\nZ'; } });
    const { TFile } = require('obsidian');
    const file = Object.assign(new TFile(), { path:'x/y/dyn.md', basename:'dyn', extension:'md' });
    app.vault.read.mockResolvedValueOnce('');
    await plugin.processFile(file);
    expect(seen).toBe('dyn');
  });

  it('writes with dynamic transform', async () => {
    const { plugin, app } = await buildWithDynamicTransform({ transform: (s)=>s+'\nZ' });
    const { TFile } = require('obsidian');
    const file = Object.assign(new TFile(), { path:'d.md', basename:'d', extension:'md' });
    app.vault.read.mockResolvedValueOnce('');
    await plugin.processFile(file);
    expect(app.vault.modify).toHaveBeenCalledTimes(1);
  });
});
