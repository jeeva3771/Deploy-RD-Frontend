 import React from 'react';
import BoardColumn from './components/BoardColumn';
import JobCard from './components/JobCard';
import AssemblyJobDetail from './components/AssemblyJobDetail';

// Dynamic columns will be generated from the `machines` prop.

export default function AssemblyBayHead({
  queueJobs = [],
  getJobsForGroup,
  colClass,
  selectedJob,
  setSelectedJob,
  refreshData,
  handleImageClick,
  assemblyDept,
  syncing,
  machines = [],
  processColors
}) {
  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  return (
    <div className="h-full flex gap-4 overflow-hidden">
      <div className="h-full flex-1 flex gap-4 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent scroll-auto">

        {/* QUEUE Column */}
        <div className={`h-full flex flex-col bg-[#cbd5e1]/30 rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden pb-5 ${colClass}`}>
          <div className="px-5 py-4 flex justify-between items-center border-b border-gray-200 bg-white/50">
            <h3 className="text-[11px] font-black tracking-widest text-[#64748b] uppercase">QUEUE</h3>
            <span className="bg-white/80 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-200">{queueJobs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-50 scroll-auto">
            <div className="p-4 pb-6 space-y-4">
              {queueJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={{
                    ...job,
                    id: `${job.job_no}/${job.sub_job_no}`,
                    customer: job.client_name,
                    color: 'bg-blue-400',
                  }}
                  onClick={() => handleJobClick(job)}
                  onImageClick={handleImageClick}
                  isActive={selectedJob?._id === job._id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Team Columns */}
        {machines.map((teamName) => {
          const groupJobs = getJobsForGroup(teamName);
          const theme = processColors?.getThemeForName ? processColors.getThemeForName(teamName) : { bar: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
          return (
            <BoardColumn
              key={teamName}
              title={teamName}
              jobs={groupJobs}
              dotColor={theme.bar}
              count={groupJobs.length}
              color={`${theme.border} ${theme.bg}`}
              className={colClass}
              onJobClick={handleJobClick}
              onImageClick={handleImageClick}
              selectedJobId={selectedJob?._id}
            />
          );
        })}
      </div>

      {/* Right Detail Panel */}
      {selectedJob && (
        <div className={`w-[450px] shrink-0 border-l border-slate-200 bg-white shadow-2xl ${syncing ? 'pointer-events-none opacity-50 transition-opacity' : 'transition-opacity'}`}>
          <AssemblyJobDetail
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            refreshData={refreshData}
            onImageClick={handleImageClick}
            machines={machines}
          />
        </div>
      )}
    </div>
  );
}
