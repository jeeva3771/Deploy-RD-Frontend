// src/utils/statusHelpers.js

// export const getStatusBadge = (status) => {
//   const statusClasses = {
//     printing: "bg-blue-500",
//     rejected: "bg-red-500",
//     approved: "bg-emerald-500",
//     production: "bg-purple-500",
//     packaging: "bg-yellow-500",
//     billing: "bg-orange-500",
//     sampling: "bg-pink-500",
//     enquiry: "bg-[#B2FFFC]",
//     design: "bg-[#C7B8EA]",
//     pending: "bg-yellow-300",
//     abandon: "bg-red-500",
//   };
//   return statusClasses[status] || "bg-gray-500";
// };

export const getStatusBadge = (status) => {
  const statusStyles = {
    // These hex codes are pulled directly from your image
    packaging: { backgroundColor: "#FFCC33" }, // Vibrant Yellow/Gold
    printing:  { backgroundColor: "#1cc2dcff" }, // Bright Blue
    approved:  { backgroundColor: "#1ce36fff" }, // Vibrant Green
    design:    { backgroundColor: "#2db75dff" }, // Light Purple
    
    // Other bright mappings
    production: { backgroundColor: "#8B5CF6" }, // Violet
    rejected:   { backgroundColor: "#EF4444" }, // Red
    billing:    { backgroundColor: "#F97316" }, // Orange
    enquiry:    { backgroundColor: "#3B82F6" }, // Cyan
    pending:    { backgroundColor: "#FACC15" }, // Yellow-400
    abandon:    { backgroundColor: "#EF4444" }, // Red
    sampling:   { backgroundColor: "#EC4899" }  // Pink-500
  };

  return statusStyles[status] || { backgroundColor: "#6B7280" };
};
export const getStatusText = (status) => {
  const statusTexts = {
    enquiry: "ENQUIRY",
    design: "DESIGN",
    production: "PRODUCTION",
    printing: "PRINTING",
    billing: "BILLING",
    sampling: "SAMPLING",
    rejected: "REJECTED",
    approved: "CLIENT APPROVED",
    pending: "PENDING",
    abandon: "Abandon"
  };
  return statusTexts[status] || status?.toUpperCase();
};
