import { fetchPokemon } from "./api.js";
import { Pokemon } from "./pokemon.js";
import { calculateDamage, applyStatusEffects, tryApplyMoveStatus, aiChooseMove } from "./battleEngine.js";
import { updateUI, renderMoveButtons, clearMoveButtons, showDamageFloat, logBattleMessage, setWinnerMessage, animateFaint, showTurnBanner } from "./ui.js";

let pokemon1    = null;
let pokemon2    = null;
let score1      = 0;
let score2      = 0;
let isP1Turn    = true;
let gameActive  = false;
let aiMode      = false;

const fightBtn   = document.getElementById("fightBtn");
const retryBtn   = document.getElementById("retryBtn");
const newGameBtn = document.getElementById("newGameBtn");
const hitSound   = document.getElementById("hitSound");
const drawSound  = document.getElementById("drawSound");
const aiToggle   = document.getElementById("aiToggle");
const aiLabel    = document.getElementById("aiLabel");



aiToggle?.addEventListener("change", () => {
  aiMode = aiToggle.checked;
  aiLabel.textContent = aiMode ? "AI ON" : "AI OFF";

  const p2area = document.getElementById("enter2");
  p2area.style.opacity       = aiMode ? "0.35" : "1";
  p2area.style.pointerEvents = aiMode ? "none"  : "auto";

  if (aiMode && !pokemon2) pickRandomAI();
});

async function pickRandomAI() {
  const pool = ["gengar", "alakazam", "mewtwo", "charizard", "blastoise", "venusaur",
                "dragonite", "snorlax", "machamp", "starmie", "lapras", "vaporeon"];
  const name = pool[Math.floor(Math.random() * pool.length)];
  try {
    const data = await fetchPokemon(name);
    pokemon2 = new Pokemon(data);
    document.getElementById("msg2").textContent = `🤖 ${name.toUpperCase()}`;
    await pokemon2.loadMoves(data.moves);
    updateUI(null, pokemon2);
    checkReady();
  } catch {}
}

async function loadPlayer(slot) {
  const inputId = `searchInput${slot}`;
  const msgId   = `msg${slot}`;
  const name    = document.getElementById(inputId).value.trim();
  if (!name) return;

  const msg = document.getElementById(msgId);
  msg.textContent = "⏳ Loading...";

  try {
    const data    = await fetchPokemon(name);
    const pokemon = new Pokemon(data);
    await pokemon.loadMoves(data.moves);

    if (slot === 1) pokemon1 = pokemon;
    else            pokemon2 = pokemon;

    updateUI(slot === 1 ? pokemon : null, slot === 2 ? pokemon : null);
    msg.textContent = "";
    playCry(pokemon);
    checkReady();
  } catch {
    msg.textContent = "❌ Not found!";
  }
}

function playCry(pokemon) {
  if (!pokemon.cry) return;
  try {
    const audio = new Audio(pokemon.cry);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  } catch {}
}

function checkReady() {
  if (pokemon1 && pokemon2 && !gameActive) fightBtn.disabled = false;
}

fightBtn.addEventListener("click", () => {
  if (!pokemon1 || !pokemon2) return;
  gameActive = true;
  fightBtn.style.display = "none";
  isP1Turn = pokemon1.speed >= pokemon2.speed;
  startTurn();
});

function startTurn() {
  const attacker = isP1Turn ? pokemon1 : pokemon2;
  const defender = isP1Turn ? pokemon2 : pokemon1;
  const label    = isP1Turn ? "⚔️ PLAYER 1'S TURN" : (aiMode ? "🤖 AI'S TURN" : "⚔️ PLAYER 2'S TURN");

  showTurnBanner(label);

  if (!isP1Turn && aiMode) {
    clearMoveButtons();
    setTimeout(() => {
      const move = aiChooseMove(attacker, defender);
      if (move) executeTurn(attacker, defender, move);
    }, 900);
  } else {
    renderMoveButtons(attacker.moves, move => {
      clearMoveButtons();
      executeTurn(attacker, defender, move);
    });
  }
}

