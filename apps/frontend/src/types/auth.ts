// src/types/auth.ts

export interface LoginRequest {
  email: string;
  password: string;
}

/** What FastAPI /auth/login returns. The BFF strips tokens and only returns ok+expires_in. */
export interface BackendLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

/** What our BFF /api/v0/auth/login returns to the browser. */
export interface ClientLoginResponse {
  ok: true;
  expires_in: number;
}

export interface CurrentAdmin {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
}
