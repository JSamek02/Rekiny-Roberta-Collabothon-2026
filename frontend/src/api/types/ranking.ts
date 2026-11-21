export type RankingEntry = {
  rank: number;
  user_id: number;
  name: string | null;
  picture: string | null;
  experience_points: number;
};

export namespace ApiGetRanking {
  export type Params = {
    limit?: number;
  };

  export type Response = {
    ranking: RankingEntry[];
    total_users: number;
    /** Position of the signed-in user; `null` for guests. */
    current_user: RankingEntry | null;
  };
}