async function executeTurn(attacker, defender, move) {
  const statusResult = applyStatusEffects(attacker);

  if (statusResult.statusMsg) logBattleMessage(statusResult.statusMsg, "status");

  if (statusResult.statusDmg > 0) {
    updateUI(isP1Turn ? attacker : null, isP1Turn ? null : attacker);
    if (attacker.isFainted()) {
      await endBattle(defender);
      return;
    }
  }

  if (statusResult.skipped) {
    updateUI(pokemon1, pokemon2);
    isP1Turn = !isP1Turn;
    startTurn();
    return;
  }

  const { damage, typeMulti, isCrit } = calculateDamage(attacker, defender, move);
  defender.currentHP = Math.max(0, defender.currentHP - damage);

  let logMsg = `${attacker.name.toUpperCase()} used ${move.name.replace(/-/g, " ").toUpperCase()}! (${damage} dmg)`;
  if (isCrit)                        logMsg += " CRITICAL HIT!";
  if (typeMulti > 1)                 logMsg += " SUPER EFFECTIVE!";
  if (typeMulti === 0)               logMsg += " NO EFFECT!";
  if (typeMulti < 1 && typeMulti > 0) logMsg += " Not very effective...";

  logBattleMessage(logMsg, isCrit ? "crit" : typeMulti > 1 ? "super" : "normal");

  const defImgId = defender === pokemon1 ? "pokiImg1" : "pokiImg2";
  shakeImage(defImgId);
  showDamageFloat(defImgId, damage, typeMulti, isCrit);
  hitSound.currentTime = 0;
  hitSound.play().catch(() => {});

  const appliedStatus = tryApplyMoveStatus(move.name, defender);
  if (appliedStatus) {
    const icons = { paralyzed: "⚡", poisoned: "☠️", asleep: "😴" };
    logBattleMessage(`${icons[appliedStatus]} ${defender.name.toUpperCase()} is now ${appliedStatus}!`, "status");
  }

  updateUI(pokemon1, pokemon2);

  if (defender.isFainted()) {
    await animateFaint(defImgId);
    await endBattle(attacker);
    return;
  }

  isP1Turn = !isP1Turn;
  setTimeout(startTurn, 400);
}

async function endBattle(winner) {
  gameActive = false;
  clearMoveButtons();
  showTurnBanner("");

  if (winner === pokemon1) {
    score1++;
    document.getElementById("score1").textContent = score1;
    setWinnerMessage("msg1", "msg2");
  } else if (winner === pokemon2) {
    score2++;
    document.getElementById("score2").textContent = score2;
    setWinnerMessage("msg2", "msg1");
  } else {
    drawSound.play().catch(() => {});
    document.getElementById("msg1").textContent = "🤝 Draw!";
    document.getElementById("msg2").textContent = "🤝 Draw!";
  }

  retryBtn.style.display   = "block";
  newGameBtn.style.display = "block";
}

retryBtn.addEventListener("click", () => {
  [pokemon1, pokemon2].forEach(p => {
    if (!p) return;
    p.currentHP      = p.hp;
    p.status         = null;
    p.poisonStacks   = 0;
    p.statusTurns    = 0;
  });

  updateUI(pokemon1, pokemon2);
  clearMoveButtons();

  document.getElementById("msg1").textContent      = "";
  document.getElementById("msg2").textContent      = aiMode ? `🤖 AI` : "";
  document.getElementById("battleLog").innerHTML   = "";
  document.getElementById("turnBanner").textContent = "";

  retryBtn.style.display   = "none";
  newGameBtn.style.display = "none";
  fightBtn.style.display   = "block";
  fightBtn.disabled        = !(pokemon1 && pokemon2);
  gameActive               = false;
});

newGameBtn.addEventListener("click", () => location.reload());

function shakeImage(imgId) {
  const img = document.getElementById(imgId);
  if (!img) return;
  img.classList.remove("shake");
  void img.offsetWidth;
  img.classList.add("shake");
}

document.getElementById("selectBtn1").addEventListener("click", () => loadPlayer(1));
document.getElementById("selectBtn2").addEventListener("click", () => loadPlayer(2));
document.getElementById("searchInput1").addEventListener("keydown", e => { if (e.key === "Enter") loadPlayer(1); });
document.getElementById("searchInput2").addEventListener("keydown", e => { if (e.key === "Enter") loadPlayer(2); });