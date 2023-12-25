export type ToObj<T extends object = object> = {
  [P in keyof T]: T[P];
};
export type ReplaceKeyByType<
  T extends object = object,
  K extends string = never,
  V = never,
> = ToObj<
  Omit<T, K> & {
    [P in K]: V;
  }
>;
export type PartialByKey<T extends object, U extends keyof T> = ToObj<
  Omit<T, U> & {
    [P in U]?: T[P];
  }
>;

export interface UserSession {
  openid: string;
  balance: number;
}
