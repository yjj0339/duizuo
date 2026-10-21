import {decide,interval} from './strategies.js';
let brain={},last=0,key='';
self.onmessage=({data})=>{if(data.key!==key){key=data.key;brain=data.brain||{};last=0;}let action=null;try{const observe=['memory','simon','reaction','rps'].includes(data.id);if(observe||data.now-last>=interval(data.id,data.level)){const a=decide(data.id,data.view,data.player,brain,data.level,data.now);if(a&&data.now-last>=interval(data.id,data.level)){action=a;last=data.now;}}self.postMessage({key:data.key,action,brain});}catch(e){self.postMessage({key:data.key,error:e.message});}};
