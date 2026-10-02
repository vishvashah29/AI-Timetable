const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const seed = [
  {id:1,name:"DBMS",exam:datePlus(2),prep:70,difficulty:4,weightage:30,minutes:60},
  {id:2,name:"Java",exam:datePlus(5),prep:40,difficulty:3,weightage:25,minutes:40},
  {id:3,name:"Mathematics",exam:datePlus(8),prep:20,difficulty:5,weightage:20,minutes:20},
  {id:4,name:"Computer Networks",exam:datePlus(12),prep:55,difficulty:3,weightage:15,minutes:0}
];
let subjects = JSON.parse(localStorage.getItem("smartstudy_subjects") || "null") || seed;
let sessions = JSON.parse(localStorage.getItem("smartstudy_sessions") || "[]");
let availableMinutes = Number(localStorage.getItem("smartstudy_minutes") || 120);
let timerSeconds = 25*60, timerId = null;

function datePlus(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function daysLeft(date){ const a=new Date(); a.setHours(0,0,0,0); const b=new Date(date+"T00:00:00"); return Math.max(0,Math.ceil((b-a)/86400000)); }
function score(s){
  const days=Math.max(1,daysLeft(s.exam));
  const urgency=Math.min(100,100/days*10); // 10-day horizon normalization
  const gap=100-s.prep;
  const difficulty=(s.difficulty/5)*100;
  const weight=Math.min(100,s.weightage);
  return Math.round(0.40*urgency + 0.30*gap + 0.15*difficulty + 0.10*weight + 0.05*Math.min(100, days>=7?0:100-days*14));
}
function ranked(){ return subjects.map(s=>({...s,score:score(s)})).sort((a,b)=>b.score-a.score); }
function persist(){localStorage.setItem("smartstudy_subjects",JSON.stringify(subjects));localStorage.setItem("smartstudy_sessions",JSON.stringify(sessions));}
function avgPrep(){return subjects.length?Math.round(subjects.reduce((a,s)=>a+s.prep,0)/subjects.length):0;}
function formatDate(x){return new Date(x+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short"});}

function render(){
  const r=ranked(), top=r[0];
  $("#statSubjects").textContent=subjects.length;
  $("#statPrep").textContent=avgPrep()+"%";
  $("#statTime").textContent=availableMinutes+"m";
  $("#statPriority").textContent=top?.name||"—";
  $("#statPriorityScore").textContent=top?`priority score ${top.score}`:"priority score —";
  $("#focusSubject").textContent=top?.name||"Add a subject";
  $("#focusReason").textContent=top?`${daysLeft(top.exam)} days left • ${top.prep}% prepared`:"Add a subject to get started.";

  $("#priorityList").innerHTML = r.length ? r.map((s,i)=>`
    <div class="priority-item">
      <div class="rank">${i+1}</div>
      <div><h4>${esc(s.name)}</h4><small>${daysLeft(s.exam)} days left • ${s.prep}% prepared • difficulty ${s.difficulty}/5</small></div>
      <div><div class="score">${s.score}</div><span class="badge">${i===0?"Highest":i===1?"High":"Normal"}</span></div>
    </div>`).join("") : `<div class="empty">No subjects yet. Add your first subject.</div>`;

  const plan = makePlan(r,availableMinutes);
  $("#planList").innerHTML=plan.length?plan.map(x=>`<div class="plan-item"><strong>${esc(x.name)}</strong><span>${x.minutes} min</span></div>`).join(""):`<div class="empty">Your recommended plan will appear here.</div>`;

  $("#progressList").innerHTML=r.map(s=>`
    <div class="progress-row"><span>${esc(s.name)}</span><div class="bar"><i style="width:${s.prep}%"></i></div><b>${s.prep}%</b></div>`).join("") || `<div class="empty">No progress to show.</div>`;

  $("#subjectTable").innerHTML=subjects.map(s=>`<tr>
    <td><strong>${esc(s.name)}</strong></td><td>${formatDate(s.exam)}<br><small>${daysLeft(s.exam)} days</small></td>
    <td>${s.prep}%</td><td>${s.difficulty}/5</td><td>${s.weightage}%</td><td><b>${score(s)}</b></td>
    <td><button class="delete-btn" onclick="removeSubject(${s.id})">Delete</button></td>
  </tr>`).join("") || `<tr><td colspan="7">No subjects added.</td></tr>`;

  $("#timerSelect").innerHTML=subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("") || `<option>No subjects</option>`;
  $("#sessionList").innerHTML=sessions.length?sessions.slice().reverse().slice(0,8).map(s=>`
    <div class="session-item"><div><strong>${esc(s.subject)}</strong><br><span>${esc(s.topic||"Study session")} • ${s.date}</span></div><b>${s.duration}m</b></div>`).join(""):`<div class="empty">No study sessions yet.</div>`;
  persist();
}

function makePlan(r,total){
  if(!r.length||total<=0)return [];
  const weights=r.map(s=>Math.max(1,s.score)), sum=weights.reduce((a,b)=>a+b,0);
  let plan=r.map(s=>({...s,minutes:Math.max(5,Math.round(total*s.score/sum))}));
  let diff=total-plan.reduce((a,x)=>a+x.minutes,0);
  plan[0].minutes=Math.max(5,plan[0].minutes+diff);
  return plan.filter(x=>x.minutes>0);
}
function esc(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

$$(".nav-item").forEach(btn=>btn.onclick=()=>{
  $$(".nav-item").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  $$(".view").forEach(v=>v.classList.remove("active")); $("#"+btn.dataset.view+"View").classList.add("active");
  $("#pageTitle").textContent=btn.dataset.view==="dashboard"?"Good morning, Vishva 👋":btn.dataset.view==="subjects"?"Manage your subjects":"Your study sessions";
  $("#sidebar").classList.remove("open");
});
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#refreshBtn").onclick=()=>{render(); $("#refreshBtn").textContent="✓ Recalculated"; setTimeout(()=>$("#refreshBtn").textContent="↻ Recalculate",900);}
$("#addSubjectBtn").onclick=()=>$("#modal").classList.add("show");
$("#closeModal").onclick=$("#cancelModal").onclick=()=>$("#modal").classList.remove("show");

$("#subjectForm").onsubmit=e=>{
  e.preventDefault(); const f=new FormData(e.target);
  subjects.push({id:Date.now(),name:f.get("name"),exam:f.get("exam"),prep:Number(f.get("prep")),difficulty:Number(f.get("difficulty")),weightage:Number(f.get("weightage")),minutes:Number(f.get("minutes"))});
  e.target.reset(); $("#modal").classList.remove("show"); render();
};
window.removeSubject=id=>{subjects=subjects.filter(s=>s.id!==id);render();};

$("#startTopBtn").onclick=()=>{
  const top=ranked()[0]; if(!top)return;
  $("#timerSelect").value=top.id; $("#timerSubject").textContent=top.name;
  $$(".nav-item").find(x=>x.dataset.view==="sessions").click();
};
$("#timerSelect").onchange=()=>{const s=subjects.find(x=>x.id===$("#timerSelect").value);$("#timerSubject").textContent=s?.name||"Select a subject";};
$("#timerStart").onclick=()=>{
  if(timerId){clearInterval(timerId);timerId=null;$("#timerStart").textContent="Start";return;}
  $("#timerStart").textContent="Pause";
  timerId=setInterval(()=>{
    timerSeconds--; updateTimer();
    if(timerSeconds<=0){clearInterval(timerId);timerId=null;$("#timerStart").textContent="Start";saveSession(25);}
  },1000);
};
$("#timerReset").onclick=()=>{if(timerId)clearInterval(timerId);timerId=null;timerSeconds=25*60;updateTimer();$("#timerStart").textContent="Start";};
function updateTimer(){const m=String(Math.floor(timerSeconds/60)).padStart(2,"0"),s=String(timerSeconds%60).padStart(2,"0");$("#timer").textContent=`${m}:${s}`;}
function saveSession(duration){
  const subj=subjects.find(x=>x.id===$("#timerSelect").value); if(!subj)return;
  sessions.push({subject:subj.name,topic:$("#timerTopic").value,duration,date:new Date().toLocaleString()});
  subj.prep=Math.min(100,subj.prep+Math.max(1,Math.round(duration/10)));
  render();
}
render();
