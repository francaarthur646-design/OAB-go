(function(){
var root=document.getElementById('tab-mat');if(!root)return;
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function norm(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_\-.]+/g,' ')}

var MATS=[
['Processo Civil',/proc\w*\s*civil|processual\s*civil|\bcpc\b/],
['Processo Penal',/proc\w*\s*penal|processual\s*penal|\bcpp\b/],
['Processo do Trabalho',/proc\w*\s*(do\s*)?trabalho|processual\s*do\s*trabalho/],
['Ética',/etica|estatuto|eoab/],
['Constitucional',/constitucion|constituicao/],
['Tributário',/tributari/],
['Civil',/civil/],
['Penal',/penal/],
['Trabalho',/trabalh/],
['Administrativo',/administrativ/],
['Empresarial',/empresarial|comercial/],
['Consumidor',/consumidor|\bcdc\b/],
['Criança e Adolescente',/\beca\b|crianca|adolescente/],
['Ambiental',/ambiental/],
['Direitos Humanos',/direitos?\s*humanos|\bdh\b/],
['Eleitoral',/eleitoral/],
['Internacional',/internacional/],
['Filosofia do Direito',/filosofia/],
['Previdenciário',/previdenci/],
['Financeiro',/financeiro/],
['CEISC',/ceisc/],
['OAB',/oab/]];
var MN=MATS.map(function(m){return m[0]}).concat('Sem matéria');
function mt(s){var n=norm(s);for(var i=0;i<MATS.length;i++)if(MATS[i][1].test(n))return MATS[i][0];return 'Sem matéria'}
function tp(s){var n=norm(s);if(/simulad/.test(n))return 'Simulado';if(/mapa/.test(n))return 'Mapa mental';if(/questo|questao|banco/.test(n))return 'Questões';if(/apostila|material|resumo/.test(n))return 'Apostila';return ''}

var st=document.createElement('style');
st.textContent='#matSetup,#matView{display:none!important}.seg{display:flex;gap:6px;margin:0 0 12px}.seg .btn{flex:1;background:var(--panel);color:var(--ink);border-color:var(--line)}.seg .btn.on{background:var(--green);color:var(--panel);border-color:var(--green)}.fr{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}.fr select{flex:1;min-width:120px;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}'+
'.rd{position:fixed;inset:0;z-index:60;background:var(--bg);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px)}'+
'.rd-bar{display:flex;align-items:center;gap:6px;padding:6px 8px;background:var(--panel);border-bottom:1px solid var(--line)}'+
'.rd-bar button{min-width:44px;min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font-size:1.1rem}'+
'.rd-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.8rem;color:var(--ink-soft)}'+
'.rd-sc{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:8px 0 calc(24px + env(safe-area-inset-bottom,0px))}'+
'.rd-p{margin:0 auto 8px;background:var(--panel);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:.8rem;contain:layout paint}'+
'.rd-p canvas{display:block}';
document.head.appendChild(st);
var f0=document.getElementById('matFrame');if(f0)f0.remove();
var box=el('div');root.appendChild(box);

