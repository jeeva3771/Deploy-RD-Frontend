import React from "react";
import { Box } from "@mui/material";

const TabCard = ({
  tabs = [],
  activeValue = "",
  onChange,
  colorMap = {},
  className = "",
  cardMinWidth = "140px",
  cardPadding = "15px",
}) => {
  // Default color configuration
  const defaultColorMap = {
    "": { color: "#1e293b", border: "#1e293b", bg: "#1e293b" },
    all: { color: "#1e293b", border: "#1e293b", bg: "#1e293b" },
    allocation: { color: "#0ea5e9", border: "#0ea5e9", bg: "#0ea5e9" },
    indesign: { color: "#3b82f6", border: "#3b82f6", bg: "#3b82f6" },
    completed: { color: "#10b981", border: "#10b981", bg: "#10b981" },
    closed_hold: { color: "#94a3b8", border: "#94a3b8", bg: "#94a3b8" },
    enquiry: { color: "#3b82f6", border: "#3b82f6", bg: "#3b82f6" },
    designerallocation: { color: "#0ea5e9", border: "#0ea5e9", bg: "#0ea5e9" },
    design: { color: "#0ea5e9", border: "#0ea5e9", bg: "#0ea5e9" },
    false: { color: "#f59e0b", border: "#f59e0b", bg: "#f59e0b" },
    true: { color: "#06b6d4", border: "#06b6d4", bg: "#06b6d4" },
    complete: { color: "#64748b", border: "#64748b", bg: "#64748b" },
    rework: { color: "#f97316", border: "#f97316", bg: "#f97316" },
    abandon: { color: "#94a3b8", border: "#94a3b8", bg: "#94a3b8" },
    approveddesigns: { color: "#10b981", border: "#10b981", bg: "#10b981" },
    approvedquotation: { color: "#8b5cf6", border: "#8b5cf6", bg: "#8b5cf6" },
    reprocessedquotation: { color: "#4f46e5", border: "#4f46e5", bg: "#4f46e5" },
    approveddesignsaccounts: { color: "#eab308", border: "#eab308", bg: "#eab308" },
    jobinprogress: { color: "#06b6d4", border: "#06b6d4", bg: "#06b6d4" },
    dispatch: { color: "#ec4899", border: "#ec4899", bg: "#ec4899" },
    submit_button: { color: "#10b981", border: "#10b981", bg: "#10b981" },
    pending: { color: "#f59e0b", border: "#f59e0b", bg: "#f59e0b" },
    process: { color: "#6194d7ff", border: "#6194d7ff", bg: "#6194d7ff" },
    requestedquotaion: { color: "#1e293b", border: "#1e293b", bg: "#1e293b" },
    newbom: { color: "#3b82f6", border: "#3b82f6", bg: "#3b82f6" },
    bomrework: { color: "#f97316", border: "#f97316", bg: "#f97316" },
  };

  // Merge custom colors with defaults
  const mergedColorMap = { ...defaultColorMap, ...colorMap };

  const getTabColors = (value) => {
    return (
      mergedColorMap[value] || {
        color: "#64748b",
        border: "#64748b",
        bg: "#64748b",
      }
    );
  };

  // Extract count and label from format "Label (123)"
  const parseTabLabel = (label) => {
    const labelParts = label.match(/^(.*?)\s*\((\d+)\)$/);
    return {
      displayLabel: labelParts ? labelParts[1] : label,
      count: labelParts ? labelParts[2] : "0",
    };
  };

  return (
    <Box
      className={className}
      sx={{
        mb: 0,
        px: 2,
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          overflowY: "hidden",
          pb: 2,
          scrollBehavior: "smooth",
          // Custom scrollbar styling
          "&::-webkit-scrollbar": {
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f5f9",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "10px",
            "&:hover": {
              backgroundColor: "#94a3b8",
            },
          },
          // Firefox scrollbar
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 #f1f5f9",
          msOverflowStyle: "auto",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeValue === tab.value;
          const colors = getTabColors(tab.value);
          const { displayLabel, count: parsedCount } = parseTabLabel(tab.label);
          const count = tab.count !== undefined ? tab.count : parsedCount;

          return (
            <Box
              key={tab.value}
              onClick={() => onChange && onChange(tab.value)}
              sx={{
                minWidth: cardMinWidth,
                flexShrink: 0,
                padding: cardPadding,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                background: isActive ? colors.bg : "white",
                border: isActive ? "none" : `2px solid ${colors.border}`,
                color: isActive ? "white" : colors.color,
                boxShadow: isActive
                  ? "0 8px 15px rgba(0,0,0,0.15)"
                  : "0 4px 6px rgba(0,0,0,0.05)",
                transform: isActive ? "scale(1.05)" : "scale(1)",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 15px rgba(0,0,0,0.1)",
                },
              }}
            >
              {/* Count Display */}
              <Box
                sx={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  mb: 0.5,
                }}
              >
                {count}
              </Box>

              {/* Label Display */}
              <Box
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  whiteSpace: "nowrap",
                }}
              >
                {displayLabel.replace(/_/g, " ")}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default TabCard;