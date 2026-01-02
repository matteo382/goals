// ========== Confettis ==========
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let confettis = [];

function Confetti() {
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height - canvas.height;
  this.size = Math.random() * 6 + 4;
  this.speedY = Math.random() * 3 + 2;
  this.speedX = Math.random() * 2 - 1;
  this.color = `hsl(${Math.random()*360}, 100%, 50%)`;
}

function createConfetti(amount = 50) { for(let i=0;i<amount;i++) confettis.push(new Confetti()); }
function updateConfetti(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  confettis.forEach((c,i)=>{
    c.y += c.speedY;
    c.x += c.speedX;
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x,c.y,c.size,c.size);
    if(c.y>canvas.height) confettis.splice(i,1);
  });
  requestAnimationFrame(updateConfetti);
}
updateConfetti();

// ========== Gestion objectifs ==========
function getCurrentWeekNumber(){ const now=new Date(); const onejan=new Date(now.getFullYear(),0,1); return Math.ceil((((now-onejan)/86400000)+onejan.getDay()+1)/7);}
function getCurrentMonth(){ return new Date().getMonth()+1; }

let goals = JSON.parse(localStorage.getItem("goals"))||[];

function resetGoals(){
  const currentWeek = getCurrentWeekNumber();
  const currentMonth = getCurrentMonth();
  goals.forEach(goal=>{
    if(!goal.lastUpdate) goal.lastUpdate={};
    switch(goal.period){
      case "Hebdomadaire":
        if(goal.lastUpdate.week!==currentWeek) goal.current=0;
        goal.lastUpdate.week=currentWeek; break;
      case "Bi-Hebdomadaire":
        if(!goal.lastUpdate.week) goal.lastUpdate.week=currentWeek;
        if(currentWeek>=goal.lastUpdate.week+2) goal.current=0;
        if(currentWeek>goal.lastUpdate.week) goal.lastUpdate.week=currentWeek;
        break;
      case "Mensuel":
        if(goal.lastUpdate.month!==currentMonth) goal.current=0;
        goal.lastUpdate.month=currentMonth; break;
      case "Bi-Mensuel":
        if(!goal.lastUpdate.month) goal.lastUpdate.month=currentMonth;
        if(currentMonth>=goal.lastUpdate.month+2) goal.current=0;
        if(currentMonth>goal.lastUpdate.month) goal.lastUpdate.month=currentMonth; break;
      case "Annuel": break;
    }
  });
  localStorage.setItem("goals",JSON.stringify(goals));
}

// ========== Affichage ==========
const container = document.getElementById("goals-container");
function checkGoalCompletion(goal){ return goal.current>=goal.target; }

function createCard(goal,index){
  const card=document.createElement("div");
  card.className="card"; card.setAttribute("data-period",goal.period);
  if(checkGoalCompletion(goal)) card.classList.add("completed");

  const h2=document.createElement("h2"); h2.textContent=goal.name; card.appendChild(h2);

  // Progress circle + couleur dynamique
  const progressContainer=document.createElement("div"); progressContainer.className="progress-container";
  const progressCircle=document.createElement("div"); progressCircle.className="progress-circle";
  let progressPercent=Math.min(goal.current/goal.target,1)*100;
  let color=`hsl(${120*goal.current/goal.target},100%,50%)`;
  progressCircle.style.background=`conic-gradient(${color} ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`;
  progressCircle.textContent=goal.current;
  progressContainer.appendChild(progressCircle); card.appendChild(progressContainer);

  const periodP=document.createElement("p"); periodP.className="period"; periodP.textContent=goal.period; card.appendChild(periodP);

  // +1
  const btn=document.createElement("button"); btn.textContent="+1";
  btn.addEventListener("click",()=>{
    if(goal.current<goal.target){
      goal.current++;
      progressPercent=Math.min(goal.current/goal.target,1)*100;
      color=`hsl(${120*goal.current/goal.target},100%,50%)`;
      progressCircle.style.background=`conic-gradient(${color} ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`;
      progressCircle.textContent=goal.current;
      if(checkGoalCompletion(goal)){
        card.classList.add("completed");
        const audio=document.getElementById("success-sound"); audio.currentTime=0; audio.play();
        createConfetti(80);
        card.style.transform="scale(1.1)"; setTimeout(()=>card.style.transform="scale(1)",300);
      }
      btn.style.transform="scale(1.2)"; btn.style.boxShadow="0 0 10px rgba(255,255,255,0.7)";
      setTimeout(()=>{btn.style.transform="scale(1)"; btn.style.boxShadow="none";},150);
      localStorage.setItem("goals",JSON.stringify(goals));
    }
  });
  card.appendChild(btn);

  // Swipe pour supprimer
  let startX=null;
  card.addEventListener("touchstart", e=>{ startX=e.touches[0].clientX; });
  card.addEventListener("touchmove", e=>{
    if(startX!==null){
      const deltaX=e.touches[0].clientX-startX;
      card.style.transform=`translateX(${deltaX}px)`;
      card.style.opacity=`${1-Math.abs(deltaX)/200}`;
    }
  });
  card.addEventListener("touchend", e=>{
    if(startX!==null){
      const deltaX=e.changedTouches[0].clientX-startX;
      if(Math.abs(deltaX)>100){ goals.splice(index,1); localStorage.setItem("goals",JSON.stringify(goals)); renderGoals(); }
      else{ card.style.transform="translateX(0)"; card.style.opacity="1"; }
      startX=null;
    }
  });

  // Supprimer bouton classique
  const btnDelete=document.createElement("button"); btnDelete.textContent="Supprimer";
  btnDelete.addEventListener("click",()=>{ goals.splice(index,1); localStorage.setItem("goals",JSON.stringify(goals)); renderGoals(); });
  card.appendChild(btnDelete);

  container.appendChild(card);
}

function renderGoals(){ container.innerHTML=""; goals.forEach((goal,index)=>createCard(goal,index)); }

// ========== Ajouter objectif ==========
document.getElementById("btn-add-goal").addEventListener("click",()=>{
  const name=document.getElementById("new-goal-name").value.trim();
  const target=parseInt(document.getElementById("new-goal-target").value);
  const period=document.getElementById("new-goal-period").value;
  if(name && target>0){
    const newGoal={name,current:0,target,period,lastUpdate:{}};
    goals.push(newGoal);
    localStorage.setItem("goals",JSON.stringify(goals));
    renderGoals();
    document.getElementById("new-goal-name").value="";
    document.getElementById("new-goal-target").value="";
    document.getElementById("new-goal-period").value="Hebdomadaire";
  }
});

// ========== Tri ==========
document.getElementById("sort-name").addEventListener("click",()=>{ goals.sort((a,b)=>a.name.localeCompare(b.name)); renderGoals(); });
document.getElementById("sort-progress").addEventListener("click",()=>{ goals.sort((a,b)=>(b.current/b.target)-(a.current/a.target)); renderGoals(); });
const periodOrder=["Annuel","Bi-Mensuel","Mensuel","Bi-Hebdomadaire","Hebdomadaire"];
document.getElementById("sort-period").addEventListener("click",()=>{ goals.sort((a,b)=>periodOrder.indexOf(a.period)-periodOrder.indexOf(b.period)); renderGoals(); });

// ========== Initialisation ==========
resetGoals(); renderGoals();
window.addEventListener("resize",()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; });