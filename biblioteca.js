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
['Previdenciário',/previdenci/]];
['Previdenciário',/previdenci/],
['Financeiro',/financeiro/]];
var MN=MATS.map(function(m){return m[0]}).concat('Sem matéria');
function mt(s){var n=norm(s);for(var i=0;i<MATS.length;i++)if(MATS[i][1].test(n))return MATS[i][0];return 'Sem matéria'}
function tp(s){var n=norm(s);if(/simulad/.test(n))return 'Simulado';if(/mapa/.test(n))return 'Mapa mental';if(/questo|questao|banco/.test(n))return 'Questões';if(/apostila|material|resumo/.test(n))return 'Apostila';return ''}

var st=document.createElement('style');
st.textContent='#matSetup,#matView{display:none!important}.seg{display:flex;gap:6px;margin:0 0 12px}.seg .btn{flex:1;background:var(--panel);color:var(--ink);border-color:var(--line)}.seg .btn.on{background:var(--green);color:var(--panel);border-color:var(--green)}.fr{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}.fr select{flex:1;min-width:120px;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink)}';
document.head.appendChild(st);
var f0=document.getElementById('matFrame');if(f0)f0.remove();
var box=el('div');root.appendChild(box);

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
rs.forEach(function(r){var k=seg==='Simulados'?'Simulados':r.materia;(g[k]=g[k]||[]).push(r)});
Object.keys(g).sort(function(a,b){return a.localeCompare(b,'pt')}).forEach(function(k){
var d=document.createElement('details');d.className='tools';d.style.marginTop='10px';
if(q||seg==='Simulados')d.open=true;
d.appendChild(el('summary','',k+' ('+g[k].length+')'));
g[k].sort(function(a,b){return a.tipo.localeCompare(b.tipo)||a.name.localeCompare(b.name,'pt',{numeric:true})}).forEach(function(r){
var row=el('div','event'),bd=el('div','event-body'),a=el('div','fr');
bd.appendChild(el('div','event-title',r.name.replace(/\.[^.]+$/,'')));
bd.appendChild(el('div','meta-text',r.tipo+' · '+(r.size/1048576).toFixed(1)+' MB'));
var o=el('button','btn','Abrir'),x=el('button','mini','🗑');
o.onclick=function(){var u=URL.createObjectURL(r.blob);if(!window.open(u,'_blank'))location.href=u};
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
var imp=el('div','quick'),b1=el('button','btn','📥 Importar arquivos'),b2=el('button','btn','📂 Importar pasta');
b1.onclick=function(){pick(false)};b2.onclick=function(){pick(true)};
imp.appendChild(b1);imp.appendChild(b2);box.appendChild(imp);
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
