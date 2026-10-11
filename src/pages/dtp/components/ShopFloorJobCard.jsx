import React from 'react';
import DeliveryPriorityColor from '../../../components/deliveryPriorityColor/priorityColor';

const ShopFloorJobCard = ({ job, processStatus, onOpenDetails, sectionName, sectionId, processIndex, processName, isShopFloorGroup }) => {
    // Determine info based on completion date
    const jobCompletionDate = (job.job_completion_date && job.job_completion_date.split('T')[0]) || job.delivery_date;
    const isCritical = job.priority === 'Critical';

    // Find the specific process to get current status/qty if needed
    let currentProcess = '';
    if (processIndex) {
        const [mpIdx, procIdx] = processIndex.split('.').map(n => parseInt(n) - 1);
        currentProcess = job.job_sheet?.materialprocess?.[mpIdx]?.processes?.[procIdx];
    }

    // Status color mapping (simplified for this view)
    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';

        switch (s) {
            case 'hold':
                return 'text-white bg-orange-500 border-orange-600 shadow-sm';
            case 'pending':
                return 'text-indigo-700 bg-indigo-100 border-indigo-200';
            case 'assigned':
                return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'master template':
                return 'text-violet-700 bg-violet-100 border-violet-200';
            case 'content proofing':
                return 'text-fuchsia-700 bg-fuchsia-100 border-fuchsia-200';
            case 'final prep':
                return 'text-pink-700 bg-pink-100 border-pink-200';
            case 'push to floor':
                return 'text-rose-700 bg-rose-100 border-rose-200';
            case 'accounting quantity':
                return 'text-amber-700 bg-amber-100 border-amber-200';
            case 'shop floor':
                return 'text-emerald-700 bg-emerald-100 border-emerald-200';
            case 'completed':
                return 'text-green-700 bg-green-100 border-green-200';
            case 'reprocess':
                return 'text-red-700 bg-red-100 border-red-200';
            // case 'hold':
            //     return 'text-gray-700 bg-gray-200 border-gray-300';
            default:
                return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    const isHold = job.is_on_hold || job.status?.toLowerCase() === 'hold';
    const statusStyle = getStatusStyle(isHold ? 'hold' : (job.status || 'New'));
    const isToday = jobCompletionDate === new Date().toISOString().split('T')[0];

    return (
        <div
            className={`p-3 rounded-lg border border-slate-200 relative mb-3 hover:shadow-md transition-all cursor-pointer pl-5 ${isHold ? 'bg-red-50 border-red-100' :
                job.urgency_sent ? 'blink-border-red-thin bg-red-40' :
                    isToday ? (isCritical ? 'blink-border-red-thin critical-pulse bg-white' : 'blink-border-red-thin bg-white') :
                        (isCritical ? 'bg-white border-red-100 critical-pulse' : 'bg-white')
                }`}
            onClick={() => onOpenDetails && onOpenDetails(job._id || job.id, sectionId, processIndex)}
        >
            {/* Priority Indicator Line - Left Side */}
            {isHold ? (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 rounded-l-lg shadow-[2px_0_4px_rgba(249,115,22,0.2)]"></div>
            ) : jobCompletionDate ? (
                <DeliveryPriorityColor
                    deliveryDate={jobCompletionDate}
                    className="absolute left-0 top-0 bottom-0 w-1.5 h-full"
                    containerStyle={{ display: 'block', position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px' }}
                />
            ) : (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300"></div>
            )}

            {isHold ? (
                <div className="absolute top-2 left-2 text-white bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white animate-bounce z-10">
                    <i className="fa-solid fa-hand text-[10px]"></i>
                </div>
            ) : isCritical && (
                <div className="absolute top-2 left-3 text-red-500 bg-white/80 rounded-full px-1.5 py-0.5 shadow-sm backdrop-blur-sm z-10">
                    <i className="fa-solid fa-bolt-lightning"></i>
                </div>
            )}

            <div className="flex justify-between items-center mb-2">
                <span className={`text-[12px] font-medium text-slate-400 flex items-center gap-1`}>
                    {job.urgency_sent && <i className="fas fa-bolt text-red-600 animate-pulse"></i>}
                    {jobCompletionDate || 'No Date'}
                </span>

                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusStyle}`}>
                        {isHold ? 'ON HOLD' : (job.status || 'New')}
                    </span>

                    {jobCompletionDate && (
                        <div className="scale-75 origin-left flex items-center">
                            <DeliveryPriorityColor
                                deliveryDate={jobCompletionDate}
                                showPriorityName={true}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col mt-2">
                <div className="flex gap-3">
                    {/* Thumbnail Image */}
                    {job.image && (
                        <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded overflow-hidden border border-slate-200">
                            <img
                                src={job.image}
                                alt="Product"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* Text Details */}
                    <div>
                        <div className="font-bold text-slate-800 text-sm mb-1">
                            {job.sub_job_no || job.job_no}
                            {sectionName && ` - ${sectionName}`}
                            {processIndex && ` - ${processIndex}`}
                            {isShopFloorGroup && processName && (
                                <span className="ml-2 text-slate-600 font-semibold uppercase">
                                    - {processName}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-slate-600 font-medium leading-snug line-clamp-2" title={job.product_name}>
                            {job.product_name || 'No Product Details'}
                            {/* {currentProcess.status && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ml-1 ${currentProcess.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                    currentProcess.status === 'Partially Completed' ? 'bg-amber-100 text-amber-700' :
                                        currentProcess.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            currentProcess.status === 'Paused' ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-600'
                                    }`}>
                                    {currentProcess.status}
                                    {currentProcess.status === 'Partially Completed' && currentProcess.completed_qty && ` (${currentProcess.completed_qty}/${job.job_quantity || job.job_qty || 0})`}
                                </span>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopFloorJobCard;
