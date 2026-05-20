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
  generos: Genero[];
}

export interface Serie {
  id: number;
  titulo: string;
  descricao: string;
  anoLancamento: number;
  capaUrlMinio: string;
  planoMinimo: string;
  generos: Genero[];
}