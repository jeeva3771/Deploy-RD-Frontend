export const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};


export const formatDateToYYYYMMDD = (dateStr) => {

  if (!dateStr) return "";

  // Handle ISO strings or strings with time
  if (dateStr.includes("T")) {
    dateStr = dateStr.split("T")[0];
  }

  // handle DD-MM-YYYY input
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts[0].length === 2) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`; // converts to YYYY-MM-DD
    }
  }
  return dateStr;
};
