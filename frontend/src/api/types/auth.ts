import { ApiRequest } from '@/api/types/common';

/** Typ zalogowanego konta zapisany w bazie (`users.role`). */
export type UserRole = 'user' | 'creator' | 'partner';

/** Typ użytkownika w aplikacji; `guest` oznacza brak ważnej sesji (niezalogowany). */
export type ViewerType = 'guest' | UserRole;

export type AuthMode = 'google' | 'mock';

export type AuthUser = {
  id: number;
  email: string | null;
  name: string | null;
  picture: string | null;
  preferred_language: string;
  shark_coins: number;
  experience_points: number;
  role: UserRole;
  created_at: string;
};

export namespace ApiGetAuthConfig {
  export type Response = {
    mode: AuthMode;
    roles: UserRole[];
  };
}

export namespace ApiGetCurrentUser {
  export type Response = {
    user: AuthUser;
  };
}

export namespace ApiPostMockLogin {
  export type Body = {
    role: UserRole;
  };

  export type Request = ApiRequest<never, never, never, Body>;

  export type Response = {
    status: 'ok';
  };
}

export namespace ApiPostGameCoin {
  export type Response = {
    shark_coins: number;
    reward: number;
  };
}

export namespace ApiPostShopPurchase {
  export type Body = {
    item_id: string;
  };

  export type Response = {
    shark_coins: number;
    cost: number;
  };
}

export namespace ApiPostLogout {
  export type Response = {
    status: 'ok';
  };
}
