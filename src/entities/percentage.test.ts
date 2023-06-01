import { it, describe, expect } from 'vitest';
import { Percentage } from './percentage';

describe('Percentage', () => {
    describe('constructor', () => {
        it('defaults to 1 denominator', () => {
            expect(new Percentage(1)).toEqual(new Percentage(1, 1));
        });
    });
    describe('#add', () => {
        it('returns a percent', () => {
            expect(new Percentage(1, 100).add(new Percentage(2, 100))).toEqual(new Percentage(3, 100));
        });
        it('different denominators', () => {
            expect(new Percentage(1, 25).add(new Percentage(2, 100))).toEqual(new Percentage(150, 2500));
        });
    });
    describe('#subtract', () => {
        it('returns a percent', () => {
            expect(new Percentage(1, 100).subtract(new Percentage(2, 100))).toEqual(new Percentage(-1, 100));
        });
        it('different denominators', () => {
            expect(new Percentage(1, 25).subtract(new Percentage(2, 100))).toEqual(new Percentage(50, 2500));
        });
    });
    describe('#multiply', () => {
        it('returns a percent', () => {
            expect(new Percentage(1, 100).multiply(new Percentage(2, 100))).toEqual(new Percentage(2, 10000));
        });
        it('different denominators', () => {
            expect(new Percentage(1, 25).multiply(new Percentage(2, 100))).toEqual(new Percentage(2, 2500));
        });
    });
    describe('#divide', () => {
        it('returns a percent', () => {
            expect(new Percentage(1, 100).divide(new Percentage(2, 100))).toEqual(new Percentage(100, 200));
        });
        it('different denominators', () => {
            expect(new Percentage(1, 25).divide(new Percentage(2, 100))).toEqual(new Percentage(100, 50));
        });
    });

    describe('#toSignificant', () => {
        it('returns the value scaled by 100', () => {
            expect(new Percentage(154, 10_000).toSignificant(3)).toEqual('1.54');
        });
    });
    describe('#toFixed', () => {
        it('returns the value scaled by 100', () => {
            expect(new Percentage(154, 10_000).toFixed(2)).toEqual('1.54');
        });
    });
});