/* ---------- Leitor de PDF (PDF.js, só as páginas próximas da tela) ---------- */
var PJ='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/',pjP=null;
function loadPdfJs(){
if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
return pjP||(pjP=new Promise(function(ok,no){
var s=document.createElement('script');s.src=PJ+'pdf.min.js';
s.onload=function(){pdfjsLib.GlobalWorkerOptions.workerSrc=PJ+'pdf.worker.min.js';ok(pdfjsLib)};
s.onerror=function(){pjP=null;no()};document.head.appendChild(s);
}));
}
function nativeOpen(r){var u=URL.createObjectURL(r.blob);if(!window.open(u,'_blank'))location.href=u}
function openRec(r){
if(!/pdf/i.test(r.type||'')&&!/\.pdf$/i.test(r.name)){nativeOpen(r);return}
var url=URL.createObjectURL(r.blob);
loadPdfJs().then(function(lib){return lib.getDocument({url:url}).promise})
.then(function(doc){reader(r,doc,url)})
.catch(function(){URL.revokeObjectURL(url);nativeOpen(r)});
}
function reader(r,doc,url){
var N=doc.numPages,key='oab_pg_'+r.id,zoom=1,ratio=1.414,GAP=8,pages=[],queue=[],busy=false,closed=false,cur=1,tick=0;
var ov=el('div','rd'),bar=el('div','rd-bar'),sc=el('div','rd-sc');
var bx=el('button','','✕'),ttl=el('div','rd-t',r.name.replace(/\.[^.]+$/,'')),pg=el('button','',''),bm=el('button','','−'),bp=el('button','','+');
pg.style.minWidth='84px';pg.style.fontSize='.85rem';
[bx,ttl,pg,bm,bp].forEach(function(x){bar.appendChild(x)});ov.appendChild(bar);ov.appendChild(sc);document.body.appendChild(ov);
history.pushState({rd:1},'');
function pageW(){return Math.max(120,(sc.clientWidth-16)*zoom)}
function setPg(n){cur=Math.min(N,Math.max(1,n));pg.textContent=cur+' / '+N}
function drop(p){p.vis=false;p.done=0;if(p.c){p.c.width=p.c.height=0;if(p.c.parentNode)p.c.parentNode.removeChild(p.c)}}
function want(p){if(p.done||p.q)return;p.q=1;queue.push(p);pump()}
function pump(){
if(busy||closed||!queue.length)return;
var p=queue.shift();p.q=0;
if(!p.vis||p.done){pump();return}
busy=true;var t=tick;
doc.getPage(p.n).then(function(page){
var w=p.w,s=w/page.getViewport({scale:1}).width,d=Math.min(window.devicePixelRatio||1,2),vp=page.getViewport({scale:s*d});
var c=p.c||(p.c=document.createElement('canvas'));c.width=vp.width;c.height=vp.height;
c.style.width=w+'px';c.style.height=(vp.height/d)+'px';
return page.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp}).promise.then(function(){
if(t!==tick||closed||!p.vis){drop(p);return}
p.style.height=c.style.height;p.textContent='';p.appendChild(c);p.done=1;
});
}).catch(function(){}).then(function(){busy=false;pump()});
}
var io=new IntersectionObserver(function(es){es.forEach(function(e){var p=e.target;if(e.isIntersecting){p.vis=true;want(p)}else drop(p)})},{root:sc,rootMargin:'150% 0px'});
function layout(){
tick++;var w=pageW();
pages.forEach(function(p){p.w=w;p.style.width=w+'px';p.style.height=(w*ratio)+'px';p.done=0;if(p.c){p.c.width=p.c.height=0;if(p.c.parentNode)p.c.parentNode.removeChild(p.c)}if(!p.textContent)p.textContent=p.n});
queue=[];pages.forEach(function(p){if(p.vis)want(p)});
}
function hOf(){var p=pages[0];return p.offsetHeight+GAP}
function goto(n){sc.scrollTop=(Math.min(N,Math.max(1,n))-1)*hOf()}
for(var i=1;i<=N;i++){var p=el('div','rd-p',i);p.n=i;pages.push(p);sc.appendChild(p)}
doc.getPage(1).then(function(pg1){var v=pg1.getViewport({scale:1});ratio=v.height/v.width;layout();
var sv=0;try{sv=+localStorage.getItem(key)||0}catch(e){}
if(sv>1)goto(sv);setPg(sv||1);pages.forEach(function(p){io.observe(p)});
});
var raf=0;
sc.addEventListener('scroll',function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;setPg(Math.floor((sc.scrollTop+sc.clientHeight/3)/hOf())+1)})},{passive:true});
function zoomTo(z){var n=cur;zoom=Math.min(3,Math.max(.6,z));layout();goto(n)}
bm.onclick=function(){zoomTo(zoom-.25)};bp.onclick=function(){zoomTo(zoom+.25)};
pg.onclick=function(){var v=parseInt(prompt('Ir para a página (1 a '+N+'):',cur),10);if(v>0)goto(v)};
var rt=0;function onRs(){clearTimeout(rt);rt=setTimeout(function(){var n=cur;layout();goto(n)},200)}
window.addEventListener('resize',onRs);
function close(fromPop){
if(closed)return;closed=true;
try{localStorage.setItem(key,cur)}catch(e){}
io.disconnect();window.removeEventListener('resize',onRs);window.removeEventListener('popstate',onPop);
pages.forEach(function(p){if(p.c)p.c.width=p.c.height=0});
ov.remove();doc.destroy();URL.revokeObjectURL(url);
if(!fromPop&&history.state&&history.state.rd)history.back();
}
function onPop(){close(true)}
window.addEventListener('popstate',onPop);
bx.onclick=function(){close(false)};
}

