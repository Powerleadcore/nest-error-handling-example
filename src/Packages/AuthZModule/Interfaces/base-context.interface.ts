export interface BaseContext<Roles> {
  userId: string;
  rank: number;
  role: Roles;
}