import React from "react";

const PillTabGroup = ({
  tabs = [],
  activeValue = "",
  onChange,
  size = "normal", // 'normal' or 'small'
  className = "",
}) => {
  if (!tabs || tabs.length === 0) return null;

  const isSmall = size === "small";

  return (
    <div className={`flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;

        return (
          <React.Fragment key={tab.value}>
            <button
              type="button"
              onClick={() => onChange && onChange(tab.value)}
              className={`
                flex items-center gap-1.5 whitespace-nowrap rounded-full transition-all duration-200 focus:outline-none
                ${isSmall
                  ? "px-4 py-1.5 text-xs font-medium tracking-wide"
                  : "px-6 py-2.5 text-sm font-medium tracking-wide"
                }
                ${isActive
                  ? "bg-blue-600 text-white shadow-md border border-blue-600 dark:bg-blue-500 dark:border-blue-500"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                }
              `}
            >
              <span>{tab.label}</span>
              {typeof tab.count !== "undefined" && tab.count !== null && (
                <span
                  className={`
                    rounded-full font-bold
                    ${isSmall ? "text-[13px]" : "text-xs"}
                    ${isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-500"}
                  `}
                >
                  ({tab.count})
                </span>
              )}
            </button>
            {tab.renderAfter && tab.renderAfter}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PillTabGroup;
