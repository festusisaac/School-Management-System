/**
 * Utility functions for transaction processing and display
 */

/**
 * Returns a human-readable payment method, including specific gateway channels if available.
 * @param transaction The transaction object from the API
 * @returns Formatted payment method string (e.g., "Online (Card)", "Cash")
 */
export const getDetailedPaymentMethod = (transaction: any): string => {
    if (!transaction) return 'N/A';
    
    const { paymentMethod, meta, type } = transaction;
    
    // For Refunds, we usually just show REFUND, but we can also show the original method if needed
    if (type === 'REFUND') return 'REFUND';
    if (type === 'WAIVER') return 'WAIVER';

    if (paymentMethod !== 'ONLINE') {
        return (paymentMethod || 'CASH').replace(/_/g, ' ');
    }

    // Try to get channel from Paystack
    if (meta?.paystackData?.channel) {
        const channel = meta.paystackData.channel;
        return `Online (${channel.charAt(0).toUpperCase() + channel.slice(1)})`;
    }

    // Try to get channel from Flutterwave
    if (meta?.flutterwaveData?.payment_type) {
        const type = meta.flutterwaveData.payment_type;
        return `Online (${type.charAt(0).toUpperCase() + type.slice(1)})`;
    }

    return 'Online';
};
