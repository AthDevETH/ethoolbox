import invariant from 'tiny-invariant';
import { Rounding } from '../constants';
import type { Dnum, Numberish } from '../types';
import { toFixed } from '../format';
import * as dn from 'dnum';
import Decimal from 'decimal.js-light';


const ONE_HUNDRED = dn.from(100);

/**
 * Converts a fraction to a percentage
 * @param numerator the numerator of the fractional token amount
 * @param denominator the denominator of the fractional token amount
 */
function toPercentage(numerator: Numberish, denominator: Numberish = 1n): Percentage {
    return new Percentage(numerator, denominator);
}


export class Percentage {
    public readonly rawAmount: Dnum;

    constructor(numerator: Numberish, denominator: Numberish = 1n, decimals: number = 18) {
        this.rawAmount = dn.div(numerator, denominator, decimals);
    }

    add(other: Numberish | Percentage): Percentage {
        const otherAmount = other instanceof Percentage ? other.rawAmount : other;
        return toPercentage(dn.add(this.rawAmount, otherAmount));
    }

    subtract(other: Numberish | Percentage): Percentage {
        const otherAmount = other instanceof Percentage ? other.rawAmount : other;
        return toPercentage(dn.sub(this.rawAmount, otherAmount));
    }

    multiply(other: Numberish | Percentage): Percentage {
        const otherAmount = other instanceof Percentage ? other.rawAmount : other;
        return toPercentage(dn.mul(this.rawAmount, otherAmount));
    }

    divide(other: Numberish | Percentage): Percentage {
        const otherAmount = other instanceof Percentage ? other.rawAmount : other;
        return toPercentage(dn.div(this.rawAmount, otherAmount));
    }

    public toSignificant(significantDigits: number = 5, rounding: Rounding = Rounding.ROUND_HALF_UP): string {
        invariant(Number.isInteger(significantDigits), `${significantDigits} is not an integer.`);
        invariant(significantDigits > 0, `${significantDigits} is not positive.`);

        // Convert rawAmount to a Decimal instance
        const decimalRawAmount = new Decimal(this.rawAmount[0].toString()).div(10 ** this.rawAmount[1]);

        const toSignificantRounding = {
            [Rounding.ROUND_DOWN]: Decimal.ROUND_DOWN,
            [Rounding.ROUND_HALF_UP]: Decimal.ROUND_HALF_UP,
            [Rounding.ROUND_UP]: Decimal.ROUND_UP
        };

        // Set the Decimal configuration
        Decimal.set({
            precision: significantDigits + 1,
            rounding: toSignificantRounding[rounding]
        });

        // Calculate the significant digits
        const quotient = decimalRawAmount
            .mul(100)
            .toSignificantDigits(significantDigits);

        // Format the result
        const formattedQuotient = quotient.toFixed(Math.min(quotient.decimalPlaces(), significantDigits));

        return formattedQuotient;
    }

    public toFixed(decimalPlaces: number = 2, format: object = { groupSeparator: '' }, rounding: Rounding = Rounding.ROUND_HALF_UP): string {
        const value = dn.multiply(this.rawAmount, ONE_HUNDRED);
        return toFixed(value, decimalPlaces, format, rounding);
    }
}
