import { describe, expect, it } from 'vitest';
import { parseRawAmount } from './parse';

describe('#parseTokenAmount', () => {
    it('parses token amounts correctly', () => {
        expect(parseRawAmount('1337')).toEqual([1337n, 0],);
        expect(parseRawAmount('1.337')).toEqual([1337n, 3],);
    });
});
