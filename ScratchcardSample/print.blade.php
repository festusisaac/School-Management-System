<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Scratch Cards - {{ $batch->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: #fff; color: #111; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.4; }
        
        .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 12mm;
            background: #fff;
            page-break-after: always;
        }

        .page-header {
            display: none;
        }

        .school-name {
            font-size: 16px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 2mm;
        }

        .batch-info {
            font-size: 11px;
            color: #666;
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
            margin-top: 4mm;
        }

        .card-wrapper {
            page-break-inside: avoid;
        }

        /* Professional Card Design */
        .card {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 2px solid #4f46e5;
            border-radius: 8px;
            padding: 10mm;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
            position: relative;
            min-height: 90mm;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s;
        }

        /* Perforated border effect */
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
                repeating-linear-gradient(0deg, transparent, transparent 4px, #4f46e5 4px, #4f46e5 6px),
                repeating-linear-gradient(90deg, transparent, transparent 4px, #4f46e5 4px, #4f46e5 6px);
            background-size: 100% 6px, 6px 100%;
            background-position: 0 0, 0 0;
            background-repeat: repeat-x, repeat-y;
            pointer-events: none;
            opacity: 0;
            border-radius: 6px;
            z-index: -1;
        }

        .card-top {
            margin-bottom: 8mm;
        }

        .school-badge {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 2mm 4mm;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
        }

        .card-title {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 3mm;
        }

        .card-divider {
            height: 1px;
            background: linear-gradient(to right, #4f46e5, transparent);
            margin: 4mm 0;
        }

        .card-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .code-section {
            margin-bottom: 4mm;
        }

        .code-label {
            font-size: 8px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1mm;
        }

        .code {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: 700;
            color: #4f46e5;
            letter-spacing: 1px;
            word-break: break-all;
            padding: 2mm;
            background: rgba(79, 70, 229, 0.05);
            border-radius: 4px;
            border-left: 3px solid #4f46e5;
        }

        .pin-section {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.08), rgba(99, 102, 241, 0.03));
            padding: 4mm;
            border-radius: 6px;
            margin-bottom: 4mm;
        }

        .pin-label {
            font-size: 8px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2mm;
        }

        .pin {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 700;
            color: #4f46e5;
            letter-spacing: 2px;
            word-break: break-all;
            text-align: center;
        }

        .card-footer {
            margin-top: 4mm;
            padding-top: 3mm;
            border-top: 1px dashed #e5e7eb;
            text-align: center;
        }

        .value-badge {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 2mm 6mm;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 2mm;
        }

        .terms {
            font-size: 7px;
            color: #999;
            line-height: 1.3;
        }

        .terms p {
            margin: 1mm 0;
        }

        .cut-line {
            text-align: center;
            font-size: 8px;
            color: #ccc;
            margin-top: 2mm;
            letter-spacing: 2px;
        }

        /* Print optimizations */
        @media print {
            :root { color-scheme: light; }
            body, html { margin: 0; padding: 0; background: #fff; }
            .page { margin: 0; padding: 12mm; page-break-after: always; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 0; }
        }

        /* Screen preview only */
        @media screen {
            body { background: #f3f4f6; padding: 10mm; }
            .page { margin-bottom: 10mm; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        }

        .print-controls {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
        }

        .print-btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: background 0.2s;
        }

        .print-btn:hover {
            background: #4338ca;
        }
    </style>
</head>
<body>
    @php
        $cardsPerPage = 4; // 2x2 grid
        $pages = array_chunk($cards->all(), $cardsPerPage);
    @endphp

    @foreach($pages as $pageCards)
    <div class="page">
        <div class="page-header">
            <div class="school-name">{{ env('SCHOOL_NAME', 'School') }}</div>
            <div class="batch-info">Scratch Card Batch: {{ $batch->name }} | Serial: {{ $batch->id }}</div>
        </div>

        <div class="cards-grid">
            @foreach($pageCards as $card)
                <div class="card-wrapper">
                    <div class="card">
                        <div class="card-top">
                            <div class="school-badge">{{ env('SCHOOL_NAME', 'School') }}</div>
                            <div class="card-title">{{ $batch->name }}</div>
                        </div>

                        <div class="card-divider"></div>

                        <div class="card-content">
                            <div>
                                <div class="code-section">
                                    <div class="code-label">Serial Number</div>
                                    <div class="code">{{ $card->code }}</div>
                                </div>

                                <div class="pin-section">
                                    <div class="pin-label">Activation PIN</div>
                                    <div class="pin">{{ $card->pin }}</div>
                                </div>
                            </div>

                            <div class="card-footer">
                                @if($card->value > 0)
                                    <div class="value-badge">₦ {{ number_format($card->value, 2) }}</div>
                                @endif
                                <div class="terms">
                                    <p><strong>Terms:</strong> For single use only. Non-transferable.</p>
                                    <p><strong>Valid:</strong> Until {{ $card->expiry_date ? date('M d, Y', strtotime($card->expiry_date)) : 'Indefinite' }}</p>
                                </div>
                                <div class="cut-line">✂ ✂ ✂ ✂ ✂</div>
                            </div>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
    @endforeach

    <div class="no-print print-controls">
        <button class="print-btn" onclick="window.print()">🖨️ Print Cards</button>
    </div>

    <script>
        // Auto-open print dialog when page loads (only in new tab context)
        window.addEventListener('load', function(){
            // Check if opened in new tab/window (referrer is empty or different origin)
            if (!document.referrer || document.referrer.indexOf(window.location.origin) === -1) {
                setTimeout(function(){ 
                    try { window.print(); } catch(e) { console.error(e); }
                }, 500);
            }
        });
    </script>
</body>
</html>
