const STORAGE_KEY = "minhaCasaOrganizada.v1";
const ROOMS = ["Cozinha","Banheiro","Quartos","Sala","Lavanderia","Garagem","Quintal","Escritório"];
const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const todayKey = () => localDateKey(new Date());
function localDateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function dateLabel(key){const d=new Date(`${key}T12:00:00`);return d.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});}
function makeId(){return "t"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function starterTasks(){
 const out=[];
 const add=(name,minutes,type,room,day=null)=>out.push({id:makeId(),name,minutes,type,room,day});
 [["Arrumar as camas",4,"Quartos"],["Recolher objetos fora do lugar",5,"Sala"],["Lavar a louça e limpar a pia",7,"Cozinha"],["Limpar as superfícies da cozinha",5,"Cozinha"],["Varrer ou aspirar áreas de maior uso",6,"Sala"],["Fazer uma arrumação final",3,"Sala"]].forEach(x=>add(x[0],x[1],"daily",x[2]));
 const weekly={
 "Segunda":[["Tirar o pó dos móveis",10,"Sala"],["Organizar a sala",10,"Sala"]],
 "Terça":[["Limpar banheiros",15,"Banheiro"],["Trocar toalhas",5,"Banheiro"]],
 "Quarta":[["Limpar espelhos e superfícies",10,"Quartos"],["Limpar portas e interruptores",10,"Sala"]],
 "Quinta":[["Limpar a cozinha com mais cuidado",15,"Cozinha"],["Conferir a geladeira",5,"Cozinha"]],
 "Sexta":[["Aspirar e limpar pisos",20,"Sala"]],
 "Sábado":[["Trocar roupa de cama",10,"Quartos"],["Organizar uma área da casa",15,"Escritório"]],
 "Domingo":[["Revisar a semana",5,"Sala"],["Preparar a rotina seguinte",5,"Cozinha"]]
 };
 Object.entries(weekly).forEach(([day,list])=>list.forEach(x=>add(x[0],x[1],"weekly",x[2],day)));
 [["Limpar janelas",15,"Sala"],["Limpar rodapés",10,"Sala"],["Organizar uma gaveta",15,"Quartos"],["Limpar armários por fora",10,"Cozinha"],["Revisar produtos de limpeza",10,"Lavanderia"],["Limpar ventiladores",15,"Quartos"],["Organizar documentos",15,"Escritório"],["Limpar embaixo dos móveis",15,"Sala"],["Varrer a garagem",15,"Garagem"],["Organizar o quintal",15,"Quintal"]].forEach(x=>add(x[0],x[1],"rotating",x[2]));
 return out;
}
function freshState(){return {tasks:starterTasks(),checks:{},history:{},rooms:ROOMS,createdAt:new Date().toISOString()};}
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));if(x&&Array.isArray(x.tasks)&&x.checks&&x.history)return x;}catch(e){}return freshState();}
let state=loadState(), currentView="hoje", currentDay=DAYS[(new Date().getDay()+6)%7], currentRoom=ROOMS[0], deferredInstallPrompt=null;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function checkedToday(id){return !!(state.checks[todayKey()]||{})[id];}
function setChecked(id,checked){const key=todayKey();state.checks[key]=state.checks[key]||{};if(checked)state.checks[key][id]=true;else delete state.checks[key][id];state.history[key]=summarizeDay(key);save();render();}
function tasksFor(type){return state.tasks.filter(t=>t.type===type);}
function summarizeDay(key){const checks=state.checks[key]||{};const ids=Object.keys(checks).filter(id=>checks[id]);return {completed:ids.length,ids,updatedAt:new Date().toISOString()};}
function currentDayTasks(){return state.tasks.filter(t=>t.type==="weekly"&&t.day===currentDay);}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function taskCard(t){const done=checkedToday(t.id);return `<article class="task-card ${done?"done":""}"><input class="task-check" type="checkbox" aria-label="Concluir ${esc(t.name)}" data-check="${t.id}" ${done?"checked":""}><div class="task-main"><div class="task-name">${esc(t.name)}</div><div class="task-meta">${t.minutes} min · ${esc(t.room||"Casa")}</div></div><div class="task-actions"><button class="icon-button" data-edit="${t.id}" aria-label="Editar tarefa">✎</button></div></article>`;}
function renderList(target,tasks,emptyText){$(target).innerHTML=tasks.length?tasks.map(taskCard).join(""):`<div class="empty">${emptyText}</div>`;}
function renderToday(){const tasks=tasksFor("daily");renderList("daily-list",tasks,"Nenhuma tarefa diária. Adicione uma na seção Cômodos.");const done=tasks.filter(t=>checkedToday(t.id)).length;const pct=tasks.length?Math.round(done/tasks.length*100):0;$("daily-count").textContent=`${done}/${tasks.length} feitas`;$("daily-bar").style.width=pct+"%";$("hero-percent").textContent=pct+"%";$("hero-progress").style.background=`conic-gradient(var(--green) ${pct*3.6}deg,#cbd9c7 0deg)`;}
function renderWeekly(){ $("day-picker").innerHTML=DAYS.map(d=>`<button class="day-button ${d===currentDay?"active":""}" data-day="${d}">${d}</button>`).join("");renderList("weekly-list",currentDayTasks(),"Sem tarefas para este dia. Adicione uma tarefa usando o botão abaixo.");}
function renderRotating(){renderList("rotating-list",tasksFor("rotating"),"Sua lista rotativa está vazia. Adicione uma tarefa quando quiser.");}
function renderRooms(){ $("room-picker").innerHTML=ROOMS.map(r=>{const n=state.tasks.filter(t=>t.room===r).length;return `<button class="room-button ${r===currentRoom?"active":""}" data-room="${esc(r)}">${esc(r)}<span>${n} tarefa(s)</span></button>`}).join("");const tasks=state.tasks.filter(t=>t.room===currentRoom);$("room-tasks").innerHTML=`<h3>${esc(currentRoom)}</h3><div class="task-list">${tasks.length?tasks.map(taskCard).join(""):`<div class="empty">Nenhuma tarefa neste cômodo.</div>`}</div>`;}
function renderHistory(){const keys=new Set([...Object.keys(state.checks),...Object.keys(state.history)]);const rows=[...keys].sort((a,b)=>b.localeCompare(a)).map(key=>{const done=Object.keys(state.checks[key]||{}).filter(id=>state.checks[key][id]).length;const tasks=state.tasks.filter(t=>{const c=state.checks[key]||{};return c[t.id]});const total=tasks.length;return {key,done,total};});const active=rows.filter(r=>r.done>0);$("history-days").textContent=active.length;$("history-tasks").textContent=active.reduce((s,r)=>s+r.done,0);$("history-list").innerHTML=active.length?active.map(r=>`<div class="history-row"><div><strong>${esc(dateLabel(r.key))}</strong><br><span>${r.done} tarefa(s) concluída(s)</span></div><span>Dia registrado</span></div>`).join(""):`<div class="empty">Seu histórico aparecerá aqui quando você concluir tarefas.</div>`;}
function render(){ $("today-label").textContent=dateLabel(todayKey());renderToday();renderWeekly();renderRotating();renderRooms();renderHistory();document.querySelectorAll(".view").forEach(el=>el.classList.add("hidden"));$("view-"+currentView).classList.remove("hidden");document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));}
function openDialog({task=null,type="daily",day=currentDay,room=currentRoom}={}){const form=$("task-form");form.reset();$("task-id").value=task?.id||"";$("task-name").value=task?.name||"";$("task-minutes").value=task?.minutes||10;$("task-type").value=task?.type||type;$("task-room").innerHTML=ROOMS.map(r=>`<option ${r===(task?.room||room)?"selected":""}>${esc(r)}</option>`).join("");$("task-day").innerHTML=DAYS.map(d=>`<option ${d===(task?.day||day)?"selected":""}>${d}</option>`).join("");$("dialog-title").textContent=task?"Editar tarefa":"Nova tarefa";$("delete-task").classList.toggle("hidden",!task);updateDayField();$("task-dialog").showModal();}
function updateDayField(){const weekly=$("task-type").value==="weekly";$("task-day").classList.toggle("hidden",!weekly);$("day-label").classList.toggle("hidden",!weekly);}
document.addEventListener("click",e=>{const tab=e.target.closest("[data-view]");if(tab){currentView=tab.dataset.view;render();return;}const day=e.target.closest("[data-day]");if(day){currentDay=day.dataset.day;renderWeekly();return;}const room=e.target.closest("[data-room]");if(room){currentRoom=room.dataset.room;renderRooms();return;}const edit=e.target.closest("[data-edit]");if(edit){const task=state.tasks.find(t=>t.id===edit.dataset.edit);if(task)openDialog({task});}});
document.addEventListener("change",e=>{if(e.target.matches("[data-check]"))setChecked(e.target.dataset.check,e.target.checked);});
$("task-type").addEventListener("change",updateDayField);
$("add-weekly").addEventListener("click",()=>openDialog({type:"weekly",day:currentDay}));
$("add-rotating").addEventListener("click",()=>openDialog({type:"rotating"}));
$("add-room-task").addEventListener("click",()=>openDialog({type:"room",room:currentRoom}));
$("close-dialog").addEventListener("click",()=>$("task-dialog").close());
$("cancel-dialog").addEventListener("click",()=>$("task-dialog").close());
$("task-form").addEventListener("submit",e=>{e.preventDefault();const id=$("task-id").value;const task={id:id||makeId(),name:$("task-name").value.trim(),minutes:Math.max(1,Math.min(240,Number($("task-minutes").value)||10)),room:$("task-room").value,type:$("task-type").value,day:$("task-type").value==="weekly"?$("task-day").value:null};if(!task.name)return;const index=state.tasks.findIndex(t=>t.id===id);if(index>=0)state.tasks[index]=task;else state.tasks.push(task);if(task.type==="room")currentRoom=task.room;save();$("task-dialog").close();render();});
$("delete-task").addEventListener("click",()=>{const id=$("task-id").value;if(!id)return;if(confirm("Excluir esta tarefa? O registro histórico anterior será mantido, mas a tarefa deixará de aparecer nas listas.")){state.tasks=state.tasks.filter(t=>t.id!==id);save();$("task-dialog").close();render();}});
$("reset-day").addEventListener("click",()=>{if(confirm("Desmarcar todas as tarefas de hoje?")){state.checks[todayKey()]={};state.history[todayKey()]={completed:0,ids:[],updatedAt:new Date().toISOString()};save();render();}});
$("export-data").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="minha-casa-organizada-backup.json";a.click();URL.revokeObjectURL(url);});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("install-button").classList.remove("hidden");});
$("install-button").addEventListener("click",async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;}else{$("install-help").classList.remove("hidden");}});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();