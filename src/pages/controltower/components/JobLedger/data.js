export const fmtN = n => n >= 100000 ? (n / 100000).toFixed(1) + 'L' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
export const fmtR = n => '₹' + (Math.round(n) || 0).toLocaleString('en-IN');
export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

export const JOBS = [
    {
        id: 'RD-2501', type: 'Production', client: 'Insurance Corp', clientGST: '27AAACI1234C1Z5',
        contact: 'Priya Sharma', phone: '+91 98200 11234',
        soNo: 'SO-2026-0412', soDate: '01 May 2026', invoiceNo: 'RD/INV/2026/2501',
        product: 'Shimmer Trophy with UV Print + Laser Base', qty: 118,
        soRate: 2850, soAmt: 336300, gst: 18, soTotal: 396834,
        delivDate: '12 May 2026', status: 'dispatched',
        category: 'Trophy', technique: 'UV Print + Laser Engraving',
        // CLIENT & CS HISTORY
        csHistory: [
            { dt: '28 Apr 2026 10:00', by: 'Rahul (Sales)', event: 'Enquiry received', detail: 'Insurance Corp annual awards — 118 trophies. Shi...' },
            { dt: '28 Apr 2026 15:30', by: 'Rahul (Sales)', event: 'Sample order raised', detail: 'Sample order RD-2501S created — 2 pcs for client...' },
            { dt: '29 Apr 2026 09:00', by: 'DTP Team', event: 'DTP artwork received', detail: 'Client logo AI file received. DTP created shimme...' },
            { dt: '29 Apr 2026 11:00', by: 'Priya Sharma (Client)', event: 'Artwork revision 1', detail: 'Client requested logo size increase by 20% and g...' },
            { dt: '29 Apr 2026 14:00', by: 'DTP Team', event: 'DTP v2 sent', detail: 'Revised artwork sent for approval — larger logo ...' },
            { dt: '30 Apr 2026 09:30', by: 'Priya Sharma (Client)', event: 'Sample approved', detail: 'Sample approved on WhatsApp. OK to proceed full ...' },
            { dt: '01 May 2026 10:00', by: 'Rahul (Sales)', event: 'Production order raised', detail: 'RD-2501 production order raised — 118 pcs. SO-20...' },
            { dt: '01 May 2026 11:00', by: 'Costing (Shalini)', event: 'Costing approved', detail: 'Material + process cost approved. Margin 34.2%. ...' },
            { dt: '08 May 2026 16:00', by: 'Operations', event: 'Dispatched', detail: 'All 118 pcs dispatched via BlueDart to 6 destina...' },
        ],
        // APPROVALS
        approvals: [
            { stage: 'Enquiry', by: 'Rahul (Sales)', dt: '28 Apr', status: 'done', icon: '📞' },
            { stage: 'Sample', by: 'DTP + Production', dt: '29 Apr', status: 'done', icon: '🎨' },
            { stage: 'Client Approval', by: 'Priya Sharma', dt: '30 Apr', status: 'done', icon: '✅' },
            { stage: 'Costing', by: 'Shalini (Accounts)', dt: '01 May', status: 'done', icon: '💰' },
            { stage: 'Production Order', by: 'Ops Head', dt: '01 May', status: 'done', icon: '🏭' },
            { stage: 'Dispatch', by: 'Packing Team', dt: '08 May', status: 'done', icon: '🚚' },
        ],
        // BOM — MATERIAL
        bomMaterial: [
            { item: 'Acrylic Sheet 12mm Clear', spec: '18"×14" per pc', bomQty: 135, bomQtyUnit: 'sqft', rate: 500, bomCost: 67500, actualQty: 141, actualCost: 70500, variance: 6, varPct: 4.4, store: 'G-1' },
            { item: 'UV Shimmer Ink (CMYK+W)', spec: 'Set of 5 colours', bomQty: 1.2, bomQtyUnit: 'litre', rate: 12000, bomCost: 14400, actualQty: 1.3, actualCost: 15600, variance: 0.1, varPct: 8.3, store: 'UV Studio' },
            { item: 'Trophy Base MDF 6mm', spec: '10"×4" per pc', bomQty: 48, bomQtyUnit: 'sqft', rate: 180, bomCost: 8640, actualQty: 50, actualCost: 9000, variance: 2, varPct: 4.2, store: 'G-2' },
            { item: 'Laser Engraving Brass Plate', spec: '2"×1" per pc', bomQty: 118, bomQtyUnit: 'pcs', rate: 35, bomCost: 4130, actualQty: 122, actualCost: 4270, variance: 4, varPct: 3.4, store: 'G-3' },
            { item: 'Assembly Adhesive', spec: 'Industrial UV', bomQty: 0.5, bomQtyUnit: 'kg', rate: 800, bomCost: 400, actualQty: 0.5, actualCost: 400, variance: 0, varPct: 0, store: 'Stores' },
            { item: 'Packing Box Corrugated', spec: '12"×10"×8"', bomQty: 12, bomQtyUnit: 'nos', rate: 85, bomCost: 1020, actualQty: 12, actualCost: 1020, variance: 0, varPct: 0, store: 'Packing' },
            { item: 'Bubble Wrap + Thermocol', spec: 'Per set', bomQty: 118, bomQtyUnit: 'sets', rate: 22, bomCost: 2596, actualQty: 118, actualCost: 2596, variance: 0, varPct: 0, store: 'Packing' },
        ],
        // BOM — PROCESS
        bomProcess: [
            { dept: 'DTP Pre-Press', process: 'Artwork + UPS Setup', uom: 'Job', rate: 2500, bomQty: 1, bomCost: 2500, actualQty: 1, actualCost: 2500, time: '4 hrs', operator: 'Kiran' },
            { dept: 'Laser Cutting Studio', process: 'Acrylic Cutting', uom: 'sqft', rate: 18, bomQty: 135, bomCost: 2430, actualQty: 141, actualCost: 2538, time: '6.2 hrs', operator: 'Shift 1' },
            { dept: 'Laser Cutting Studio', process: 'Base MDF Cutting', uom: 'sqft', rate: 15, bomQty: 48, bomCost: 720, actualQty: 50, actualCost: 750, time: '2.1 hrs', operator: 'Shift 1' },
            { dept: 'UV Printing Studio', process: 'Shimmer UV Print', uom: 'sqft', rate: 95, bomQty: 135, bomCost: 12825, actualQty: 141, actualCost: 13395, time: '5.8 hrs', operator: 'Mimaki' },
            { dept: 'Laser Engraving', process: 'Brass Plate Engraving', uom: 'pcs', rate: 12, bomQty: 118, bomCost: 1416, actualQty: 122, actualCost: 1464, time: '1.5 hrs', operator: 'Shankar' },
            { dept: 'Assembly', process: 'Trophy Assembly', uom: 'pcs', rate: 25, bomQty: 118, bomCost: 2950, actualQty: 118, actualCost: 2950, time: '4.0 hrs', operator: 'Team A' },
            { dept: 'QC', process: 'Quality Inspection', uom: 'pcs', rate: 8, bomQty: 118, bomCost: 944, actualQty: 118, actualCost: 944, time: '1.2 hrs', operator: 'QC Head' },
            { dept: 'Packing', process: 'Packing + Labelling', uom: 'pcs', rate: 15, bomQty: 118, bomCost: 1770, actualQty: 118, actualCost: 1770, time: '3.5 hrs', operator: 'Ramesh Nair' },
        ],
        // MATERIAL LEDGER (stores to shopfloor)
        materialLedger: [
            { date: '01 May', ref: 'MR-001', event: 'BOM Assigned', dept: 'Stores', matIn: 98686, matOut: 0, balance: 98686, notes: 'Full BOM material reserved' },
            { date: '02 May', ref: 'ISS-101', event: 'Issued to Laser Studio', dept: 'LC Studio', matIn: 0, matOut: 76140, balance: 22546, notes: 'Acrylic 141sqft + MDF 50sqft issued' },
            { date: '03 May', ref: 'ISS-102', event: 'Issued to UV Studio', dept: 'UV Studio', matIn: 0, matOut: 15600, balance: 6946, notes: 'UV Ink 1.3L issued' },
            { date: '03 May', ref: 'ISS-103', event: 'Issued to Engraving', dept: 'Laser Engraving', matIn: 0, matOut: 4270, balance: 2676, notes: 'Brass plates 122 pcs' },
            { date: '04 May', ref: 'ISS-104', event: 'Issued to Assembly', dept: 'Assembly', matIn: 0, matOut: 400, balance: 2276, notes: 'Adhesive 0.5kg' },
            { date: '07 May', ref: 'RET-001', event: 'Offcut return to Stores', dept: 'Stores', matIn: 1800, matOut: 0, balance: 4076, notes: 'Acrylic offcuts 3.6sqft returned' },
            { date: '07 May', ref: 'ISS-105', event: 'Packing material issued', dept: 'Packing', matIn: 0, matOut: 3616, balance: 460, notes: 'Boxes 12 + bubble wrap 118 sets' },
            { date: '08 May', ref: 'CLO-001', event: 'Job closed — balance credited', dept: 'Stores', matIn: 0, matOut: 460, balance: 0, notes: 'Minor balance absorbed' },
        ],
        // PROCESS LEDGER (per dept entries)
        processLedger: [
            { date: '01 May', dept: 'DTP Pre-Press', shift: 'Day', matIn: 0, processCost: 2500, output: 'UPS file ready', qcStatus: 'pass', notes: 'Client approved artwork used. 2 hr ove...' },
            { date: '02 May', dept: 'LC Studio — Shift 1', shift: 'Day', matIn: 76140, processCost: 3288, output: '118 acrylic pcs + 118 bases', qcStatus: 'pass', notes: '3 acrylic pcs cracked — replaced from ...' },
            { date: '03 May', dept: 'UV Printing Studio', shift: 'Day', matIn: 15600, processCost: 13395, output: '118 pcs UV printed', qcStatus: 'pass', notes: '2 prints rejected — reprinted. Shimmer...' },
            { date: '03 May', dept: 'Laser Engraving', shift: 'Day', matIn: 4270, processCost: 1464, output: '118 brass plates engraved', qcStatus: 'pass', notes: '122 plates cut — 4 rejected. Engraving...' },
            { date: '04 May', dept: 'Assembly', shift: 'Day', matIn: 400, processCost: 2950, output: '118 assembled trophies', qcStatus: 'pass', notes: 'All 118 assembled and checked. 0 rejec...' },
            { date: '05 May', dept: 'QC Gate 2', shift: 'Day', matIn: 0, processCost: 944, output: '118 pcs QC passed', qcStatus: 'pass', notes: 'Final QC by QC Head — all 118 approved...' },
            { date: '07 May', dept: 'Finished Goods Store', shift: 'Day', matIn: 0, processCost: 0, output: '118 pcs to FG Store', qcStatus: 'pass', notes: 'FG stock entry. Invoice raised.' },
            { date: '08 May', dept: 'Packing + Dispatch', shift: 'Day', matIn: 3616, processCost: 1770, output: '118 pcs dispatched — 6 dests', qcStatus: 'pass', notes: 'Packed in 14 boxes. BlueDart AWBs gene...' },
        ],
        // MANUFACTURING JOURNEY
        journey: [
            { dept: 'DTP Pre-Press', icon: '🎨', status: 'complete', in: 118, out: 118, time: '4.0 hrs', cost: 2500, qc: 'pass', dt: '01 May' },
            { dept: 'LC Studio — Acrylic', icon: '✂️', status: 'complete', in: 141, out: 118, time: '6.2 hrs', cost: 2538, qc: 'pass', dt: '02 May' },
            { dept: 'LC Studio — Base', icon: '✂️', status: 'complete', in: 50, out: 118, time: '2.1 hrs', cost: 750, qc: 'pass', dt: '02 May' },
            { dept: 'UV Print Studio', icon: '🖨️', status: 'complete', in: 118, out: 118, time: '5.8 hrs', cost: 13395, qc: 'pass', dt: '03 May' },
            { dept: 'Laser Engraving', icon: '✒️', status: 'complete', in: 122, out: 118, time: '1.5 hrs', cost: 1464, qc: 'pass', dt: '03 May' },
            { dept: 'Assembly', icon: '🔧', status: 'complete', in: 118, out: 118, time: '4.0 hrs', cost: 2950, qc: 'pass', dt: '04 May' },
            { dept: 'QC Gate 2', icon: '✅', status: 'complete', in: 118, out: 118, time: '1.2 hrs', cost: 944, qc: 'pass', dt: '05 May' },
            { dept: 'Packing + Dispatch', icon: '📦', status: 'complete', in: 118, out: 118, time: '3.5 hrs', cost: 1770, qc: 'pass', dt: '08 May' },
        ],
        // FG + PACKING
        fg: { fgDate: '07 May 2026', fgQty: 118, fgBy: 'Sunita Kadam', invoiceRaised: true, invoiceDate: '07 May 2026' },
        packing: {
            packedBy: 'Ramesh Nair', boxes: 14, packDt: '08 May 2026',
            dispatchType: 'courier', courier: 'BlueDart', dispatchDt: '08 May 2026',
            destinations: [
                { name: 'Mumbai HO', qty: 30, awb: 'BD5543218901', status: 'delivered' },
                { name: 'Delhi Branch', qty: 25, awb: 'BD5543218902', status: 'delivered' },
                { name: 'Bengaluru', qty: 20, awb: 'BD5543218903', status: 'in_transit' },
                { name: 'Chennai', qty: 18, awb: 'BD5543218904', status: 'in_transit' },
                { name: 'Hyderabad', qty: 15, awb: 'BD5543218905', status: 'pending' },
                { name: 'Pune', qty: 10, awb: 'BD5543218906', status: 'pending' },
            ]
        },
        // FINANCIAL
        financial: {
            revenue: { soRate: 2850, qty: 118, subtotal: 336300, gstAmt: 60534, total: 396834 },
            materialCost: { bom: 98686, actual: 103386, variance: 4700 },
            processCost: { bom: 27555, actual: 29311, variance: 1756 },
            packingCost: { material: 3616, labour: 1770, logistics: 8200, total: 13586 },
            overhead: { pct: 12, amt: 15935 },
            totalCost: 162218, grossProfit: 174082, grossMargin: 34.2,
        },
        flowLedger: [
            {
                dept: 'STORES — BOM RESERVATION', date: '01 May 2026', ref: 'MR-001', type: 'reserve',
                rows: [
                    { kind: 'mat', item: 'Acrylic Sheet 12mm Clear', qty: 135, unit: 'sqft', rate: 500, value: 67500, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'UV Shimmer Ink CMYK+W', qty: 1.2, unit: 'litre', rate: 12000, value: 14400, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'Trophy Base MDF 6mm', qty: 48, unit: 'sqft', rate: 180, value: 8640, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'Laser Engraving Brass Plate 2x1"', qty: 118, unit: 'pcs', rate: 35, value: 4130, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'Assembly Adhesive Industrial UV', qty: 0.5, unit: 'kg', rate: 800, value: 400, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'Corrugated Box 12x10x8"', qty: 12, unit: 'nos', rate: 85, value: 1020, note: 'BOM standard qty' },
                    { kind: 'mat', item: 'Bubble Wrap + Thermocol Set', qty: 118, unit: 'sets', rate: 22, value: 2596, note: 'BOM standard qty' },
                ],
                output: 'Full BOM reserved in stores. Total: Rs 98,686', qc: '—', op: 'Stores Manager',
                note: 'All 7 BOM items physically verified a...'
            },

            {
                dept: 'DTP PRE-PRESS', date: '01 May 2026', ref: 'DTP-001', type: 'process',
                rows: [
                    { kind: 'proc', process: 'Client Artwork Digitisation', qty: 1, unit: 'job', rate: 800, value: 800, note: 'AI logo + brand guide' },
                    { kind: 'proc', process: 'Shimmer UV Layout — v1', qty: 1, unit: 'job', rate: 600, value: 600, note: 'Layout + shimmer channel map' },
                    { kind: 'proc', process: 'Client Revision — v2 (Gold border)', qty: 1, unit: 'job', rate: 400, value: 400, note: 'Logo larger + gold border added' },
                    { kind: 'proc', process: 'UPS File Setup + Bed Mapping', qty: 1, unit: 'job', rate: 700, value: 700, note: 'UV printer bed configuration' },
                ],
                output: 'UPS file client-approved. Production artwork ready for UV printing.', qc: 'pass', op: 'Kiran (DTP)',
                note: '2 DTP revisions. Client approved gold...'
            },

            {
                dept: 'STORES to LC STUDIO', date: '02 May 2026', ref: 'ISS-101', type: 'issue',
                rows: [
                    { kind: 'mat', item: 'Acrylic Sheet 12mm Clear', qty: 141, unit: 'sqft', rate: 500, value: 70500, note: '+6sqft buffer — 3 breakage expected' },
                    { kind: 'mat', item: 'Trophy Base MDF 6mm', qty: 50, unit: 'sqft', rate: 180, value: 9000, note: '+2sqft buffer over BOM 48sqft' },
                ],
                output: '141sqft acrylic + 50sqft MDF physically transferred. Signed by LC Studio supervisor.', qc: '—', op: 'Deepak (Stores)',
                note: 'ISS-101 issued and signed. Over-BOM i...'
            },

            {
                dept: 'LC STUDIO — LASER CUTTING', date: '02 May 2026', ref: 'LC-001', type: 'process',
                rows: [
                    { kind: 'mat', item: 'Acrylic Sheet 12mm — Consumed', qty: 141, unit: 'sqft', rate: 500, value: 70500, note: '3 sheets cracked during cutting' },
                    { kind: 'proc', process: 'Acrylic Cutting — Epilog Fusion', qty: 141, unit: 'sqft', rate: 18, value: 2538, note: 'UPS cycles: 14 passes per sheet' },
                    { kind: 'mat', item: 'MDF Base 6mm — Consumed', qty: 50, unit: 'sqft', rate: 180, value: 9000, note: 'Nesting: 8 bases per A3 sheet' },
                    { kind: 'proc', process: 'MDF Base Cutting', qty: 50, unit: 'sqft', rate: 15, value: 750, note: 'Base profile cut per DTP template' },
                    { kind: 'reject', item: 'Acrylic Rejects — 3 pcs cracked', qty: 3, unit: 'pcs', rate: 0, value: 0, note: 'Sheet micro-fracture — absorbed in 14...' },
                ],
                output: '118 acrylic display bodies + 118 MDF bases cut. Passed to UV Studio on trolley.', qc: 'pass', op: 'Ramdas — Shift 1',
                note: '3 acrylic pcs cracked at corner durin...'
            },

            {
                dept: 'STORES to UV STUDIO', date: '03 May 2026', ref: 'ISS-102', type: 'issue',
                rows: [
                    { kind: 'mat', item: 'UV Shimmer Ink CMYK+W (5 channels)', qty: 1.3, unit: 'litre', rate: 12000, value: 15600, note: '+0.1L over BOM — 2 reprint runs required' },
                ],
                output: '1.3L UV shimmer ink transferred to UV Studio ink room. Logged in ink register.', qc: '—', op: 'Deepak (Stores)',
                note: '0.1L over BOM due to 2 reprint cycles...'
            },

            {
                dept: 'UV PRINTING STUDIO', date: '03 May 2026', ref: 'UV-001', type: 'process',
                rows: [
                    { kind: 'mat', item: 'UV Shimmer Ink — Consumed', qty: 1.3, unit: 'litre', rate: 12000, value: 15600, note: 'Shimmer + CMYK + White channels' },
                    { kind: 'proc', process: 'UV Shimmer Print — Mimaki JFX200', qty: 141, unit: 'sqft', rate: 95, value: 13395, note: 'Bed 1 approved. Bed 3 rejected.' },
                    { kind: 'reject', item: 'UV Print Rejects — 4 pcs', qty: 4, unit: 'pcs', rate: 0, value: 0, note: 'Ink misalignment on bed 3 — reprint c...' },
                ],
                output: '118 pcs UV shimmer printed. Gold border + company logo. Print approved by supervisor on Bed 1.', qc: 'pass', op: 'Mimaki Operator',
                note: '4 UV print rejects due to ink channel...'
            },

            {
                dept: 'STORES to ENGRAVING', date: '03 May 2026', ref: 'ISS-103', type: 'issue',
                rows: [
                    { kind: 'mat', item: 'Laser Engraving Brass Plate 2x1"', qty: 122, unit: 'pcs', rate: 35, value: 4270, note: '+4 pcs buffer over BOM 118' },
                ],
                output: '122 brass plates issued to Engraving dept. Signed by Shankar.', qc: '—', op: 'Deepak (Stores)',
                note: '4 extra plates issued as reject buffe...'
            },

            {
                dept: 'LASER ENGRAVING', date: '03 May 2026', ref: 'ENG-001', type: 'process',
                rows: [
                    { kind: 'mat', item: 'Brass Plate — Consumed', qty: 122, unit: 'pcs', rate: 35, value: 4270, note: '122 plates processed' },
                    { kind: 'proc', process: 'Plate Engraving — Fiber Laser', qty: 122, unit: 'pcs', rate: 12, value: 1464, note: 'Insurance Corp + year text + logo' },
                    { kind: 'reject', item: 'Brass Plate Rejects — 4 pcs cracked', qty: 4, unit: 'pcs', rate: 35, value: 140, note: 'Cracked in fixture clamp — material l...' },
                ],
                output: '118 engraved brass plates. Depth +0.1mm per supervisor instruction for better relief.', qc: 'pass', op: 'Shankar',
                note: '4 plates cracked in clamp fixture. Re...'
            },

            {
                dept: 'STORES to ASSEMBLY', date: '04 May 2026', ref: 'ISS-104', type: 'issue',
                rows: [
                    { kind: 'mat', item: 'Assembly Adhesive — Industrial UV', qty: 0.5, unit: 'kg', rate: 800, value: 400, note: 'Exact BOM qty — no buffer needed' },
                ],
                output: '0.5kg adhesive issued to Assembly. No buffer — waste is negligible.', qc: '—', op: 'Deepak (Stores)',
                note: 'Exact BOM quantity. Adhesive waste in...'
            },

            {
                dept: 'ASSEMBLY', date: '04 May 2026', ref: 'ASM-001', type: 'process',
                rows: [
                    { kind: 'mat', item: 'Acrylic Body + MDF Base (in-process)', qty: 118, unit: 'pcs', rate: 0, value: 0, note: 'Passed from LC Studio — no new cost' },
                    { kind: 'mat', item: 'Engraved Brass Plate (in-process)', qty: 118, unit: 'pcs', rate: 0, value: 0, note: 'Passed from Engraving — no new cost' },
                    { kind: 'mat', item: 'Assembly Adhesive — Consumed', qty: 0.5, unit: 'kg', rate: 800, value: 400, note: 'UV adhesive for bonding' },
                    { kind: 'proc', process: 'Trophy Assembly — Manual Line', qty: 118, unit: 'pcs', rate: 25, value: 2950, note: '3 components bonded per trophy' },
                ],
                output: '118 complete trophies assembled. Acrylic + MDF base + brass plate. 0 rejects.', qc: 'pass', op: 'Team A — Sunita',
                note: 'All 118 assembled in one shift. Compo...'
            },

            {
                dept: 'QC GATE 2 — FINAL INSPECTION', date: '05 May 2026', ref: 'QC-001', type: 'process',
                rows: [
                    { kind: 'proc', process: 'Visual Inspection — Surface + Print', qty: 118, unit: 'pcs', rate: 5, value: 590, note: 'Shimmer quality + engraving depth' },
                    { kind: 'proc', process: 'QC Documentation + Sign-off', qty: 1, unit: 'job', rate: 354, value: 354, note: 'QC report + Manjula sign-off' },
                ],
                output: '118 pcs QC passed. 0 rejects. Sign-off: Manjula (QC Head). Job cleared for FG Store.', qc: 'pass', op: 'Manjula (QC Head)',
                note: 'All 118 checked for shimmer print qua...'
            },

            {
                dept: 'FINISHED GOODS STORE', date: '07 May 2026', ref: 'FG-001', type: 'fg',
                rows: [
                    { kind: 'fg', item: 'Shimmer Trophy RD-2501 — Completed', qty: 118, unit: 'pcs', rate: 0, value: 0, note: '118 pcs into FG stock' },
                ],
                output: '118 pcs entered FG Store. Invoice RD/INV/2026/2501 raised — Rs 3,96,834 (18% GST).', qc: 'pass', op: 'Sunita Kadam',
                note: 'FG stock entry completed by Sunita Ka...'
            },

            {
                dept: 'OFFCUT RETURN to STORES', date: '07 May 2026', ref: 'RET-001', type: 'return',
                rows: [
                    { kind: 'mat', item: 'Acrylic Offcuts — Usable Pieces', qty: 3.6, unit: 'sqft', rate: 500, value: 1800, note: 'Returned from LC Studio godown' },
                ],
                output: '3.6sqft acrylic offcuts returned to G-1. Job cost credited Rs 1,800.', qc: '—', op: 'Ramdas (LC)',
                note: 'Usable offcuts from 141sqft acrylic u...'
            },

            {
                dept: 'STORES to PACKING', date: '07 May 2026', ref: 'ISS-105', type: 'pack',
                rows: [
                    { kind: 'mat', item: 'Corrugated Box 12x10x8"', qty: 12, unit: 'nos', rate: 85, value: 1020, note: 'BOM qty — exact' },
                    { kind: 'mat', item: 'Bubble Wrap + Thermocol Sets', qty: 118, unit: 'sets', rate: 22, value: 2596, note: 'One set per trophy — exact BOM' },
                ],
                output: 'All packing material issued to Packing dept. No variance from BOM.', qc: '—', op: 'Anil (Packing Stores)',
                note: 'Packing material issued exactly as pe...'
            },

            {
                dept: 'PACKING + LABELLING', date: '08 May 2026', ref: 'PACK-001', type: 'pack',
                rows: [
                    { kind: 'mat', item: 'Packing Material — Consumed', qty: 14, unit: 'boxes', rate: 0, value: 3616, note: '14 boxes used vs 12 BOM — 2 extra for...' },
                    { kind: 'proc', process: 'Packing + Fragile Labelling', qty: 118, unit: 'pcs', rate: 15, value: 1770, note: '14 boxes, fragile tape, inner wrap' },
                ],
                output: '118 pcs packed in 14 boxes. 6 BlueDart AWBs generated and booked.', qc: 'pass', op: 'Ramesh Nair',
                note: '2 extra boxes vs BOM — fragile trophi...'
            },

            {
                dept: 'DISPATCH — BLUEDART', date: '08 May 2026', ref: 'DISP-001', type: 'dispatch',
                rows: [
                    { kind: 'proc', process: 'BlueDart Courier — 6 Destinations', qty: 118, unit: 'pcs', rate: 0, value: 8200, note: 'Actuals: Rs 8,200 freight charged' },
                ],
                output: '118 pcs dispatched. Mumbai + Delhi delivered. Bengaluru + Chennai in transit. Hyd + Pune pending.', qc: 'pass', op: 'Operations',
                note: '6 AWBs raised. BlueDart next-day deli...'
            },
        ],
    },

    // JOB 2 — RD-2499 — COMPLETE (Crystal Award, single dest, DTDC)
    {
        id: 'RD-2499', type: 'Production', client: 'Events India Pvt Ltd', clientGST: '27DDDEV9876F1Z2',
        contact: 'Kavita Rao', phone: '+91 98760 44321',
        soNo: 'SO-2026-0409', soDate: '25 Apr 2026', invoiceNo: 'RD/INV/2026/2499',
        product: 'Crystal Award Cube with Laser Engraving', qty: 75,
        soRate: 3200, soAmt: 240000, gst: 18, soTotal: 283200,
        delivDate: '07 May 2026', status: 'complete',
        category: 'Crystal Award', technique: 'Laser Engraving + 3D Effect',
        csHistory: [
            { dt: '22 Apr 2026 11:00', by: 'Priya (Sales)', event: 'Enquiry received', detail: 'Events India — 75 crystal cubes for annual gala....' },
            { dt: '22 Apr 2026 16:00', by: 'Priya (Sales)', event: 'Costing sent', detail: 'Quote sent: Rs 3,200/pc + 18% GST. Lead time 12 ...' },
            { dt: '23 Apr 2026 10:00', by: 'Kavita Rao (Client)', event: 'PO received', detail: 'PO # EI/2026/0445 received. Design brief attached.' },
            { dt: '24 Apr 2026 09:00', by: 'DTP Team', event: '3D design created', detail: 'Crystal 3D subsurface design created per brief. ...' },
            { dt: '24 Apr 2026 14:00', by: 'Kavita Rao (Client)', event: 'Design approved', detail: 'Design approved on first attempt. No revisions n...' },
            { dt: '25 Apr 2026 09:00', by: 'Ops Head', event: 'Production order raised', detail: 'RD-2499 raised. Crystal blocks ordered from Crys...' },
        ],
        approvals: [
            { stage: 'Enquiry', by: 'Priya (Sales)', dt: '22 Apr', status: 'done', icon: '📞' },
            { stage: 'Design', by: 'DTP Team', dt: '24 Apr', status: 'done', icon: '🎨' },
            { stage: 'Client Approval', by: 'Kavita Rao', dt: '24 Apr', status: 'done', icon: '✅' },
            { stage: 'Costing', by: 'Shalini', dt: '25 Apr', status: 'done', icon: '💰' },
            { stage: 'Production', by: 'Ops Head', dt: '25 Apr', status: 'done', icon: '🏭' },
            { stage: 'Dispatch', by: 'Packing Team', dt: '05 May', status: 'done', icon: '🚚' },
        ],
        bomMaterial: [
            { item: 'Crystal Block 80×80×80mm', spec: 'K9 optical crystal', bomQty: 75, bomQtyUnit: 'pcs', rate: 320, bomCost: 24000, actualQty: 77, actualCost: 24640, variance: 2, varPct: 2.7, store: 'Outsource' },
            { item: 'Laser Engraving Time', spec: '3D subsurface engraving', bomQty: 75, bomQtyUnit: 'pcs', rate: 180, bomCost: 13500, actualQty: 75, actualCost: 13500, variance: 0, varPct: 0, store: 'LC Studio' },
            { item: 'Gift Box Premium', spec: 'Velvet lined 4"×4"×4"', bomQty: 75, bomQtyUnit: 'nos', rate: 95, bomCost: 7125, actualQty: 75, actualCost: 7125, variance: 0, varPct: 0, store: 'Packing' },
            { item: 'Foam Insert', spec: 'Custom cut', bomQty: 75, bomQtyUnit: 'pcs', rate: 28, bomCost: 2100, actualQty: 75, actualCost: 2100, variance: 0, varPct: 0, store: 'Packing' },
        ],
        bomProcess: [
            { dept: 'DTP Pre-Press', process: '3D Artwork Setup', uom: 'Job', rate: 1800, bomQty: 1, bomCost: 1800, actualQty: 1, actualCost: 1800, time: '3 hrs', operator: 'Kiran' },
            { dept: 'Outsource — Crystal Works', process: '3D Subsurface Laser', uom: 'pcs', rate: 180, bomQty: 75, bomCost: 13500, actualQty: 75, actualCost: 13500, time: 'Outsourced', operator: 'Crystal Works Mumbai' },
            { dept: 'QC Gate 1', process: 'Receipt QC', uom: 'pcs', rate: 5, bomQty: 75, bomCost: 375, actualQty: 75, actualCost: 375, time: '0.5 hrs', operator: 'QC Team' },
            { dept: 'Packing', process: 'Packing + Dispatch', uom: 'pcs', rate: 18, bomQty: 75, bomCost: 1350, actualQty: 75, actualCost: 1350, time: '2 hrs', operator: 'Ramesh Nair' },
        ],
        materialLedger: [
            { date: '25 Apr', ref: 'MR-002', event: 'BOM Assigned', dept: 'Stores', matIn: 46825, matOut: 0, balance: 46825, notes: 'Crystal block PO raised to Crystal Works' },
            { date: '02 May', ref: 'PO-RECV', event: 'Crystal blocks received', dept: 'QC Gate 1', matIn: 0, matOut: 24640, balance: 22185, notes: '77 crystal blocks received — 2 extra f...' },
            { date: '02 May', ref: 'ISS-201', event: 'Issued to 3D Engraving', dept: 'Outsource', matIn: 0, matOut: 13500, balance: 8685, notes: '75 pcs sent to Crystal Works for 3D su...' },
            { date: '04 May', ref: 'RECV-201', event: 'Engraved crystals received', dept: 'QC Gate 1', matIn: 0, matOut: 0, balance: 8685, notes: '75 engraved crystals returned — all QC...' },
            { date: '05 May', ref: 'ISS-202', event: 'Packing material issued', dept: 'Packing', matIn: 0, matOut: 9225, balance: 460, notes: '75 gift boxes + foam inserts' },
            { date: '05 May', ref: 'CLO-002', event: 'Job closed', dept: 'Stores', matIn: 0, matOut: 460, balance: 0, notes: '2 extra crystals returned to stock' },
        ],
        processLedger: [
            { date: '25 Apr', dept: 'DTP Pre-Press', shift: 'Day', matIn: 0, processCost: 1800, output: '3D artwork file ready', qcStatus: 'pass', notes: '3D design created — client approved on...' },
            { date: '02 May', dept: 'Outsource — Crystal Works', shift: '—', matIn: 24640, processCost: 13500, output: '75 crystals engraved', qcStatus: 'pass', notes: '3D subsurface laser done. 77 received ...' },
            { date: '02 May', dept: 'QC Gate 1', shift: 'Day', matIn: 0, processCost: 375, output: '75 pcs QC pass', qcStatus: 'pass', notes: 'All 75 approved. 2 extras held as buff...' },
            { date: '05 May', dept: 'Packing + Dispatch', shift: 'Day', matIn: 9225, processCost: 1350, output: '75 pcs dispatched', qcStatus: 'pass', notes: 'Packed in 8 boxes. DTDC AWB DTDC908765...' },
        ],
        journey: [
            { dept: 'DTP Pre-Press', icon: '🎨', status: 'complete', in: 75, out: 75, time: '3.0 hrs', cost: 1800, qc: 'pass', dt: '25 Apr' },
            { dept: 'Outsource 3D Engraving', icon: '💎', status: 'complete', in: 77, out: 75, time: 'Outsource', cost: 13500, qc: 'pass', dt: '02 May' },
            { dept: 'QC Gate 1', icon: '✅', status: 'complete', in: 75, out: 75, time: '0.5 hrs', cost: 375, qc: 'pass', dt: '02 May' },
            { dept: 'Packing + Dispatch', icon: '📦', status: 'complete', in: 75, out: 75, time: '2.0 hrs', cost: 1350, qc: 'pass', dt: '05 May' },
        ],
        fg: { fgDate: '04 May 2026', fgQty: 75, fgBy: 'Sunita Kadam', invoiceRaised: true, invoiceDate: '04 May 2026' },
        packing: {
            packedBy: 'Ramesh Nair', boxes: 8, packDt: '05 May 2026',
            dispatchType: 'courier', courier: 'DTDC', dispatchDt: '05 May 2026',
            destinations: [{ name: 'Events India Office', qty: 75, awb: 'DTDC9087654321', status: 'delivered' }]
        },
        financial: {
            revenue: { soRate: 3200, qty: 75, subtotal: 240000, gstAmt: 43200, total: 283200 },
            materialCost: { bom: 46825, actual: 46825, variance: 0 },
            processCost: { bom: 17025, actual: 17025, variance: 0 },
            packingCost: { material: 9225, labour: 1350, logistics: 4200, total: 14775 },
            overhead: { pct: 12, amt: 11563 },
            totalCost: 90188, grossProfit: 149812, grossMargin: 62.4,
        },
    },

    // JOB 3 — RD-2504 — IN PRODUCTION (Reliance Long Service Plaque)
    {
        id: 'RD-2504', type: 'Production', client: 'Reliance Industries', clientGST: '27RELI1234H1Z8',
        contact: 'Sunil Kapoor', phone: '+91 98880 12345',
        soNo: 'SO-2026-0413', soDate: '05 May 2026', invoiceNo: '',
        product: 'Long Service Award Plaque — Acrylic + Gold Foil', qty: 160,
        soRate: 1850, soAmt: 296000, gst: 18, soTotal: 349280,
        delivDate: '22 May 2026', status: 'in_production',
        category: 'Plaque', technique: 'Laser Cut + Gold Foil + UV Print',
        csHistory: [
            { dt: '02 May 2026 09:00', by: 'Priya (Sales)', event: 'Enquiry received', detail: 'Reliance Industries — 160 plaques for long servi...' },
            { dt: '03 May 2026 14:00', by: 'DTP Team', event: 'Artwork initiated', detail: '4 artwork variants (25/20/15/10 yr) being prepar...' },
            { dt: '04 May 2026 10:00', by: 'Sunil Kapoor (Client)', event: 'Artwork revision 1', detail: 'Font change requested — from Helvetica to Garamo...' },
            { dt: '04 May 2026 16:00', by: 'DTP Team', event: 'DTP v2 ready', detail: 'Revised with Garamond + gold foil outline. Await...' },
            { dt: '05 May 2026 09:00', by: 'Sunil Kapoor (Client)', event: 'Artwork approved', detail: 'All 4 variants approved. Proceed to production.' },
            { dt: '05 May 2026 10:00', by: 'Ops Head', event: 'Production order raised', detail: 'RD-2504 raised. Materials requisitioned from sto...' },
        ],
        approvals: [
            { stage: 'Enquiry', by: 'Priya (Sales)', dt: '02 May', status: 'done', icon: '📞' },
            { stage: 'Design (4 variants)', by: 'DTP Team', dt: '04 May', status: 'done', icon: '🎨' },
            { stage: 'Client Approval', by: 'Sunil Kapoor', dt: '05 May', status: 'done', icon: '✅' },
            { stage: 'Costing', by: 'Shalini', dt: '05 May', status: 'done', icon: '💰' },
            { stage: 'Production', by: 'Ops Head', dt: '05 May', status: 'done', icon: '🏭' },
            { stage: 'Dispatch', by: 'Packing Team', dt: '22 May', status: 'pending', icon: '🚚' },
        ],
        bomMaterial: [
            { item: 'Acrylic Sheet 6mm Frosted', spec: '14"×10" per pc', bomQty: 112, bomQtyUnit: 'sqft', rate: 420, bomCost: 47040, actualQty: 118, actualCost: 49560, variance: 6, varPct: 5.4, store: 'G-1' },
            { item: 'Gold Foil Roll', spec: 'Metallic hot stamp foil', bomQty: 8, bomQtyUnit: 'metres', rate: 280, bomCost: 2240, actualQty: 8, actualCost: 2240, variance: 0, varPct: 0, store: 'Stores' },
            { item: 'UV Ink (Gold + CMYK)', spec: 'Job quantity', bomQty: 0.8, bomQtyUnit: 'litre', rate: 12000, bomCost: 9600, actualQty: 0.8, actualCost: 9600, variance: 0, varPct: 0, store: 'UV Studio' },
            { item: 'Wooden Box 12x8"', spec: 'Velvet lined', bomQty: 160, bomQtyUnit: 'nos', rate: 125, bomCost: 20000, actualQty: 160, actualCost: 20000, variance: 0, varPct: 0, store: 'Packing' },
            { item: 'Outer Carton Large', spec: 'For transit', bomQty: 18, bomQtyUnit: 'nos', rate: 95, bomCost: 1710, actualQty: 18, actualCost: 1710, variance: 0, varPct: 0, store: 'Packing' },
        ],
        bomProcess: [
            { dept: 'DTP Pre-Press', process: '4-Variant Artwork Setup', uom: 'Job', rate: 4000, bomQty: 1, bomCost: 4000, actualQty: 1, actualCost: 4000, time: '6 hrs', operator: 'Kiran' },
            { dept: 'LC Studio', process: 'Acrylic Plaque Cutting', uom: 'sqft', rate: 18, bomQty: 112, bomCost: 2016, actualQty: 118, actualCost: 2124, time: '5.2 hrs', operator: 'Shift 1' },
            { dept: 'UV Printing Studio', process: 'UV Print + Gold Effect', uom: 'sqft', rate: 95, bomQty: 112, bomCost: 10640, actualQty: 0, actualCost: 0, time: 'Pending', operator: '—' },
            { dept: 'Gold Foil Stamping', process: 'Hot Foil Border', uom: 'pcs', rate: 35, bomQty: 160, bomCost: 5600, actualQty: 0, actualCost: 0, time: 'Pending', operator: '—' },
            { dept: 'Assembly + QC', process: 'Final Assembly + QC', uom: 'pcs', rate: 20, bomQty: 160, bomCost: 3200, actualQty: 0, actualCost: 0, time: 'Pending', operator: '—' },
            { dept: 'Packing', process: 'Box Packing', uom: 'pcs', rate: 18, bomQty: 160, bomCost: 2880, actualQty: 0, actualCost: 0, time: 'Pending', operator: '—' },
        ],
        materialLedger: [
            { date: '05 May', ref: 'MR-003', event: 'BOM Assigned', dept: 'Stores', matIn: 80590, matOut: 0, balance: 80590, notes: 'Full BOM reserved in stores' },
            { date: '07 May', ref: 'ISS-301', event: 'Issued to LC Studio', dept: 'LC Studio', matIn: 0, matOut: 49560, balance: 31030, notes: 'Acrylic 118sqft issued — 6sqft buffer ...' },
            { date: '08 May', ref: 'ISS-302', event: 'Gold foil to Foil Dept', dept: 'Foil Stamping', matIn: 0, matOut: 2240, balance: 28790, notes: 'Gold foil 8m issued' },
        ],
        processLedger: [
            { date: '05 May', dept: 'DTP Pre-Press', shift: 'Day', matIn: 0, processCost: 4000, output: '4-variant artwork ready', qcStatus: 'pass', notes: 'Garamond font + gold foil design. Clie...' },
            { date: '07 May', dept: 'LC Studio — Shift 1', shift: 'Day', matIn: 49560, processCost: 2124, output: '160 acrylic blanks cut', qcStatus: 'pass', notes: '118sqft used (6sqft over BOM — 2 sheet...' },
            { date: '09 May', dept: 'UV Printing Studio', shift: '—', matIn: 0, processCost: 0, output: 'In progress', qcStatus: 'pending', notes: 'UV print scheduled for 09 May. Gold + ...' },
        ],
        journey: [
            { dept: 'DTP Pre-Press', icon: '🎨', status: 'complete', in: 160, out: 160, time: '6.0 hrs', cost: 4000, qc: 'pass', dt: '05 May' },
            { dept: 'LC Studio', icon: '✂️', status: 'complete', in: 118, out: 160, time: '5.2 hrs', cost: 2124, qc: 'pass', dt: '07 May' },
            { dept: 'UV Print Studio', icon: '🖨️', status: 'active', in: 0, out: 0, time: '—', cost: 0, qc: 'pending', dt: '09 May' },
            { dept: 'Gold Foil Stamp', icon: '✨', status: 'pending', in: 0, out: 0, time: '—', cost: 0, qc: 'pending', dt: '—' },
            { dept: 'Assembly + QC', icon: '🔧', status: 'pending', in: 0, out: 0, time: '—', cost: 0, qc: 'pending', dt: '—' },
            { dept: 'Packing', icon: '📦', status: 'pending', in: 0, out: 0, time: '—', cost: 0, qc: 'pending', dt: '—' },
        ],
        fg: { fgDate: '', fgQty: 0, fgBy: '', invoiceRaised: false, invoiceDate: '' },
        packing: {
            packedBy: '', boxes: 0, packDt: '', dispatchType: 'courier', courier: 'BlueDart', dispatchDt: '',
            destinations: [
                { name: 'RIL HQ Nariman Point', qty: 80, awb: '', status: 'pending' },
                { name: 'RIL Navi Mumbai', qty: 50, awb: '', status: 'pending' },
                { name: 'RIL Jamnagar', qty: 30, awb: '', status: 'pending' },
            ]
        },
        financial: {
            revenue: { soRate: 1850, qty: 160, subtotal: 296000, gstAmt: 53280, total: 349280 },
            materialCost: { bom: 80590, actual: 81684, variance: 1094 },
            processCost: { bom: 28336, actual: 6124, variance: -22212 },
            packingCost: { material: 0, labour: 0, logistics: 0, total: 0 },
            overhead: { pct: 12, amt: 10532 },
            totalCost: 98340, grossProfit: 197660, grossMargin: 66.8,
        },
    },
];


