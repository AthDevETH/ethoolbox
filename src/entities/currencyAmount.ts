import invariant from 'tiny-invariant';
import type { Currency } from './currency';
import type { Token } from './token';
import { MaxUint256, Rounding } from '../constants';
import type { Dnum, Numberish } from '../types';
import { toFixed } from '../format';
import * as dn from 'dnum';
import Decimal from 'decimal.js-light';


export class CurrencyAmount<T extends Currency> {
    public readonly currency: T;
    public readonly rawAmount: Dnum;
    public readonly decimalScale: bigint;

    /**
     * Returns a new currency amount instance from the unitless amount of token, i.e. the raw amount
     * @param currency the currency in the amount
     * @param rawAmount the raw token or ether amount
     */
    public static fromRawAmount<T extends Currency>(currency: T, rawAmount: Numberish): CurrencyAmount<T> {
        return new CurrencyAmount(currency, rawAmount);
    }

    /**
     * Construct a currency amount with a denominator that is not equal to 1
     * @param currency the currency
     * @param numerator the numerator of the fractional token amount
     * @param denominator the denominator of the fractional token amount
     */
    public static fromFractionalAmount<T extends Currency>(
        currency: T,
        numerator: Numberish,
        denominator: Numberish
    ): CurrencyAmount<T> {
        return new CurrencyAmount(currency, numerator, denominator);
    }

    protected constructor(currency: T, numerator: Numberish, denominator?: Numberish) {
        this.rawAmount = dn.div(numerator, denominator ?? 1n, currency.decimals);
        invariant(dn.lessThanOrEqual(this.rawAmount, MaxUint256), 'AMOUNT');
        this.currency = currency;
        this.decimalScale = 10n ** BigInt(currency.decimals);
    }

    public add(other: CurrencyAmount<T>): CurrencyAmount<T> {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        const added = dn.add(this.rawAmount, other.rawAmount);
        return CurrencyAmount.fromRawAmount(this.currency, added);
    }

    public subtract(other: CurrencyAmount<T>): CurrencyAmount<T> {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        const subtracted = dn.sub(this.rawAmount, other.rawAmount);
        return CurrencyAmount.fromRawAmount(this.currency, subtracted);
    }

    public multiply(other: Numberish): CurrencyAmount<T> {
        const multiplied = dn.mul(this.rawAmount, other);
        return CurrencyAmount.fromRawAmount(this.currency, multiplied);
    }

    public divide(other: Numberish): CurrencyAmount<T> {
        const divided = dn.div(this.rawAmount, other);
        return CurrencyAmount.fromRawAmount(this.currency, divided);
    }

    public equalTo(other: CurrencyAmount<T>): boolean {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        return dn.equal(this.rawAmount, other.rawAmount);
    }

    public lessThan(other: CurrencyAmount<T>): boolean {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        return dn.lessThan(this.rawAmount, other.rawAmount);
    }

    public greaterThan(other: CurrencyAmount<T>): boolean {
        invariant(this.currency.equals(other.currency), 'CURRENCY');
        return dn.greaterThan(this.rawAmount, other.rawAmount);
    }

    public lessThanOrEqual(other: CurrencyAmount<T>): boolean {
        return this.lessThan(other) || this.equalTo(other);
    }

    public greaterThanOrEqual(other: CurrencyAmount<T>): boolean {
        return this.greaterThan(other) || this.equalTo(other);
    }

    public toSignificant(
        significantDigits: number = 6,
        rounding: Rounding = Rounding.ROUND_DOWN
    ): string {
        invariant(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
        invariant(significantDigits > 0, `${significantDigits} is not positive.`);

        const decimalRawAmount = new Decimal(this.rawAmount[0].toString()).div(10 ** this.rawAmount[1]);

        const toSignificantRounding = {
            [Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
            [Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
            [Rounding.ROUND_UP]: Decimal.ROUND_UP,
        };

        Decimal.set({
            precision: significantDigits + 1,
            rounding: toSignificantRounding[rounding],
        });

        const rounded = decimalRawAmount.toSignificantDigits(significantDigits);
        return rounded.toFixed(Math.min(rounded.decimalPlaces(), significantDigits));
    }

    public toFixed(
        decimalPlaces: number = this.currency.decimals,
        format: object = { groupSeparator: '' },
        rounding: Rounding = Rounding.ROUND_DOWN
    ): string {
        invariant(decimalPlaces <= this.currency.decimals, 'DECIMALS');

        return toFixed(this.rawAmount, decimalPlaces, format, rounding);
    }

    public toExact(): string {
        const decimalRawAmount = new Decimal(this.rawAmount[0].toString()).div(10 ** this.rawAmount[1]);
        return decimalRawAmount.toDecimalPlaces(this.currency.decimals).toString();
    }

    public get wrapped(): CurrencyAmount<Token> {
        if (this.currency.isToken) return this as CurrencyAmount<Token>;
        return CurrencyAmount.fromRawAmount(this.currency.wrapped, this.rawAmount);
    }
}
