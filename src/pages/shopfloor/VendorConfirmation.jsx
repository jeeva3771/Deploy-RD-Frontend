import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

const fmt = (n) => Number(n).toLocaleString('en-IN');

const styles = {
    pageLayout: {
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Solid white background
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '40px 20px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    },
    centerCard: {
        maxWidth: '560px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        background: 'transparent',
        backgroundColor: 'transparent'
    },
    header: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '10px'
    },
    logo: {
        height: '60px',
        width: 'auto',
        marginBottom: '15px'
    },
    title: {
        fontSize: '24px',
        fontWeight: '900',
        color: '#0f172a', // Highly legible slate title on white
        letterSpacing: '-0.02em',
        margin: '0 0 6px 0',
        textTransform: 'uppercase'
    },
    subtitle: {
        fontSize: '13px',
        fontWeight: '800',
        color: '#4f46e5', // Brand Indigo accent
        letterSpacing: '0.04em',
        textTransform: 'uppercase'
    },
    reprocessBadge: {
        display: 'inline-block',
        marginTop: '8px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1.5px solid #fee2e2',
        borderRadius: '6px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: '900',
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
    },
    card: {
        backgroundColor: '#f8fafc', // Soft gray card
        borderRadius: '20px',
        border: '1px solid #e2e8f0', // Soft gray border
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)'
    },
    cardAccentBar: {
        height: '4px',
        background: 'linear-gradient(to right, #4f46e5, #818cf8)'
    },
    cardContent: {
        padding: '24px'
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: '900',
        color: '#1e293b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    detailList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingBottom: '8px',
        borderBottom: '1.5px dashed #f1f5f9'
    },
    detailLabel: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.03em'
    },
    detailValue: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#334155'
    },
    detailHighlight: {
        color: '#4f46e5',
        fontWeight: '900'
    },
    detailGreenHighlight: {
        color: '#059669',
        fontWeight: '900'
    },
    materialBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '800',
        color: '#475569',
        textTransform: 'uppercase',
        border: '1px solid #e2e8f0'
    },
    materialText: {
        fontSize: '13px',
        fontWeight: '800',
        color: '#0f172a',
        lineHeight: '1.4'
    },
    materialsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #f1f5f9'
    },
    materialItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px'
    },
    formLabel: {
        fontSize: '11px',
        fontWeight: '800',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.06em'
    },
    dateInput: {
        padding: '12px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '13px',
        fontWeight: '700',
        color: '#1e293b',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: '#ffffff'
    },
    dateInputFocus: {
        borderColor: '#4f46e5'
    },
    textInput: {
        padding: '14px 16px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        fontSize: '13px',
        fontWeight: '700',
        color: '#1e293b',
        outline: 'none',
        transition: 'all 0.2s ease',
        minHeight: '80px',
        resize: 'none'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '700',
        color: '#475569',
        userSelect: 'none'
    },
    checkbox: {
        width: '18px',
        height: '18px',
        borderRadius: '6px',
        border: '2.5px solid #cbd5e1',
        cursor: 'pointer',
        accentColor: '#4f46e5'
    },
    actionArea: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '20px'
    },
    actionBtn: {
        width: '100%',
        padding: '14px 0',
        borderRadius: '12px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minHeight: '48px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnConfirm: {
        backgroundColor: '#059669',
        color: '#ffffff',
        border: 'none',
        '&:hover': {
            backgroundColor: '#047857'
        }
    },
    btnDecline: {
        backgroundColor: '#fef2f2',
        color: '#ef4444',
        border: '1px solid #fee2e2',
        '&:hover': {
            backgroundColor: '#fee2e2'
        }
    },
    btnRejectSubmit: {
        flex: 2,
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: 'none',
        '&:hover': {
            backgroundColor: '#b91c1c'
        }
    },
    btnCancel: {
        flex: 1,
        backgroundColor: '#cbd5e1',
        color: '#475569',
        border: 'none',
        '&:hover': {
            backgroundColor: '#94a3b8'
        }
    },
    btnDisabled: {
        opacity: '0.5',
        cursor: 'not-allowed'
    },
    declineCard: {
        backgroundColor: '#f8fafc',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
        animation: 'fadeUp 0.3s ease both'
    },
    declineActionGroup: {
        display: 'flex',
        gap: '10px',
        width: '100%'
    },
    centerContainer: {
        minHeight: '100vh',
        backgroundColor: '#ffffff', // Solid white background
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: 'center'
    },
    spinner: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid #e2e8f0',
        borderTopColor: '#4f46e5',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '20px'
    },
    loadingText: {
        color: '#475569',
        fontSize: '14px',
        fontWeight: '500'
    },
    errorIcon: {
        fontSize: '48px',
        marginBottom: '20px'
    },
    errorTitle: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#0f172a',
        margin: '0 0 10px 0'
    },
    errorText: {
        fontSize: '14px',
        color: '#475569',
        maxWidth: '340px',
        margin: '0',
        lineHeight: '1.6'
    },
    successIcon: {
        fontSize: '56px',
        marginBottom: '20px',
        filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.1))'
    },
    successTitle: {
        fontSize: '22px',
        fontWeight: '900',
        color: '#0f172a',
        margin: '0 0 12px 0',
        textTransform: 'uppercase',
        letterSpacing: '-0.02em'
    },
    successText: {
        fontSize: '14px',
        color: '#475569',
        maxWidth: '440px',
        margin: '0 0 30px 0',
        lineHeight: '1.6'
    },
    footerNote: {
        fontSize: '11px',
        fontWeight: '700',
        color: '#64748b',
        letterSpacing: '0.08em',
        textTransform: 'uppercase'
    }
};

