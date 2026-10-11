import EmployeeCard from "../component/Card";

const DepartmentSection = ({ department, employees, onEdit, onExit }) => {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-extrabold text-indigo-700 uppercase tracking-wide">
          {department}
        </h3>
        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold text-sm">
          {employees.length}
        </span>
      </div>
      <div className="mt-1 h-px w-4/4 bg-indigo-100 mb-4"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <EmployeeCard
            key={emp.id}
            employee={emp}
            onEdit={onEdit}
            onExit={onExit}
          />
        ))}
      </div>
    </div>
  );
};

export default DepartmentSection;