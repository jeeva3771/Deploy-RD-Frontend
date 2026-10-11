import React from 'react';
import MobileCompletedJobsView from './MobileCompletedJobsView';

const AssemblyBayCompletedMobileView = ({
    jobs = [],
    processColors = {},
    onImageClick,
    onBackToPipeline
}) => {
    return (
        <MobileCompletedJobsView
            jobs={jobs}
            processColors={processColors}
            onImageClick={onImageClick}
            onBackToPipeline={onBackToPipeline}
        />
    );
};

export default AssemblyBayCompletedMobileView;
