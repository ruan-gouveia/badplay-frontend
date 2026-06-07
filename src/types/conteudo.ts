export interface Genero {
  id: number;
  nome: string;
}

export interface Episodio {
  id: number;
  nome: string;
  numeroEpisodio: number;
  duracaoMinutos: number;
  trailerUrlYoutube: string;
}

export interface Temporada {
  id: number;
  numeroTemporada: number;
  episodios: Episodio[];
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
  trailerUrlYoutube?: string;
  generos: Genero[];
  temporadas: Temporada[];
}

export interface Avaliacao {
  id: number;
  nota: number;
  comentarioSocial: string;
  nomeUsuario: string;
}

export interface ConteudoLista {
  id: number;
  titulo: string;
  capaUrlMinio: string;
  planoMinimo: string;
}

export interface ListaDesejo {
  id: number;
  nome: string;
  dataCriacao: string;
  conteudos: ConteudoLista[];
}