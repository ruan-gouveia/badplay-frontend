export interface Genero {
  id: number;
  nome: string;
}

export interface Filme {
  id: number;
  titulo: string;
  descricao: string;
  anoLancamento: number;
  capaUrlMinio: string;
  duracaoMinutos: number;
  planoMinimo: string;
  trailerUrlYoutube: string;
  generos: Genero[];
}

export interface Serie {
  id: number;
  titulo: string;
  descricao: string;
  anoLancamento: number;
  capaUrlMinio: string;
  planoMinimo: string;
  trailerUrlYoutube: string;
  generos: Genero[];
}

export interface Avaliacao {
  id: number;
  nota: number;
  comentarioSocial: string;
  nomeUsuario: string;
}