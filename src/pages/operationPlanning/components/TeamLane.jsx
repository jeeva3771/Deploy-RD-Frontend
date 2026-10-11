import React, { useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import moment from 'moment';
import { toast } from 'react-toastify';
import JobDetailsDrawer from './JobDetailsDrawer';
import AssignProductionModal from './AssignProductionModal';
import ImageLightbox from '../../common/ImageLightbox';
import Pagination from '../../components/Pagination';
import TeamInfoModal from './TeamInfoModal';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';
import { usePriorityColors } from "../../../context/PriorityColorContext";

const TeamLane = ({ team, onReassignClick, canReassign }) => {
    const { teamJobs: allTeamJobs } = useSelector((state) => state.assemblyTeamJob);
    const { priorityColors } = usePriorityColors();
    const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [lightboxImg, setLightboxImg] = useState(null);
    const [activeFilter, setActiveFilter] = useState(null); // null | 'overdue' | 'due_today' | 'job_today' | 'qty_alert' | 'date_alert'
    const [teamModalOpen, setTeamModalOpen] = useState(false);

    // Permission logic
    const user = useSelector(state => state.auth.user);
    const role = user?.role?.toLowerCase() || '';
    const isAssemblyNotHead = role.includes('assembly') && !user?.is_head;
    const isAssemblyHead = role.includes('assembly') && user?.is_head;

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(8);

    // Scroll handling
    const scrollRef = useRef(null);

    const teamJobs = useMemo(() => {
        return (allTeamJobs || []).filter(job =>
            (job.team_id?._id || job.team_id) === team._id
        );
    }, [allTeamJobs, team._id]);

    // Sync viewData with latest Redux state when store updates
    React.useEffect(() => {
        if (viewDrawerOpen && viewData?._id) {
            const updatedJob = teamJobs?.find(j => j._id === viewData._id);
            if (updatedJob) {
                setViewData(updatedJob);
            }
        }
    }, [teamJobs, viewDrawerOpen, viewData?._id]);

    const stats = useMemo(() => {
        const now = moment();
        const todayStart = moment().startOf('day');
        const todayEnd = moment().endOf('day');
        return {
            total: teamJobs.length,
            overdue: teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                return end && end.isBefore(now) && j.status !== 'completed';
            }).length,
            dueToday: teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                return end && end.isBetween(todayStart, todayEnd, null, '[]');
            }).length,
            jobToday: teamJobs.filter(j => {
                const start = j.start_date_time ? moment(j.start_date_time) : null;
                return start && start.isBetween(todayStart, todayEnd, null, '[]');
            }).length,
            qtyAlert: teamJobs.filter(j => {
                if (isAssemblyNotHead || isAssemblyHead) return j.isNotHeadQty;
                return j.is_qty_changed || j.sales_order_id?.is_qty_changed;
            }).length,
            dateAlert: teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                const isOverdue = end && end.isBefore(now) && j.status !== 'completed';
                if (isOverdue) return false;
                if (isAssemblyNotHead || isAssemblyHead) return j.isNotHeadDate;
                return j.is_date_changed || j.sales_order_id?.is_date_changed;
            }).length,
        };
    }, [teamJobs, isAssemblyNotHead, isAssemblyHead]);

    // Apply active filter to determine which cards to render
    const filteredJobs = useMemo(() => {
        if (!activeFilter) return teamJobs;
        const now = moment();
        const todayStart = moment().startOf('day');
        const todayEnd = moment().endOf('day');
        if (activeFilter === 'overdue') {
            return teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                return end && end.isBefore(now) && j.status !== 'completed';
            });
        }
        if (activeFilter === 'due_today') {
            return teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                return end && end.isBetween(todayStart, todayEnd, null, '[]');
            });
        }
        if (activeFilter === 'job_today') {
            return teamJobs.filter(j => {
                const start = j.start_date_time ? moment(j.start_date_time) : null;
                return start && start.isBetween(todayStart, todayEnd, null, '[]');
            });
        }
        if (activeFilter === 'qty_alert') {
            return teamJobs.filter(j => {
                if (isAssemblyNotHead || isAssemblyHead) return j.isNotHeadQty;
                return j.is_qty_changed || j.sales_order_id?.is_qty_changed;
            });
        }
        if (activeFilter === 'date_alert') {
            return teamJobs.filter(j => {
                const end = j.end_date_time ? moment(j.end_date_time) : null;
                const isOverdue = end && end.isBefore(now) && j.status !== 'completed';
                if (isOverdue) return false;
                if (isAssemblyNotHead || isAssemblyHead) return j.isNotHeadDate;
                return j.is_date_changed || j.sales_order_id?.is_date_changed;
            });
        }
        return teamJobs;
    }, [activeFilter, teamJobs, isAssemblyHead, isAssemblyNotHead]);

    const handleWhatsAppShareAll = () => {
        if (filteredJobs.length === 0) {
            toast.info("No jobs available to share.");
            return;
        }

        const teamName = team.team_name || 'N/A';
        let text = `*RDCA Operation Planning- ${teamName} Job List*\n`;
        text += `_Generated on ${moment().format('MMM DD, YYYY HH:mm')}_\n\n`;

        filteredJobs.forEach((job, index) => {
            const jobNo = job.sub_job_no || job.job_no;
            const client = job.client_name || job.sales_order_id?.client_name || 'Retail Client';
            const product = job.product_name || job.sales_order_id?.product_name || 'N/A';
            const type = job.type || job.sample_order_type || 'Prod';
            const qty = job.qty;
            const start = job.start_date_time ? moment(job.start_date_time).format('MMM DD, YYYY HH:mm') : 'N/A';
            const due = job.end_date_time ? moment(job.end_date_time).format('MMM DD, YYYY HH:mm') : 'N/A';

            text += `*${index + 1}. Sub Job No:* ${jobNo}\n`;
            text += `*Client Name:* ${client}\n`;
            text += `*Product Name:* ${product}\n`;
            text += `*Type:* ${type}\n`;
            text += `*Quantity:* ${qty}\n`;
            text += `*Start Date:* ${start}\n`;
            text += `*Due Date:* ${due}\n\n`;
        });

        text += `_Total Jobs: ${filteredJobs.length}_`;

        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const paginatedJobs = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredJobs.slice(start, start + limit);
    }, [filteredJobs, page, limit]);

    const totalPages = Math.ceil(filteredJobs.length / limit) || 1;

    const toggleFilter = (filter) => {
        setActiveFilter(prev => prev === filter ? null : filter);
        setPage(1); // Reset to first page when filtering
    };

    const handlePrint = () => {
        const now = new Date().toLocaleString();
        const teamName = team.team_name;
        const teamColor = team.color || '#4f46e5';
        const shift = team.shift_timing ? `${team.shift_timing.name || ''} (${team.shift_timing.start_time} - ${team.shift_timing.end_time})` : '';

        // Helper for priority info
        const getPriority = (date) => {
            if (!date) return { name: 'Normal', color: '#64748b' };
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const delivery = new Date(date);
            delivery.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) return { name: 'Overdue', color: '#dc2626' };
            if (daysLeft >= 11) return { name: 'Flexible', color: '#eb33b1' };

            const matched = priorityColors.find(p => daysLeft >= p.priority.days_from && daysLeft <= p.priority.days_to);
            return {
                name: matched?.name || 'Normal',
                color: matched?.priority.color || '#64748b'
            };
        };

        const cardHTML = filteredJobs.map(job => {
            const jobNo = job.sub_job_no || job.job_no || '—';

            const clientName = job.client_name || 'Client';
            const qty = job.qty || '—';
            const type = job.sample_order_type || 'Prod';
            const due = job.end_date_time ? moment(job.end_date_time).format('MMM DD, YYYY') : 'N/A';
            const start = job.start_date_time ? moment(job.start_date_time).format('MMM DD, YYYY HH:mm') : 'N/A';
            const priority = job.end_date_time ? getPriority(job.end_date_time) : null;

            const imgHTML = job.image
                ? `<div class="card-img"><img src="${job.image}" alt="Product" /></div>`
                : `<div class="card-img-placeholder">${jobNo}</div>`;

            const priorityBadgeHTML = priority
                ? `<div class="priority-badge" style="background-color: ${priority.color}">${priority.name}</div>`
                : '';

            const priorityBorderHTML = priority
                ? `<div class="priority-border" style="background-color: ${priority.color}"></div>`
                : `<div class="priority-border" style="background-color: #e2e8f0"></div>`;

            return `
                <div class="job-card">
                    ${priorityBorderHTML}
                    <div class="card-header">
                        <div style="flex: 1; min-width: 0;">
                            <span class="job-no">${jobNo}</span>
                        </div>
                        ${priorityBadgeHTML}
                    </div>
                    ${imgHTML}
                    <div class="card-meta">
                        <div class="meta-item">
                            <span class="meta-label">QTY</span>
                            <span class="meta-value">${qty}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">TYPE</span>
                            <span class="meta-value">${type}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">DUE</span>
                            <span class="meta-value">${due}</span>
                        </div>
                    </div>
                    <div class="card-dates">
                        <span>Start: ${start}</span>
                    </div>
                </div>
            `;
        }).join('');

        const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8"/>
            <title>Print – ${teamName}</title>
            <style>
                @page { size: A4; margin: 16mm; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }

                .print-header { 
                    margin-bottom: 24px; 
                    border-bottom: 3px solid ${teamColor}; 
                    padding-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .print-header h1 { font-size: 28px; font-weight: 900; color: #1e293b; margin-bottom: 4px; }
                .print-header p { font-size: 14px; color: #64748b; font-weight: 700; }
                .print-meta { font-size: 12px; color: #475569; text-align: right; }
                .print-meta span { font-weight: 900; color: ${teamColor}; }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }
                .job-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    background: #fff;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    position: relative;
                }
                .priority-border { 
                    height: 5px; 
                    width: 100%; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact; 
                }

                .card-header {
                    background: #fff;
                    padding: 10px 12px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .job-no { display: block; font-size: 13px; font-weight: 900; color: #1e293b; }
                .client { display: block; font-size: 10px; color: #64748b; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                
                .priority-badge {
                    font-size: 10px;
                    font-weight: 900;
                    color: white;
                    padding: 4px 10px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .card-img { height: 120px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fff; }
                .card-img img { max-width: 100%; max-height: 100%; object-fit: contain; }
                .card-img-placeholder {
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 900;
                    color: #cbd5e1;
                    background: #f8fafc;
                    text-align: center;
                    padding: 12px;
                }

                .card-meta { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid #f1f5f9; }
                .meta-item { text-align: center; padding: 10px 4px; border-right: 1px solid #f1f5f9; }
                .meta-item:last-child { border-right: none; }
                .meta-label { display: block; font-size: 8px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
                .meta-value { display: block; font-size: 14px; font-weight: 800; color: #1e293b; }

                .card-dates { padding: 8px 12px; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; font-weight: 700; background: #fafafa; }

                .print-footer { margin-top: 30px; border-top: 2px solid ${teamColor}; padding-top: 10px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; font-weight: 700; }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div>
                    <h1>${teamName}</h1>
                    <p>${shift}</p>
                </div>
                <div class="print-meta">
                    <div>Total Jobs: <span>${filteredJobs.length}</span></div>
                    <div>Printed on: <span>${now.split(',')[0]}</span></div>
                </div>
            </div>

            <div class="cards-grid">
                ${cardHTML}
            </div>

            <div class="print-footer">
                <span>RDCA CRM – Production Tracking: ${teamName}</span>
                <span>Job Management System</span>
            </div>

            <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
        </body>
        </html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    return (
        <div
            id={`lane-${team._id}`}
            className="team-lane bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            style={{ borderLeft: `5px solid ${team.color || '#cbd5e1'}` }}
        >
            <div className="px-6 py-4 flex flex-col gap-3 border-b border-slate-50 bg-white/50 backdrop-blur-sm">
                {/* Top row: team name + stats + print */}
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            {team.team_name}
                            {/* <span className="text-[10px] opacity-30 cursor-pointer hover:opacity-100 transition-opacity">👁️</span> */}
                            <span
                                className="text-[12px] cursor-pointer hover:opacity-100 transition-opacity"
                                onClick={() => setTeamModalOpen(true)}
                            >👁️</span>
                        </h3>
                        <span className="text-[14px] font-bold text-slate-800 capitalize">
                            {team.shift_timing?.name || 'Day Shift'} ({team.shift_timing?.start_time} - {team.shift_timing?.end_time})
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                        {/* Filter buttons */}
                        <div className="flex flex-wrap gap-2 hide-on-print">
                            <button
                                onClick={() => toggleFilter('overdue')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'overdue'
                                    ? 'bg-red-500 border-red-500 text-white shadow-sm shadow-red-200'
                                    : stats.overdue > 0
                                        ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                <span>⏰</span> Overdue
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeFilter === 'overdue' ? 'bg-white/30 text-white' : 'bg-white text-red-500'
                                    }`}>{stats.overdue}</span>
                            </button>

                            <button
                                onClick={() => toggleFilter('due_today')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'due_today'
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200'
                                    : stats.dueToday > 0
                                        ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                <span>📅</span> Due Today
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeFilter === 'due_today' ? 'bg-white/30 text-white' : 'bg-white text-amber-600'
                                    }`}>{stats.dueToday}</span>
                            </button>

                            <button
                                onClick={() => toggleFilter('job_today')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'job_today'
                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-200'
                                    : stats.jobToday > 0
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-500 hover:bg-indigo-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                <span>🚀</span> Job Today
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeFilter === 'job_today' ? 'bg-white/30 text-white' : 'bg-white text-indigo-500'
                                    }`}>{stats.jobToday}</span>
                            </button>

                            <button
                                onClick={() => toggleFilter('qty_alert')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'qty_alert'
                                    ? 'bg-violet-500 border-violet-500 text-white shadow-sm shadow-violet-200'
                                    : stats.qtyAlert > 0
                                        ? 'bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200 animate-pulse'
                                        : 'bg-violet-50/50 border-violet-100 text-violet-400 hover:bg-violet-100'
                                    }`}
                            >
                                <span>📦</span> Qty Alert
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeFilter === 'qty_alert' ? 'bg-white/30 text-white' : 'bg-white text-violet-500'
                                    }`}>{stats.qtyAlert}</span>
                            </button>

                            <button
                                onClick={() => toggleFilter('date_alert')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'date_alert'
                                    ? 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-200'
                                    : stats.dateAlert > 0
                                        ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200 animate-pulse'
                                        : 'bg-orange-50/50 border-orange-100 text-orange-400 hover:bg-orange-100'
                                    }`}
                            >
                                <span>📅</span> Date Change
                                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeFilter === 'date_alert' ? 'bg-white/30 text-white' : 'bg-white text-orange-600'
                                    }`}>{stats.dateAlert}</span>
                            </button>

                            {activeFilter && (
                                <button
                                    onClick={() => setActiveFilter(null)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                                >
                                    ✕ Clear
                                </button>
                            )}
                        </div>

                        {/* Right side: Total + Print — pushed to end on large, wraps below on small */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5">
                                <span className="text-[11px] font-black text-slate-400 uppercase">Total</span>
                                <span className="text-[11px] font-black text-slate-800">{stats.total}</span>
                            </div>

                            <button
                                onClick={handleWhatsAppShareAll}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-green-50 transition-colors text-slate-400 text-green-600 flex items-center gap-2 text-xs font-black hide-on-print bg-green-100"
                                title="Share Team List via WhatsApp"
                            >
                                <WhatsAppIcon sx={{ fontSize: 16 }} />
                                SHARE
                            </button>

                            <button
                                onClick={handlePrint}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-800 flex items-center gap-2 text-xs font-black hide-on-print"
                            >
                                <PrintIcon sx={{ fontSize: 16 }} />
                                PRINT
                            </button>
                        </div>

                    </div>
                </div>

                {/* Filter pills row */}

            </div>

            <div
                ref={scrollRef}
                className="p-6 flex overflow-x-auto gap-6 pb-8 scrollbar-thin scrollbar-thumb-slate-500 min-h-[300px]"
            >
                {paginatedJobs.length === 0 ? (
                    <div className="w-full text-center py-6 text-slate-300 font-medium italic text-sm">
                        {activeFilter ? `No jobs match the "${activeFilter.replace('_', ' ')}" filter` : 'No jobs assigned to this team'}
                    </div>
                ) : (
                    paginatedJobs.map((job) => {
                        const urgency = job.end_date_time;
                        const isOverdue = job.end_date_time && moment(job.end_date_time).isBefore(moment()) && job.status !== 'completed';
                        const isQtyChanged = isAssemblyNotHead || isAssemblyHead ? job.isNotHeadQty : (job.is_qty_changed || job.sales_order_id?.is_qty_changed);
                        const isDateChanged = (isAssemblyNotHead || isAssemblyHead) ? job.isNotHeadDate : (job.is_date_changed || job.sales_order_id?.is_date_changed);
                        const hasAlert = isQtyChanged || isDateChanged;

                        // Debug log for the user to see in their console
                        if (hasAlert || isOverdue) {
                            console.log(`CARD ALERT DETECTED - Job: ${job.job_no}, Qty: ${isQtyChanged}, Date: ${isDateChanged}, Overdue: ${isOverdue}`);
                        }

                        return (
                            <div
                                key={job._id}
                                className={`bg-white rounded-xl w-[300px] min-w-[300px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative 
                                    ${isQtyChanged ? 'animate-glow-violet' :
                                        isDateChanged ? 'animate-glow-orange' : ''
                                    }
                                `}
                            >
                                {urgency ? (
                                    <DeliveryPriorityColor
                                        deliveryDate={urgency}
                                        className="w-full h-1.5 rounded-t"
                                        containerStyle={{ width: '100%', height: 'auto', display: 'block' }}
                                    />
                                ) : (
                                    <div className="w-full h-1.5 bg-slate-200 rounded-t" />
                                )}

                                <div className="p-4 pb-2 flex justify-between items-start">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[13px] font-black text-slate-700 tracking-tight uppercase">{job.sub_job_no || job.job_no}</span>
                                            {(job.reference_no || job.enquiry_id?.reference_no || job.sales_order_id?.enquiry_id?.reference_no) && (
                                                <span className="text-[12px] font-semibold uppercase tracking-wider mt-[1px]">
                                                    - {job.reference_no || job.enquiry_id?.reference_no || job.sales_order_id?.enquiry_id?.reference_no}
                                                </span>
                                            )}
                                        </div>
                                        {/* <span className="text-[12px] font-bold text-slate-800 block truncate">{job.product_name || job.sales_order_id?.product_name}</span> */}

                                        <span className="text-[11px] font-bold text-slate-400 block truncate">{job.client_name || job.sales_order_id?.client_name || 'Retail Client'}</span>
                                    </div>
                                    {urgency ? (
                                        <DeliveryPriorityColor
                                            deliveryDate={urgency}
                                            showPriorityName={true}
                                            className="hidden"
                                        />
                                    ) : (
                                        <span className="text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500">
                                            Normal
                                        </span>
                                    )}
                                </div>

                                <div className="text-center flex flex-col items-center gap-3">
                                    {job.image && (
                                        <div
                                            className="w-8/12 h-32 bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm relative group/img cursor-zoom-in mt-2"
                                            onClick={() => setLightboxImg(job.image)}
                                        >
                                            <img
                                                src={job.image}
                                                alt=""
                                                className="w-full h-full object-contain p-1"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                {/* <span className="text-white text-[10px] font-black uppercase tracking-widest">🔍 Zoom</span> */}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-1 px-4 py-4">
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</div>
                                        <div className="text-sm font-bold text-slate-900">{job?.qty}</div>
                                    </div>
                                    <div className="text-center border-x border-slate-100">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</div>
                                        <div className="text-sm font-bold text-slate-900 truncate px-1 capitalize">{job.type || 'Prod'}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due</div>
                                        <div className="text-sm font-bold text-slate-900">{job.end_date_time ? moment(job.end_date_time).format('MMM DD') : 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="px-4 pb-4 flex gap-2 mt-auto hide-on-print">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setViewData(job); setViewDrawerOpen(true); }}
                                        className="flex-1 py-2.5 bg-slate-500 hover:bg-slate-600 text-slate-800 text-[10px] text-white font-bold rounded-lg transition-colors tracking-widest"
                                    >
                                        VIEW
                                    </button>
                                    {canReassign && (
                                        <>
                                            {/* <button
                                                onClick={(e) => { e.stopPropagation(); onReassignClick(job, true); }}
                                                className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-black rounded-lg transition-colors tracking-widest"
                                            >
                                                EDIT
                                            </button> */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onReassignClick(job); }}
                                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-colors tracking-widest"
                                            >
                                                REASSIGN
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="w-full pb-4">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={(p) => setPage(p)}
                    itemsPerPage={limit}
                    onItemsPerPageChange={(l) => { setLimit(l); setPage(1); }}
                    totalCount={filteredJobs.length}
                    startIndex={(page - 1) * limit}
                    visibleItemCount={paginatedJobs.length}
                />
            </div>

            {viewDrawerOpen && (
                <JobDetailsDrawer
                    show={viewDrawerOpen}
                    onClose={() => setViewDrawerOpen(false)}
                    data={viewData}
                />
            )}

            <ImageLightbox
                src={lightboxImg}
                fileName="Job Image"
                onClose={() => setLightboxImg(null)}
            />

            {teamModalOpen && (
                <TeamInfoModal team={team} onClose={() => setTeamModalOpen(false)} />
            )}

            <style>{`
                @keyframes glow-red {
                    0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.7), inset 0 0 10px rgba(239, 68, 68, 0.3); border-color: rgba(239, 68, 68, 0.9); }
                }
                @keyframes glow-violet {
                    0%, 100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2), inset 0 0 5px rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.7), inset 0 0 10px rgba(139, 92, 246, 0.3); border-color: rgba(139, 92, 246, 0.9); }
                }
                @keyframes glow-orange {
                    0%, 100% { box-shadow: 0 0 5px rgba(251, 146, 60, 0.2), inset 0 0 5px rgba(251, 146, 60, 0.1); border-color: rgba(251, 146, 60, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(251, 146, 60, 0.7), inset 0 0 10px rgba(251, 146, 60, 0.3); border-color: rgba(251, 146, 60, 0.9); }
                }
                .animate-glow-red { animation: glow-red 2s infinite ease-in-out !important; border-width: 2px !important; }
                .animate-glow-violet { animation: glow-violet 2s infinite ease-in-out !important; border-width: 2px !important; }
                .animate-glow-orange { animation: glow-orange 2s infinite ease-in-out !important; border-width: 2px !important; }
            `}</style>
        </div>
    );
};

export default TeamLane;