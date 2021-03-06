// copyright defined in eosjs2/LICENSE.txt

'use strict';

const ecc = require('eosjs-ecc');
import { SignatureProvider, SignatureProviderArgs } from './index';

export default class JsSignatureProvider implements SignatureProvider {
    privateKeys: string[];

    constructor(privateKeys: string[]) {
        this.privateKeys = privateKeys;
    }

    async sign({ chainId, serializedTransaction }: SignatureProviderArgs) {
        let signBuf = Buffer.concat([new Buffer(chainId, 'hex'), new Buffer(serializedTransaction), new Buffer(new Uint8Array(32))]);
        return this.privateKeys.map(key => {
            return ecc.Signature.sign(signBuf, key).toString();
        });
    }
}
