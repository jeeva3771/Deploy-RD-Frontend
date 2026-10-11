import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../../reducer/userReducer';

const GroupJobsModal = ({ isOpen, onClose, selectedJobs, onConfirm }) => {
    const dispatch = useDispatch();
    const { users, loading: usersLoading } = useSelector((state) => state.user);

    const [folderName, setFolderName] = useState('');
    const [selectedArtist, setSelectedArtist] = useState('');

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllUsers({
                is_active: true,
                departmentName: 'DTP'
            }));

            // Set default folder name using the job_no of selected jobs (they all have the same)
            if (selectedJobs && selectedJobs.length > 0) {
                setFolderName(selectedJobs[0].job_no);
            }
        }
    }, [isOpen, dispatch, selectedJobs]);

    const handleConfirm = () => {
        if (!folderName.trim()) {
            alert('Please enter a folder name');
            return;
        }

        const selectedUser = users.find(u => u._id === selectedArtist);

        onConfirm({
            folder_name: folderName.trim(),
            artistId: selectedArtist || null,
            artistName: selectedUser ? selectedUser.name : null
        });

        // Reset
        setFolderName('');
        setSelectedArtist('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1060] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 font-primary">Group Jobs</h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-primary">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-primary"
                            placeholder="Enter folder name..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-primary">
                            Assign to Artist (Optional)
                        </label>
                        <select
                            value={selectedArtist}
                            onChange={(e) => setSelectedArtist(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-primary"
                        >
                            <option value="">Select Artist</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors font-primary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold text-sm transition-all shadow-md font-primary"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupJobsModal;
