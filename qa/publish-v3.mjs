// D:-only release helper. Uses Git Data API when Git HTTPS transport is unreliable.
// Updates a ref without force; remote edits outside the listed files are preserved.
import {execFileSync} from 'node:child_process';import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';import {join,relative} from 'node:path';import {createHash} from 'node:crypto';
const root='D:/codexAI/duizuo',gh='D:/codexAI/.runtime/github-cli/gh.exe',git='D:/codexAI/.toolchains/git/cmd/git.exe',repo='repos/yjj0339/duizuo',env={...process.env,GH_CONFIG_DIR:'D:/codexAI/.runtime/github-config',NO_PROXY:'api.github.com,github.com,raw.githubusercontent.com'},mode=process.argv[2]||'pages';
async function api(endpoint,method='GET',body){for(let i=0;i<3;i++){try{return JSON.parse(execFileSync(gh,['api',repo+'/'+endpoint,'--method',method,...(body?['--input','-']:[])],{env,cwd:root,encoding:'utf8',input:body?JSON.stringify(body):undefined,maxBuffer:64*1024*1024,timeout:90000}));}catch(e){if(i===2)throw e;await new Promise(r=>setTimeout(r,1500));}}}
function* walk(dir){for(const n of readdirSync(dir)){const p=join(dir,n);if(statSync(p).isDirectory())yield*walk(p);else yield p;}}
const branch=mode==='pages'?'gh-pages':'main',parent=(await api('git/ref/heads/'+branch)).object.sha,base=(await api('git/commits/'+parent)).tree.sha,old=(await api('git/trees/'+base+'?recursive=1')).tree.filter(e=>e.type==='blob'),oldMap=new Map(old.map(e=>[e.path,e.sha]));
const files=mode==='pages'?[...walk(root+'/dist')].map(p=>relative(root+'/dist',p).split('\\').join('/')):execFileSync(git,['ls-files','-m','-o','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const entries=[];
for(const path of files){const data=readFileSync(join(root,mode==='pages'?'dist':'',path)),sha=createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');if(oldMap.get(path)===sha)continue;const blob=await api('git/blobs','POST',{content:data.toString('base64'),encoding:'base64'});entries.push({path,mode:'100644',type:'blob',sha:blob.sha});console.log('Uploaded '+path);}
if(mode==='pages'){const keep=new Set(files);for(const e of old)if(!keep.has(e.path))entries.push({path:e.path,mode:'100644',type:'blob',sha:null});}
if(!entries.length){console.log('Remote already matches selected release files');process.exit(0);}
const tree=(await api('git/trees','POST',{base_tree:base,tree:entries})).sha,commit=(await api('git/commits','POST',{message:mode==='pages'?'Publish DUIZUO 3.0: 32 two-player games':'feat: expand DUIZUO to 32 games with sports, mode picker and legacy AI',tree,parents:[parent]})).sha;
await api('git/refs/heads/'+branch,'PATCH',{sha:commit,force:false});writeFileSync(root+'/runtime/'+branch+'-release-v3.json',JSON.stringify({branch,parent,tree,commit,files:entries.length},null,2));console.log('Published '+branch+' '+commit);
if(mode==='pages')console.log('Pages rebuild: '+(await api('pages/builds','POST')).status);
