import React, { useState } from 'react';
import CategoriesSidebar from './component/CategoriesSidebar';
import CreateTeamForm from './component/CreateTeamForm';
import ActiveTeamsList from './component/ActiveTeamsList';

const TeamsModule = () => {
    const [selectedTeam, setSelectedTeam] = useState(null);

    return (
        <div className="flex h-[calc(100vh-80px)] gap-6 px-6 pb-6 pt-10 bg-gray-50/50">
            {/* Left Sidebar */}
            <div className="w-64 flex-shrink-0 h-full">
                <CategoriesSidebar
                    selectedTeam={selectedTeam}
                    onSelectTeam={setSelectedTeam}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <h1 className="text-xl font-bold text-slate-800 mb-6 font-sans">
                    {selectedTeam ? `${selectedTeam.name} Team` : 'Production Planning Team'}
                </h1>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Create Form */}
                    <div className="w-[450px] flex-shrink-0 h-full overflow-hidden">
                        <CreateTeamForm selectedTeam={selectedTeam} />
                    </div>

                    {/* Active List */}
                    <div className="flex-1 h-full overflow-hidden">
                        <ActiveTeamsList selectedTeam={selectedTeam} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamsModule;
