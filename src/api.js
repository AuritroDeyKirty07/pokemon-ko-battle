export async function fetchPokemon(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase().trim()}`);
  if (!res.ok) throw new Error("Pokemon not found");
  return res.json();
}

export async function fetchMove(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}