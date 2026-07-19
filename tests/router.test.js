import assert from 'node:assert/strict';
import { defaultSettings, selectProvider } from '../build/src/services/router.js';
Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
let d=selectProvider({prompt:'apa status banjir',messages:[],settings:defaultSettings,demoMode:true});assert.equal(d.provider.id,'demo');assert.equal(d.simulated,true);
const settings=defaultSettings.map(p=>({...p,enabled:['openai','local'].includes(p.id)}));d=selectProvider({prompt:'gunakan lokal untuk privasi',messages:[],settings,demoMode:false});assert.equal(d.provider.id,'local');
Object.defineProperty(globalThis,'navigator',{value:{onLine:false},configurable:true});d=selectProvider({prompt:'hello',messages:[],settings,demoMode:false});assert.equal(d.provider.id,'demo');
console.log('AI Router tests passed');
