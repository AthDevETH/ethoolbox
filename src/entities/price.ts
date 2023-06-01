import invariant from 'tiny-invariant';
import type { Currency } from './currency';
import { CurrencyAmount } from './currencyAmount';
import type { Dnum, Numberish } from '../types';
import * as dn from 'dnum';
import { Rounding } from '../constants';
import Decimal from 'decimal.js-light';


function pow10(exponent: number): Decimal {
    if (exponent >= 0) {
        return new Decimal(10 ** exponent);
    } else {
        return new Decimal(1).div(10 ** -exponent);
    }
}


export class Price<TBase extends Currency, TQuote extends Currency>   {
    public readonly baseCurrency: TBase; // input i.e. denominator
    public readonly quoteCurrency: TQuote; // output i.e. numerator
    public readonly scalar: Dnum; // used to adjust the raw fraction w/r/t the decimals of the {base,quote}Token
    public readonly rawPrice: Dnum; // the raw price, i.e. the fraction of the quote token amount over the base token amount

    /**
     * Construct a price, either with the base and quote currency amount, or the
     * @param args
     */
    public constructor(
        ...args:
            | [TBase, TQuote, Dnum]
            | [TBase, TQuote, Numberish, Numberish]
            | [{ baseAmount: CurrencyAmount<TBase>; quoteAmount: CurrencyAmount<TQuote> }]
    ) {
        let baseCurrency: TBase;
        let quoteCurrency: TQuote;

        if (args.length === 3) {
            [baseCurrency, quoteCurrency, this.rawPrice] = args;
        } else if (args.length === 4) {
            let denominator: Numberish;
            let numerator: Numberish;
            [baseCurrency, quoteCurrency, denominator, numerator] = args;
            const decimals = Math.max(baseCurrency.decimals, quoteCurrency.decimals);
            this.rawPrice = dn.div(numerator, denominator, decimals);
        } else {
            const result = args[0].quoteAmount.divide(args[0].baseAmount.rawAmount);
            [baseCurrency, quoteCurrency, this.rawPrice] = [
                args[0].baseAmount.currency,
                args[0].quoteAmount.currency,
                result.rawAmount,
            ];
        }

        this.baseCurrency = baseCurrency
        this.quoteCurrency = quoteCurrency
        this.scalar = dn.divide(10n ** BigInt(baseCurrency.decimals), 10n ** BigInt(quoteCurrency.decimals))
    }

    /**
     * Flip the price, switching the base and quote currency
     */
    public invert(): Price<TQuote, TBase> {
        return new Price(this.quoteCurrency, this.baseCurrency, dn.divide(1n, this.rawPrice));
    }

    /**
     * Multiply the price by another price, returning a new price. The other price must have the same base currency as this price's quote currency
     * @param other the other price
     */
    public multiply<TOtherQuote extends Currency>(other: Price<TQuote, TOtherQuote>): Price<TBase, TOtherQuote> {
        invariant(this.quoteCurrency.equals(other.baseCurrency), 'TOKEN')
        return new Price(this.baseCurrency, other.quoteCurrency, dn.mul(this.rawPrice, other.rawPrice));
    }

    /**
     * Return the amount of quote currency corresponding to a given amount of the base currency
     * @param currencyAmount the amount of base currency to quote against the price
     */
    public quote(currencyAmount: CurrencyAmount<TBase>): CurrencyAmount<TQuote> {
        invariant(currencyAmount.currency.equals(this.baseCurrency), 'TOKEN')
        return CurrencyAmount.fromRawAmount(this.quoteCurrency, dn.mul(currencyAmount.rawAmount, this.rawPrice));
    }

    /**
     * Get the value scaled by decimals for formatting
     */
    public get adjustedForDecimals(): Dnum {
        return dn.mul(this.rawPrice, this.scalar);
    }

    public toSignificant(
        significantDigits: number = 6,
        rounding: Rounding = Rounding.ROUND_DOWN
    ): string {
        invariant(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
        invariant(significantDigits > 0, `${significantDigits} is not positive.`);

        const decimalDifference = BigInt(this.baseCurrency.decimals) - BigInt(this.quoteCurrency.decimals);
        const decimalRawPrice = new Decimal(this.rawPrice[0].toString()).div(10 ** this.rawPrice[1]);

        const toSignificantRounding = {
            [Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
            [Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
            [Rounding.ROUND_UP]: Decimal.ROUND_UP,
        };

        Decimal.set({
            precision: significantDigits + 1,
            rounding: toSignificantRounding[rounding],
        });

        const rounded = decimalRawPrice.toSignificantDigits(significantDigits);
        const shifted = rounded.times(pow10(Number(decimalDifference)));
        const finalRounded = shifted.toSignificantDigits(significantDigits);

        return finalRounded.toFixed();
    }

    public toFixed(
        decimalPlaces: number = this.quoteCurrency.decimals,
        rounding: Rounding = Rounding.ROUND_DOWN
    ): string {
        invariant(decimalPlaces <= this.quoteCurrency.decimals, 'DECIMALS');

        const decimalRawPrice = new Decimal(this.rawPrice[0].toString()).div(10 ** this.rawPrice[1]);

        const toFixedRounding = {
            [Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
            [Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
            [Rounding.ROUND_UP]: Decimal.ROUND_UP,
        };

        Decimal.set({
            precision: decimalPlaces + 1,
            rounding: toFixedRounding[rounding],
        });

        return decimalRawPrice.toDecimalPlaces(decimalPlaces, toFixedRounding[rounding]).toFixed(decimalPlaces);
    }
}
