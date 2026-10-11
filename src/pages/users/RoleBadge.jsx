import React from 'react';

const RoleBadge = ({ role }) => {
  const roleName = role?.name;

  const getRoleColor = (name) => {
    switch (name) {
      case "Admin executive":
        return "bg-green-100 text-green-800";

      case "Manager":
        return "bg-blue-100 text-blue-800";

      case "Accounts Manager":
        return "bg-purple-100 text-purple-800";

      case "Operations Director":
        return "bg-indigo-500 text-white";

      case "Operations Executive":
        return "bg-indigo-100 text-indigo-800";

      case "Client Servicing Manager":
        return "bg-blue-200 text-blue-900";

      case "Client Servicing Executive":
        return "bg-orange-100 text-orange-800";

      case "Marketing Manager":
        return "bg-yellow-100 text-yellow-800";

      case "Marketing Executive":
        return "bg-red-100 text-red-800";

      case "Design Executive":
        return "bg-pink-100 text-pink-800";

      case "3D Design Executive":
        return "bg-rose-100 text-rose-800";

      case "Associate":
        return "bg-indigo-100 text-indigo-800";

      case "Production Team":
        return "bg-sky-100 text-sky-800";

      case "Assembly Foreman":
        return "bg-fuchsia-100 text-fuchsia-800";

      case "Assembly Technician":
        return "bg-emerald-100 text-emerald-800";

      case "Purchase Manager":
        return "bg-amber-100 text-amber-800";

      case "Purchase Coordinator":
        return "bg-orange-100 text-orange-800";

      case "DTP Head":
        return "bg-violet-100 text-violet-800";

      case "DTP Operator":
        return "bg-purple-100 text-purple-800";

      case "Store Incharge":
        return "bg-emerald-100 text-emerald-800";

      case "QC Inspector":
        return "bg-red-200 text-red-900";

      case "Packing Head":
        return "bg-blue-300 text-white-800";

      case "Packing Helper":
        return "bg-green-500 text-white-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleColor(
        roleName
      )}`}
    >
      <span>{roleName}</span>
    </span>
  );
};

export default RoleBadge;