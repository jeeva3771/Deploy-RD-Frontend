import React from 'react';
import ProfileImage from '../../users/ProfileImage';

const TeamMemberItem = ({ member, isSelected, onClick }) => {
    return (
        <div
            onClick={() => onClick(member)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected
                ? 'bg-purple-50 border-purple-200 shadow-sm'
                : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
        >
            <div className="relative">
                {/* Use the shared ProfileImage component logic */}
                <span className="block h-8 w-8 [&>div]:w-8 [&>div]:h-8 [&>div]:text-xs [&>img]:w-8 [&>img]:h-8">
                    <ProfileImage
                        src={member.image}
                        alt={member.first_name || member.name}
                        name={member.first_name || member.name}
                        size="default" // We might need to override the size classes in the component if 'small' isn't supported, but using CSS wrapper to force size
                    />
                </span>

                {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-[2px] border-2 border-white z-10">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <span className={`text-sm font-semibold capitalize ${isSelected ? 'text-gray-800' : 'text-gray-600'}`}>
                    {member.first_name || member.name}
                </span>
                <span className="text-[11px] text-gray-400">ID: {member.employee_id || member.emp_id || 'N/A'}</span>
            </div>
        </div>
    );
};

export default TeamMemberItem;
