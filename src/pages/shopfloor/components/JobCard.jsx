import React from 'react';
import { MoreVertical, AlertCircle, Factory, Calendar, Clock, Flag } from 'lucide-react';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';

const JobCard = ({ job, onClick, onImageClick, isActive, isOutsourceColumn, columnName }) => {
  const theme = job.theme || { bg: 'bg-white', border: 'border-transparent', text: 'text-gray-900', pill: 'bg-gray-100' };

  // Calculate display quantity based on column allocation
  let displayQty = job.total_qty || 0;
  if (columnName && job.team_allocations) {
    const allocation = job.team_allocations.find(ta => ta.team_name === columnName);
    if (allocation) {
      displayQty = allocation.allocated_qty;
    }
  }
  const isQtyChanged = job.is_qty_changed;
  const isDateChanged = job.is_date_changed;

  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    // Handle ISO format (e.g., 2026-04-30T18:05)
    if (dateStr.includes('T')) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d)) {
          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        }
      } catch (e) { console.error("Date parse error", e); }
    }
    // Handle YYYY-MM-DD format (if no space or T)
    if (dateStr.includes('-') && !dateStr.includes(' ')) {
      const parts = dateStr.split('-');
      if (parts[0].length === 4) { // YYYY-MM-DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    // Standard DD-MM-YYYY HH:mm:ss
    return dateStr.split(' ')[0];
  };

  const isUv = job.process_name?.toUpperCase().includes('PRINTING') || job.process_name?.toUpperCase().includes('UV');
  const outsourceShift = isUv ? 3 : 4;

  const outsourcedGroups = job.material_groups?.filter(mg =>
    (mg.assigned_shifts?.includes(outsourceShift) || mg.assigned_outsource_sheets > 0)
  ) || [];

  return (
    <>
      <style>
        {`
          @keyframes pulse-purple {
            0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
            50% { box-shadow: 0 0 15px 5px rgba(147, 51, 234, 0.6); }
          }
          @keyframes pulse-orange {
            0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
            50% { box-shadow: 0 0 15px 5px rgba(249, 115, 22, 0.6); }
          }
          @keyframes pulse-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
            50% { box-shadow: 0 0 20px 8px rgba(225, 29, 72, 0.6); }
          }
          .animate-pulse-purple {
            animation: pulse-purple 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
          }
          .animate-pulse-orange {
            animation: pulse-orange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
          }
          .animate-pulse-red {
            animation: pulse-red 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
          }
          @keyframes pulse-amber {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
            50% { box-shadow: 0 0 15px 5px rgba(245, 158, 11, 0.6); }
          }
          .animate-pulse-amber {
            animation: pulse-amber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
          }
        `}
      </style>
      <div className={`rounded-[1.25rem] transition-all duration-300 ${job.is_escalated ? 'animate-pulse-red scale-[1.02]' : isQtyChanged ? 'animate-pulse-purple' : isDateChanged ? 'animate-pulse-orange' : ''}`}>
        <div
          onClick={onClick}
          className={`${theme.bg} rounded-[1.25rem] p-3 pl-6 shadow-lg shadow-gray-200/40 border-[2px] 
            ${isActive ? 'border-cyan-500 scale-[1.01]' : theme.border} 
            ${job.is_hold ? 'border-amber-500' : job.is_escalated ? 'border-rose-500' : isQtyChanged ? 'border-purple-500/50' : isDateChanged ? 'border-orange-500/50' : ''} 
            relative overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-between`}
        >

          {/* Job Completion Priority Legend */}
          {job.job_completion_date && job.job_completion_date !== '-' ? (
            <DeliveryPriorityColor
              deliveryDate={job.job_completion_date}
              className="absolute left-0 top-0 bottom-0 w-2 h-full"
              containerStyle={{ display: 'block', position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px' }}
            />
          ) : (
            <div className="absolute left-0 top-0 bottom-0 w-2 h-full bg-emerald-500/80" style={{ position: 'absolute' }}></div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-1.5">
                <DeliveryPriorityColor
                  deliveryDate={job.job_completion_date}
                  showPriorityName={true}
                  badgeClassName="!text-[6px] !font-black !py-0.5 !px-1 italic uppercase !rounded-sm opacity-90"
                />
                {job.job_type === 'sample' ? (
                  <span className="text-[7px] font-black py-0.5 px-1 bg-amber-500 text-white italic rounded-sm shadow-sm">SAMPLE</span>
                ) : (
                  <span className="text-[7px] font-black py-0.5 px-1 bg-indigo-500 text-white italic rounded-sm shadow-sm">PRODUCTION</span>
                )}
                {job.is_reprocess && (
                  <span className="text-[7px] font-black py-0.5 px-1 bg-red-600 text-white italic rounded-sm shadow-sm">REPROCESS</span>
                )}
                {job.is_escalated && (
                  <span className="text-[7px] font-black py-0.5 px-1 bg-rose-600 text-white italic rounded-sm shadow-sm flex items-center gap-0.5 animate-pulse">
                    <Flag className="w-1.5 h-1.5 fill-white" />
                    ESCALATED
                  </span>
                )}
                {job.is_hold && (
                  <span className="text-[7px] font-black py-0.5 px-1 bg-amber-500 text-white italic rounded-sm shadow-sm flex items-center gap-0.5 animate-pulse">
                    <Clock className="w-1.5 h-1.5 fill-white" />
                    ON HOLD
                  </span>
                )}
              </div>
              {/* <div className="flex items-center gap-1">
            <button className="text-gray-300 hover:text-gray-600 transition-colors">
              <MoreVertical className="w-3 h-3" />
            </button>
          </div> */}
            </div>

            <div className="flex gap-3">
              {/* Product Image Thumbnail with Preview Trigger */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick?.(job.product_image);
                }}
                className="w-14 h-14 rounded-xl bg-white/50 border border-black/5 overflow-hidden flex-shrink-0 shadow-sm relative group/img"
              >
                {job.product_image ? (
                  <img src={job.product_image} alt={job.product_name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-gray-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-[8px] font-black">VIEW</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex justify-between items-start leading-none mb-1">
                  <span className="text-[10px] font-black text-gray-900 tracking-wider font-mono uppercase truncate opacity-70">
                    {job.id}
                  </span>
                  <span className="text-[9px] font-black text-rose-500 uppercase italic">
                    {formatDisplayDate(job.job_completion_date)}
                  </span>
                </div>

                <h4 className={`text-[10px] font-[1000] ${theme.text} leading-tight uppercase italic mb-0.5 line-clamp-1`} title={job.product_name}>
                  {job.product_name || 'No Name'}
                </h4>

                <div className="flex justify-between items-center gap-2">
                  <div className="text-[8px] font-bold text-gray-500/70 truncate uppercase tracking-tight flex-1">
                    {job.customer}
                  </div>
                  <div className="text-[9px] font-black text-slate-800 bg-black/5 px-1.5 rounded border border-black/5 shrink-0">
                    QTY: {displayQty}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className={`text-[7px] font-black ${theme.text} uppercase tracking-widest ${theme.pill} px-1.5 py-0.5 rounded border ${theme.border}`}>
                    {job.process_name}
                  </span>
                  {job.reference_no && (
                    <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">
                      REF: {job.reference_no}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Outsource Details Section - ONLY show in Outsource column */}
            {isOutsourceColumn && outsourcedGroups.length > 0 && (
              <div className="mt-3 space-y-2">
                {outsourcedGroups.map((mg, idx) => {
                  const mainMat = mg.materials?.find(m => {
                    const cat = m.category_type?.toLowerCase() || '';
                    return !cat.includes('consumable') && !cat.includes('hardware');
                  });
                  const length = mainMat?.material_input?.one_up_length || mainMat?.material_input?.length || '-';
                  const width = mainMat?.material_input?.one_up_width || mainMat?.material_input?.width || '-';

                  const assignments = mg.outsource_assignments?.length > 0
                    ? mg.outsource_assignments
                    : (mg.vendor_name && mg.assigned_outsource_sheets > 0 ? [{
                      vendor_name: mg.vendor_name,
                      outsource_sheets: mg.assigned_outsource_sheets,
                      outsource_qty: mg.assigned_outsource_ups,
                      outsource_rate: mg.outsource_rate,
                      outsource_delivery_date: mg.outsource_delivery_date
                    }] : []);

                  return assignments.map((assignment, aIdx) => (
                    <div key={`${idx}-${aIdx}`} className="p-2.5 rounded-2xl bg-purple-100 border border-purple-100/50">
                      <div className="text-[10px] font-[1000] text-purple-700 uppercase italic leading-none mb-1.5">
                        {mg.group_name} {assignments.length > 1 ? `#${aIdx + 1}` : ''}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 opacity-90">
                        <span className="text-[10px] font-[1000] text-purple-500 uppercase tracking-tighter">
                          {length}x{width} in
                        </span>
                        <span className="text-purple-200">|</span>
                        <span className="text-[10px] font-[1000] text-purple-500 uppercase tracking-tighter">
                          {(assignment.outsource_qty || 0).toLocaleString()} {isUv ? 'PCS' : 'UPS'}
                        </span>
                        <span className="text-purple-200">|</span>
                        <span className="text-[10px] font-[1000] text-purple-500 uppercase tracking-tighter">
                          ₹{assignment.outsource_rate || 0} / {isUv ? 'pc' : 'min'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-purple-100/30">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-500 tracking-tighter">{assignment.outsource_delivery_date || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Factory className="w-2.5 h-2.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase italic tracking-tighter truncate max-w-[60px]">
                              {assignment.vendor_name || 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Shift Indicators */}
                        {(() => {
                          const groupShifts = mg.assigned_shifts?.filter(s => s !== outsourceShift) || [];
                          if (groupShifts.length === 0) return null;
                          return (
                            <div className="flex gap-1">
                              {groupShifts.map(s => (
                                <span key={s} className="text-[6px] font-black bg-blue-500 text-white px-1 py-0.5 rounded-[3px] shadow-sm uppercase">SHIFT {s}</span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ));
                })}
              </div>
            )}
          </div>

          <div className="mt-2 space-y-1.5">

            {job.alert && (
              <div className="flex items-center gap-1.5 text-red-500 bg-red-50 p-1.5 rounded-lg border border-red-100">
                <AlertCircle className="w-3 h-3 fill-red-500 text-white" />
                <span className="text-[8px] font-black italic uppercase tracking-tight">{job.alert}</span>
              </div>
            )}

            {/* Progress Bar */}
            <div className="flex justify-between items-center pt-1">
              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mr-3 shadow-inner">
                <div className={`h-full ${job.color} transition-all duration-500`} style={{ width: `${job.progress}%` }}></div>
              </div>
              <span className="text-[9px] font-black text-slate-500 tabular-nums">{job.progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobCard;
