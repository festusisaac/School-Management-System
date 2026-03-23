/**
 * Currency Configuration
 * These values can be updated dynamically via updateCurrencyConfig.
 */
export let CURRENCY_CONFIG = {
    SYMBOL: '₦',
    CODE: 'NGN',
    LOCALE: 'en-NG',
};

export let CURRENCY_SYMBOL = CURRENCY_CONFIG.SYMBOL;

/**
 * Updates the global currency configuration.
 */
export const updateCurrencyConfig = (symbol: string, code: string) => {
    CURRENCY_CONFIG.SYMBOL = symbol;
    CURRENCY_CONFIG.CODE = code;
    CURRENCY_SYMBOL = symbol;
    
    // Attempt to guess locale based on code, or default to en-US if unknown
    // This is a simple mapping; for a real app, you might want a more comprehensive list.
    const localeMap: Record<string, string> = {
        'NGN': 'en-NG',
        'USD': 'en-US',
        'GBP': 'en-GB',
        'EUR': 'de-DE',
        'GHS': 'en-GH',
        'KES': 'en-KE',
    };
    CURRENCY_CONFIG.LOCALE = localeMap[code] || 'en-US';
};

/**
 * Formats a number as a currency string.
 * @param amount The number or string to format
 * @param includeSymbol Whether to include the currency symbol (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number | string | undefined | null,
    includeSymbol: boolean = true
): string => {
    if (amount === undefined || amount === null) return includeSymbol ? `${CURRENCY_SYMBOL}0` : '0';

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) return includeSymbol ? `${CURRENCY_SYMBOL}0` : '0';

    const formatted = numericAmount.toLocaleString(CURRENCY_CONFIG.LOCALE, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return includeSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
};

/**
 * Formats a number as a currency string without decimals if they are .00
 * @param amount The number or string to format
 * @returns Formatted currency string
 */
export const formatCurrencyCompact = (
    amount: number | string | undefined | null
): string => {
    if (amount === undefined || amount === null) return `${CURRENCY_SYMBOL}0`;

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numericAmount)) return `${CURRENCY_SYMBOL}0`;

    const formatted = numericAmount.toLocaleString(CURRENCY_CONFIG.LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    return `${CURRENCY_SYMBOL}${formatted}`;
};

/**
 * Converts a number to its word representation in currency.
 * @param amount The number or string to convert
 * @returns Amount in words string
 */
export const currencyToWords = (amount: number | string | undefined | null): string => {
    const majorMinorMap: Record<string, [string, string]> = {
        'NGN': ['Naira', 'Kobo'],
        'USD': ['Dollars', 'Cents'],
        'GBP': ['Pounds', 'Pence'],
        'EUR': ['Euros', 'Cents'],
        'GHS': ['Cedis', 'Pesewas'],
        'KES': ['Shillings', 'Cents'],
    };

    const [major, minor] = majorMinorMap[CURRENCY_CONFIG.CODE] || ['Units', 'Sub-units'];

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    if (isNaN(numericAmount) || numericAmount === 0) return `Zero ${major} Only`;

    // ... (rest of units, teens, tens, scales remains same)
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    const convertChunk = (num: number): string => {
        let chunk = '';
        if (num >= 100) {
            chunk += units[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
            if (num > 0) chunk += 'and ';
        }
        if (num >= 10 && num < 20) {
            chunk += teens[num - 10] + ' ';
        } else {
            if (num >= 20) {
                chunk += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            }
            if (num > 0) {
                chunk += units[num] + ' ';
            }
        }
        return chunk;
    };

    const parts = (numericAmount || 0).toFixed(2).split('.');
    let integerPart = parseInt(parts[0] || '0');
    const fractionalPart = parseInt(parts[1] || '0');

    let words = '';
    if (integerPart === 0) {
        words = 'Zero ';
    } else {
        let scaleIdx = 0;
        while (integerPart > 0) {
            const chunk = integerPart % 1000;
            if (chunk > 0) {
                const chunkWords = convertChunk(chunk);
                words = chunkWords + scales[scaleIdx] + (words ? ', ' : '') + words;
            }
            integerPart = Math.floor(integerPart / 1000);
            scaleIdx++;
        }
    }

    words = words.trim() + ` ${major}`;

    if (fractionalPart > 0) {
        words += ', ' + convertChunk(fractionalPart).trim() + ` ${minor}`;
    }

    return words + ' Only';
};
