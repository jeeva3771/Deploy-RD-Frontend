import React, { useState } from 'react';
import { STATUS_CFG, fmtN, isJobFullyDispatched, isJobOnHold } from './data.js';
import { getUserRole } from '../../../../utils/permission/auth.jsx';
import DeliveryPriorityColor from '../../../../components/deliveryPriorityColor/priorityColor';

function JobBanner({ job, sidebarOpen, setSidebarOpen }) {
    const [previewImg, setPreviewImg] = useState(null);
    const isShippedJob = isJobFullyDispatched(job);
    const isOnHoldJob = isJobOnHold(job);
    const showBadge = isShippedJob || isOnHoldJob;
    const bannerStatusKey = isOnHoldJob ? 'hold' : (isShippedJob ? 'dispatched' : job.status);
    const sc = STATUS_CFG[bannerStatusKey] || STATUS_CFG[job.status] || STATUS_CFG.pending;
    const jobDeliveryDate = job.job_completion_datetime || job.delivery_date || job.delivDate;

    const userRole = getUserRole();
    const userRoleLower = String(userRole?.name || userRole || '').toLowerCase();
    const isAdmin = userRoleLower.includes('admin') || userRoleLower === 'super admin' || userRoleLower === 'superadmin';

    const soAmt = job.soAmt || ((job.soRate || 0) * (job.qty || 0));
    const fin = job.financial || {};
    const matActual = fin.materialCost?.actual || 0;
    const procActual = fin.processCost?.actual || 0;
    const packCost = fin.packingCost?.total || 0;
    const spent = matActual + procActual + packCost;
    const revenueVal = fin.revenue?.subtotal || soAmt;
    const grossMarginVal = fin.grossMargin !== undefined && fin.grossMargin !== null ? fin.grossMargin : (soAmt > 0 ? Math.round(((soAmt - spent) / soAmt) * 100) : 0);

    return (
        <div className="job-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {!sidebarOpen && (
                    <button
                        className="sb-toggle"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open job list"
                        style={{ marginRight: 4, flexShrink: 0, alignSelf: 'flex-start', marginTop: '4px' }}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                )}
                {job.image && (
                    <img
                        src={job.image}
                        alt={job.product || 'Product'}
                        onClick={() => setPreviewImg(job.image)}
                        title="Click to view full image"
                        style={{
                            width: 68,
                            height: 68,
                            borderRadius: 9,
                            objectFit: 'cover',
                            border: '1.5px solid #E2E8F0',
                            cursor: 'pointer',
                            flexShrink: 0,
                            background: '#F8FAFC',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
                        }}
                    />
                )}
                <div>
                    <div className="jb-id">{job.id}</div>
                    <div className="jb-client">{job.client}</div>
                    <div className="jb-product">{job.product}</div>
                    <div className="jb-pills">
                        <span className="jb-pill">{job.qty} pcs</span>
                        <span className="jb-pill">Comp: {job.completionDate || job.job_completion_datetime || job.delivDate || '-'}</span>
                        {jobDeliveryDate && (
                            <DeliveryPriorityColor
                                deliveryDate={jobDeliveryDate}
                                showPriorityName={true}
                                badgeClassName="!text-[10px] !font-black !py-0.5 !px-2.5 !rounded-full text-white shadow-xs uppercase tracking-wide"
                            />
                        )}
                        {job.invoiceNo && <span className="jb-pill">INV: {job.invoiceNo}</span>}
                        {showBadge && (
                            <span className="jb-pill" style={{ background: sc.bg, color: sc.c, border: '1px solid ' + sc.bd }}>{sc.l}</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="jb-kpis">
                <div className="kpi"><div className="kpi-v" style={{ color: '#059669' }}>₹{fmtN(revenueVal)}</div><div className="kpi-l">SO Value</div></div>
                <div className="kpi"><div className="kpi-v" style={{ color: '#EF4444' }}>₹{fmtN(spent)}</div><div className="kpi-l">Cost Incurred</div></div>
                {isAdmin && (
                    <div className="kpi"><div className="kpi-v" style={{ color: '#8B5CF6' }}>{grossMarginVal}%</div><div className="kpi-l">Gross Margin</div></div>
                )}
                <div className="kpi"><div className="kpi-v" style={{ color: '#0D9488' }}>{job.qty}</div><div className="kpi-l">Qty Ordered</div></div>
            </div>

            {/* FULL IMAGE LIGHTBOX MODAL */}
            {previewImg && (
                <div
                    onClick={() => setPreviewImg(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setPreviewImg(null)}
                            style={{
                                position: 'absolute',
                                top: -14,
                                right: -14,
                                background: '#EF4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                fontSize: 16,
                                fontWeight: 900,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                        >
                            ✕
                        </button>
                        <img
                            src={previewImg}
                            alt="Full Preview"
                            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default JobBanner;