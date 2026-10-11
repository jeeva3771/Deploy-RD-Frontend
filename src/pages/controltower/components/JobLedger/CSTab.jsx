import React from 'react';
import { JobProgressOverviewContent } from '../../../salesorder/components/JobProgressOverviewDrawer';

function CSTab({ job }) {
    if (!job) return null;
    return (
        <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
            <JobProgressOverviewContent data={job} mode="cs_tab" />
        </div>
    );
}

export default CSTab;