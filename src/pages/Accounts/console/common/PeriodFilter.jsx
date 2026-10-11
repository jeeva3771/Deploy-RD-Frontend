import React, { useMemo } from "react";

/**
 * PeriodFilter — Reusable Period Selector for Accounts Console tabs
 *
 * Props:
 *  value            - currently selected period string
 *  onChange         - (newPeriodStr) => void
 *  availableFinancialYears  - [{ value, label }] from API
 *  availableMonths          - [{ value, label }] from API
 *  label            - optional label text (default: "Period:")
 *  loading          - boolean to show ⏳ state
 *  onRefresh        - () => void  (refresh button click)
 *  showAllTime      - boolean, default true
 */
export function PeriodFilter({
  value,
  onChange,
  availableFinancialYears = [],
  availableMonths = [],
  label = "Period:",
  loading = false,
  onRefresh,
  showAllTime = true,
}) {
  const defaults = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = now.getMonth();
    const fyStart = mo >= 3 ? yr : yr - 1;

    const fys = [];
    for (let y = fyStart; y >= fyStart - 4; y--) {
      fys.push({ value: `fy_${y}_${y + 1}`, label: `${y}-${y + 1}` });
    }

    return { fys };
  }, []);

  const fysToRender = useMemo(() => {
    const src = availableFinancialYears.length > 0 ? availableFinancialYears : defaults.fys;
    return [...src].sort((a, b) => {
      const aYr = parseInt((a.value || "").replace("fy_", "").split("_")[0]) || 0;
      const bYr = parseInt((b.value || "").replace("fy_", "").split("_")[0]) || 0;
      return bYr - aYr;
    });
  }, [availableFinancialYears, defaults.fys]);

  const derivedFilterType = useMemo(() => {
    if (value === "today" || (value && value.startsWith("date_"))) return "today";
    if (value === "weekly" || (value && value.startsWith("week_"))) return "week";
    if (value === "all") return "all";
    if (value && value.startsWith("fy_")) return "fy";
    return "month"; // default
  }, [value]);

  const getCurrentWeekString = () => {
    const now = new Date();
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const derivedWeekValue = useMemo(() => {
    if (value && value.startsWith("week_")) return value.replace("week_", "");
    if (value === "weekly") return getCurrentWeekString();
    return "";
  }, [value]);

  const handleTypeChange = (e) => {
    const type = e.target.value;
    if (type === "today") onChange("today");
    else if (type === "week") onChange("weekly");
    else if (type === "month") {
      const now = new Date();
      onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    }
    else if (type === "fy") {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = now.getMonth();
      const fyStart = mo >= 3 ? yr : yr - 1;
      onChange(`fy_${fyStart}_${fyStart + 1}`);
    }
    else if (type === "all") {
      onChange("all");
    }
  };

  const inputStyle = {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1.5px solid #CBD5E1",
    fontSize: 12.5,
    fontWeight: 700,
    color: "#0F172A",
    background: "#FFFFFF",
    cursor: "pointer",
    outline: "none",
    minWidth: 140,
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 14,
        padding: "10px 14px",
        background: "#F8FAFC",
        borderRadius: 10,
        border: "1px solid #E2E8F0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <select
          value={derivedFilterType}
          onChange={handleTypeChange}
          style={{ ...inputStyle, color: "#0F172A", minWidth: 150 }}
        >
          <option value="today">Today</option>
          <option value="week">By Week</option>
          <option value="month">By Month</option>
          <option value="fy">By Financial Year</option>
          {showAllTime && <option value="all">All Time</option>}
        </select>

        {derivedFilterType === "today" && (
          <input
            type="text"
            readOnly
            value={new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}
            style={{ ...inputStyle, minWidth: 120, cursor: "default" }}
          />
        )}

        {derivedFilterType === "week" && (
          <input
            type="week"
            value={derivedWeekValue}
            onChange={(e) => onChange(`week_${e.target.value}`)}
            style={{ ...inputStyle, minWidth: 150 }}
          />
        )}

        {derivedFilterType === "month" && (
          <input
            type="month"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, minWidth: 150 }}
          />
        )}

        {derivedFilterType === "fy" && (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, minWidth: 120 }}
          >
            {fysToRender.map((fy) => (
              <option key={fy.value} value={fy.value}>{fy.label}</option>
            ))}
          </select>
        )}
      </div>

      {onRefresh && (
        <button
          className="btn bs"
          onClick={onRefresh}
          disabled={loading}
          style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
        >
          <span>{loading ? "⏳" : "🔄"}</span>
          <span>{loading ? "Loading..." : "Refresh"}</span>
        </button>
      )}
    </div>
  );
}

/**
 * Returns the current month as "YYYY-MM" string
 */
export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
