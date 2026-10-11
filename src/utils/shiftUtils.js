export const getShiftBadgeClass = (shift) => {
    if (!shift) return 'bg-gray-100 text-gray-600 border border-gray-300';
    
    const shiftName = shift.name?.toLowerCase() || '';
    
    if (shiftName.includes('general')) {
        return 'bg-blue-100 text-blue-800 border border-blue-300';
    } else if (shiftName.includes('morning')) {
        return 'bg-orange-100 text-orange-800 border border-orange-300';
    } else if (shiftName.includes('evening')) {
        return 'bg-purple-100 text-purple-800 border border-purple-300';
    } else if (shiftName.includes('night')) {
        return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
    
    return 'bg-gray-100 text-gray-600 border border-gray-300';
};