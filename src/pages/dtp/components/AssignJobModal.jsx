import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../../reducer/userReducer';

const AssignJobModal = ({ isOpen, onClose, job, onConfirm }) => {
    const dispatch = useDispatch();
    const { users, loading: usersLoading } = useSelector((state) => state.user);

    const [selectedArtist, setSelectedArtist] = useState('');
    const [note, setNote] = useState('');

    const jobId = job?._id || job?.jobId;
    const existingArtistId = job?.assigned_to ? (typeof job.assigned_to === 'object' ? job.assigned_to?._id : job.assigned_to) : '';

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchAllUsers({
                is_active: true,
                departmentName: 'DTP'
            }));

            // Set existing artist if available
            if (existingArtistId) {
                setSelectedArtist(existingArtistId);
            }
        }
    }, [isOpen, dispatch, jobId, existingArtistId]);

    const handleConfirm = () => {
        if (!selectedArtist) {
            alert('Please select an artist');
            return;
        }

        const selectedUser = users.find(u => u._id === selectedArtist);

        onConfirm({
            artistId: selectedArtist,
            artistName: selectedUser ? `${selectedUser.name}` : '',
            note: note.trim()
        });

        // Reset form
        setSelectedArtist('');
        setNote('');
    };

    const handleCancel = () => {
        setSelectedArtist('');
        setNote('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Assign {job?.jobId}
                    </h2>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Artist Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Artist
                        </label>
                        <select
                            value={selectedArtist}
                            onChange={(e) => setSelectedArtist(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            disabled={usersLoading}
                        >
                            <option value="">
                                {usersLoading ? 'Loading artists...' : 'Select an artist'}
                            </option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Note Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Reason..."
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedArtist || usersLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignJobModal;
