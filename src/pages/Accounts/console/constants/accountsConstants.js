export const JOBS = [
  { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 118, inv: 'RD/INV/2026/2501', contact: 'Priya Sharma', bilAt: '08 May 12:46', bilDocs: { invoice: { n: 'RD-2501_Invoice.pdf', by: 'Shalini', dt: '08 May 01:30' }, challan: { n: 'RD-2501_Challan.pdf', by: 'Shalini', dt: '08 May 01:35' }, eway: null } },
  { id: 'RD-2503', client: 'Bank Awards', product: 'Medal + Lanyard', qty: 200, inv: 'RD/INV/2026/2503', contact: 'Rahul Mehta', bilAt: '07 May 04:16', bilDocs: { invoice: null, challan: { n: 'RD-2503_Challan.pdf', by: 'Shalini', dt: '07 May 05:45' }, eway: null } },
  { id: 'RD-2499', client: 'Events India', product: 'Crystal Award', qty: 75, inv: 'RD/INV/2026/2499', contact: 'Kavita Rao', bilAt: '05 May 11:01', bilDocs: { invoice: { n: 'RD-2499_Invoice.pdf', by: 'Shalini', dt: '05 May 12:30' }, challan: { n: 'RD-2499_Challan.pdf', by: 'Shalini', dt: '05 May 12:35' }, eway: { n: 'RD-2499_EwayBill.pdf', by: 'Shalini', dt: '05 May 12:40' } } },
  { id: 'RD-2504', client: 'Reliance Industries', product: 'Long Service Plaque', qty: 160, inv: 'RD/INV/2026/2504', contact: 'Sunil Kapoor', bilAt: '07 May 02:01', bilDocs: { invoice: null, challan: null, eway: null } },
  { id: 'RD-2500', client: 'L&T Finance', product: 'Best Branch Trophy', qty: 24, inv: 'RD/INV/2026/2500', contact: 'Harsh Sharma', bilAt: '06 May 09:01', bilDocs: { invoice: { n: 'RD-2500_Invoice.pdf', by: 'Shalini', dt: '06 May 10:30' }, challan: null, eway: null } },
];