/* ---------- Armazenamento no aparelho ---------- */
var db,recs=[],seg='Materiais',q='',pend=null,lst;
function openDb(cb){
if(!window.indexedDB){box.textContent='Este navegador não permite guardar arquivos no aparelho.';return}
var r=indexedDB.open('rota_oab_lib',1);
r.onupgradeneeded=function(){r.result.createObjectStore('f',{keyPath:'id',autoIncrement:true})};
r.onsuccess=function(){db=r.result;cb()};
r.onerror=function(){box.textContent='Não foi possível abrir o armazenamento do aparelho.'};
}
function load(){
var o=[],c=db.transaction('f').objectStore('f').openCursor();
c.onsuccess=function(){var x=c.result;if(x){o.push(x.value);x.continue()}else{recs=o;render()}};
}
function del(id){var t=db.transaction('f','readwrite');t.objectStore('f').delete(id);t.oncomplete=load}

function exportBackup(btn){
btn.disabled=true;btn.textContent='Preparando backup...';
Promise.all(recs.slice().map(function(r){
return new Promise(function(resolve,reject){
var rd=new FileReader();
rd.onload=function(){resolve({name:r.name,size:r.size,type:r.type,tipo:r.tipo,materia:r.materia,added:r.added,data:rd.result})};
rd.onerror=reject;rd.readAsDataURL(r.blob);
});
})).then(function(files){
var backup={app:'ROTA_OAB',version:1,createdAt:new Date().toISOString(),total:files.length,records:files};
var url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));
var a=document.createElement('a');a.href=url;a.download='backup-rota-oab-'+new Date().toISOString().slice(0,10)+'.json';
document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
btn.disabled=false;btn.textContent='⬇ Exportar backup';alert('Backup exportado com sucesso!');
}).catch(function(err){console.error(err);btn.disabled=false;btn.textContent='⬇ Exportar backup';alert('Erro ao gerar backup.')});
}

function importBackup(file){
if(!file)return;
var reader=new FileReader();
reader.onload=function(){
try{
var backup=JSON.parse(reader.result);
if(backup.app!=='ROTA_OAB'||backup.version!==1||!Array.isArray(backup.records))throw new Error('Arquivo de backup inválido.');
if(!confirm('Foram encontrados '+backup.records.length+' documentos. Deseja restaurar a biblioteca? Os documentos existentes serão preservados.'))return;
var existing={};
recs.forEach(function(r){existing[r.name+'|'+r.size+'|'+r.tipo+'|'+r.materia]=true});
var items=backup.records.filter(function(r){var k=r.name+'|'+r.size+'|'+r.tipo+'|'+r.materia;if(existing[k])return false;existing[k]=true;return true});
var t=db.transaction('f','readwrite'),store=t.objectStore('f');
items.forEach(function(r){
var parts=r.data.split(','),bin=atob(parts[1]),bytes=new Uint8Array(bin.length);
for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
store.add({name:r.name,size:r.size,type:r.type,tipo:r.tipo,materia:r.materia,blob:new Blob([bytes],{type:r.type||'application/octet-stream'}),added:r.added||Date.now()});
});
t.oncomplete=function(){alert('Restauração concluída! '+items.length+' documento(s) adicionado(s).');load()};
t.onerror=function(){alert('Erro ao restaurar. Verifique o espaço disponível.')};
}catch(err){console.error(err);alert('Não foi possível ler o backup. Verifique se o arquivo é válido.')}
};
reader.onerror=function(){alert('Erro ao ler o arquivo de backup.')};
reader.readAsText(file);
}
function pick(dir){
var i=document.createElement('input');i.type='file';i.multiple=true;if(dir)i.webkitdirectory=true;
i.onchange=function(){
var fs=[].slice.call(i.files).filter(function(f){return !/^\.|^thumbs\.db$/i.test(f.name)});
if(!fs.length)return;
pend=fs.map(function(f){
var p=f.webkitRelativePath||f.name,m=mt(f.name);
if(m==='Sem matéria')m=mt(p);
return{f:f,tipo:tp(f.name)||tp(p)||'Apostila',materia:m};
});
render();
};
i.click();
}
function sel(opts,v,fn){var s=document.createElement('select');opts.forEach(function(o){s.appendChild(new Option(o,o))});s.value=v;s.onchange=function(){fn(s.value)};return s}

function save(){
var seen={};recs.forEach(function(r){seen[r.name+'|'+r.size+'|'+r.tipo+'|'+r.materia]=1});
var t=db.transaction('f','readwrite'),s=t.objectStore('f');
pend.forEach(function(p){
var k=p.f.name+'|'+p.f.size+'|'+p.tipo+'|'+p.materia;
if(seen[k])return;seen[k]=1;
s.add({name:p.f.name,size:p.f.size,type:p.f.type,tipo:p.tipo,materia:p.materia,blob:p.f,added:Date.now()});
});
t.oncomplete=function(){pend=null;load()};
t.onerror=function(){alert('Não foi possível salvar. Verifique o espaço livre no aparelho.');pend=null;load()};
}

