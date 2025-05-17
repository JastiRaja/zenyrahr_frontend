import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  MapPin,
  Users,
  Building2,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

// Define the type for employee data
interface Employee {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  department: string;
  role: string;
  designation: string;
  position: string;
  joinDate: string;
  workLocation: string;
}

interface Filters {
  department: string;
  position: string;
  workLocation: string;
  role: string;
  joinDateRange: {
    start: string;
    end: string;
  };
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    department: "All",
    position: "All",
    workLocation: "All",
    role: "All",
    joinDateRange: {
      start: "",
      end: "",
    },
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/employees`);
        if (response.ok) {
          const data: Employee[] = await response.json();
          setEmployees(data);
        } else {
          console.error("Failed to fetch employees");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // Get unique values for filter options
  const uniqueDepartments = [
    "All",
    ...new Set(employees.map((e) => e.department)),
  ];
  const uniquePositions = ["All", ...new Set(employees.map((e) => e.position))];
  const uniqueLocations = [
    "All",
    ...new Set(employees.map((e) => e.workLocation)),
  ];

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      department: "All",
      position: "All",
      workLocation: "All",
      role: "All",
      joinDateRange: {
        start: "",
        end: "",
      },
    });
    setSearchTerm("");
  };

  // Filter employees based on all criteria
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      `${employee.firstName} ${employee.lastName} ${employee.username} ${employee.department} ${employee.role} ${employee.position}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesDepartment =
      filters.department === "All" ||
      employee.department === filters.department;

    const matchesPosition =
      filters.position === "All" || employee.position === filters.position;

    const matchesLocation =
      filters.workLocation === "All" ||
      employee.workLocation === filters.workLocation;

      const matchesRole =
      filters.role === "All" ||
      employee.role === filters.role;

    const matchesDateRange = () => {
      if (!filters.joinDateRange.start && !filters.joinDateRange.end)
        return true;
      const joinDate = new Date(employee.joinDate);
      const start = filters.joinDateRange.start
        ? new Date(filters.joinDateRange.start)
        : null;
      const end = filters.joinDateRange.end
        ? new Date(filters.joinDateRange.end)
        : null;

      if (start && end) {
        return joinDate >= start && joinDate <= end;
      } else if (start) {
        return joinDate >= start;
      } else if (end) {
        return joinDate <= end;
      }
      return true;
    };

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesPosition &&
      matchesLocation &&
      matchesDateRange()
    );
  });

  return (
    <div className="max-w-[100%] mx-auto px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your team members and their access.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/employees/add")}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[
          {
            label: "Total Employees",
            value: employees.length || "0",
            icon: Users,
          },
          {
            label: "Departments",
            value: uniqueDepartments.length - 1 || "0",
            icon: Building2,
          },
          {
            label: "New This Month",
            value:
              employees.filter(
                (e) => new Date(e.joinDate).getMonth() === new Date().getMonth()
              ).length || "0",
            icon: Plus,
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium ${
                  showFilters
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                    : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              {(showFilters ||
                Object.values(filters).some(
                  (v) => v !== "All" && v !== ""
                )) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg max-w-3xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                >
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.position}
                  onChange={(e) =>
                    setFilters({ ...filters, position: e.target.value })
                  }
                >
                  {uniquePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Location
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filters.workLocation}
                  onChange={(e) =>
                    setFilters({ ...filters, workLocation: e.target.value })
                  }
                >
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Join Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={filters.joinDateRange.start}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        joinDateRange: {
                          ...filters.joinDateRange,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                  <input
                    type="date"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={filters.joinDateRange.end}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        joinDateRange: {
                          ...filters.joinDateRange,
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Location
                </th>
                <th className="px-6 py-3 relative text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <MapPin className="h-4 w-4 text-blue-500 mr-2" />
                      {employee.workLocation}
                    </div>
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/employees/edit/${employee.code}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/selfservice/${employee.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
