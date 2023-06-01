import * as dn from 'dnum';
import type { Dnum, Numberish } from './types';


export function parseRawAmount(value: Numberish): Dnum {
    try {
        if (value === '') value = '0';
        if (typeof value === 'string') {
            if (value[value.length - 1] === '.') value = value.slice(0, -1);
        }
        return dn.from(value);
    } catch (error) {
        throw new Error(`${value} is not a valid Dnum.`);
    }
}
