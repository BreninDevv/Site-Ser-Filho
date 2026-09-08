import { createClient } from "@/lib/supabase/server";
import { uuidValido } from "@/lib/seguranca";

const MAX_IDS = 500;

export function idsInscricaoValidos(ids: string[]) {
  return [...new Set(ids)].filter(uuidValido).slice(0, MAX_IDS);
}

export async function removerArquivosDoBucket(
  bucket: string,
  caminhos: (string | null | undefined)[]
) {
  const limpos = [...new Set(caminhos.filter((c): c is string => Boolean(c)))];
  if (limpos.length === 0) return;
  const supabase = await createClient();
  for (let i = 0; i < limpos.length; i += 100) {
    await supabase.storage.from(bucket).remove(limpos.slice(i, i + 100));
  }
}