export const ACC = {
  salesOrders: [
    { id: 'SO-2026-0412', client: 'Insurance Corp', job: 'RD-2501', product: 'Shimmer Trophy', qty: 118, rate: 2850, amt: 336300, gst: 18, total: 396834, soDate: '01 May 2026', delivDate: '12 May 2026', status: 'invoiced', inv: 'RD/INV/2026/2501' },
    { id: 'SO-2026-0411', client: 'Bank Awards', job: 'RD-2503', product: 'Medal + Lanyard', qty: 200, rate: 1450, amt: 290000, gst: 12, total: 324800, soDate: '29 Apr 2026', delivDate: '26 May 2026', status: 'active', inv: '' },
    { id: 'SO-2026-0409', client: 'Events India', job: 'RD-2499', product: 'Crystal Award', qty: 75, rate: 3200, amt: 240000, gst: 18, total: 283200, soDate: '25 Apr 2026', delivDate: '07 May 2026', status: 'paid', inv: 'RD/INV/2026/2499' },
    { id: 'SO-2026-0408', client: 'Tech Mahindra', job: 'RD-2497', product: 'Acrylic Plaque', qty: 350, rate: 680, amt: 238000, gst: 18, total: 280840, soDate: '22 Apr 2026', delivDate: '30 Apr 2026', status: 'overdue', inv: 'RD/INV/2026/2497' },
    { id: 'SO-2026-0406', client: 'HDFC Life', job: 'RD-2495', product: 'Trophy + Box', qty: 500, rate: 1200, amt: 600000, gst: 18, total: 708000, soDate: '18 Apr 2026', delivDate: '25 Apr 2026', status: 'partial_paid', inv: 'RD/INV/2026/2495' },
  ],
  clients: [],
  vendors: [
    { id: 'v1', vendor: 'Acrylic World Mumbai', type: 'Raw Material', contact: 'Deepak Sharma', phone: '+91 98200 44123', bills: [{ bill: 'AW/2026/1234', date: '01 May 2026', amt: 85000, paid: 0, due: 85000, dueDate: '15 May 2026', status: 'pending' }, { bill: 'AW/2026/1198', date: '10 Apr 2026', amt: 62000, paid: 62000, due: 0, dueDate: '24 Apr 2026', status: 'paid' }] },
    { id: 'v2', vendor: 'Metal Craft Supplies', type: 'Metal Stock', contact: 'Ravi Gupta', phone: '+91 98760 12345', bills: [{ bill: 'MC/2026/0892', date: '28 Apr 2026', amt: 134000, paid: 50000, due: 84000, dueDate: '12 May 2026', status: 'partial' }] },
    { id: 'v3', vendor: 'Print Plus Offset', type: 'Printing', contact: 'Sanjay Verma', phone: '+91 99010 55432', bills: [{ bill: 'PP/2026/0456', date: '05 May 2026', amt: 28500, paid: 0, due: 28500, dueDate: '19 May 2026', status: 'pending' }, { bill: 'PP/2026/0441', date: '20 Apr 2026', amt: 31200, paid: 31200, due: 0, dueDate: '04 May 2026', status: 'paid' }] },
    { id: 'v4', vendor: 'BlueDart Express', type: 'Courier', contact: 'Ops Manager', phone: '+91 1800 233 1234', bills: [{ bill: 'BD/2026/MAY01', date: '01 May 2026', amt: 12400, paid: 0, due: 12400, dueDate: '31 May 2026', status: 'pending' }] },
    { id: 'v5', vendor: 'Raju Transports', type: 'Hand Delivery', contact: 'Raju Kadam', phone: '+91 98450 77890', bills: [{ bill: 'RT/2026/0089', date: '07 May 2026', amt: 1800, paid: 0, due: 1800, dueDate: '14 May 2026', status: 'pending' }] },
  ],
  pl: {
    month: 'May 2026', revenue: { invoiced: 2089674, collected: 754900, target: 2500000 }, costs: { material: 412000, labour: 185000, overhead: 95000, logistics: 42000, misc: 18000 }, gstCollected: 289674, gstPayable: 98400, gstNet: 191274, tdsDeducted: 24000, tdsPayable: 18000,
    trend: [{ m: 'Jan', r: 1420000, c: 580000 }, { m: 'Feb', r: 1650000, c: 620000 }, { m: 'Mar', r: 1890000, c: 710000 }, { m: 'Apr', r: 2140000, c: 790000 }, { m: 'May', r: 2089674, c: 752000 }]
  },
  assets: [
    { id: 'A001', n: 'CNC Laser Cutter (Epilog Fusion)', cat: 'Machinery', yr: 'Jan 2022', cost: 1850000, book: 1110000, dep: 740000, loc: 'Laser Studio', status: 'active', svc: 'Mar 2026' },
    { id: 'A002', n: 'UV Flatbed Printer (Mimaki JFX200)', cat: 'Machinery', yr: 'Jun 2021', cost: 2400000, book: 1200000, dep: 1200000, loc: 'UV Studio', status: 'active', svc: 'Apr 2026' },
    { id: 'A003', n: 'Hantop UV Printer', cat: 'Machinery', yr: 'Mar 2023', cost: 980000, book: 784000, dep: 196000, loc: 'UV Studio', status: 'active', svc: 'Feb 2026' },
    { id: 'A004', n: 'Air Compressor 50L', cat: 'Equipment', yr: 'Aug 2020', cost: 125000, book: 25000, dep: 100000, loc: 'Workshop', status: 'active', svc: 'Jan 2026' },
    { id: 'A005', n: 'Sandblasting Cabinet', cat: 'Equipment', yr: 'Feb 2021', cost: 85000, book: 34000, dep: 51000, loc: 'Finishing', status: 'inactive', svc: 'Dec 2025' },
    { id: 'A006', n: 'Delivery Van MH04 AB 1234', cat: 'Vehicle', yr: 'Oct 2019', cost: 620000, book: 62000, dep: 558000, loc: 'Logistics', status: 'active', svc: 'Mar 2026' },
    { id: 'A007', n: 'Factory Fit-out', cat: 'Fixtures', yr: 'Jan 2018', cost: 950000, book: 190000, dep: 760000, loc: 'All', status: 'active', svc: '—' },
  ],
  stock: [
    { id: 'S001', n: 'Acrylic 12mm Clear', u: 'sqft', op: 840, rcv: 320, iss: 510, cl: 650, min: 200, val: 325000, loc: 'G-1' },
    { id: 'S002', n: 'Acrylic 6mm Frosted', u: 'sqft', op: 620, rcv: 180, iss: 290, cl: 510, min: 150, val: 204000, loc: 'G-1' },
    { id: 'S003', n: 'Acrylic 3mm Tinted', u: 'sqft', op: 380, rcv: 240, iss: 400, cl: 220, min: 200, val: 88000, loc: 'G-1' },
    { id: 'S004', n: 'MDF Board 6mm', u: 'sqft', op: 1200, rcv: 600, iss: 980, cl: 820, min: 300, val: 164000, loc: 'G-2' },
    { id: 'S005', n: 'Aluminium Sheet 2mm', u: 'sqft', op: 280, rcv: 120, iss: 180, cl: 220, min: 100, val: 132000, loc: 'G-2' },
    { id: 'S006', n: 'UV Ink Cyan', u: 'litre', op: 18, rcv: 12, iss: 14, cl: 16, min: 10, val: 192000, loc: 'UV Studio' },
    { id: 'S007', n: 'UV Ink Magenta', u: 'litre', op: 15, rcv: 12, iss: 16, cl: 11, min: 10, val: 132000, loc: 'UV Studio' },
    { id: 'S008', n: 'UV Ink Black', u: 'litre', op: 20, rcv: 12, iss: 15, cl: 17, min: 12, val: 204000, loc: 'UV Studio' },
    { id: 'S009', n: 'UV Ink White', u: 'litre', op: 22, rcv: 10, iss: 18, cl: 14, min: 12, val: 168000, loc: 'UV Studio' },
    { id: 'S010', n: 'Laser Brass Sheet', u: 'pcs', op: 150, rcv: 100, iss: 120, cl: 130, min: 50, val: 91000, loc: 'G-3' },
    { id: 'S011', n: 'Packing Boxes Assorted', u: 'nos', op: 800, rcv: 400, iss: 650, cl: 550, min: 200, val: 82500, loc: 'Packing' },
  ],
  godowns: [
    { id: 'GD-01', n: 'Raw Material Store A', type: 'Raw Material', sqft: 1200, active: true, jobs: 12, mat: true, items: 28, by: 'Deepak Mishra', audit: '01 May 2026' },
    { id: 'GD-02', n: 'Raw Material Store B', type: 'Raw Material', sqft: 900, active: true, jobs: 8, mat: true, items: 19, by: 'Ramesh Yadav', audit: '01 May 2026' },
    { id: 'GD-03', n: 'UV Ink + Consumables', type: 'Consumables', sqft: 400, active: true, jobs: 0, mat: true, items: 14, by: 'Priya Menon', audit: '28 Apr 2026' },
    { id: 'GD-04', n: 'Finished Goods Store', type: 'Finished Goods', sqft: 1800, active: true, jobs: 5, mat: true, items: 6, by: 'Sunita Kadam', audit: '08 May 2026' },
    { id: 'GD-05', n: 'Packing Material Store', type: 'Packing', sqft: 600, active: true, jobs: 0, mat: true, items: 12, by: 'Anil Patil', audit: '05 May 2026' },
    { id: 'GD-06', n: 'Acrylic Offcuts', type: 'Scrap', sqft: 300, active: true, jobs: 0, mat: true, items: 3, by: 'Deepak Mishra', audit: '15 Apr 2026' },
    { id: 'GD-07', n: 'Mezzanine West', type: 'Archive', sqft: 500, active: false, jobs: 0, mat: false, items: 0, by: '—', audit: 'Jan 2026' },
    { id: 'GD-08', n: 'Old Machinery Room', type: 'Equipment', sqft: 250, active: false, jobs: 0, mat: false, items: 2, by: 'Maintenance', audit: 'Mar 2026' },
  ],
  bom: [
    { id: 'RD-2501', client: 'Insurance Corp', product: 'Shimmer Trophy', qty: 118, mat: 'Acrylic 12mm', bom: 354, act: 372, diff: 18, pct: 5.1, reason: 'Edge wastage — sheet format mismatch', st: 'over' },
    { id: 'RD-2499', client: 'Events India', product: 'Crystal Award', qty: 75, mat: 'Acrylic 12mm', bom: 225, act: 221, diff: -4, pct: -1.8, reason: 'Efficient nesting — 4 sqft saved', st: 'under' },
    { id: 'RD-2503', client: 'Bank Awards', product: 'Medal + Lanyard', qty: 200, mat: 'Brass Sheet', bom: 100, act: 100, diff: 0, pct: 0, reason: 'Exact BOM match', st: 'exact' },
    { id: 'RD-2497', client: 'Tech Mahindra', product: 'Acrylic Plaque', qty: 350, mat: 'Acrylic 6mm', bom: 700, act: 748, diff: 48, pct: 6.9, reason: '3 sheets cracked during laser — BOM review needed', st: 'over' },
    { id: 'RD-2495', client: 'HDFC Life', product: 'Trophy + Box', qty: 500, mat: 'Acrylic 12mm', bom: 1250, act: 1238, diff: -12, pct: -1.0, reason: 'Nesting optimised by LC operator', st: 'under' },
    { id: 'RD-2502', client: 'Wipro', product: 'Innovation Shield', qty: 90, mat: 'Aluminium 2mm', bom: 180, act: 197, diff: 17, pct: 9.4, reason: 'Customer changed size mid-production. BOM not updated.', st: 'over' },
  ],
  audit: {
    stock: { sc: 78, f: [{ s: 'HIGH', t: 'UV Ink Magenta below minimum stock', d: 'Closing 11L vs min 10L — 1L buffer. Risk of production stoppage in 2 days.' }, { s: 'MED', t: 'Acrylic 3mm Tinted near minimum', d: '220 sqft vs min 200. Order immediately.' }, { s: 'LOW', t: 'Brass sheet — no receipt in 30 days', d: 'Check next job requirement before ordering.' }], last: '01 May 2026', due: '01 Jun 2026' },
    production: { sc: 84, f: [{ s: 'HIGH', t: 'RD-2497 material variance 6.9% over BOM', d: '48 sqft excess. 3 sheets cracked. BOM needs update. Rs 8,500 impact.' }, { s: 'MED', t: 'RD-2502 BOM not updated after spec change', d: 'Customer changed size mid-production. Finance impact: Rs 8,500.' }, { s: 'LOW', t: '2 jobs without QC sign-off', d: 'RD-2488, RD-2490 — retrospective sign-off required.' }], last: '15 Apr 2026', due: '15 May 2026' },
    financial: { sc: 71, f: [{ s: 'HIGH', t: 'Tech Mahindra invoice overdue 31 days', d: 'Rs 2.8L outstanding. No commitment received. Escalate to Director.' }, { s: 'HIGH', t: 'HDFC Life partial — Rs 3.58L balance', d: 'Balance due 09 May — follow up daily.' }, { s: 'MED', t: '2 SOs without invoices', d: 'SO-2026-0411 and SO-2026-0408 — revenue recognition gap.' }, { s: 'LOW', t: 'Petty cash April not reconciled', d: 'Rs 12,450 unaccounted.' }], last: '30 Apr 2026', due: '30 May 2026' },
    gst: { sc: 90, f: [{ s: 'MED', t: 'GSTR-1 due in 2 days', d: '3 invoices not yet matched to GSTIN.' }, { s: 'LOW', t: 'ITC on courier bills not claimed', d: 'Rs 42,000 bills — ITC Rs 5,040 available.' }], last: '10 Apr 2026', due: '10 May 2026' },
    asset: { sc: 88, f: [{ s: 'MED', t: 'Sandblasting Cabinet inactive — dispose', d: 'Net book Rs 34,000. Consider disposal or lease-out.' }, { s: 'LOW', t: 'Delivery van service overdue 15 days', d: 'Schedule service this week.' }], last: '01 Apr 2026', due: '01 Jul 2026' },
    vendor: { sc: 82, f: [{ s: 'HIGH', t: 'Metal Craft Rs 84,000 partial pending', d: '30-day credit exhausted. Vendor may stop supply.' }, { s: 'MED', t: 'Raju Transports bill not received', d: 'RD-2503 delivery done. Follow up.' }, { s: 'LOW', t: 'Print Plus — 3 invoices, no PO', d: 'Regularise with PO next month.' }], last: '01 May 2026', due: '01 Jun 2026' },
    payroll: { sc: 95, f: [{ s: 'LOW', t: '1 operator timesheet missing', d: 'Suresh Patil — May timesheet not submitted.' }, { s: 'LOW', t: 'PF due 15 May', d: 'Rs 38,400 PF+ESIC challan to be filed.' }], last: '30 Apr 2026', due: '31 May 2026' },
    compliance: { sc: 76, f: [{ s: 'HIGH', t: 'Factory licence renewal pending', d: 'Due 31 May 2026. Not yet filed. Rs 5,000 penalty after due date.' }, { s: 'MED', t: 'MSME portal — 2 buyers not registered', d: 'Risk of losing MSME dispute protection.' }, { s: 'LOW', t: 'Fire safety cert — 8 months old', d: 'Next inspection Sep 2026. Schedule proactively.' }], last: '01 Mar 2026', due: '01 Jun 2026' },
  },
};

export const CLIENTS_LIST = ['Insurance Corp', 'Bank Awards', 'Events India', 'Reliance Industries', 'Wipro Technologies', 'HDFC Life', 'Tech Mahindra', 'L&T Finance'];

export const SO_IDS = ['RD-2501', 'RD-2503', 'RD-2499', 'RD-2504', 'RD-2502', 'RD-2500'];
export const STATUS_CFG = { active: { c: '#2563EB', bg: '#EFF6FF' }, invoiced: { c: '#F59E0B', bg: '#FFFBEB' }, paid: { c: '#059669', bg: '#ECFDF5' }, overdue: { c: '#EF4444', bg: '#FEF2F2' }, partial_paid: { c: '#8B5CF6', bg: '#F5F3FF' } };
export const PRIORITY_CFG = { HIGH: { c: '#EF4444', bg: '#FEF2F2', bd: '#FECACA' }, MED: { c: '#F59E0B', bg: '#FFFBEB', bd: '#FDE68A' }, LOW: { c: '#6366F1', bg: '#EEF2FF', bd: '#C7D2FE' } };

// Reusable Helper Components
