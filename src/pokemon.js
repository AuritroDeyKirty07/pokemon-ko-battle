import { fetchMove } from "./api.js";

export class Pokemon {
  constructor(data) {
    this.name       = data.name;
    this.hp         = this.getStat(data, "hp");
    this.attack     = this.getStat(data, "attack");
    this.defense    = this.getStat(data, "defense");
    this.spAttack   = this.getStat(data, "special-attack");
    this.spDefense  = this.getStat(data, "special-defense");
    this.speed      = this.getStat(data, "speed");
    this.currentHP  = this.hp;
    this.sprite     = data.sprites.front_default;
    this.types      = data.types.map(t => t.type.name);
    this.cry        = data.cries?.latest ?? null;
    this.status     = null;
    this.statusTurns = 0;
    this.poisonStacks = 0;
    this.moves      = [];
  }

  getStat(data, name) {
    return data.stats.find(s => s.stat.name === name)?.base_stat ?? 50;
  }

  isFainted() {
    return this.currentHP <= 0;
  }

  async loadMoves(rawMoves) {
    const candidates = [...rawMoves].sort(() => Math.random() - 0.5).slice(0, 12);
    const results = await Promise.all(candidates.map(m => fetchMove(m.move.url).catch(() => null)));

    const damaging = results
      .filter(m => m && m.power && m.damage_class.name !== "status")
      .sort((a, b) => b.power - a.power)
      .slice(0, 4);

    if (damaging.length === 0) {
      damaging.push({ name: "tackle", power: 40, type: { name: "normal" }, damage_class: { name: "physical" } });
    }

    this.moves = damaging.map(m => ({
      name:     m.name,
      power:    m.power,
      type:     m.type.name,
      category: m.damage_class.name,
    }));
  }
}