type Coordenadas = { lat: number; lng: number };

export async function geocodificarEndereco(endereco: string): Promise<Coordenadas | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(endereco)}`;

  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "SerFilho-App (brenoeevil@gmail.com)",
    },
  });

  if (!resposta.ok) return null;

  const resultados = await resposta.json();
  if (!resultados || resultados.length === 0) return null;

  return {
    lat: parseFloat(resultados[0].lat),
    lng: parseFloat(resultados[0].lon),
  };
}

export function calcularDistanciaKm(a: Coordenadas, b: Coordenadas): number {
  const raioTerraKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return raioTerraKm * c;
}