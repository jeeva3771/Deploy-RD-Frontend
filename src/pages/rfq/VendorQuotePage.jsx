import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ImageLightbox from '../common/ImageLightbox';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

const fmt = (n) => Number(n).toLocaleString('en-IN');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD';
const fmtTime = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const h = dt.getHours().toString().padStart(2, '0');
  const m = dt.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};


const VendorQuotePage = () => {
  const { id, token } = useParams();

  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [rate, setRate] = useState('');
  const [delDays, setDelDays] = useState('');
  const [delDate, setDelDate] = useState('');
  const [isConfirmedSchedule, setIsConfirmedSchedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scheduleResponses, setScheduleResponses] = useState([]);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [showVendorSplit, setShowVendorSplit] = useState(false);
  const [vendorSplits, setVendorSplits] = useState([{ date: '', qty: '' }]);


  useEffect(() => {
    const fetchRFQ = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/rfq/vendor-view/${id}/${token}`);
        if (data.success) {
          setRfq(data.data);
          if (data.data.vendorName) setVendorName(data.data.vendorName);

          if (!data.data.isSplit && data.data.deliveryDate) {
            const dt = new Date(data.data.deliveryDate);
            const datePart = data.data.deliveryDate.split('T')[0];

            let hh = String(dt.getHours()).padStart(2, '0');
            let mm = String(dt.getMinutes()).padStart(2, '0');

            if (data.data.deliveryTime && data.data.deliveryTime.includes(':')) {
              [hh, mm] = data.data.deliveryTime.split(':');
            } else if (hh === '00' && mm === '00') {
              hh = '18'; mm = '00';
            }

            setDelDate(`${datePart}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`);
            const ms = dt.getTime() - Date.now();
            setDelDays(Math.max(1, Math.ceil(ms / 86400000)).toString());
          }

          if (data.data.isSplit && data.data.deliverySchedule)
            setScheduleResponses(data.data.deliverySchedule.map((_, i) => ({ splitIdx: i, isConfirmed: true, delDays: '' })));

          if (data.data.alreadySubmitted) {
            const eq = data.data.existingQuote;
            if (eq) {
              setRate(String(eq.rate || ''));
              setDelDays(String(eq.delDays || ''));
              if (eq.delDate) {
                const dt = new Date(eq.delDate);
                const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0'), hh = String(dt.getHours()).padStart(2, '0'), mm = String(dt.getMinutes()).padStart(2, '0');
                setDelDate(`${y}-${m}-${day}T${hh}:${mm}`);
              }
              if (eq.scheduleResponses?.length) {
                setScheduleResponses(eq.scheduleResponses.map(r => {
                  if (!r.delDate) return { ...r, delDate: '' };
                  const dt = new Date(r.delDate);
                  const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0'), hh = String(dt.getHours()).padStart(2, '0'), mm = String(dt.getMinutes()).padStart(2, '0');
                  return { ...r, delDate: `${y}-${m}-${day}T${hh}:${mm}` };
                }));
              }
              setIsConfirmedSchedule(eq.isScheduleConfirmed || false);
            }
            setSubmitted(true);
          }
        } else setError(data.message || 'API_ERROR');
      } catch (err) {
        setError(err.response?.data?.message || 'FETCH_FAILED');
      } finally {
        setLoading(false);
      }
    };
    fetchRFQ();
  }, [id, token]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorName.trim() || !rate || !delDays) return;

    if (!rfq.isSplit && showVendorSplit && vendorSplits.length > 0) {
      const validSplits = vendorSplits.filter(s => s.date && s.qty);
      if (validSplits.length === 0) {
        alert("Please provide at least one valid split entry, or remove the split proposal.");
        return;
      }
      const totalSplitQty = validSplits.reduce((sum, s) => sum + Number(s.qty), 0);
      if (totalSplitQty !== rfq.qty) {
        alert(`The total split quantity (${totalSplitQty}) must exactly match the required RFQ quantity (${rfq.qty}).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalDelDate = delDate;
      let finalDelDays = delDays;

      if (rfq.isSplit && scheduleResponses.length > 0) {
        const allDates = scheduleResponses.map((r, idx) => {
          if (r.delDate) return new Date(r.delDate).getTime();
          const orig = rfq.deliverySchedule[idx].date;
          return orig ? new Date(orig).getTime() : 0;
        }).filter(t => t > 0);
        if (allDates.length > 0) {
          const maxT = Math.max(...allDates);
          finalDelDate = new Date(maxT).toISOString();
          finalDelDays = Math.max(1, Math.ceil((maxT - Date.now()) / 86400000));
        }
      } else if (!rfq.isSplit && showVendorSplit && vendorSplits.length > 0) {
        const validSplits = vendorSplits.filter(s => s.date && s.qty);
        const latestDtStr = validSplits.reduce((mx, sp) => sp.date > mx ? sp.date : mx, '');
        if (latestDtStr) {
          let dObj = new Date(latestDtStr);
          if (dObj.getHours() === 0 && dObj.getMinutes() === 0) dObj.setHours(18, 0, 0, 0);
          finalDelDate = dObj.toISOString();
          finalDelDays = Math.max(1, Math.ceil((dObj.getTime() - Date.now()) / 86400000));
        }
      } else if (finalDelDate) {
        let dObj = new Date(finalDelDate);
        if (dObj.getHours() === 0 && dObj.getMinutes() === 0) dObj.setHours(18, 0, 0, 0);
        finalDelDate = dObj.toISOString();
      }

      await axios.post(`${BASE_URL}/rfq/vendor-quote/${id}/${token}`, {
        rate: Number(rate),
        delDays: Number(finalDelDays),
        delDate: finalDelDate ? new Date(finalDelDate).toISOString() : null,
        isScheduleConfirmed: isConfirmedSchedule || showVendorSplit,
        scheduleResponses: rfq.isSplit
          ? scheduleResponses.map(r => ({
            ...r,
            delDate: r.delDate ? new Date(r.delDate).toISOString() : null
          }))
          : (showVendorSplit && vendorSplits.length > 0
            ? vendorSplits.filter(s => s.date && s.qty).map((s, i) => ({
              splitIdx: i,
              isConfirmed: true,
              delDays: Math.max(1, Math.ceil((new Date(s.date).getTime() - Date.now()) / 86400000)),
              delDate: new Date(s.date).toISOString(),
              qty: Number(s.qty)
            }))
            : []),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  /* ── states ── */
  if (loading) return (
    <CenterScreen>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>Loading…</div>
      </div>
    </CenterScreen>
  );

  if (error && !rfq) return (
    <CenterScreen>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{error === 'EXPIRED_LINK' ? '⏰' : '🔗'}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
          {error === 'EXPIRED_LINK' ? 'Link Expired' : 'Invalid Link'}
        </h2>
        <div style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          {error === 'EXPIRED_LINK'
            ? 'This link has expired. Contact RDCA Procurement for a new one.'
            : 'Could not load this RFQ. Please try again or contact support.'}
        </div>
      </div>
    </CenterScreen>
  );

  if (submitted) {
    const displayRate = rate || (rfq?.existingQuote?.rate ?? '');
    const displayDays = delDays || (rfq?.existingQuote?.delDays ?? '');
    const displayVendor = vendorName || '';
    return (
      <CenterScreen>
        <div style={{ textAlign: 'center', maxWidth: 340, width: '100%', padding: '0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            {rfq?.alreadySubmitted ? 'Already Submitted' : 'Quote Submitted'}
          </h2>
          <div style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
            {rfq?.alreadySubmitted ? 'We already have your quote. Thank you!' : "Your quote has been recorded. We'll be in touch."}
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', textAlign: 'left' }}>
            {[['Vendor', displayVendor, '#0f172a'], ['Rate', displayRate ? `₹${fmt(displayRate)}` : '—', '#059669']].map(([l, v, c]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </CenterScreen>
    );
  }

  const isVendorSplitUnbalanced = showVendorSplit && (vendorSplits.reduce((acc, s) => acc + Number(s.qty || 0), 0) !== rfq.qty || vendorSplits.some(s => !s.date || !s.qty));
  const isSubmitDisabled = submitting || !vendorName.trim() || !rate || (showVendorSplit ? isVendorSplitUnbalanced : !isConfirmedSchedule);
  const submitBg = isSubmitDisabled ? '#e2e8f0' : '#059669';
  const submitColor = isSubmitDisabled ? '#94a3b8' : '#fff';

  /* ── main layout ── */
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .book-layout {
          min-height: 100vh;
          background: #f1f5f9;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .book-center {
          padding: 32px 24px 56px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 560px;
          width: 100%;
          animation: fadeUp .4s ease both;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .book-center {
            padding: 24px 20px 48px;
            max-width: 100%;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .book-center {
            padding: 16px 12px 40px;
            gap: 12px;
          }
        }

        /* Small mobile */
        @media (max-width: 360px) {
          .book-center {
            padding: 12px 10px 32px;
            gap: 10px;
          }
        }

        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .inp {
          width: 100%;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          outline: none;
          font-family: inherit;
          transition: border-color .15s;
          /* Prevent zoom on iOS when font-size < 16px */
          font-size: max(16px, 14px);
        }
        .inp:focus { border-color: #6366f1; }
        .inp::placeholder { color: #cbd5e1; font-weight: 400; }
        .inp:read-only { opacity: .6; cursor: not-allowed; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

        /* datetime-local on mobile — make it full-width and tappable */
        input[type=datetime-local] {
          min-height: 44px;
        }
        @media (max-width: 480px) {
          input[type=datetime-local] {
            font-size: 13px;
          }
        }

        .lbl {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 5px;
        }

        /* Tile grid — 2-col on all sizes, stacks to 1-col on very small */
        .tile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 320px) {
          .tile-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Split schedule confirm/date row */
        .split-row {
          display: flex;
          gap: 8px;
        }
        @media (max-width: 400px) {
          .split-row {
            flex-direction: column;
          }
          .split-row button,
          .split-row input {
            width: 100% !important;
          }
        }

        /* Vendor split entry grid */
        .vsplit-row {
          display: grid;
          grid-template-columns: 1fr 80px 32px;
          gap: 8px;
          margin-bottom: 8px;
          align-items: end;
        }
        @media (max-width: 400px) {
          .vsplit-row {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
          }
          .vsplit-row > div:first-child {
            grid-column: 1 / -1;
          }
        }

        /* Live total bar */
        .live-total {
          background: #1e293b;
          border-radius: 12px;
          padding: 16px 20px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        @media (max-width: 360px) {
          .live-total {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* Delivery date confirm row */
        .delivery-confirm-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        @media (max-width: 400px) {
          .delivery-confirm-row {
            flex-direction: column;
            align-items: stretch;
          }
          .delivery-confirm-row button {
            width: 100%;
          }
        }

        /* Card padding responsive */
        .card-body {
          padding: 18px;
        }
        @media (max-width: 480px) {
          .card-body {
            padding: 14px;
          }
        }
        @media (max-width: 360px) {
          .card-body {
            padding: 12px;
          }
        }

        /* Product image responsive height */
        .product-img {
          width: 100%;
          height: 170px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 14px;
          cursor: pointer;
          position: relative;
        }
        @media (max-width: 480px) {
          .product-img {
            height: 140px;
          }
        }
        @media (max-width: 360px) {
          .product-img {
            height: 120px;
          }
        }

        /* Header logo/title responsive */
        .page-header {
          text-align: center;
          padding-bottom: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .page-header h1 {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -.01em;
        }
        @media (max-width: 360px) {
          .page-header h1 {
            font-size: 16px;
          }
        }

        /* Form gaps */
        .form-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        @media (max-width: 480px) {
          .form-body {
            padding: 14px;
            gap: 11px;
          }
        }

        /* Submit button touch target */
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background .15s, opacity .15s;
          min-height: 48px; /* accessible touch target */
          -webkit-tap-highlight-color: transparent;
        }
        .submit-btn:disabled { opacity: .45; cursor: not-allowed; }

        /* Schedule card header */
        .schedule-header {
          padding: 12px 18px;
          border-bottom: 1px solid #fef3c7;
          background: #fffbeb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        @media (max-width: 360px) {
          .schedule-header {
            padding: 10px 12px;
          }
        }
      `}</style>

      <div className="book-layout">

        <main className="book-center">

          {/* Header */}
          <div className="page-header">
            <img
              src="https://rdcustomawards.com/cdn/shop/files/logo.svg?v=1700546283&width=170"
              alt="RDCA"
              style={{ height: 50, width: 100, marginBottom: 10, display: 'block' }}
            />
            <h1>Request for Quotation</h1>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              Ref: {rfq.uid || 'RFQ-PENDING'} · RDCA Procurement
            </div>
          </div>

          {/* RFQ Details */}
          <div className="card">
            <div style={{ height: 3, background: '#6366f1' }} />
            <div className="card-body">
              {rfq.image && (
                <div
                  className="product-img"
                  onClick={() => setLightboxImg(rfq.image)}
                >
                  <img src={rfq.image} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    🔍 Preview
                  </div>
                </div>
              )}
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: rfq.specs ? 6 : 14 }}>{rfq.name}</h2>
              {rfq.specs && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>{rfq.specs}</div>}

              <div className="tile-grid">
                <Tile label="Quantity" value={`${rfq.qty} nos`} />
                <Tile label="Deliver By" value={fmtDate(rfq.deliveryDate)} sub={(rfq.deliveryTime || fmtTime(rfq.deliveryDate)) ? `@ ${rfq.deliveryTime || fmtTime(rfq.deliveryDate)}` : null} />
                {rfq.aiBaseRate && (
                  <Tile label="Budget Rate" value={`₹${rfq.aiBaseRate} / unit`} span={2} valueColor="#4f46e5" />
                )}
              </div>

              {rfq.remarks && (
                <div style={{ marginTop: 14, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: 10, color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Note from RDCA</div>
                  <div style={{ fontSize: 13, color: '#92400e', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {rfq.remarks}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Split Schedule */}
          {rfq.isSplit && rfq.deliverySchedule?.length > 0 && (
            <div className="card">
              <div className="schedule-header">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Delivery Schedule</div>
                  <div style={{ fontSize: 11, color: '#b45309', marginTop: 1 }}>Confirm or propose days for each split</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>Required</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rfq.deliverySchedule.map((s, i) => {
                  const resp = scheduleResponses[i] || { isConfirmed: true, delDays: '' };
                  return (
                    <div key={i} style={{ border: `1.5px solid ${resp.isConfirmed ? '#e2e8f0' : '#c7d2fe'}`, borderRadius: 8, padding: 12, background: resp.isConfirmed ? '#fff' : '#f5f3ff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Split #{i + 1}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                            {fmtDate(s.date)} {(s.time || fmtTime(s.date)) && <span style={{ color: '#4f46e5' }}>@ {s.time || fmtTime(s.date)}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Qty</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309' }}>{s.qty} nos</div>
                        </div>
                      </div>
                      <div className="split-row">
                        <button
                          type="button"
                          onClick={() => {
                            const nr = [...scheduleResponses];
                            nr[i] = { ...nr[i], isConfirmed: true, delDate: '' };
                            setScheduleResponses(nr);
                            const allOk = nr.every(r => r.isConfirmed);
                            setIsConfirmedSchedule(allOk);
                            if (allOk) {
                              const dates = rfq.deliverySchedule.map(sd => sd.date ? new Date(sd.date).getTime() : 0);
                              const maxD = Math.max(...dates);
                              if (maxD > 0) {
                                const dt = new Date(maxD);
                                const y = dt.getFullYear(), month = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0'), hh = String(dt.getHours()).padStart(2, '0'), mm = String(dt.getMinutes()).padStart(2, '0');
                                setDelDate(`${y}-${month}-${day}T${hh}:${mm}`);
                                setDelDays(Math.ceil((maxD - Date.now()) / 86400000).toString());
                              }
                            }
                          }}
                          style={{
                            flex: 1, padding: '10px 0', borderRadius: 7, fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', border: '1.5px solid',
                            borderColor: resp.isConfirmed ? '#059669' : '#d1d5db',
                            background: resp.isConfirmed ? '#059669' : '#fff',
                            color: resp.isConfirmed ? '#fff' : '#94a3b8',
                            fontFamily: 'inherit',
                            minHeight: 44,
                          }}
                        >
                          ✓ Confirm
                        </button>
                        <input
                          type="datetime-local"
                          min={new Date().toISOString().slice(0, 16)}
                          value={resp.delDate || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nr = [...scheduleResponses];
                            nr[i] = { ...nr[i], delDate: val };

                            const allDates = nr.map((r, idx) => {
                              if (r.delDate) return new Date(r.delDate).getTime();
                              const orig = rfq.deliverySchedule[idx].date;
                              return orig ? new Date(orig).getTime() : 0;
                            }).filter(t => t > 0);

                            if (allDates.length > 0) {
                              const maxT = Math.max(...allDates);
                              const dt = new Date(maxT);
                              const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0'), hh = String(dt.getHours()).padStart(2, '0'), mm = String(dt.getMinutes()).padStart(2, '0');
                              setDelDate(`${y}-${m}-${day}T${hh}:${mm}`);
                              setDelDays(Math.ceil((maxT - Date.now()) / 86400000).toString());
                            }

                            nr[i].isConfirmed = true;
                            setScheduleResponses(nr);

                            const allConfirmed = rfq.deliverySchedule.every((sd, idx) => {
                              return nr[idx] && nr[idx].isConfirmed;
                            });
                            setIsConfirmedSchedule(allConfirmed);
                          }}
                          className="inp"
                          style={{ flex: 1.5, color: '#6366f1', fontWeight: 600, fontSize: '11px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Total */}
          {rate > 0 && (
            <div className="live-total">
              <div>
                <div style={{ fontSize: 10, color: '#ffffff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Total Estimate</div>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', color: '#ffffff' }}>₹{fmt(Number(rate) * rfq.qty)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#ffffff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Per Unit</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>₹{fmt(rate)}</div>
              </div>
            </div>
          )}

          {/* Quote Form */}
          <div className="card">
            <div style={{ height: 3, background: '#059669' }} />
            <form onSubmit={handleSubmit} className="form-body">
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Submit Your Quote</h3>

              <div>
                <label className="lbl">Vendor Name</label>
                <input
                  type="text"
                  readOnly
                  value={vendorName}
                  className="inp"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  title="Vendor identity is verified by your unique link"
                />
              </div>

              {!showVendorSplit && (
                <div style={{ background: isConfirmedSchedule ? '#f0fdf4' : '#fff9f9', border: isConfirmedSchedule ? '1px solid #bcf0d1' : '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 4 }}>
                  <div className="delivery-confirm-row">
                    <div style={{ flex: 1 }}>
                      <label className="lbl">Estimated Delivery Date &amp; Time</label>
                      {(!isConfirmedSchedule && !rfq.isSplit) ? (
                        <input
                          type="datetime-local"
                          min={new Date().toISOString().slice(0, 16)}
                          value={delDate}
                          onChange={e => {
                            const val = e.target.value;
                            setDelDate(val);
                            if (val) {
                              const ms = new Date(val).getTime() - Date.now();
                              setDelDays(Math.max(1, Math.ceil(ms / 86400000)).toString());
                            }
                          }}
                          className="inp"
                          style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 15, fontWeight: 800, color: '#4f46e5', width: '100%', outline: 'none' }}
                        />
                      ) : (
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                          {fmtDate(delDate)} <span style={{ color: '#6366f1' }}>@ {(fmtTime(delDate) && fmtTime(delDate) !== "00:00") ? fmtTime(delDate) : (rfq.deliveryTime || "18:00")}</span>
                        </div>
                      )}
                    </div>
                    {!rfq.isSplit && (
                      <>
                        {!isConfirmedSchedule ? (
                          <button type="button" onClick={() => setIsConfirmedSchedule(true)}
                            style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' }}>
                            ✓ Confirm
                          </button>
                        ) : (
                          <button type="button" onClick={() => setIsConfirmedSchedule(false)}
                            style={{ padding: '8px 12px', background: '#fff', color: '#059669', border: '1px solid #059669', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', minHeight: 44, whiteSpace: 'nowrap' }}>
                            Change
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="lbl">Unit Rate (₹)</label>
                <input required type="number" min="1" step="0.01" placeholder="0.00"
                  onKeyDown={e => { if (e.key === '-') e.preventDefault(); }}
                  value={rate} onChange={e => setRate(e.target.value)}
                  className="inp" style={{ color: '#059669', fontWeight: 700, fontSize: 16 }} />
              </div>

              {/* Optional Vendor-Proposed Split Delivery */}
              {!rfq.isSplit && (
                <div style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showVendorSplit;
                      setShowVendorSplit(next);
                      setIsConfirmedSchedule(false);
                      if (next) {
                        setVendorSplits([{ date: '', qty: '' }]);
                      } else {
                        if (rfq?.deliveryDate) {
                          const dt = new Date(rfq.deliveryDate);
                          const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0'), hh = String(dt.getHours()).padStart(2, '0'), mm = String(dt.getMinutes()).padStart(2, '0');
                          setDelDate(`${y}-${m}-${day}T${hh}:${mm}`);
                          const ms = dt.getTime() - Date.now();
                          setDelDays(Math.max(1, Math.ceil(ms / 86400000)).toString());
                        }
                      }
                    }}
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px dashed',
                      borderColor: showVendorSplit ? '#6366f1' : '#cbd5e1',
                      background: showVendorSplit ? '#eef2ff' : '#f8fafc',
                      color: showVendorSplit ? '#4f46e5' : '#64748b',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                      minHeight: 44,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🚚</span>
                    {showVendorSplit ? 'Remove Split Delivery Proposal' : 'Propose Split Delivery (Optional)'}
                    <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.6 }}>{showVendorSplit ? '▲' : '▼'}</span>
                  </button>

                  {showVendorSplit && (
                    <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #e0e7ff', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 11, color: '#4f46e5', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Proposed Split Schedule</div>
                      {vendorSplits.map((s, i) => (
                        <div key={i} className="vsplit-row">
                          <div>
                            <label className="lbl">Split #{i + 1} — Date &amp; Time</label>
                            <input
                              type="datetime-local"
                              min={new Date().toISOString().slice(0, 16)}
                              value={s.date}
                              onChange={e => {
                                const ns = [...vendorSplits]; ns[i] = { ...ns[i], date: e.target.value }; setVendorSplits(ns);
                              }}
                              className="inp"
                              style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600 }}
                            />
                          </div>
                          <div>
                            <label className="lbl">Qty</label>
                            <input
                              type="number" min="1" placeholder="0"
                              value={s.qty}
                              onChange={e => { const ns = [...vendorSplits]; ns[i] = { ...ns[i], qty: e.target.value }; setVendorSplits(ns); }}
                              className="inp" style={{ fontSize: 13, fontWeight: 700, width: "100px" }}
                            />
                          </div>
                          {vendorSplits.length > 1 && (
                            <button type="button" onClick={() => setVendorSplits(vendorSplits.filter((_, idx) => idx !== i))}
                              style={{ height: 44, background: '#fee2e2', border: 'none', borderRadius: 8, color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: 16 }}>×</button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVendorSplits([...vendorSplits, { date: '', qty: '' }])}
                        style={{ marginTop: 4, width: '100%', padding: '9px', border: '1.5px dashed #6366f1', borderRadius: 8, background: '#fff', color: '#6366f1', fontWeight: 700, fontSize: 12, cursor: 'pointer', minHeight: 44 }}
                      >+ Add Another Split</button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 12px' }}>
                  <div style={{ fontSize: 12, color: '#dc2626' }}>{error}</div>
                </div>
              )}

              <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                {showVendorSplit && (() => {
                  const total = vendorSplits.reduce((acc, s) => acc + Number(s.qty || 0), 0);
                  if (total !== rfq.qty) {
                    return <div style={{ background: '#fff1f2', color: '#be123c', fontSize: 11, fontWeight: 700, padding: '8px 12px', borderRadius: 8, marginBottom: 12, border: '1px solid #fda4af' }}>⚠️ Total Split Qty ({total}) must match Required Qty ({rfq.qty})</div>;
                  }
                  return null;
                })()}

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="submit-btn"
                  style={{ background: submitBg, color: submitColor }}
                >
                  {submitting && <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} />}
                  {submitting ? 'Submitting…' : '✓ Submit My Quote'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 11, color: '#606164ff' }}>Securely submitted to RDCA Procurement</div>
            </form>
          </div>

        </main>

        {lightboxImg && (
          <ImageLightbox src={lightboxImg} fileName={rfq.name} onClose={() => setLightboxImg(null)} />
        )}

      </div>
    </>
  );
};

/* helpers */
const CenterScreen = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
    {children}
  </div>
);

const Tile = ({ label, value, sub, span = 1, valueColor = '#0f172a' }) => (
  <div style={{ gridColumn: `span ${span}`, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 13px' }}>
    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: valueColor, wordBreak: 'break-word' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#3a3a3bff', marginTop: 1 }}>{sub}</div>}
  </div>
);

export default VendorQuotePage;