export function formDataDeJson(json: unknown): FormData {
  const formData = new FormData();
  if (!json || typeof json !== "object") return formData;
  for (const [chave, valor] of Object.entries(json as Record<string, unknown>)) {
    if (valor === null || valor === undefined) continue;
    formData.set(chave, String(valor));
  }
  return formData;
}

export function objetoDeFormData(formData: FormData): Record<string, string> {
  const corpo: Record<string, string> = {};
  formData.forEach((valor, chave) => {
    if (typeof valor === "string") corpo[chave] = valor;
  });
  return corpo;
}

export async function enviarInscricaoJson<T extends { status: string }>(
  url: string,
  formData: FormData,
  fallback: T
): Promise<T> {
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objetoDeFormData(formData)),
    });
    const dados = (await resposta.json()) as T;
    if (dados && typeof dados.status === "string") return dados;
    return fallback;
  } catch {
    return fallback;
  }
}