function review(){
box.appendChild(el('div','event-title',pend.length+' arquivo(s) para importar'));
var h=el('div','meta-text','Confira o tipo e a matéria detectados e corrija o que precisar.');h.style.margin='4px 0 10px';box.appendChild(h);
pend.forEach(function(p){
var row=el('div','event'),bd=el('div','event-body'),a=el('div','fr');
bd.appendChild(el('div','event-title',p.f.name));
a.appendChild(sel(['Apostila','Mapa mental','Questões','Simulado'],p.tipo,function(v){p.tipo=v}));
a.appendChild(sel(MN,p.materia,function(v){p.materia=v}));
bd.appendChild(a);row.appendChild(bd);box.appendChild(row);
});
var r=el('div','row'),ok=el('button','btn','Salvar no aparelho'),no=el('button','btn','Cancelar');
ok.onclick=save;no.onclick=function(){pend=null;render()};
r.appendChild(ok);r.appendChild(no);box.appendChild(r);
}

function drawList(){
lst.innerHTML='';
var tipos=seg==='Materiais'?['Apostila','Mapa mental']:seg==='Questões'?['Questões']:['Simulado'];
var rs=recs.filter(function(r){return tipos.indexOf(r.tipo)>=0&&(!q||norm(r.name).indexOf(norm(q))>=0)});
if(!rs.length){lst.appendChild(el('div','empty-state','Nenhum arquivo aqui ainda. Use os botões de importar.'));return}
var g={};
rs.forEach(function(r){var k=r.materia||'Sem matéria';(g[k]=g[k]||[]).push(r)});
Object.keys(g).sort(function(a,b){return a.localeCompare(b,'pt')}).forEach(function(k){
var d=document.createElement('details');d.className='tools';d.style.marginTop='10px';
if(q||seg==='Simulados')d.open=true;
d.appendChild(el('summary','',k+' ('+g[k].length+')'));
g[k].sort(function(a,b){return a.tipo.localeCompare(b.tipo)||a.name.localeCompare(b.name,'pt',{numeric:true})}).forEach(function(r){
var row=el('div','event'),bd=el('div','event-body'),a=el('div','fr');
bd.appendChild(el('div','event-title',r.name.replace(/\.[^.]+$/,'')));
bd.appendChild(el('div','meta-text',r.tipo+' · '+(r.size/1048576).toFixed(1)+' MB'));
var o=el('button','btn','Abrir'),x=el('button','mini','🗑');
o.onclick=function(){openRec(r)};
x.onclick=function(){if(confirm('Excluir este arquivo do aparelho?'))del(r.id)};
a.appendChild(o);a.appendChild(x);bd.appendChild(a);row.appendChild(bd);d.appendChild(row);
});
lst.appendChild(d);
});
}

function render(){
box.innerHTML='';
if(pend){review();return}
var s=el('div','seg');
['Materiais','Questões','Simulados'].forEach(function(n){
var b=el('button','btn'+(n===seg?' on':''),n);b.onclick=function(){seg=n;render()};s.appendChild(b);
});
box.appendChild(s);
var imp=el('div','quick'),
b1=el('button','btn','📥 Importar arquivos'),
b2=el('button','btn','📂 Importar pasta'),
b3=el('button','btn','⬇ Exportar backup'),
b4=el('button','btn','⬆ Restaurar backup');
b1.onclick=function(){pick(false)};
b2.onclick=function(){pick(true)};
b3.onclick=function(){exportBackup(b3)};
b4.onclick=function(){
var input=document.createElement('input');input.type='file';input.accept='.json,application/json';
input.onchange=function(){if(input.files.length)importBackup(input.files[0])};
input.click();
};
imp.appendChild(b1);imp.appendChild(b2);imp.appendChild(b3);imp.appendChild(b4);
box.appendChild(imp);
var inp=el('input');inp.type='text';inp.placeholder='Buscar pelo nome...';inp.value=q;
inp.style.cssText='width:100%;padding:9px 12px;margin-bottom:6px;border-radius:8px;border:1px solid var(--line);background:var(--panel);color:var(--ink)';
inp.oninput=function(){q=inp.value;drawList()};
box.appendChild(inp);
lst=el('div');box.appendChild(lst);
var n=el('div','meta-text','Os arquivos ficam guardados só neste aparelho e não entram no backup de texto.');n.style.marginTop='14px';box.appendChild(n);
drawList();
}

openDb(load);
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
})();
