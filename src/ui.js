export function updateUI(p1, p2) {
  if (p1) updateCard(p1, "1");
  if (p2) updateCard(p2, "2");
}

function updateCard(p, n) {
  document.getElementById(`name${n}`).textContent = p.name.toUpperCase();

  const img = document.getElementById(`pokiImg${n}`);
  img.src = p.sprite;
  img.style.display = "block";

  const pct = (p.currentHP / p.hp) * 100;
  const fill = document.getElementById(`hpFill${n}`);
  fill.style.width = pct + "%";
  fill.style.background = pct > 50 ? "#39ff14" : pct > 20 ? "#ffa500" : "#ff2d78";

  document.getElementById(`hpText${n}`).textContent = `HP: ${p.currentHP} / ${p.hp}`;

  const badge = document.getElementById(`status${n}`);
  if (!badge) return;
  if (p.status) {
    const labels = { paralyzed: "⚡ PAR", poisoned: "☠️ PSN", asleep: "😴 SLP" };
    badge.textContent = labels[p.status] || "";
    badge.style.display = "inline-block";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }
}

export function renderMoveButtons(moves, onPick) {
  const area = document.getElementById("moveArea");
  area.innerHTML = "";
  moves.forEach(move => {
    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.dataset.type = move.type;

    const name = document.createElement("span");
    name.className = "move-name";
    name.textContent = move.name.replace(/-/g, " ").toUpperCase();

    const meta = document.createElement("span");
    meta.className = "move-meta";
    meta.textContent = `PWR ${move.power} · ${move.type.toUpperCase()}`;

    btn.append(name, meta);
    btn.addEventListener("click", () => onPick(move));
    area.appendChild(btn);
  });
}

export function clearMoveButtons() {
  const area = document.getElementById("moveArea");
  if (area) area.innerHTML = "";
}

export function showDamageFloat(imgId, damage, typeMulti, isCrit) {
  const img = document.getElementById(imgId);
  if (!img) return;
  const rect = img.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "damage-float";

  let text = `-${damage}`;
  if (isCrit)        { text += " CRIT!";  el.classList.add("crit"); }
  if (typeMulti > 1) { text += " SUPER!"; el.classList.add("super"); }
  if (typeMulti === 0) { text = "NO EFFECT"; el.classList.add("immune"); }
  if (typeMulti < 1 && typeMulti > 0) el.classList.add("resist");

  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top  = `${rect.top + window.scrollY}px`;
  document.body.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

export function logBattleMessage(message, type = "normal") {
  const log = document.getElementById("battleLog");
  const entry = document.createElement("p");
  entry.textContent = message;
  entry.dataset.type = type;
  log.prepend(entry);
}

export function setWinnerMessage(winnerId, loserId) {
  document.getElementById(winnerId).textContent = "🏆 Winner!";
  document.getElementById(loserId).textContent  = "💀 Fainted!";
}

export function animateFaint(imgId) {
  return new Promise(resolve => {
    const img = document.getElementById(imgId);
    if (!img) return resolve();
    img.classList.add("fainting");
    img.addEventListener("animationend", () => {
      img.classList.remove("fainting");
      resolve();
    }, { once: true });
  });
}

export function showTurnBanner(text) {
  const banner = document.getElementById("turnBanner");
  if (!banner) return;
  banner.textContent = text;
  banner.classList.remove("banner-pop");
  void banner.offsetWidth;
  banner.classList.add("banner-pop");
}