export const STATUS_CFG = {
    dispatched: { c: '#059669', bg: '#ECFDF5', bd: '#6EE7B7', l: 'Dispatched' },
    shipped: { c: '#059669', bg: '#ECFDF5', bd: '#6EE7B7', l: 'Dispatched' },
    packed: { c: '#0D9488', bg: '#F0FDFA', bd: '#99F6E4', l: 'Packed' },
    in_qc: { c: '#8B5CF6', bg: '#F5F3FF', bd: '#DDD6FE', l: 'Pack' },
    qc_pending: { c: '#8B5CF6', bg: '#F5F3FF', bd: '#DDD6FE', l: 'QC Pending' },
    complete: { c: '#059669', bg: '#ECFDF5', bd: '#6EE7B7', l: 'Done (QC)' },
    in_production: { c: '#0EA5E9', bg: '#E0F2FE', bd: '#BAE6FD', l: 'In Production' },
    sample: { c: '#F59E0B', bg: '#FFFBEB', bd: '#FDE68A', l: 'Sample' },
    hold: { c: '#DC2626', bg: '#FEF2F2', bd: '#FECACA', l: 'On Hold' },
    on_hold: { c: '#DC2626', bg: '#FEF2F2', bd: '#FECACA', l: 'On Hold' },
    pending: { c: '#94A3B8', bg: '#F8FAFC', bd: '#E2E8F0', l: 'Pending' },
};

