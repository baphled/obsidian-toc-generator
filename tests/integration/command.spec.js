// tests/integration/command.spec.js
jest.mock('obsidian', () => {
  class Plugin { constructor(app, manifest){ this.app=app; this.manifest=manifest; this.__commands=[]; } addSettingTab(t){ this.__settingTab=t; } registerEvent(e){ return e; } registerInterval(i){ return i; } addCommand(c){ this.__commands.push(c); return c; } async loadData(){ return {}; } async saveData(){} }
  class PluginSettingTab { constructor(app, plugin){ this.app=app; this.plugin=plugin; const el={ innerHTML:"", empty(){ this.innerHTML=""; }, createEl(){ return {}; } }; this.containerEl=el; } display(){} }
  class Setting { constructor(){ } setName(){return this;} setDesc(){return this;} addText(f){ f({ setPlaceholder(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } addToggle(f){ f({ setValue(){return this;}, onChange(){return this;} }); return this; } addSlider(f){ f({ setLimits(){return this;}, setDynamicTooltip(){return this;}, setValue(){return this;}, onChange(){return this;} }); return this; } }
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

describe('main.js command', () => {
  let app, plugin, TFileCtor;

  beforeEach(async () => {
    app = appFactory();
    plugin = new PluginCtor(app, { id:'obsidian-toc-generator', name:'TOC', version:'0.0.0' });
    jest.spyOn(plugin, 'loadData').mockResolvedValue({ debounce_ms: 0 });
    await plugin.onload();
    plugin._transform = (t)=>t+'\nX';
    TFileCtor = require('obsidian').TFile;
    app.vault.modify.mockClear();
  });

  it('registers the run-on-active command', () => {
    expect(plugin.__commands.some(c => c && c.id === 'mdnav-toc-run-on-active')).toBe(true);
  });

  it('run-on-active processes active markdown file', async () => {
    const file = Object.assign(new TFileCtor(), { path:'a.md', basename:'a', extension:'md' });
    app.workspace.getActiveFile = () => file;
    const cmd = plugin.__commands.find(c => c.id === 'mdnav-toc-run-on-active');
    await cmd.callback();
    expect(app.vault.modify).toHaveBeenCalledTimes(1);
  });

  it('run-on-active skips when no active file', async () => {
    app.workspace.getActiveFile = () => null;
    const cmd = plugin.__commands.find(c => c.id === 'mdnav-toc-run-on-active');
    await cmd.callback();
    expect(app.vault.modify).toHaveBeenCalledTimes(0);
  });

  it('run-on-active skips non-markdown file', async () => {
    const file = Object.assign(new TFileCtor(), { path:'a.txt', basename:'a', extension:'txt' });
    app.workspace.getActiveFile = () => file;
    const cmd = plugin.__commands.find(c => c.id === 'mdnav-toc-run-on-active');
    await cmd.callback();
    expect(app.vault.modify).toHaveBeenCalledTimes(0);
  });
});
