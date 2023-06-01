import type { Numberish as _Numberish } from 'dnum/dist/types';
import type { Address as _Address } from 'viem';

export type Address = _Address;
export type AddressTo<T> = Record<Address, T>;
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
export type Nullable<T> = T | null;
export type Nullish<T> = Nullable<T> | undefined;
export type Primitive = number | string | boolean | bigint | symbol | null | undefined;
export type Numberish = _Numberish;
export type { Dnum } from 'dnum/dist/types';
