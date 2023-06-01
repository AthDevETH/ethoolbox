import { describe, it, expect } from 'vitest';
import { MaxUint256 } from '../constants';
import { Token } from './token';
import { CurrencyAmount } from './currencyAmount';
import { NativeCurrency } from './nativeCurrency';
import * as dn from 'dnum';


describe('CurrencyAmount', () => {
    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

    describe('constructor', () => {
        it('works', () => {
            const token = new Token(1, ADDRESS_ONE, 18);
            const amount = CurrencyAmount.fromRawAmount(token, 100);
            expect(amount.rawAmount).toEqual([100000000000000000000n, 18]);
        });
    });

    describe('#rawAmount', () => {
        it('returns the amount after multiplication', () => {
            const token = new Token(1, ADDRESS_ONE, 18);
            const amount = CurrencyAmount.fromRawAmount(token, 100).multiply(15 / 100);
            expect(amount.rawAmount).toEqual([15000000000000000000n, 18]);
        });
    });

    describe('#ether', () => {
        it('produces ether amount', () => {
            const amount = CurrencyAmount.fromRawAmount(new NativeCurrency(1, 18, 'ETH', 'Ether', 'tokenURI', ADDRESS_ONE, true), 100);
            expect(amount.rawAmount).toEqual([100000000000000000000n, 18]);
            expect(amount.currency).toEqual(new NativeCurrency(1, 18, 'ETH', 'Ether', 'tokenURI', ADDRESS_ONE, true));
        });
    });

    it('token amount can be max uint256', () => {
        const amount = CurrencyAmount.fromRawAmount(new Token(1, ADDRESS_ONE, 18), [MaxUint256, 18]);
        expect(amount.rawAmount).toEqual([MaxUint256, 18]);
    })
    it('token amount cannot exceed max uint256', () => {
        expect(() =>
            CurrencyAmount.fromRawAmount(new Token(1, ADDRESS_ONE, 18), dn.add(MaxUint256, 1n))
        ).toThrow('AMOUNT');
    });
    it('token amount rawAmount cannot exceed max uint256', () => {
        expect(() =>
            CurrencyAmount.fromFractionalAmount(
                new Token(1, ADDRESS_ONE, 18),
                dn.add(dn.multiply(MaxUint256, 2n), 2n),
                2n
            )
        ).toThrow('AMOUNT');
    });

    describe('#toFixed', () => {
        it('throws for decimals > currency.decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 1000)
            expect(() => amount.toFixed(3)).toThrow('DECIMALS')
        })
        it('is correct for 0 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 123456)
            expect(amount.toFixed(0)).toEqual('123456')
        })
        it('is correct for 18 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 18)
            const amount = CurrencyAmount.fromRawAmount(token, [1000000000000000n, 18]);
            expect(amount.toFixed(9)).toEqual('0.001000000')
        })
    })

    describe('#toSignificant', () => {
        it('does not throw for sig figs > currency.decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 1000)
            expect(amount.toSignificant(3)).toEqual('1000')
        })
        it('is correct for 0 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 123456)
            expect(amount.toSignificant(4)).toEqual('123400')
        })
        it('is correct for 18 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 18);
            const amount = CurrencyAmount.fromRawAmount(token, [1000000000000000n, 18]);
            expect(amount.toSignificant(9)).toEqual('0.001');
        })
    })

    describe('#toExact', () => {
        it('does not throw for sig figs > currency.decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 1000)
            expect(amount.toExact()).toEqual('1000')
        })
        it('is correct for 0 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 0)
            const amount = CurrencyAmount.fromRawAmount(token, 123456)
            expect(amount.toExact()).toEqual('123456')
        })
        it('is correct for 18 decimals', () => {
            const token = new Token(1, ADDRESS_ONE, 18)
            const amount = CurrencyAmount.fromRawAmount(token, [1230000000000000n, 18])
            expect(amount.toExact()).toEqual('0.00123')
        })
    })
});
