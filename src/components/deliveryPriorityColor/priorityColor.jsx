import React from "react";
import { usePriorityColors } from "../../context/PriorityColorContext";
import { formatDateToYYYYMMDD } from "../../utils/enquiry/dateformat";

const DeliveryPriorityColor = ({
  deliveryDate,
  as = "div",
  className = "",
  style = {},
  children,
  showPriorityName = false,
  containerStyle = {},
  badgeClassName = "",
}) => {
  const { priorityColors } = usePriorityColors();
  const updatedDateFormat = formatDateToYYYYMMDD(deliveryDate);

  const getDaysLeft = (date) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight

    const delivery = new Date(date);
    delivery.setHours(0, 0, 0, 0); // Normalize delivery date to midnight

    return Math.ceil((delivery - today) / (1000 * 60 * 60 * 24));
  };

  const getColorByDate = (date) => {
    const daysLeft = getDaysLeft(date);
    if (daysLeft == null) return "";

    if (daysLeft < 0) return "#dc2626"; // Red for overdue
    if (daysLeft >= 11) return "#eb33b1";

    const matched = priorityColors.find(
      (p) =>
        daysLeft >= p.priority.days_from &&
        daysLeft <= p.priority.days_to
    );
    return matched?.priority.color || "";
  };

  const getPriorityName = (date) => {
    const daysLeft = getDaysLeft(date);
    if (daysLeft == null) return "";

    if (daysLeft < 0) return "Overdue";
    if (daysLeft >= 11) return "Upcoming";

    const matched = priorityColors.find(
      (p) =>
        daysLeft >= p.priority.days_from &&
        daysLeft <= p.priority.days_to
    );

    if (!matched) return "";
    return matched.name;
  };

  const bgColor = getColorByDate(updatedDateFormat);
  const priorityName = showPriorityName ? getPriorityName(updatedDateFormat) : "";
  const Component = as;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", ...containerStyle }}>
      <Component
        className={className}
        style={{
          backgroundColor: bgColor,
          transition: "background-color 0.4s ease",
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
          ...style,
        }}
      >
        {children}
      </Component>

      {showPriorityName && priorityName && (
        <span
          className={badgeClassName}
          style={{
            padding: "2px 8px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "12px",
            backgroundColor: bgColor,
            color: "#fff",
            whiteSpace: "nowrap",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {priorityName}
        </span>
      )}
    </div>
  );
};

export default DeliveryPriorityColor;