const VendorConfirmation = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const initialAction = searchParams.get('action') || 'confirm';

    const [assignmentData, setAssignmentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Toggle for delivery date change
    const [changeDeliveryDate, setChangeDeliveryDate] = useState(false);
    // Toggle for showing the decline form
    const [showDeclineForm, setShowDeclineForm] = useState(initialAction === 'reject');

    // Form inputs
    const [delDate, setDelDate] = useState('');
    const [rejReason, setRejReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedAction, setSubmittedAction] = useState('');

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const { data } = await axios.get(`${BASE_URL}/shop-floor/outsource/vendor-view/${token}`);
                if (data.success) {
                    setAssignmentData(data.data);
                    
                    // Initialize date input from proposed outsource delivery date
                    const originalDate = data.data.assignment?.outsource_delivery_date;
                    if (originalDate) {
                        // Standardize format: DD-MM-YYYY to YYYY-MM-DD or parse datetime
                        let formattedDate = originalDate;
                        if (originalDate.includes('-')) {
                            const parts = originalDate.split('-');
                            if (parts[0].length === 2) {
                                // DD-MM-YYYY -> YYYY-MM-DD
                                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                        setDelDate(formattedDate);
                    }
                } else {
                    setError(data.message || 'Unable to load assignment details.');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Could not load assignment details. Please verify your link.');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignment();
    }, [token]);

    const handleConfirm = async () => {
        if (changeDeliveryDate && !delDate) {
            alert('Please select a committed delivery date.');
            return;
        }

        setSubmitting(true);
        try {
            let payloadDate = delDate;
            
            if (changeDeliveryDate) {
                if (delDate && delDate.includes('-')) {
                    const parts = delDate.split('-');
                    if (parts[0].length === 4) {
                        // YYYY-MM-DD -> DD-MM-YYYY
                        payloadDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                }
            } else {
                payloadDate = assignmentData.assignment.outsource_delivery_date;
            }

            const payload = {
                action: 'confirm',
                outsource_delivery_date: payloadDate
            };

            const { data } = await axios.post(`${BASE_URL}/shop-floor/outsource/vendor-response/${token}`, payload);
            if (data.success) {
                setSubmitted(true);
                setSubmittedAction('confirm');
            } else {
                alert(data.message || 'Failed to submit response.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeclineSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!rejReason.trim()) {
            alert('Please enter your reason for rejection.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                action: 'reject',
                rejection_reason: rejReason
            };

            const { data } = await axios.post(`${BASE_URL}/shop-floor/outsource/vendor-response/${token}`, payload);
            if (data.success) {
                setSubmitted(true);
                setSubmittedAction('reject');
            } else {
                alert(data.message || 'Failed to submit response.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit response. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const displayDate = (() => {
        if (!changeDeliveryDate && assignmentData?.assignment?.outsource_delivery_date) {
            return assignmentData.assignment.outsource_delivery_date;
        }
        if (delDate && delDate.includes('-')) {
            const parts = delDate.split('-');
            if (parts[0].length === 4) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        return delDate;
    })();

    if (loading) return (
        <div style={styles.centerContainer}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Fetching assignment details...</div>
        </div>
    );

    if (error) return (
        <div style={styles.centerContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <h2 style={styles.errorTitle}>Link Invalid or Expired</h2>
            <p style={styles.errorText}>{error}</p>
        </div>
    );

    if (submitted) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.successIcon}>{submittedAction === 'confirm' ? '✅' : '❌'}</div>
                <h2 style={styles.successTitle}>
                    {submittedAction === 'confirm' ? 'Assignment Confirmed' : 'Assignment Rejected'}
                </h2>
                <p style={styles.successText}>
                    {submittedAction === 'confirm' 
                        ? `Thank you! You have accepted the outsource assignment for Job #${assignmentData.job_no}. The committed delivery date is set to ${displayDate}.`
                        : `You have declined this outsource assignment. Your rejection reason has been logged. Thank you for your feedback.`
                    }
                </p>
                <div style={styles.footerNote}>RD Custom Awards Co.</div>
            </div>
        );
    }

    const sheets = parseFloat(assignmentData.assignment.outsource_sheets) || 0;
    const qty = parseFloat(assignmentData.assignment.outsource_qty) || 0;
    const rate = parseFloat(assignmentData.assignment.outsource_rate) || 0;
    const cutTime = parseFloat(assignmentData.actual_input) || 0;
    const isUv = assignmentData.process_name?.toUpperCase().includes('PRINTING') || assignmentData.process_name?.toUpperCase().includes('UV');
    const cost = isUv ? rate * qty : rate * cutTime * sheets;
    const costDisplay = cost > 0 ? `₹${fmt(Number(cost.toFixed(2)))}` : "—";

    const mainMat = assignmentData.materials?.find(m => {
        const cat = m.category_type?.toLowerCase() || '';
        return !cat.includes('consumable') && !cat.includes('hardware');
    });
    const upsSize = mainMat?.material_input?.one_up_length && mainMat?.material_input?.one_up_width
        ? `${mainMat.material_input.one_up_length}x${mainMat.material_input.one_up_width}in`
        : "";

    return (
        <div style={styles.pageLayout}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.3); }
            `}</style>

            <div style={styles.centerCard}>
                {/* Logo & Header */}
                <div style={styles.header}>
                    <img
                        src="https://rdcustomawards.com/cdn/shop/files/logo.svg?v=1700546283&width=170"
                        alt="RD Custom Awards"
                        style={styles.logo}
                    />
                    <h1 style={styles.title}>Outsource Assignment Request</h1>
                    <div style={styles.subtitle}>
                        Job Ref: {assignmentData.job_no} — {assignmentData.sub_job_no}
                    </div>
                    {assignmentData.is_reprocess && (
                        <div style={styles.reprocessBadge}>
                            REPROCESS JOB
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div style={styles.card}>
                    <div style={styles.cardAccentBar} />
                    <div style={styles.cardContent}>
                        <h2 style={styles.sectionHeader}>Assignment Details</h2>
                        
                        <div style={styles.detailsGrid}>
                            <DetailRow label="Product Name" value={assignmentData.product_name || 'N/A'} />
                            {upsSize && (
                                <DetailRow label="UPS Size (one-up)" value={upsSize.toUpperCase()} />
                            )}
                            <DetailRow label="Material Group" value={assignmentData.group_name} />
                            <DetailRow label="Process Requested" value={assignmentData.process_name} />
                            <DetailRow 
                                label="Outsource Quantity" 
                                value={isUv ? `${qty} pcs` : (sheets ? `${sheets} sheets (${qty} pcs)` : `${qty} pcs`)} 
                            />
                            {cutTime > 0 && !isUv && (
                                <DetailRow label="Cut Time / Sheet" value={`${cutTime} mins`} />
                            )}
                            <DetailRow label="Outsource Rate" value={isUv ? `₹${fmt(rate)}/pc` : `₹${fmt(rate)}/min`} />
                            {cost > 0 && (
                                <DetailRow label="Estimated Cost" value={costDisplay} isGreenHighlight />
                            )}
                            <DetailRow 
                                label="Requested Delivery" 
                                value={assignmentData.assignment.outsource_delivery_date || 'TBD'} 
                                isHighlight 
                            />
                        </div>

                        {/* Checkbox and conditional date picker */}
                        <div style={styles.deliveryDateToggleSection}>
                            <label style={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={changeDeliveryDate}
                                    onChange={(e) => setChangeDeliveryDate(e.target.checked)}
                                    style={styles.checkboxInput}
                                />
                                <span style={styles.checkboxText}>Change delivery date</span>
                            </label>
                            
                            {changeDeliveryDate && (
                                <div style={styles.datePickerContainer}>
                                    <label style={styles.inputLabel}>COMMITTED DELIVERY DATE</label>
                                    <input
                                        required
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={delDate}
                                        onChange={(e) => setDelDate(e.target.value)}
                                        style={styles.dateInput}
                                    />
                                    <p style={styles.inputHelper}>
                                        Select the date by which you commit to delivering the outsourced items to our facility.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                {!showDeclineForm ? (
                    <div style={styles.actionBlock}>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleConfirm}
                            style={{
                                ...styles.actionBtn,
                                ...styles.btnConfirm,
                                ...(submitting ? styles.btnDisabled : {})
                            }}
                        >
                            {submitting ? 'Processing...' : '✓ Confirm Assignment'}
                        </button>
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setShowDeclineForm(true)}
                            style={{
                                ...styles.actionBtn,
                                ...styles.btnDecline,
                                ...(submitting ? styles.btnDisabled : {})
                            }}
                        >
                            ✗ Decline Assignment
                        </button>
                    </div>
                ) : (
                    <div style={styles.declineCard}>
                        <form onSubmit={handleDeclineSubmit} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.inputLabel}>REASON FOR DECLINING</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Please state why you are unable to accept this assignment..."
                                    value={rejReason}
                                    onChange={(e) => setRejReason(e.target.value)}
                                    style={styles.textArea}
                                />
                                <p style={styles.inputHelper}>
                                    Your response will notify the shop floor coordinator to reassign this order.
                                </p>
                            </div>
                            
                            <div style={styles.declineActionGroup}>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        ...styles.submitBtn,
                                        ...styles.btnRejectSubmit,
                                        ...(submitting ? styles.btnDisabled : {})
                                    }}
                                >
                                    {submitting ? 'Submitting...' : '✗ Submit Decline Response'}
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => {
                                        setShowDeclineForm(false);
                                        setRejReason('');
                                    }}
                                    style={{
                                        ...styles.submitBtn,
                                        ...styles.btnCancel,
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, isHighlight = false, isGreenHighlight = false }) => (
    <div style={styles.detailRow}>
        <span style={styles.detailLabel}>{label}</span>
        <span style={{
            ...styles.detailValue,
            ...(isHighlight ? styles.detailHighlight : {}),
            ...(isGreenHighlight ? styles.detailGreenHighlight : {})
        }}>{value}</span>
    </div>
);

export default VendorConfirmation;
