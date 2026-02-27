
/**
 * Converts a number to words (for Naira currency format).
 * Handles numbers up to trillions.
 */
export function numberToWords(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) return '';
    if (num === 0) return 'Zero Naira Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    // Split integer and decimal parts
    const parts = num.toFixed(2).split('.');
    let integerPart = parseInt(parts[0], 10);
    const decimalPart = parseInt(parts[1], 10);

    let words = '';

    if (integerPart === 0) {
        words = 'Zero';
    } else {
        let scaleIndex = 0;
        while (integerPart > 0) {
            const chunk = integerPart % 1000;
            if (chunk > 0) {
                const chunkWords = convertChunk(chunk);
                words = chunkWords + (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') + (words ? ' ' + words : '');
            }
            integerPart = Math.floor(integerPart / 1000);
            scaleIndex++;
        }
    }

    words += ' Naira';

    if (decimalPart > 0) {
        words += ` and ${convertChunk(decimalPart)} Kobo`;
    }

    return words + ' Only';

    function convertChunk(n: number): string {
        let chunkWords = '';

        if (n >= 100) {
            chunkWords += units[Math.floor(n / 100)] + ' Hundred';
            n %= 100;
            if (n > 0) chunkWords += ' and ';
        }

        if (n > 0) {
            if (n < 20) {
                chunkWords += units[n];
            } else {
                chunkWords += tens[Math.floor(n / 10)];
                if (n % 10 > 0) {
                    chunkWords += '-' + units[n % 10];
                }
            }
        }
        return chunkWords;
    }
}
