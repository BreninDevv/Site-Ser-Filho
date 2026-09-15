import {
  ROTULOS_FORMA,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";

export function rotuloFormaPlanilha(
  forma: FormaPagamento | null | undefined,
  parcelas?: number | null
) {
  if (!forma) return "Não informada";
  const base = ROTULOS_FORMA[forma] ?? String(forma);
  if (forma === "credito" && parcelas) {
    return parcelas === 1 ? `${base} à vista` : `${base} em ${parcelas}x`;
  }
  return base;
}
