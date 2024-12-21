export type Provider = {
  id: number;
  name: string;
  api_key: string;
  base_url: string;
  path?: string;
  is_active: boolean;
};

export type User = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  api_keys: ApiKey[];
};

export type ApiKey = {
  id: number;
  provider_id: number;
  api_key: string;
  is_active: boolean;
};

export type ApiKeyDetail = {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  base_url: string;
  is_active: boolean;
  usage_in: number;
  usage_out: number;
  created_at: string;
};
