import { renderToStaticMarkup } from 'react-dom/server';
import { ReceiptTemplate } from '../components/ReceiptTemplate';

const getPrintableStyles = () => {
    return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');
};

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export const printReceipt = ({
    transaction,
    schoolInfo,
    onPopupBlocked,
}: {
    transaction: any;
    schoolInfo?: any;
    onPopupBlocked?: () => void;
}) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
        onPopupBlocked?.();
        return;
    }

    // 1. Detect if this is a bulk transaction and needs splitting
    let meta = transaction.meta;
    try { if (typeof meta === 'string') meta = JSON.parse(meta); } catch (e) { meta = {}; }
    meta = meta || {};

    let bulkAllocations = meta.bulkAllocations || [];
    try { if (typeof bulkAllocations === 'string') bulkAllocations = JSON.parse(bulkAllocations); } catch (e) { bulkAllocations = []; }

    const isBulk = Array.isArray(bulkAllocations) && bulkAllocations.length > 0;
    const printBulkAsCombined = Boolean(meta?.printBulkAsCombined);

    let receiptMarkup = '';

    if (isBulk && !printBulkAsCombined) {
        // Group allocations by student
        const studentMap: Record<string, { student: any, allocations: any[] }> = {};
        bulkAllocations.forEach((alloc: any) => {
            const sid = alloc.studentId || 'unknown';
            if (!studentMap[sid]) {
                studentMap[sid] = {
                    student: { 
                        firstName: alloc.studentName?.split(' ')[0] || transaction.student?.firstName,
                        lastName: alloc.studentName?.split(' ').slice(1).join(' ') || transaction.student?.lastName,
                        admissionNo: alloc.admissionNo || transaction.student?.admissionNo || 'N/A',
                        class: { name: alloc.className || transaction.student?.class?.name || 'N/A' },
                        id: sid
                    },
                    allocations: []
                };
            }
            studentMap[sid].allocations.push(alloc);
        });

        // Generate multiple split receipts
        receiptMarkup = Object.values(studentMap).map((group, idx) => {
            const splitTx = {
                ...transaction,
                student: group.student,
                amount: group.allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0).toFixed(2),
                meta: {
                    ...meta,
                    bulkAllocations: undefined,
                    allocations: group.allocations
                }
            };
            
            return `
                <div class="split-receipt-page" style="${idx > 0 ? 'page-break-before: always; margin-top: 20px;' : ''}">
                    ${renderToStaticMarkup(<ReceiptTemplate transaction={splitTx} schoolInfo={schoolInfo} />)}
                </div>
            `;
        }).join('');
    } else if (isBulk) {
        receiptMarkup = renderToStaticMarkup(
            <ReceiptTemplate
                transaction={{
                    ...transaction,
                    meta: {
                        ...meta,
                        allocations: bulkAllocations,
                    },
                }}
                schoolInfo={schoolInfo}
            />
        );
    } else {
        // Standard single receipt
        receiptMarkup = renderToStaticMarkup(
            <ReceiptTemplate transaction={transaction} schoolInfo={schoolInfo} />
        );
    }

    const styles = getPrintableStyles();
    const title = escapeHtml(`Receipt - ${transaction?.id || 'print'}`);

    printWindow.document.write(`
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>${title}</title>
                ${styles}
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }

                    body {
                        color: #000000;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    @page {
                        size: auto;
                        margin: 10mm;
                    }

                    @media print {
                        html, body {
                            background: #ffffff !important;
                        }

                        [data-receipt-card] {
                            margin: 0 !important;
                            min-height: auto !important;
                            padding: 18px !important;
                            display: block !important;
                            box-sizing: border-box !important;
                        }

                        [data-receipt-spacer] {
                            display: none !important;
                            height: 0 !important;
                            flex: 0 0 auto !important;
                        }

                        [data-receipt-table-section] {
                            margin-bottom: 18px !important;
                        }

                        [data-receipt-footer-group] {
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }

                        [data-receipt-footer] {
                            margin-top: 18px !important;
                            padding-top: 12px !important;
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div id="receipt-print-root">${receiptMarkup}</div>
                <script>
                    (function () {
                        const images = Array.from(document.images || []);
                        let completed = 0;
                        let printed = false;

                        const finish = () => {
                            if (printed) return;
                            
                            // Check if document is still loading
                            if (document.readyState !== 'complete') {
                                return;
                            }

                            printed = true;
                            
                            // Give the browser several frames to compute layout and apply styles
                            setTimeout(() => {
                                window.focus();
                                window.print();
                                
                                // Auto-close handler
                                window.addEventListener('mouseover', () => { setTimeout(() => window.close(), 500); }, { once: true });
                            }, 600); 
                        };

                        if (images.length === 0) {
                            // If no images, still wait for window load and a safety buffer
                            window.addEventListener('load', finish, { once: true });
                            setTimeout(finish, 2000); // Absolute safety fallback
                        } else {
                            const markDone = () => {
                                completed += 1;
                                if (completed >= images.length) {
                                    finish();
                                }
                            };

                            images.forEach((img) => {
                                if (img.complete) {
                                    markDone();
                                } else {
                                    img.addEventListener('load', markDone, { once: true });
                                    img.addEventListener('error', markDone, { once: true });
                                }
                            });
                        }

                        // Always listen for load as a secondary trigger
                        window.addEventListener('load', finish, { once: true });
                        
                        // If everything is already pre-cached, the load event and image complete checks 
                        // might have already fired, so we add a final safety check
                        if (document.readyState === 'complete') {
                            setTimeout(finish, 800);
                        }

                        window.addEventListener('afterprint', () => {
                            window.close();
                        }, { once: true });
                    })();
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
};
