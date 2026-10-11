import React from 'react';
import { STATUS_CFG, fmtR, isJobFullyDispatched, isJobOnHold } from './data.js';

function OverviewTab({ job }) {
    if (!job) return null;
    const isShippedJob = isJobFullyDispatched(job);
    const isOnHoldJob = isJobOnHold(job);
    const showBadge = isShippedJob || isOnHoldJob;
    const overviewStatusKey = isOnHoldJob ? 'hold' : (isShippedJob ? 'dispatched' : job.status);
    const sc = STATUS_CFG[overviewStatusKey] || STATUS_CFG[job.status] || STATUS_CFG.pending;

    const cleanVal = (val, fallback = '-') => {
        if (val === undefined || val === null) return fallback;
        const s = String(val).trim();
        if (!s || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'not provided') {
            return fallback;
        }
        return s;
    };

    const filterValid = (arr) => (arr || [])
        .map(String)
        .map(s => s.trim())
        .filter(s => s && s.toLowerCase() !== 'undefined' && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'n/a');

    const rawCompletionDate = job.job_completion_datetime || job.completionDate || job.completedDate || job.completion_date || '';
    const formattedCompletionDate = cleanVal(rawCompletionDate ? String(rawCompletionDate).split('T')[0].split(' ')[0].trim() : '');

    const rawDelivDate = job.delivDate || '';
    const formattedDelivDate = cleanVal(rawDelivDate ? String(rawDelivDate).split('T')[0].split(' ')[0].trim() : '');

    const jobDetails = [
        ['Job Number', cleanVal(job.id), true],
        ['Job Type', cleanVal(job.type), false],
        ['Product', cleanVal(job.product), false],
        ['Category', cleanVal(job.category), false],
        ['Sub-Category', cleanVal(job.technique), false],
        ['Quantity', (job.qty || 0) + ' pcs', true],
        ['Approved Date', cleanVal(job.soDate), false],
        ['Job Completion Date', formattedCompletionDate, false],
        ['Delivery Date', formattedDelivDate, false],
    ];

    const mobileList = filterValid(
        (job.mobiles && job.mobiles.length > 0)
            ? job.mobiles
            : (job.mobile ? [job.mobile] : ((job.phones && job.phones.length > 0) ? job.phones : (job.phone ? [job.phone] : [])))
    );
    const wpList = filterValid(
        (job.wpNumbers && job.wpNumbers.length > 0)
            ? job.wpNumbers
            : (job.whatsapp ? [job.whatsapp] : (Array.isArray(job.wp_number) ? job.wp_number : (job.wp_number ? [job.wp_number] : [])))
    );
    const emailList = filterValid(
        (job.emails && job.emails.length > 0) ? job.emails : (job.email ? [job.email] : [])
    );

    const clientDetails = [
        ['Client Name', cleanVal(job.client)],
        ['GST Number', cleanVal(job.clientGST)],
        ['Contact Person', cleanVal(job.contact)],
    ];


    return (
        <div>
            <div className="rg2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* JOB INFORMATION CARD */}
                <div className="lcard">
                    <div className="lch">
                        <div className="lcht">Job Specifications</div>
                        {showBadge && (
                            <span className="tag" style={{ background: sc.bg, color: sc.c, border: '1px solid ' + sc.bd }}>
                                {sc.l}
                            </span>
                        )}
                    </div>
                    <div className="lcb">
                        {jobDetails.map(([l, v, isMono]) => (
                            <div key={l} className="fin-row">
                                <span className="c64">{l}</span>
                                <span style={{ fontWeight: 800, color: '#0C1A2E', fontFamily: isMono ? 'monospace' : 'inherit' }}>
                                    {v}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CLIENT & COMMERCIAL DETAILS CARD */}
                <div className="lcard">
                    <div className="lch">
                        <div className="lcht">🏢 Client & Commercial Breakdown</div>
                    </div>
                    <div className="lcb">
                        {clientDetails.map(([l, v]) => (
                            <div key={l} className="fin-row">
                                <span className="c64">{l}</span>
                                <span style={{ fontWeight: 800, color: '#0C1A2E', fontFamily: l.includes('GST') ? 'monospace' : 'inherit' }}>
                                    {v}
                                </span>
                            </div>
                        ))}

                        {/* MOBILE NUMBERS */}
                        <div className="fin-row" style={{ alignItems: 'flex-start' }}>
                            <span className="c64">Mobile Number {mobileList.length > 1 ? `(${mobileList.length})` : ''}</span>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {mobileList.length === 0 ? (
                                    <span style={{ fontWeight: 800, color: '#94A3B8' }}>-</span>
                                ) : (
                                    mobileList.map((p, idx) => (
                                        <a key={idx} href={`tel:${p}`} style={{ fontWeight: 800, color: '#0D9488', fontFamily: 'monospace', textDecoration: 'none' }}>
                                            📞 {p}
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* WHATSAPP NUMBERS */}
                        <div className="fin-row" style={{ alignItems: 'flex-start' }}>
                            <span className="c64">WhatsApp Number {wpList.length > 1 ? `(${wpList.length})` : ''}</span>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {wpList.length === 0 ? (
                                    <span style={{ fontWeight: 800, color: '#94A3B8' }}>-</span>
                                ) : (
                                    wpList.map((w, idx) => (
                                        <a key={idx} href={`https://wa.me/${String(w).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ fontWeight: 800, color: '#059669', fontFamily: 'monospace', textDecoration: 'none' }}>
                                            💬 {w}
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* EMAIL ADDRESSES */}
                        <div className="fin-row" style={{ alignItems: 'flex-start' }}>
                            <span className="c64">Email Addresses {emailList.length > 1 ? `(${emailList.length})` : ''}</span>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {emailList.length === 0 ? (
                                    <span style={{ fontWeight: 800, color: '#94A3B8' }}>-</span>
                                ) : (
                                    emailList.map((em, idx) => (
                                        <a key={idx} href={`mailto:${em}`} style={{ fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', textDecoration: 'none' }}>
                                            ✉️ {em}
                                        </a>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>



        </div>
    );
}

export default OverviewTab;