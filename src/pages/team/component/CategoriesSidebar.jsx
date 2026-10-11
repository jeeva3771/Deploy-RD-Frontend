import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllDepartments } from '../../../reducer/departmentReducer';
import { useNavigate } from 'react-router-dom';

const CategoriesSidebar = ({ selectedTeam, onSelectTeam }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { departments, isLoading } = useSelector((state) => state.department);

    useEffect(() => {
        // Fetch only active departments
        dispatch(getAllDepartments({ is_active: "true" }));
    }, [dispatch]);

    useEffect(() => {
        if (!isLoading && departments.length > 0 && !selectedTeam) {
            onSelectTeam(departments[0]);
        }
    }, [departments, isLoading, selectedTeam, onSelectTeam]);

    const handlePrintMasterView = () => {
        window.open('/print/team/master');
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="p-4 border-b border-gray-100">
                <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wide">Categories</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading && departments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
                ) : (
                    departments.map((dept) => (
                        <button
                            key={dept.id || dept._id}
                            onClick={() => onSelectTeam(dept)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${(selectedTeam && (selectedTeam.id || selectedTeam._id) === (dept.id || dept._id))
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            {dept.name} Team
                        </button>
                    ))
                )}
                {departments.length === 0 && !isLoading && (
                    <div className="text-center py-4 text-gray-400 text-sm">No active departments found.</div>
                )}
            </div>

            <div className="p-3 mt-auto">
                <button onClick={handlePrintMasterView} className="w-full bg-[#1e1b4b] text-white py-3 px-4 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-[#2e2a6b] transition-colors shadow-lg">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-print"></i>
                        <span className="font-bold text-sm">PRINT MASTER VIEW</span>
                    </div>
                    <span className="text-[10px] text-gray-300 font-normal">(Department Wise Report)</span>
                </button>
            </div>
        </div>
    );
};

export default CategoriesSidebar;
