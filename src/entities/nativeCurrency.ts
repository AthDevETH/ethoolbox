import type { Address } from 'viem';
import { BaseCurrency } from './baseCurrency';
import { Token } from './token';
import { checkValidAddress, validateAndParseAddress } from '../validate';

/**
 * Represents the native currency of the chain on which it resides
 */
export class NativeCurrency extends BaseCurrency {
    public readonly isNative: true = true;
    public readonly isToken: false = false;
    public readonly wrapped: Token;


    public constructor(
        chainId: number,
        decimals: number,
        symbol: string,
        name: string,
        logoURI: string,
        wrappedAddress: Address,
        bypassChecksum?: boolean
    ) {
        super(chainId, decimals, symbol, name, logoURI);

        if (bypassChecksum) {
            wrappedAddress = checkValidAddress(wrappedAddress);
        } else {
            wrappedAddress = validateAndParseAddress(wrappedAddress);
        }
        this.wrapped = new Token(chainId, wrappedAddress, decimals, symbol, name);
    }


    public equals(other: NativeCurrency | Token): boolean {
        return other.isNative && other.chainId === this.chainId;
    }
}
