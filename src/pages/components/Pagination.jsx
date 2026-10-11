import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalCount,
  startIndex,
  visibleItemCount,
  customOptions = null,
  listType = false
}) => {
  const maxVisible = 3;

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

  const buttons = [];
  for (let i = start; i <= end; i++) {
    buttons.push(i);
  }

  const ItemsPerPageOptions = customOptions || (listType ? [5, 10, 15, 20] : [8, 16, 24, 32]);

  const safeStartIndex = Number(startIndex) || 0;
  const safeVisibleCount = Number(visibleItemCount) || 0;
  const safeTotalCount = Number(totalCount) || 0;

  return (
    <div className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 bg-white rounded-b-md">
      {/* Left: Show Entries */}
      <div className="flex items-center mb-4 sm:mb-0 min-w-[150px]">
        <span className="text-sm text-gray-700 mr-2">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
          }}
          className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {ItemsPerPageOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-700 ml-2">entries</span>
      </div>

      {/* Center: Status Text */}
      <div className="text-sm text-gray-700 mb-4 sm:mb-0 text-center flex-1">
        Showing {safeTotalCount === 0 ? 0 : safeStartIndex + 1} to {Math.min(safeStartIndex + safeVisibleCount, safeTotalCount)} of {safeTotalCount} entries
      </div>

      {/* Right: Navigation Buttons */}
      <div className="flex items-center min-w-[150px] justify-end">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-l-md text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {buttons.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`px-3 py-1 border-t border-b border-gray-300 text-sm ${currentPage === pageNum
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 border border-gray-300 rounded-r-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
