export interface BlockscoutResponse<T> {
    status: string;
    message: string;
    result: T[];
}

export interface BlockscoutTx {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
}

export interface BlockscoutTokenTx extends BlockscoutTx {
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
}
