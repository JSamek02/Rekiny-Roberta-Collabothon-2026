/** Removes null from fields unions */
export type NotNullFields<T> = {
  [P in keyof T]: Exclude<T[P], null>;
};

/** Makes all fields on any tree level requred  */
export type DeepRequired<T> = T extends Date | FileList | File | Blob
  ? T
  : { [K in keyof T]-?: NonNullable<DeepRequired<T[K]>> };

/** Returns union of names of fields that are optional */
type OptionalKeys<T> = {
  [K in keyof T]-?: Record<never, never> extends Pick<T, K> ? K : never;
}[keyof T];

/** Makes result type easier to read */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/** Returns type of fields that exists in both type `A` and `B`. If field has different types returns union of those types. */
export type SharedIntersection<A, B> = Prettify<
  { [K in keyof A & keyof B as K extends OptionalKeys<A> | OptionalKeys<B> ? never : K]: A[K] | B[K] } & {
    [K in keyof A & keyof B as K extends OptionalKeys<A> | OptionalKeys<B> ? K : never]?:
      | NonNullable<A[K]>
      | NonNullable<B[K]>;
  }
>;

/** If `T` is `never` then returned type is `never` too. Otherwise returns field of given type and name */
export type PhantomField<T, Name extends string> = { [K in [T] extends [never] ? never : Name]: T };
