export const ROOTSTOCK = {
    MAINNET_CHAIN_ID: 30,
    TESTNET_CHAIN_ID: 31,
    // Authenticated RPC URL from environment variables
    RPC_URL: (() => {
        const url = process.env.EXPO_PUBLIC_RSK_RPC_API_URL;
        const key = process.env.EXPO_PUBLIC_RSK_RPC_API_KEY;

        if (!url) return "https://public-node.rsk.co";
        if (!key) return url;

        // If URL already ends with key (ignoring trailing slash), return it as is
        if (url.includes(key)) return url;

        // Otherwise append properly
        return url.endsWith('/') ? `${url}${key}` : `${url}/${key}`;
    })(),

    // Legacy public endpoints
    MAINNET_RPC_URL: "https://public-node.rsk.co",
    TESTNET_RPC_URL: "https://public-node.testnet.rsk.co"
};
