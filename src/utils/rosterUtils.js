export const generateRosterText = (rosterData, department) => {
    if (!rosterData || rosterData.length === 0) {
        return 'No roster data available';
    }

    // Group by shift
    const grouped = {};
    rosterData.forEach(emp => {
        const shiftKey = emp.shift_time 
            ? `${emp.shift_time.start_time} - ${emp.shift_time.end_time} (${emp.shift_time.name})`
            : 'Not Assigned';
        
        if (!grouped[shiftKey]) {
            grouped[shiftKey] = [];
        }
        grouped[shiftKey].push(emp.name);
    });

    let text = `*Shift Roster: ${department?.name || 'Department'}*\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    text += `------------------\n`;

    for (const [shift, names] of Object.entries(grouped)) {
        text += `\n*${shift}*\n`;
        names.forEach(name => {
            text += `- ${name}\n`;
        });
    }

    text += `\n------------------\n`;
    text += `Total Employees: ${rosterData.length}`;

    return text;
};