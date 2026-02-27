<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Student Report</title>
    <style>
        @page { 
            margin: 5mm; 
            size: A4 portrait; 
        }
        
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px; /* Increased from 10px */
            margin: 0;
            padding: 5mm;
            color: #000;
            background: white;
            line-height: 1.2; /* Increased from 1.1 */
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed; /* Force table to respect widths */
        }
        
        td, th {
            padding: 3px; /* Increased from 2px */
            vertical-align: middle;
            word-wrap: break-word; /* Ensure long text wraps */
            overflow-wrap: break-word;
        }
        
        .main-container {
            /* border: 2px solid #2aa06c; Removed outer border */
            padding: 0px;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
            background: white;
        }
        
        .header-table {
            background-color: #eaf6f0;
            border: 1px solid #2aa06c;
            margin-bottom: 4px; /* Increased from 2px */
        }
        
        .logo {
            width: 60px; /* Increased from 50px */
            height: 60px; /* Increased from 50px */
            object-fit: contain;
        }
        
        .school-name {
            font-size: 16px; /* Increased from 14px */
            font-weight: bold;
            color: #000;
            text-transform: uppercase;
        }
        
        .term-header {
            text-align: center;
            font-weight: bold;
            font-size: 12px; /* Increased from 11px */
            margin: 4px 0; /* Increased from 2px */
            text-transform: uppercase;
        }
        
        .bordered-table td, .bordered-table th {
            border: 1px solid #218b12ff;
        }
        
        .header-bg {
            background-color: #d9ead3;
            font-weight: bold;
            text-align: center;
        }
        
        .text-center { text-align: center; }
        .text-bold { font-weight: bold; }
        
        .section-header {
            background-color: #d9ead3;
            border: 1px solid #2aa06c;
            text-align: center;
            font-weight: bold;
            padding: 2px; /* Increased from 1px */
            margin-top: 4px; /* Increased from 2px */
        }
        
        .no-border { border: none !important; }
        .check-mark { font-family: 'DejaVu Sans', sans-serif; }
        
        /* Print-specific styles */
        @media print {
            @page {
                margin: 5mm;
                size: A4 portrait;
            }
            
            body {
                margin: 0;
                padding: 0;
                background: white;
            }
            
            .main-container {
                /* border: 2px solid #2aa06c; Removed outer border */
                padding: 0px;
                width: 100%;
                max-width: 100%;
                margin: 0;
            }
            
            /* Ensure backgrounds print */
            .header-table,
            .header-bg,
            .section-header {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* Prevent page breaks in critical sections */
            table {
                page-break-inside: auto;
            }
            
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            
            /* Reduce signature height for print to prevent page breaks */
            .signature-img {
                height: 25px !important; /* Increased from 15px */
                max-width: 80px !important;
            }
            
            /* Prevent page breaks in footer */
            .footer-section {
                page-break-inside: avoid !important;
            }
            
            .footer-section td {
                padding: 3px 5px !important;
            }
        }
        
        /* Screen view - center content */
        @media screen {
            body {
                background: #f5f5f5;
                padding: 20px;
            }
            
            .main-container {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        }
    </style>
    @if(isset($isPdf) && $isPdf)
    <style>
        @page { margin: 10px; }
        body {
            font-size: 10px !important; /* Increased from 9px */
            padding: 0 !important;
        }
        td, th {
            padding: 2px !important; /* Increased from 1px */
        }
        .header-table { margin-bottom: 2px !important; }
        .term-header { margin: 2px 0 !important; font-size: 11px !important; }
        .section-header { margin-top: 2px !important; padding: 1px !important; }
        .logo { width: 50px !important; height: 50px !important; }
        /* Adjust photo and stamp sizes for PDF */
        .photo-container { width: 95px !important; height: 100px !important; }
        .stamp-container { height: 70px !important; }
        /* Reduce signature height for PDF to prevent page breaks */
        .signature-img { height: 20px !important; max-width: 80px !important; }
        /* Reduce footer padding for PDF */
        .footer-section { page-break-inside: avoid !important; }
        .footer-section td { padding: 3px 5px !important; }
    </style>
    @endif
</head>
<body>
    <div class="main-container">
        <!-- Header -->
        <table class="header-table">
            <tr>
                <td width="15%" align="center" style="padding: 5px;">
                    @if(!empty($settings['school_logo']))
                        @if(isset($isPdf) && $isPdf)
                            <img src="{{ public_path('storage/' . $settings['school_logo']) }}" class="logo">
                        @else
                            <img src="{{ asset('storage/' . $settings['school_logo']) }}" class="logo">
                        @endif
                    @else
                        <div style="width:60px;height:60px;background:#9333ea;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;">LOGO</div>
                    @endif
                </td>
                <td align="center">
                    <div class="school-name">{{ $settings['result_title'] ?? 'HISGRACE INTERNATIONAL SCHOOL' }}</div>
                    <div>{{ $settings['school_address'] ?? 'Lagos, Nigeria' }}</div>
                    <div style="font-style: italic; margin-top: 2px;">"{{ $settings['school_motto'] ?? 'Excellence & Integrity' }}"</div>
                </td>
                <td width="15%" align="center" style="padding: 5px;">
                    @if(!empty($settings['school_logo']))
                        @if(isset($isPdf) && $isPdf)
                            <img src="{{ public_path('storage/' . $settings['school_logo']) }}" class="logo">
                        @else
                            <img src="{{ asset('storage/' . $settings['school_logo']) }}" class="logo">
                        @endif
                    @else
                        <div style="width:60px;height:60px;background:#9333ea;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;">LOGO</div>
                    @endif
                </td>
            </tr>
        </table>

        <div class="term-header">
            {{ $student->session->name ?? 'SESSION' }} {{ strtoupper($currentTerm->term_name ?? 'TERM') }} REPORT SHEET
        </div>

        <!-- Student Info Grid (Using nested tables for layout) -->
        <table style="margin-bottom: 4px;">
            <tr>
                <!-- Col 1: Personal Data -->
                <td width="35%" style="vertical-align: top; padding: 0 2px 0 0;">
                    <table class="bordered-table">
                        <tr><th colspan="2" class="header-bg">STUDENT'S PERSONAL DATA</th></tr>
                        <tr><td>Name</td><td class="text-bold">{{ strtoupper($student->full_name) }}</td></tr>
                        <tr><td>Date of Birth</td><td>{{ optional($student->dob)->format('d/m/Y') ?? '' }}</td></tr>
                        <tr><td>Sex</td><td>{{ strtoupper($student->gender ?? '') }}</td></tr>
                        <tr><td>Class</td><td>{{ $student->classRoom->name ?? '' }}</td></tr>
                        <tr><td>Admission No.</td><td>{{ $student->adm_no ?? '' }}</td></tr>
                    </table>
                </td>
                
                <!-- Col 2: Photo -->
                <td width="15%" style="vertical-align: top; padding: 0 2px;">
                    <div class="photo-container" style="height: 100px; width: 95px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; overflow: hidden; margin: 0 auto;">
                        @if($student->passport)
                            @if(isset($isPdf) && $isPdf)
                                <img src="{{ public_path('storage/' . $student->passport) }}" style="width:100%;height:100%;object-fit:cover;">
                            @else
                                <img src="{{ asset('storage/' . $student->passport) }}" style="width:100%;height:100%;object-fit:cover;">
                            @endif
                        @else
                            <span style="color: #ccc; font-size: 10px;">PHOTO</span>
                        @endif
                    </div>
                </td>

                <!-- Col 3: Attendance & Duration -->
                <td width="30%" style="vertical-align: top; padding: 0 2px;">
                    <table class="bordered-table" style="margin-bottom: 3px;">
                        <tr><th colspan="3" class="header-bg">ATTENDANCE</th></tr>
                        <tr style="font-size: 9px;">
                            <td class="text-center">No. of Times<br>School Opened</td>
                            <td class="text-center">No. of Times<br>Present</td>
                            <td class="text-center">No. of Times<br>Absent</td>
                        </tr>
                        <tr>
                            <td class="text-center">{{ $attendanceData['school_opened'] }}</td>
                            <td class="text-center">{{ $attendanceData['times_present'] }}</td>
                            <td class="text-center">{{ $attendanceData['times_absent'] }}</td>
                        </tr>
                    </table>
                    <table class="bordered-table">
                        <tr><th colspan="3" class="header-bg">TERMINAL DURATION ({{ $currentTerm->terminal_duration ?? '' }})</th></tr>
                        <tr style="font-size: 9px;">
                            <td class="text-center">Term Begins</td>
                            <td class="text-center">Term Ends</td>
                            <td class="text-center">Next Term Begins</td>
                        </tr>
                        <tr>
                            <td class="text-center">{{ optional($currentTerm->term_begins)->format('d/m/Y') ?? '' }}</td>
                            <td class="text-center">{{ optional($currentTerm->term_ends)->format('d/m/Y') ?? '' }}</td>
                            <td class="text-center">{{ optional($currentTerm->next_term_begins)->format('d/m/Y') ?? '' }}</td>
                        </tr>
                    </table>
                </td>

                <!-- Col 4: Summary -->
                <td width="20%" style="vertical-align: top; padding: 0 0 0 2px;">
                    <table class="bordered-table" style="margin-bottom: 3px;">
                        <tr>
                            <td class="text-bold text-center" style="font-size: 9px;">TOTAL SCORE<br>OBTAINABLE</td>
                            <td class="text-center text-bold">{{ $summary['total_obtainable'] ?? 0 }}</td>
                        </tr>
                        <tr>
                            <td class="text-bold text-center" style="font-size: 9px;">TOTAL SCORE<br>OBTAINED</td>
                            <td class="text-center text-bold">{{ $summary['total_score'] ?? 0 }}</td>
                        </tr>
                        <tr>
                            <td class="text-bold text-center" style="font-size: 9px;">TERM AVERAGE</td>
                            <td class="text-center text-bold">{{ number_format($summary['average_score'] ?? 0, 1) }}</td>
                        </tr>
                    </table>
                    <table class="bordered-table">
                        <tr>
                            <td class="text-bold text-center" style="font-size: 9px;">No. in Class</td>
                            <td class="text-bold text-center" style="font-size: 9px;">Position</td>
                        </tr>
                        <tr>
                            <td class="text-center">{{ $summary['class_size'] ?? 0 }}</td>
                            <td class="text-center">
                                @php
                                    $pos = $summary['position'] ?? 0;
                                    if ($pos > 0) {
                                        $suffix = 'th';
                                        if ($pos % 100 < 11 || $pos % 100 > 13) {
                                            switch ($pos % 10) {
                                                case 1: $suffix = 'st'; break;
                                                case 2: $suffix = 'nd'; break;
                                                case 3: $suffix = 'rd'; break;
                                            }
                                        }
                                        echo $pos . $suffix;
                                    } else {
                                        echo '-';
                                    }
                                @endphp
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Academic Performance Table -->
        <div class="section-header">ACADEMIC PERFORMANCE</div>
        <table class="bordered-table">
            <thead>
                @if($isThirdTerm ?? false)
                    <!-- Third Term Headers with B/F columns -->
                    <tr class="header-bg" style="font-size: 9px;">
                        <th rowspan="3" width="20%">SUBJECT</th>
                        <th colspan="2">B/F</th>
                        <th colspan="2">CA</th>
                        <th rowspan="3" width="4%">EXAM</th>
                        <th rowspan="3" width="5%">TOTAL<br>SCORE</th>
                        <th rowspan="3" width="4%">CUM<br>TOTAL</th>
                        <th rowspan="3" width="6%">HIGHEST<br>IN CLASS</th>
                        <th rowspan="3" width="6%">LOWEST<br>IN CLASS</th>
                        <th rowspan="3" width="5%">CLASS<br>AVERAGE</th>
                        <th rowspan="3" width="7%">POSITION IN<br>SUBJECT</th>
                        <th rowspan="3" width="5%">GRADE</th>
                        <th rowspan="3" width="9%">REMARKS</th>
                    </tr>
                    <tr class="header-bg" style="font-size: 9px;">
                        <th rowspan="2" width="6%">FIRST<br>TERM</th>
                        <th rowspan="2" width="7%">SECOND<br>TERM</th>
                        <th colspan="2"></th>
                    </tr>
                    <tr class="header-bg" style="font-size: 9px;">
                        <th width="4%">20</th>
                        <th width="4%">20</th>
                    </tr>
                @else
                    <!-- First/Second Term Headers -->
                    <tr class="header-bg" style="font-size: 10px;">
                        <th rowspan="2" width="20%">SUBJECT</th>
                        <th colspan="2">CA</th>
                        <th rowspan="2" width="5%">EXAM</th>
                        <th rowspan="2" width="7%">TOTAL<br>SCORE</th>
                        <th rowspan="2" width="7%">HIGHEST<br>IN CLASS</th>
                        <th rowspan="2" width="7%">LOWEST<br>IN CLASS</th>
                        <th rowspan="2" width="7%">CLASS<br>AVERAGE</th>
                        <th rowspan="2" width="7%">POSITION IN<br>SUBJECT</th>
                        <th rowspan="2" width="5%">GRADE</th>
                        <th rowspan="2" width="10%">REMARKS</th>
                    </tr>
                    <tr class="header-bg" style="font-size: 10px;">
                        <th width="5%">20</th>
                        <th width="5%">20</th>
                    </tr>
                @endif
            </thead>
            <tbody>
                @foreach($scores as $score)
                <tr style="font-size: 10px;">
                    <td style="text-align: left;">{{ $score->subject->name }}</td>
                    
                    @if($isThirdTerm ?? false)
                        <!-- Third Term: Show B/F columns -->
                        <td class="text-center">
                            {{ isset($previousTermScores['first'][$score->subject_id]) ? number_format($previousTermScores['first'][$score->subject_id]->total_score, 0) : '-' }}
                        </td>
                        <td class="text-center">
                            {{ isset($previousTermScores['second'][$score->subject_id]) ? number_format($previousTermScores['second'][$score->subject_id]->total_score, 0) : '-' }}
                        </td>
                    @endif
                    
                    <td class="text-center">{{ $score->ca1_score > 0 ? $score->ca1_score : '' }}</td>
                    <td class="text-center">{{ $score->ca2_score > 0 ? $score->ca2_score : '' }}</td>
                    <td class="text-center">{{ $score->exam_score > 0 ? $score->exam_score : '' }}</td>
                    <td class="text-center">{{ number_format($score->total_score, 0) }}</td>

                    @if($isThirdTerm ?? false)
                        @php
                            $first = isset($previousTermScores['first'][$score->subject_id]) ? $previousTermScores['first'][$score->subject_id]->total_score : 0;
                            $second = isset($previousTermScores['second'][$score->subject_id]) ? $previousTermScores['second'][$score->subject_id]->total_score : 0;
                            $cumTotal = $first + $second + $score->total_score;
                        @endphp
                        <td class="text-center">{{ number_format($cumTotal, 0) }}</td>
                    @endif

                    <td class="text-center">{{ isset($subjectStats[$score->subject_id]) ? number_format($subjectStats[$score->subject_id]['highest'], 0) : '-' }}</td>
                    <td class="text-center">{{ isset($subjectStats[$score->subject_id]) ? number_format($subjectStats[$score->subject_id]['lowest'], 0) : '-' }}</td>
                    <td class="text-center">{{ isset($subjectStats[$score->subject_id]) ? number_format($subjectStats[$score->subject_id]['average'], 1) : '-' }}</td>
                    <td class="text-center">{{ isset($subjectStats[$score->subject_id]) ? $subjectStats[$score->subject_id]['position'] : '-' }}</td>
                    <td class="text-center">{{ $score->grade }}</td>
                    <td class="text-center" style="font-size: 9px;">{{ $score->remark }}</td>
                </tr>
                @endforeach
                @for($i = 0; $i < max(0, 10 - count($scores)); $i++)
                <tr style="height: 18px;">
                    <td>&nbsp;</td>
                    @if($isThirdTerm ?? false)
                        <td></td><td></td> <!-- B/F 1st & 2nd -->
                    @endif
                    <td></td><td></td><td></td><td></td> <!-- CA1, CA2, Exam, Total -->
                    
                    @if($isThirdTerm ?? false)
                        <td></td> <!-- Cum Total -->
                    @endif

                    <td></td><td></td><td></td><td></td><td></td><td></td> <!-- Highest, Lowest, Avg, Pos, Grade, Remark -->
                </tr>
                @endfor
            </tbody>
        </table>

        <!-- Keys -->
        <div class="section-header" style="font-size: 9px; margin-top: 4px;">KEYS TO RATING</div>
        <table class="bordered-table" style="font-size: 9px;">
            <tr>
                <td class="text-center">100-70 (EXCELLENT)</td>
                <td class="text-center">60-69 (VERY GOOD)</td>
                <td class="text-center">50-59 (GOOD)</td>
                <td class="text-center">45-49 (FAIR)</td>
                <td class="text-center">40-44 (POOR)</td>
                <td class="text-center">0-39 (VERY POOR)</td>
            </tr>
        </table>

        <!-- Traits -->
        <table style="margin-top: 4px;">
            <tr>
                <td width="50%" style="padding-right: 2px; vertical-align: top;">
                    <table class="bordered-table">
                        <tr><th colspan="6" class="header-bg">AFFECTIVE TRAITS</th></tr>
                        <tr style="font-size: 9px;">
                            <th width="40%"></th>
                            <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                        </tr>
                        @foreach($affectiveTraits as $trait)
                        <tr>
                            <td style="font-size: 9px;">{{ $trait->name }}</td>
                            @for($i = 1; $i <= 5; $i++)
                                <td class="text-center" style="padding: 1px;">
                                    @if(isset($studentAffectiveTraits[$trait->id]) && $studentAffectiveTraits[$trait->id]->score == $i)
                                        <span style="font-family: DejaVu Sans, sans-serif; font-size: 9px;">&#10003;</span>
                                    @endif
                                </td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                </td>
                <td width="50%" style="padding-left: 2px; vertical-align: top;">
                    <table class="bordered-table">
                        <tr><th colspan="6" class="header-bg">PSYCHOMOTOR SKILLS</th></tr>
                        <tr style="font-size: 9px;">
                            <th width="40%"></th>
                            <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
                        </tr>
                        @foreach($psychomotorSkills as $skill)
                        <tr>
                            <td style="font-size: 9px;">{{ $skill->name }}</td>
                            @for($i = 1; $i <= 5; $i++)
                                <td class="text-center" style="padding: 1px;">
                                    @if(isset($studentPsychomotorSkills[$skill->id]) && $studentPsychomotorSkills[$skill->id]->score == $i)
                                        <span style="font-family: DejaVu Sans, sans-serif; font-size: 9px;">&#10003;</span>
                                    @endif
                                </td>
                            @endfor
                        </tr>
                        @endforeach
                    </table>
                    
                    <div style="border: 1px solid #2aa06c; margin-top: 4px;">
                        <div class="header-bg" style="padding: 2px; border-bottom: 1px solid #2aa06c; font-size: 9px;">KEYS TO RATING</div>
                        <div style="padding: 3px; font-size: 9px;">
                            <div style="margin-bottom: 2px;">5. Excellent</div>
                            <div style="margin-bottom: 2px;">4. Good</div>
                            <div style="margin-bottom: 2px;">3. Fair</div>
                            <div style="margin-bottom: 2px;">2. Poor</div>
                            <div>1. Very Poor</div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-section" style="border: 2px solid #2aa06c; margin-top: 4px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding-bottom: 8px; border-bottom: 1px solid #2aa06c;">
                                    <strong>Class Teacher's Comments:</strong> {{ $defaults['teacher_comment'] ?? '' }}
                                    <span style="float: right;">
                                        <strong>Sign.:</strong> 
                                        @if(!empty($settings['teacher_signature']))
                                            @if(isset($isPdf) && $isPdf)
                                                <img src="{{ public_path('storage/' . $settings['teacher_signature']) }}" alt="Teacher Signature" class="signature-img" style="height: 25px; max-width: 80px; object-fit: contain; vertical-align: middle;" />
                                            @else
                                                <img src="{{ asset('storage/' . $settings['teacher_signature']) }}" alt="Teacher Signature" class="signature-img" style="height: 25px; max-width: 80px; object-fit: contain; vertical-align: middle;" />
                                            @endif
                                        @else
                                            <span style="display:inline-block;width:50px;border-bottom:1px solid #000;"></span>
                                        @endif
                                        <strong>Date:</strong> {{ now()->format('d/m/Y') }}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 8px; padding-bottom: 8px; border-bottom: 1px solid #2aa06c;">
                                    <strong>Principal's Comments:</strong> {{ $defaults['principal_comment'] ?? '' }}
                                    <span style="float: right;">
                                        <strong>Sign.:</strong> 
                                        @if(!empty($settings['principal_signature']))
                                            @if(isset($isPdf) && $isPdf)
                                                <img src="{{ public_path('storage/' . $settings['principal_signature']) }}" alt="Principal Signature" class="signature-img" style="height: 25px; max-width: 80px; object-fit: contain; vertical-align: middle;" />
                                            @else
                                                <img src="{{ asset('storage/' . $settings['principal_signature']) }}" alt="Principal Signature" class="signature-img" style="height: 25px; max-width: 80px; object-fit: contain; vertical-align: middle;" />
                                            @endif
                                        @else
                                            <span style="display:inline-block;width:50px;border-bottom:1px solid #000;"></span>
                                        @endif
                                        <strong>Date:</strong> {{ now()->format('d/m/Y') }}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 8px;">
                                    <strong>Promotion Status:</strong> {{ $defaults['promotion_status'] ?? 'PROMOTED TO NEXT CLASS' }}
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 110px; border-left: 2px solid #2aa06c; vertical-align: middle; text-align: center;">
                        <div class="stamp-container" style="height: 70px; display: flex; align-items: center; justify-content: center; color: #2aa06c; font-weight: bold;">
                            @if(!empty($settings['school_stamp']))
                                @if(isset($isPdf) && $isPdf)
                                    <img src="{{ public_path('storage/' . $settings['school_stamp']) }}" alt="School Stamp" style="max-width:90px; max-height:70px; object-fit: contain;">
                                @else
                                    <img src="{{ asset('storage/' . $settings['school_stamp']) }}" alt="School Stamp" style="max-width:90px; max-height:70px; object-fit: contain;">
                                @endif
                            @else
                                STAMP
                            @endif
                        </div>
                    </td>
                </tr>
            </table>
        </div>

    </div>
    
    @if(!$isPdf)
    <script>
        // Auto-trigger print dialog when page loads (only in preview mode, not PDF generation)
        window.addEventListener('load', function() {
            // Small delay to ensure page is fully rendered
            setTimeout(function() {
                window.print();
            }, 500);
        });
    </script>
    @endif
</body>
</html>
