type Campus = {
  id: string;
  nome: string;
};

export type Instituicao = {
  id: string;
  nome: string;
  slug: string;
  dominiosEmail: string[];
  campi: Campus[];
};

/** Catalogo local. Depois pode virar collection `instituicoes`. */
export const INSTITUICOES: Instituicao[] = [
  {
    id: "fatec",
    nome: "FATEC",
    slug: "fatec",
    dominiosEmail: ["fatec.sp.gov.br"],
    campi: [
      { id: "fatec-sp", nome: "São Paulo" },
      { id: "fatec-zl", nome: "Zona Leste" },
      { id: "fatec-outro", nome: "Outro campus" },
    ],
  },
  {
    id: "fiap",
    nome: "FIAP",
    slug: "fiap",
    dominiosEmail: ["fiap.com.br"],
    campi: [{ id: "fiap-sp", nome: "São Paulo" }],
  },
  {
    id: "unip",
    nome: "UNIP",
    slug: "unip",
    dominiosEmail: ["unip.br"],
    campi: [{ id: "unip-sp", nome: "São Paulo" }],
  },
  {
    id: "usp",
    nome: "USP",
    slug: "usp",
    dominiosEmail: ["usp.br"],
    campi: [{ id: "usp-sp", nome: "São Paulo" }],
  },
];

export function getInstituicao(id: string): Instituicao | undefined {
  return INSTITUICOES.find((i) => i.id === id);
}

export function matchInstituicaoPorEmail(
  email: string | null | undefined
): Instituicao | undefined {
  if (!email) return undefined;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return undefined;
  return INSTITUICOES.find((i) =>
    i.dominiosEmail.some(
      (d) => domain === d || domain.endsWith(`.${d}`)
    )
  );
}
