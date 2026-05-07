import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { TokenSymbol } from '@/core/config/tokens';
import { sendService, FeeResult } from '@/core/services/SendService';
import { WalletBalances } from '@/core/types/TokenBalance';

interface UseSendTransactionProps {
    initialToken: TokenSymbol;
    balances: WalletBalances;
    walletAddress: string | null;
}

export function useSendTransaction({ initialToken, balances, walletAddress }: UseSendTransactionProps) {
    const [selectedToken, setSelectedToken] = useState<TokenSymbol>(initialToken);
    const [toAddress, setToAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isAddressValid, setIsAddressValid] = useState(true);
    const [feeResult, setFeeResult] = useState<FeeResult | null>(null);
    const [calculatingFee, setCalculatingFee] = useState(false);
    const [errorData, setErrorData] = useState<{ field: 'address' | 'amount' | 'fee'; message: string } | null>(null);

    const estimateFee = useCallback(
        async (token: TokenSymbol, to: string, amt: string) => {
            if (!ethers.isAddress(to) || !walletAddress) return;

            setCalculatingFee(true);
            setFeeResult(null);
            setErrorData(null); 

            try {
                const result = await sendService.estimateSendFee({
                    token,
                    to,
                    amount: amt || '0',
                    from: walletAddress
                });
                setFeeResult(result);
            } catch (error) {
                console.error('Fee estimation error:', error);
                setErrorData({ field: 'fee', message: 'Failed to estimate gas fee' });
            } finally {
                setCalculatingFee(false);
            }
        },
        [walletAddress]
    );

    useEffect(() => {
        const handler = setTimeout(() => {
            if (walletAddress && ethers.isAddress(toAddress)) {
                estimateFee(selectedToken, toAddress, amount);
            } else {
                setFeeResult(null);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [selectedToken, toAddress, amount, walletAddress, estimateFee]);

    const handleAddressChange = (text: string) => {
        setToAddress(text);
        const valid = text === '' || ethers.isAddress(text);
        setIsAddressValid(valid);
        
        if (text !== '' && !valid) {
            setErrorData({ field: 'address', message: 'Invalid address format' });
        } else {
            if (errorData?.field === 'address') setErrorData(null);
        }
    };

    const handleAmountChange = (text: string) => {
        const normalizedText = text.replace(',', '.');
        if (/^\d*\.?\d*$/.test(normalizedText) || text === '') {
            setAmount(normalizedText);
            if (errorData?.field === 'amount') setErrorData(null);
        }
    };

    const handleSetMax = () => {
        const balance = balances[selectedToken]?.formatted || '0';

        if (selectedToken === 'RBTC' && feeResult) {
            const feeVal = parseFloat(feeResult.formattedFee);
            const balanceVal = parseFloat(balance);
            const max = Math.max(0, balanceVal - feeVal * 1.5);
            setAmount(max.toFixed(6));
        } else {
            setAmount(balance);
        }
    };

    const validateBeforeReview = () => {
        if (!walletAddress) return false;
        if (!isAddressValid || !toAddress) {
            setErrorData({ field: 'address', message: 'Valid address required' });
            return false;
        }

        const amtVal = parseFloat(amount || '0');
        if (amtVal <= 0) {
            setErrorData({ field: 'amount', message: 'Amount must be greater than 0' });
            return false;
        }

        const balanceVal = parseFloat(balances[selectedToken]?.formatted || '0');
        if (amtVal > balanceVal) {
            setErrorData({ field: 'amount', message: 'Insufficient balance' });
            return false;
        }

        if (selectedToken === 'LUT' && feeResult) {
            const rbtcBalance = parseFloat(balances.RBTC?.formatted || '0');
            const feeVal = parseFloat(feeResult.formattedFee);
            if (feeVal > rbtcBalance) {
                setErrorData({ field: 'fee', message: 'Insufficient RBTC for network fee' });
                return false;
            }
        }

        return true;
    };

    return {
        selectedToken,
        setSelectedToken,
        toAddress,
        handleAddressChange,
        amount,
        handleAmountChange,
        handleSetMax,
        isAddressValid,
        feeResult,
        calculatingFee,
        errorData,
        validateBeforeReview
    };
}