export const isJobOnHold = (j) => {
    if (!j) return false;
    const jStatus = (j.status || '').toLowerCase().trim();
    return Boolean(j.is_on_hold || jStatus === 'hold' || jStatus === 'on_hold');
};

export const isJobFullyDispatched = (j) => {
    if (!j) return false;
    const jStatus = (j.status || '').toLowerCase().trim();
    const packStage = String(j.stage || j.ct_pack?.stage || j.packing?.stage || '').toLowerCase().trim();
    const packStatus = String(j.status || j.ct_pack?.status || j.packing?.status || '').toLowerCase().trim();
    const isOnHold = Boolean(j.is_on_hold || jStatus === 'hold' || jStatus === 'on_hold');

    const isDoneTab = Boolean(
        !isOnHold &&
        (
            packStage === 'logistics' ||
            j.stage === 'logistics' ||
            j.ct_pack?.stage === 'logistics'
        )
    );

    const plannedQty = Number(j.qty || j.job_quantity || j.total_qty || 0);
    const deliveredQty = Number(j.deliveredQty ?? j.ct_pack?.deliveredQty ?? j.packing?.deliveredQty ?? j.packed_qty ?? 0);
    const isQtyComplete = plannedQty > 0 && deliveredQty >= plannedQty;

    return Boolean(
        !isOnHold &&
        !isDoneTab &&
        packStatus !== 'packing in progress' &&
        jStatus !== 'packing_in_progress' &&
        packStage !== 'logistics' &&
        !j.is_partial_dispatch &&
        (
            jStatus === 'shipped' ||
            jStatus === 'dispatched' ||
            j.is_dispatched ||
            packStatus === 'completed' ||
            packStatus === 'dispatched' ||
            packStage === 'complete' ||
            packStage === 'completed' ||
            packStage === 'dispatched' ||
            isQtyComplete ||
            (j.packing && j.packing.dispatchDt && (packStatus === 'completed' || isQtyComplete))
        )
    );
};