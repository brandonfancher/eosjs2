// copyright defined in eosjs2/LICENSE.txt

export class RpcError extends Error {
    json: any;
    constructor(json: any) {
        if (json.error && json.error.details && json.error.details.length && json.error.details[0].message)
            super(json.error.details[0].message)
        else if (json.processed && json.processed.except && json.processed.except.message)
            super(json.processed.except.message);
        else
            super(json.message);
        this.json = json;
    }
}

export interface Abi {
    version: string;
    types: { new_type_name: string, type: string }[];
    structs: { name: string, base: string, fields: { name: string, type: string }[] }[];
    actions: { name: string, type: string, ricardian_contract: string }[];
}

export interface GetAbiResult {
    account_name: string;
    abi: Abi;
}

export interface BlockTaposInfo {
    timestamp: string;
    block_num: number;
    ref_block_prefix: number;
}

export interface GetBlockResult {
    timestamp: string;
    producer: string;
    confirmed: number;
    previous: string;
    transaction_mroot: string;
    action_mroot: string;
    schedule_version: number;
    producer_signature: string;
    id: string;
    block_num: number;
    ref_block_prefix: number;
}

export interface GetCodeResult {
    account_name: string;
    code_hash: string;
    wast: string;
    wasm: string;
    abi: Abi;
}

export interface GetInfoResult {
    server_version: string;
    chain_id: string;
    head_block_num: number;
    last_irreversible_block_num: number;
    last_irreversible_block_id: string;
    head_block_id: string;
    head_block_time: string;
    head_block_producer: string;
    virtual_block_cpu_limit: number;
    virtual_block_net_limit: number;
    block_cpu_limit: number;
    block_net_limit: number;
}

export interface PushTransactionArgs {
    signatures: string[];
    serializedTransaction: Uint8Array;
};

function arrayToHex(data: Uint8Array) {
    let result = '';
    for (let x of data)
        result += ('00' + x.toString(16)).slice(-2);
    return result;
}

export class JsonRpc {
    endpoint: string;
    fetchBuiltin: (input?: Request | string, init?: RequestInit) => Promise<Response>;

    constructor(endpoint: string, args: any = {}) {
        this.endpoint = endpoint;
        if (args.fetch)
            this.fetchBuiltin = args.fetch;
        else
            this.fetchBuiltin = (<any>global).fetch;
    }

    async fetch(path: string, body: any) {
        let response, json;
        try {
            let f = this.fetchBuiltin;
            response = await f(this.endpoint + path, {
                body: JSON.stringify(body),
                method: 'POST',
            });
            json = await response.json();
            if (json.processed && json.processed.except)
                throw new RpcError(json);
        } catch (e) {
            e.isFetchError = true;
            throw e;
        }
        if (!response.ok)
            throw new RpcError(json);
        return json;
    }

    async get_abi(account_name: string): Promise<GetAbiResult> { return await this.fetch('/v1/chain/get_abi', { account_name }); }
    async get_account(account_name: string): Promise<any> { return await this.fetch('/v1/chain/get_account', { account_name }); }
    async get_block(block_num_or_id: number | string): Promise<GetBlockResult> { return await this.fetch('/v1/chain/get_block', { block_num_or_id }); }
    async get_code(account_name: string): Promise<GetCodeResult> { return await this.fetch('/v1/chain/get_code', { account_name }); }
    async get_info(): Promise<GetInfoResult> { return await this.fetch('/v1/chain/get_info', {}); }

    async get_table_rows({
        json = true,
        code,
        scope,
        table,
        table_key = '',
        lower_bound = '',
        upper_bound = '',
        limit = 10 }: any): Promise<any> {

        return await this.fetch(
            '/v1/chain/get_table_rows', {
                json,
                code,
                scope,
                table,
                table_key,
                lower_bound,
                upper_bound,
                limit
            });
    }

    async push_transaction({ signatures, serializedTransaction }: PushTransactionArgs): Promise<any> {
        return await this.fetch('/v1/chain/push_transaction', {
            signatures,
            compression: 0,
            packed_context_free_data: '',
            packed_trx: arrayToHex(serializedTransaction),
        });
    }
} // JsonRpc
