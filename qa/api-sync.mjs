import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const gh='D:/codexAI/.runtime/github-cli/gh.exe';
const git='D:/codexAI/.toolchains/git/cmd/git.exe';
const env={...process.env,GH_CONFIG_DIR:'D:/codexAI/.runtime/github-config'};
const REPO='yjj0339/duizuo', CWD='D:/codexAI/duizuo';
const api=(a,input)=>execFileSync(gh,['api',...a],{env,encoding:'utf8',maxBuffer:1<<26,input:input?JSON.stringify(input):undefined}).trim();
const gitOut=(a)=>execFileSync(git,a,{cwd:CWD,encoding:'utf8',maxBuffer:1<<26}).trim();
const remote=api(['repos/'+REPO+'/git/ref/heads/main','--jq','.object.sha']);
const baseTree=api(['repos/'+REPO+'/git/commits/'+remote,'--jq','.tree.sha']);
const rTree=JSON.parse(api(['repos/'+REPO+'/git/trees/'+baseTree+'?recursive=1'])).tree||[];
const rMap=new Map(rTree.filter(e=>e.type==='blob').map(e=>[e.path,e.sha]));
const lMap=new Map();
for(const line of gitOut(['ls-tree','-r','-z','HEAD']).split('\0').filter(Boolean)){
  const m=line.match(/^\S+\s+blob\s+(\S+)\s+(.*)$/);
  if(m) lMap.set(m[2], m[1]);
}
const entries=[];
for(const [path,sha] of lMap){
  if(rMap.get(path)===sha) continue;
  const blob=api(['repos/'+REPO+'/git/blobs','--method','POST','--input','-'],{content:readFileSync(CWD+'/'+path).toString('base64'),encoding:'base64'});
  entries.push({path,mode:'100644',type:'blob',sha:JSON.parse(blob).sha});
  console.log('  更新 '+path);
}
for(const path of rMap.keys()){ if(!lMap.has(path)){ entries.push({path,mode:'100644',type:'blob',sha:null}); console.log('  删除 '+path);} }
if(!entries.length){ console.log('已完全一致'); process.exit(0); }
const tree=JSON.parse(api(['repos/'+REPO+'/git/trees','--method','POST','--input','-' ],{base_tree:baseTree,tree:entries})).sha;
const commit=JSON.parse(api(['repos/'+REPO+'/git/commits','--method','POST','--input','-'],{message:'chore: align working tree with the published state',tree,parents:[remote]})).sha;
api(['repos/'+REPO+'/git/refs/heads/main','--method','PATCH','--input','-'],{sha:commit,force:false});
console.log('✔ 远端已对齐 -> '+commit.slice(0,10));
