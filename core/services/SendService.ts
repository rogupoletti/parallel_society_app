import { ethers } from 'ethers';
import { TOKENS, TokenSymbol } from '../config/tokens';
import { ROOTSTOCK } from '../config/RootstockConfig';

// Minimal ERC-20 ABI for transfer and estimateGas
const ERC20_ABI = [
    'function transfer(address to, uint256 value) public returns (bool)',
    'function estimateGas(address to, uint256 value) public view returns (uint256)' // Note: ethers handles this via contract.estimateGas.transfer
];

export interface SendTransactionParams {
    token: TokenSymbol;
    to: string;
    amount: string; // Human readable amount
    wallet: ethers.Wallet;
    gasLimit?: bigint;
    gasPrice?: bigint;
}

export interface EstimateFeeParams {
    token: TokenSymbol;
    to: string;
    amount: string;
    from: string; // Needed for estimateGas
}

export interface FeeResult {
    gasLimit: bigint;
    gasPrice: bigint;
    totalFee: bigint; // In Wei (RBTC)
    formattedFee: string; // In RBTC
}

class SendService {
    private provider: ethers.JsonRpcProvider;

    constructor(rpcUrl?: string) {
        const defaultUrl = ROOTSTOCK.RPC_URL;
        this.provider = new ethers.JsonRpcProvider(rpcUrl || defaultUrl);
    }

    /**
     * Estimates the gas fee for a transaction
     */
    async estimateSendFee({ token, to, amount, from }: EstimateFeeParams): Promise<FeeResult> {
        let gasLimit: bigint;
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice ?? BigInt(60000000); // Default to 0.06 Gwei if null

        try {
            if (token === 'RBTC') {
                const value = ethers.parseEther(amount || '0');
                // Estimate gas for native transfer
                gasLimit = await this.provider.estimateGas({
                    from,
                    to,
                    value
                });
            } else {
                // ERC-20 Token Transfer
                const tokenConfig = TOKENS[token];
                if (!tokenConfig.address) throw new Error('Token address not found');

                const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, this.provider);
                const value = ethers.parseUnits(amount || '0', tokenConfig.decimals);

                // Ethers v6 contract.getFunction('transfer').estimateGas
                gasLimit = await contract.getFunction('transfer').estimateGas(to, value, { from });
            }

            // Buffer gas limit by 10% for safety
            const bufferedGasLimit = (gasLimit * BigInt(110)) / BigInt(100);

            const totalFee = bufferedGasLimit * gasPrice;
            const formattedFee = ethers.formatEther(totalFee);

            return {
                gasLimit: bufferedGasLimit,
                gasPrice,
                totalFee,
                formattedFee
            };

        } catch (error) {
            console.error('Gas estimation failed:', error);
            // Fallback gas limits
            const fallbackLimit = token === 'RBTC' ? BigInt(21000) : BigInt(100000);
            const totalFee = fallbackLimit * gasPrice;
            return {
                gasLimit: fallbackLimit,
                gasPrice,
                totalFee,
                formattedFee: ethers.formatEther(totalFee)
            };
        }
    }

    /**
     * Broadcasts a transaction to the network
     */
    async sendTransaction({ token, to, amount, wallet, gasLimit, gasPrice }: SendTransactionParams): Promise<ethers.TransactionResponse> {
        // Connect wallet to provider
        const connectedWallet = wallet.connect(this.provider);

        if (token === 'RBTC') {
            const value = ethers.parseEther(amount);
            return await connectedWallet.sendTransaction({
                to,
                value,
                gasLimit,
                gasPrice
            });
        } else {
            const tokenConfig = TOKENS[token];
            if (!tokenConfig.address) throw new Error('Token address not found');

            const contract = new ethers.Contract(tokenConfig.address, ERC20_ABI, connectedWallet);
            const value = ethers.parseUnits(amount, tokenConfig.decimals);

            // For contract calls, we pass overrides as the last argument
            return await contract.transfer(to, value, {
                gasLimit,
                gasPrice
            });
        }
    }
}

export const sendService = new SendService();
