export interface LoginRequest {
  email: string;
  senha: string;
}

    
export interface TokenResponse {
  token: string;
  usuarioId: number;
  nome: string;
  perfil: string;
}