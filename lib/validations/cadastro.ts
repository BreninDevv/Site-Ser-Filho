export const ROLES_CADASTRO = [
  "discipulo",
  "lider",
  "pastor",
  "apostolo",
  "midia",
  "tesouraria",
] as const;

export type RoleCadastro = (typeof ROLES_CADASTRO)[number];

export const ROTULOS_ROLE_CADASTRO: Record<RoleCadastro, string> = {
  discipulo: "Discípulo",
  lider: "Líder",
  pastor: "Pastor",
  apostolo: "Apóstolo",
  midia: "Líder de mídia",
  tesouraria: "Tesouraria",
};

export const TEMPOS_IGREJA = [
  "Menos de 6 meses",
  "6 meses a 1 ano",
  "1 a 3 anos",
  "3 a 5 anos",
  "5 a 10 anos",
  "Mais de 10 anos",
] as const;

export type TempoIgreja = (typeof TEMPOS_IGREJA)[number];

export function precisaEscolherEquipe(role: string) {
  return role === "discipulo" || role === "lider";
}

export function ehRoleCadastro(valor: string): valor is RoleCadastro {
  return ROLES_CADASTRO.includes(valor as RoleCadastro);
}

export function ehTempoIgreja(valor: string): valor is TempoIgreja {
  return TEMPOS_IGREJA.includes(valor as TempoIgreja);
}
