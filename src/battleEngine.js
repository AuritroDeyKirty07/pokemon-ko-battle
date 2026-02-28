const TYPE_CHART = {
  normal:   { ghost: 0 },
  fire:     { fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5, grass: 2, ice: 2, bug: 2, steel: 2 },
  water:    { water: 0.5, grass: 0.5, dragon: 0.5, fire: 2, ground: 2, rock: 2 },
  electric: { electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0, flying: 2, water: 2 },
  grass:    { fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5, water: 2, ground: 2, rock: 2 },
  ice:      { water: 0.5, ice: 0.5, fire: 0.5, steel: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2 },
  fighting: { poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, ghost: 0, fairy: 0.5, normal: 2, ice: 2, rock: 2, dark: 2, steel: 2 },
  poison:   { poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, grass: 2, fairy: 2 },
  ground:   { grass: 0.5, bug: 0.5, flying: 0, fire: 2, electric: 2, poison: 2, rock: 2, steel: 2 },
  flying:   { electric: 0.5, rock: 0.5, steel: 0.5, grass: 2, fighting: 2, bug: 2 },
  psychic:  { psychic: 0.5, steel: 0.5, dark: 0, fighting: 2, poison: 2 },
  bug:      { fire: 0.5, fighting: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5, grass: 2, psychic: 2, dark: 2 },
  rock:     { fighting: 0.5, ground: 0.5, steel: 0.5, fire: 2, ice: 2, flying: 2, bug: 2 },
  ghost:    { normal: 0, dark: 0.5, ghost: 2, psychic: 2 },
  dragon:   { steel: 0.5, fairy: 0, dragon: 2 },
  dark:     { fighting: 0.5, dark: 0.5, fairy: 0.5, ghost: 2, psychic: 2 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5, ice: 2, rock: 2, fairy: 2 },
  fairy:    { fire: 0.5, poison: 0.5, steel: 0.5, fighting: 2, dragon: 2, dark: 2 },
};

export function getTypeMultiplier(moveType, defenderTypes) {
  let multiplier = 1;
  for (const defType of defenderTypes) {
    const row = TYPE_CHART[moveType];
    if (row && row[defType] !== undefined) multiplier *= row[defType];
  }
  return multiplier;
}

export function calculateDamage(attacker, defender, move) {
  const atkStat   = move.category === "special" ? attacker.spAttack  : attacker.attack;
  const defStat   = move.category === "special" ? defender.spDefense : defender.defense;
  const base      = (atkStat / defStat) * move.power * 0.4;
  const roll      = Math.random() * 0.15 + 0.85;
  const typeMulti = getTypeMultiplier(move.type, defender.types);
  const isCrit    = Math.random() < 0.0625;
  const damage    = Math.max(1, Math.floor(base * roll * typeMulti * (isCrit ? 1.5 : 1)));
  return { damage, typeMulti, isCrit };
}

export function applyStatusEffects(pokemon) {
  if (!pokemon.status) return { skipped: false, statusDmg: 0, statusMsg: "" };

  if (pokemon.status === "asleep") {
    pokemon.statusTurns--;
    if (pokemon.statusTurns > 0) return { skipped: true, statusDmg: 0, statusMsg: `😴 ${pokemon.name} is fast asleep!` };
    pokemon.status = null;
    return { skipped: false, statusDmg: 0, statusMsg: `☀️ ${pokemon.name} woke up!` };
  }

  if (pokemon.status === "paralyzed") {
    if (Math.random() < 0.25) return { skipped: true, statusDmg: 0, statusMsg: `⚡ ${pokemon.name} is paralyzed and can't move!` };
    return { skipped: false, statusDmg: 0, statusMsg: "" };
  }

  if (pokemon.status === "poisoned") {
    pokemon.poisonStacks = Math.min((pokemon.poisonStacks || 1) + 1, 15);
    const dmg = Math.max(1, Math.floor(pokemon.hp / 16 * pokemon.poisonStacks));
    pokemon.currentHP = Math.max(0, pokemon.currentHP - dmg);
    return { skipped: false, statusDmg: dmg, statusMsg: `☠️ ${pokemon.name} took ${dmg} poison damage!` };
  }

  return { skipped: false, statusDmg: 0, statusMsg: "" };
}

const STATUS_MOVES = {
  "thunder-wave":  { status: "paralyzed", chance: 1.0 },
  "thunder":       { status: "paralyzed", chance: 0.3 },
  "body-slam":     { status: "paralyzed", chance: 0.3 },
  "toxic":         { status: "poisoned",  chance: 1.0 },
  "poison-powder": { status: "poisoned",  chance: 0.75 },
  "hypnosis":      { status: "asleep",    chance: 0.6 },
  "sleep-powder":  { status: "asleep",    chance: 0.75 },
  "sing":          { status: "asleep",    chance: 0.55 },
  "stun-spore":    { status: "paralyzed", chance: 0.75 },
};

export function tryApplyMoveStatus(moveName, target) {
  const entry = STATUS_MOVES[moveName];
  if (!entry || target.status) return null;
  if (Math.random() < entry.chance) {
    target.status = entry.status;
    if (entry.status === "asleep")   target.statusTurns  = Math.floor(Math.random() * 3) + 1;
    if (entry.status === "poisoned") target.poisonStacks = 1;
    return entry.status;
  }
  return null;
}

export function aiChooseMove(aiPokemon, target) {
  return aiPokemon.moves.reduce((best, move) => {
    const scoreA = move.power * getTypeMultiplier(move.type, target.types);
    const scoreB = best.power * getTypeMultiplier(best.type, target.types);
    return scoreA > scoreB ? move : best;
  }, aiPokemon.moves[0]);
}