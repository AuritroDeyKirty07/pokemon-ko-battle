let poke1=null;
let poke2=null;

let hp1=0;
let hp2=0;
const maxHp = 255;


let back1="";
let back2="";

let score1=0;
let score2=0;

let ready1=false;
let ready2=false;

async function fetchData1() {

    const query=document.getElementById("searchInput1").value.trim().toLowerCase();
    if(poke1 && poke1 === poke2){
        document.getElementById("msg1").textContent="Choose different Pokemon";
        return;
     }

    try{

        const urlApi=await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

        if(!urlApi.ok){
            throw new Error("not found");
        }

        const data=await urlApi.json();

        function typeBonus(types){
            if(types.includes("fire")) return 10;
            if(types.includes("water")) return 8;
            if(types.includes("electric")) return 12;
            return 0;
         }
         const types = data.types.map(t=>t.type.name);
hp1 += typeBonus(types);

        poke1=data.name;
        hp1=data.stats[0].base_stat;

        const front=data.sprites.front_default;
        back1=data.sprites.back_default;

        const pokiImg=document.getElementById("pokiImg1");
        pokiImg.src=front;
        pokiImg.style.display="block";

        pokiImg.onmouseenter=()=>{ if(back1) pokiImg.src=back1 };
        pokiImg.onmouseleave=()=>{ pokiImg.src=front };
        const hpPercent1 = (hp1/maxHp)*100;
        document.getElementById("hpFill1").style.width = hpPercent1 + "%";
        document.getElementById("hp1").textContent = Math.floor(hpPercent1) + "/255";
        document.getElementById("name1").textContent=data.name.toUpperCase();
        ready1=true;


    }catch(e){
        document.getElementById("msg1").textContent="Invalid Pokemon";
    }
    activateFight();
}

async function fetchData2() {

    const query=document.getElementById("searchInput2").value.trim().toLowerCase();
    if(poke1 && poke1 === poke2){
        document.getElementById("msg1").textContent="Choose different Pokemon";
        return;
     }

     

    try{

        const urlApi=await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

        if(!urlApi.ok){
            throw new Error("not found");
        }

        const data=await urlApi.json();
        function typeBonus(types){
            if(types.includes("fire")) return 10;
            if(types.includes("water")) return 8;
            if(types.includes("electric")) return 12;
            return 0;
         }
         const types = data.types.map(t=>t.type.name);
hp2 += typeBonus(types);

        poke2=data.name;
        hp2=data.stats[0].base_stat;

        const front=data.sprites.front_default;
        back2=data.sprites.back_default;

        const pokiImg=document.getElementById("pokiImg2");
        pokiImg.src=front;
        pokiImg.style.display="block";

        pokiImg.onmouseenter=()=>{ if(back2) pokiImg.src=back2 };
        pokiImg.onmouseleave=()=>{ pokiImg.src=front };
        const hpPercent2= (hp2/maxHp)*100;
        document.getElementById("hpFill2").style.width = hpPercent2 + "%";
        document.getElementById("hp2").textContent = Math.floor(hpPercent2) + "/255";
        document.getElementById("name2").textContent=data.name.toUpperCase();
        ready2=true;


    }catch(e){
        document.getElementById("msg2").textContent="Invalid Pokemon";
    }
    activateFight();
}

function activateFight(){
    if(ready1 && ready2){
        document.getElementById("fightBtn").disabled=false;
    }
}

function calculateDamage(baseHp){
    return Math.floor((baseHp/12) + Math.random()*20);
}

function checkBattle(){

    document.getElementById("searchInput1").disabled = true;
    document.getElementById("searchInput2").disabled = true;
    
    if(!poke1 || !poke2) return;

    const msg1=document.getElementById("msg1");
    const msg2=document.getElementById("msg2");

    const dmg1 = calculateDamage(hp1);
    const dmg2 = calculateDamage(hp2);

    document.querySelector(".board").classList.add("shake");

    setTimeout(()=>{
        document.querySelector(".board").classList.remove("shake");
     },1200);

    
    if(dmg1 > dmg2){

        document.getElementById("retryBtn").style.display="block";
        document.getElementById("newGameBtn").style.display="block";
        score1++;
        document.getElementById("score1").textContent=score1;

        msg1.textContent="YOU WIN";
        msg1.style.backgroundColor = "lightgreen"
        msg2.textContent="YOU LOSE";
        msg2.style.backgroundColor = "yellow"
        document.getElementById("hitSound").play();
        document.getElementById("pokiImg1").classList.add("winner-glow");

        setTimeout(()=>{
            document.getElementById("pokiImg2").style.display="none";
            resetRound(2);
        },7000);

    }else if(dmg2 > dmg1){

        document.getElementById("retryBtn").style.display="block";
        document.getElementById("newGameBtn").style.display="block";

        score2++;
        document.getElementById("score2").textContent=score2;

        msg2.textContent="YOU WIN";
        msg2.style.backgroundColor = "lightgreen"
        msg1.textContent="YOU LOSE";
        msg1.style.backgroundColor = "yellow"
        document.getElementById("hitSound").play();
        document.getElementById("pokiImg2").classList.add("winner-glow");

        setTimeout(()=>{
            document.getElementById("pokiImg1").style.display="none";
            resetRound(1);
        },7000);

    }else{

        msg1.textContent="DRAW";
        msg1.style.backgroundColor = "White"
        msg2.textContent="DRAW";
        msg2.style.backgroundColor = "White"
        document.getElementById("drawSound").play();

        setTimeout(()=>{
            resetRound(0);
        },7000);
    }
}

function retryRound(){

    document.getElementById("retryBtn").style.display="none";

    if(hp1 > hp2){
        poke2 = null;
        document.getElementById("pokiImg2").style.display="none";
        document.getElementById("searchInput2").disabled = false;
    }
    else if(hp2 > hp1){
        poke1 = null;
        document.getElementById("pokiImg1").style.display="none";
        document.getElementById("searchInput1").disabled = false;
    }

    ready1=false;
    ready2=false;
    document.getElementById("fightBtn").disabled=true;
}

function resetRound(side){

    document.getElementById("searchInput1").disabled = false;
    document.getElementById("searchInput2").disabled = false;

    poke1=null;
    poke2=null;

    hpPercent1=0;
    hpPercent2=0;

    document.getElementById("msg1").textContent="";
    document.getElementById("msg2").textContent="";

    ready1 = false;
    ready2 = false;
    document.getElementById("fightBtn").disabled = true;

    if(side===1){
        document.getElementById("pokiImg1").style.display="none";
        document.getElementById("hpFill1").style.width = hpPercent1 + "%";
        document.getElementById("hp1").textContent = Math.floor(hpPercent1) + "/255";
    }

    if(side===2){
        document.getElementById("pokiImg2").style.display="none";
        document.getElementById("hpFill2").style.width = hpPercent2 + "%";
        document.getElementById("hp2").textContent = Math.floor(hpPercent2) + "/255";
    }
}

document.getElementById("enter1").addEventListener("submit",function(e){
    e.preventDefault();
});

document.getElementById("enter2").addEventListener("submit",function(e){
    e.preventDefault();
});

document.getElementById("retryBtn").addEventListener("click", retryRound);
document.getElementById("newGameBtn").addEventListener("click", retryRound);