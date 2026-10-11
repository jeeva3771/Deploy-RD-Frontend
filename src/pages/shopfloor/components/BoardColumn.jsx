import React from 'react';
import JobCard from './JobCard';

const BoardColumn = ({ title, dotColor, count, color, jobs = [], onJobClick, onImageClick, selectedJobId, className = "flex-shrink-0" }) => (
  <div className={`flex flex-col rounded-[2.5rem] border ${color} shadow-sm overflow-hidden ${className} pb-6`}>
    <div className="px-6 py-5 flex justify-between items-center bg-white/40 border-b border-black/5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${dotColor} shadow-md shadow-current/30`}></div>
        <h3 className="text-[12px] font-black tracking-[0.15em] text-[#64748b] uppercase">{title}</h3>
      </div>
      <span className="text-[12px] font-black text-blue-600">{count}</span>
    </div>

    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-auto">
      <div className="p-4 pb-8 space-y-4">
        {jobs.map((job) => {
          const preparedJob = {
            ...job,
            id: `${job.job_no}/${job.sub_job_no}`,
            customer: job.client_name,
            color: dotColor,
            theme: job.theme // Handled in LaserCutting filtering
          };

          return (
            <JobCard
              key={job._id}
              job={preparedJob}
              onClick={() => onJobClick(job)}
              onImageClick={onImageClick}
              isActive={selectedJobId === job._id}
              isOutsourceColumn={title === 'OUTSOURCE'}
              columnName={title}
            />
          );
        })}
      </div>
    </div>
  </div>
);

export default BoardColumn;
