import React from 'react';
import { JobProgressOverviewContent } from '../../../salesorder/components/JobProgressOverviewDrawer';
import { CompletedJobOverview } from '../../../shopfloor/components/CTPack/CompletedJobOverview';

function FGPackTab({ job }) {
    if (!job) return null;

    const isPackedOrComplete = Boolean(job.is_dispatched);

    return (
        <div className="space-y-4">
            <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <JobProgressOverviewContent data={job} mode="fg_tab" />
            </div>
            {isPackedOrComplete && (
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden p-4">
                    <CompletedJobOverview job={job} hideHeader={true} />
                </div>
            )}
        </div>
    );
}

export default FGPackTab;