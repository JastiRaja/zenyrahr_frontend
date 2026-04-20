import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isMainPlatformAdmin, MAIN_PLATFORM_ADMIN_ROLE } from "../types/auth";
import { Search, Plus, Filter, MapPin, Users, X, Trash2, Download, History, Briefcase, ChevronDown } from "lucide-react";
import CommonDialog from "../components/CommonDialog";
import api from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

// Define the type for employee data
interface Employee {
  id: number;
  code: string;
  active: boolean;
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
  organization?: { id: number; name: string } | null;
  /** ISO timestamps from server (manager team view) */
  todayCheckInTime?: string | null;
  todayCheckOutTime?: string | null;
}

interface Filters {
  department: string;
  position: string;
  workLocation: string;
  role: string;
  status: "All" | "Active" | "Inactive";
  joinDateRange: {
    start: string;
    end: string;
  };
}

type EmployeeStatusAction = "deactivate" | "reactivate";
type JobChangeType = "PROMOTION" | "ROLE_CHANGE" | "TRANSFER" | "JOB_UPDATE";

interface JobChangeFormState {
  changeType: JobChangeType;
  role: string;
  position: string;
  department: string;
  workLocation: string;
  managerId: string;
  clearManager: boolean;
  effectiveDate: string;
  reason: string;
}

interface EmployeeJobHistory {
  id: number;
  employeeId: number;
  employeeName: string;
  changedByName: string;
  changeType: string;
  oldRole: string | null;
  newRole: string | null;
  oldPosition: string | null;
  newPosition: string | null;
  oldDepartment: string | null;
  newDepartment: string | null;
  oldWorkLocation: string | null;
  newWorkLocation: string | null;
  oldManagerName: string | null;
  newManagerName: string | null;
  effectiveDate: string | null;
  reason: string | null;
  changedAt: string;
}

function formatPunchTime(iso: string | null | undefined) {
  if (!iso || typeof iso !== "string") return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function Employees() {
  const { user, hasPermission } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [deactivatingEmployeeId, setDeactivatingEmployeeId] = useState<number | null>(null);
  const [reactivatingEmployeeId, setReactivatingEmployeeId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    employee: Employee | null;
    action: EmployeeStatusAction | null;
  }>({
    isOpen: false,
    employee: null,
    action: null,
  });
  const [messageDialog, setMessageDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    message: "",
    tone: "success",
  });
  const [jobChangeDialog, setJobChangeDialog] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null,
  });
  const [jobHistoryDialog, setJobHistoryDialog] = useState<{
    isOpen: boolean;
    employee: Employee | null;
  }>({
    isOpen: false,
    employee: null,
  });
  const [jobChangeForm, setJobChangeForm] = useState<JobChangeFormState>({
    changeType: "JOB_UPDATE",
    role: "",
    position: "",
    department: "",
    workLocation: "",
    managerId: "",
    clearManager: false,
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [jobHistory, setJobHistory] = useState<EmployeeJobHistory[]>([]);
  const [isJobChangeSubmitting, setIsJobChangeSubmitting] = useState(false);
  const [isJobHistoryLoading, setIsJobHistoryLoading] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Filters>({
    department: "All",
    position: "All",
    workLocation: "All",
    role: "All",
    status: "All",
    joinDateRange: {
      start: "",
      end: "",
    },
  });

  const navigate = useNavigate();
  const currentUserRole = user?.role?.toLowerCase() || "";
  const isCurrentUserAdmin = isMainPlatformAdmin(user?.role);
  const isCurrentUserHr = currentUserRole === "hr";
  const isCurrentUserManager = currentUserRole === "manager";
  const canAddEmployee = hasPermission("manage", "employees");
  const canDeleteEmployees = isCurrentUserAdmin || isCurrentUserHr;

  const canManageEmployeeStatus = (employee: Employee) => {
    if (!canDeleteEmployees) return false;
    const targetRole = employee.role?.toLowerCase?.() || "";

    // HR cannot manage admin or org admin accounts.
    if (isCurrentUserHr && (targetRole === MAIN_PLATFORM_ADMIN_ROLE || targetRole === "org_admin"))
      return false;

    // Prevent self deactivation/reactivation actions from this screen.
    if (user?.id && employee.id === Number(user.id)) return false;

    return true;
  };

  const canManageJobChanges = (employee: Employee) => {
    if (!canAddEmployee) return false;
    const targetRole = employee.role?.toLowerCase?.() || "";

    if (isCurrentUserHr && (targetRole === MAIN_PLATFORM_ADMIN_ROLE || targetRole === "org_admin")) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get<Employee[]>("/auth/employees");
        setEmployees(response.data);
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
  const uniqueRoles = ["All", ...new Set(employees.map((e) => e.role))];

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      department: "All",
      position: "All",
      workLocation: "All",
      role: "All",
      status: "All",
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

    const matchesStatus =
      filters.status === "All" ||
      (filters.status === "Active" ? employee.active : !employee.active);

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
      matchesRole &&
      matchesStatus &&
      matchesDateRange()
    );
  });

  const readErrorMessage = async (response: Response) => {
    const errorMessage = "Unable to update employee status. Please try again.";
    const responseBody = await response.text();
    if (!responseBody) return errorMessage;

    try {
      const payload = JSON.parse(responseBody);
      if (typeof payload === "string") return payload;
      if (payload?.message) return payload.message;
      if (payload?.error) return payload.error;
      return errorMessage;
    } catch {
      return responseBody;
    }
  };

  const handleDeactivateEmployee = (employee: Employee) => {
    if (!canManageEmployeeStatus(employee)) return;
    setActiveActionMenuId(null);
    setConfirmDialog({
      isOpen: true,
      employee,
      action: "deactivate",
    });
  };

  const handleReactivateEmployee = (employee: Employee) => {
    if (!canManageEmployeeStatus(employee)) return;
    setActiveActionMenuId(null);

    setConfirmDialog({
      isOpen: true,
      employee,
      action: "reactivate",
    });
  };

  const handleConfirmEmployeeStatusChange = async () => {
    if (!confirmDialog.employee || !confirmDialog.action) return;

    const { employee, action } = confirmDialog;
    const isDeactivation = action === "deactivate";

    if (isDeactivation) {
      setDeactivatingEmployeeId(employee.id);
    } else {
      setReactivatingEmployeeId(employee.id);
    }

    try {
      const accessToken =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/auth/employees/${employee.id}/${isDeactivation ? "deactivate" : "reactivate"}`,
        {
          method: "PATCH",
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        }
      );

      if (!response.ok) {
        const errorMessage = await readErrorMessage(response);
        throw new Error(errorMessage);
      }

      setEmployees((prev) =>
        prev.map((item) =>
          item.id === employee.id ? { ...item, active: !isDeactivation } : item
        )
      );

      setMessageDialog({
        isOpen: true,
        title: isDeactivation ? "Employee Deactivated" : "Employee Reactivated",
        message: isDeactivation
          ? `${employee.firstName} ${employee.lastName} has been deactivated successfully.`
          : `${employee.firstName} ${employee.lastName} has been reactivated successfully.`,
        tone: "success",
      });
    } catch (error) {
      console.error(`Error ${action} employee:`, error);
      setMessageDialog({
        isOpen: true,
        title: "Action Failed",
        message:
          error instanceof Error
            ? error.message
            : `Unable to ${action} employee. Please try again.`,
        tone: "error",
      });
    } finally {
      if (isDeactivation) {
        setDeactivatingEmployeeId(null);
      } else {
        setReactivatingEmployeeId(null);
      }
      setConfirmDialog({
        isOpen: false,
        employee: null,
        action: null,
      });
    }
  };

  const toCsvValue = (value: unknown) => {
    const asString = String(value ?? "");
    return `"${asString.replace(/"/g, '""')}"`;
  };

  const exportFilteredEmployees = () => {
    if (!filteredEmployees.length) {
      setMessageDialog({
        isOpen: true,
        title: "No Data to Export",
        message: "Apply different filters or add employees before exporting.",
        tone: "error",
      });
      return;
    }

    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Department",
      "Role",
      "Designation",
      "Join Date",
      "Work Location",
      "Status",
    ];

    const rows = filteredEmployees.map((employee) => [
      employee.code || `EMP-${employee.id}`,
      employee.firstName,
      employee.lastName,
      employee.username,
      employee.phone,
      employee.department,
      employee.role,
      employee.position,
      new Date(employee.joinDate).toLocaleDateString(),
      employee.workLocation,
      employee.active ? "Active" : "Inactive",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => toCsvValue(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openJobChangeDialog = (employee: Employee) => {
    if (!canManageJobChanges(employee)) return;
    setActiveActionMenuId(null);
    setJobChangeForm({
      changeType: "JOB_UPDATE",
      role: employee.role ?? "",
      position: employee.position ?? "",
      department: employee.department ?? "",
      workLocation: employee.workLocation ?? "",
      managerId: "",
      clearManager: false,
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "",
    });
    setJobChangeDialog({
      isOpen: true,
      employee,
    });
  };

  const closeJobChangeDialog = () => {
    setJobChangeDialog({ isOpen: false, employee: null });
    setIsJobChangeSubmitting(false);
  };

  const handleSubmitJobChange = async () => {
    if (!jobChangeDialog.employee) return;
    setIsJobChangeSubmitting(true);
    try {
      const payload = {
        changeType: jobChangeForm.changeType,
        role: jobChangeForm.role.trim() || undefined,
        position: jobChangeForm.position.trim() || undefined,
        department: jobChangeForm.department.trim() || undefined,
        workLocation: jobChangeForm.workLocation.trim() || undefined,
        managerId:
          !jobChangeForm.clearManager && jobChangeForm.managerId.trim()
            ? Number(jobChangeForm.managerId.trim())
            : undefined,
        clearManager: jobChangeForm.clearManager,
        effectiveDate: jobChangeForm.effectiveDate || undefined,
        reason: jobChangeForm.reason.trim() || undefined,
      };

      await api.post(`/auth/employees/${jobChangeDialog.employee.id}/job-change`, payload);

      setEmployees((prev) =>
        prev.map((item) =>
          item.id === jobChangeDialog.employee?.id
            ? {
                ...item,
                role: jobChangeForm.role.trim() || item.role,
                position: jobChangeForm.position.trim() || item.position,
                department: jobChangeForm.department.trim() || item.department,
                workLocation: jobChangeForm.workLocation.trim() || item.workLocation,
              }
            : item
        )
      );

      setMessageDialog({
        isOpen: true,
        title: "Job Details Updated",
        message: `Job change for ${jobChangeDialog.employee.firstName} ${jobChangeDialog.employee.lastName} was saved successfully.`,
        tone: "success",
      });
      closeJobChangeDialog();
    } catch (error) {
      console.error("Error applying job change:", error);
      setMessageDialog({
        isOpen: true,
        title: "Job Change Failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to apply job change. Please verify fields and try again.",
        tone: "error",
      });
      setIsJobChangeSubmitting(false);
    }
  };

  const openJobHistoryDialog = async (employee: Employee) => {
    setActiveActionMenuId(null);
    setJobHistoryDialog({
      isOpen: true,
      employee,
    });
    setIsJobHistoryLoading(true);
    try {
      const response = await api.get<EmployeeJobHistory[]>(
        `/auth/employees/${employee.id}/job-history`
      );
      setJobHistory(response.data);
    } catch (error) {
      console.error("Error fetching employee job history:", error);
      setJobHistory([]);
      setMessageDialog({
        isOpen: true,
        title: "Unable to Load History",
        message: "Could not fetch job history for this employee.",
        tone: "error",
      });
    } finally {
      setIsJobHistoryLoading(false);
    }
  };

  const closeJobHistoryDialog = () => {
    setJobHistoryDialog({ isOpen: false, employee: null });
    setJobHistory([]);
    setIsJobHistoryLoading(false);
  };
  const managerOptions = employees.filter((e) => {
    if (jobChangeDialog.employee && e.id === jobChangeDialog.employee.id) return false;
    return e.role?.toLowerCase() === "manager";
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((employee) => employee.active).length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  const joinedThisMonth = employees.filter((employee) => {
    const joinDate = new Date(employee.joinDate);
    const today = new Date();
    return (
      joinDate.getMonth() === today.getMonth() &&
      joinDate.getFullYear() === today.getFullYear()
    );
  }).length;
  const hasAnyFiltersApplied =
    filters.department !== "All" ||
    filters.position !== "All" ||
    filters.workLocation !== "All" ||
    filters.role !== "All" ||
    filters.status !== "All" ||
    Boolean(filters.joinDateRange.start) ||
    Boolean(filters.joinDateRange.end) ||
    Boolean(searchTerm.trim());
  const isDialogActionLoading =
    (confirmDialog.action === "deactivate" &&
      deactivatingEmployeeId === confirmDialog.employee?.id) ||
    (confirmDialog.action === "reactivate" &&
      reactivatingEmployeeId === confirmDialog.employee?.id);

  if (isCurrentUserAdmin) {
    return (
      <div className="mx-auto max-w-3xl rounded-md border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-xl font-semibold">Employee data is restricted</h1>
        <p className="mt-2 text-sm">
          Main admin can only access organization-level information.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[100%] space-y-4 px-0">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
              {isCurrentUserManager ? "My Team" : "Employee Management"}
            </h1>
              <p className="mt-1 text-sm text-sky-50">
                {isCurrentUserManager
                  ? "Your direct reports, access status, and today’s punch in / punch out."
                  : "Manage employee records, access status, and directory visibility."}
              </p>
            </div>
            {canAddEmployee && (
            <button
              onClick={() => navigate("/employees/add")}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Employees</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalEmployees}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{activeEmployees}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{inactiveEmployees}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Joined This Month</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{joinedThisMonth}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-sky-500"
                placeholder="Search by name, email, role, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                onClick={exportFilteredEmployees}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>
              <button
                className={`inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium ${
                  showFilters
                    ? "border-sky-500 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </button>
              {hasAnyFiltersApplied && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {hasAnyFiltersApplied && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                Showing {filteredEmployees.length} of {employees.length}
              </span>
              {filters.department !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Department: {filters.department}
                </span>
              )}
              {filters.position !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Position: {filters.position}
                </span>
              )}
              {filters.workLocation !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Location: {filters.workLocation}
                </span>
              )}
              {filters.role !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Role: {filters.role}
                </span>
              )}
              {filters.status !== "All" && (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Status: {filters.status}
                </span>
              )}
            </div>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Department
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Position
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              >
                {uniquePositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Work Location
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                value={filters.workLocation}
                onChange={(e) => setFilters({ ...filters, workLocation: e.target.value })}
              >
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Role
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Employee Status
              </label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
                value={filters.status}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as "All" | "Active" | "Inactive",
                  })
                }
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Join Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
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
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
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

        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Employee ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Join Date
                </th>
                {isCurrentUserManager && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Punch in (today)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Punch out (today)
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Designation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{employee.role}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {employee.code || `EMP-${employee.id}`}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {employee.username}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {employee.phone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </td>
                    {isCurrentUserManager && (
                      <>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatPunchTime(employee.todayCheckInTime)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatPunchTime(employee.todayCheckOutTime)}
                        </td>
                      </>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {employee.position}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {employee.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                        <MapPin className="mr-1 h-3.5 w-3.5" />
                        {employee.workLocation}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          employee.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {employee.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setActiveActionMenuId((prev) =>
                              prev === employee.id ? null : employee.id
                            )
                          }
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Actions
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </button>

                        {activeActionMenuId === employee.id && (
                          <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={() => {
                                setActiveActionMenuId(null);
                                navigate(`/selfservice/${employee.id}`);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>
                            <button
                              onClick={() => openJobHistoryDialog(employee)}
                              className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              <History className="mr-2 h-4 w-4" />
                              History
                            </button>
                            {canManageJobChanges(employee) && (
                              <button
                                onClick={() => openJobChangeDialog(employee)}
                                className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Briefcase className="mr-2 h-4 w-4" />
                                Job Change
                              </button>
                            )}
                            {canManageEmployeeStatus(employee) &&
                              (employee.active === false ? (
                                <button
                                  onClick={() => handleReactivateEmployee(employee)}
                                  disabled={reactivatingEmployeeId === employee.id}
                                  className="block w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {reactivatingEmployeeId === employee.id
                                    ? "Reactivating..."
                                    : "Reactivate"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeactivateEmployee(employee)}
                                  disabled={deactivatingEmployeeId === employee.id}
                                  className="flex w-full items-center px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {deactivatingEmployeeId === employee.id
                                    ? "Deactivating..."
                                    : "Deactivate"}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isCurrentUserManager ? 12 : 10} className="px-4 py-10 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <Users className="h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {isCurrentUserManager
                          ? "No direct reports match your search (or none are assigned to you yet)."
                          : "No employees match your search criteria"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {isCurrentUserManager
                          ? "HR can assign employees to you as their reporting manager."
                          : "Try changing filters or reset them to view all employees."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {jobChangeDialog.isOpen && jobChangeDialog.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-3xl rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Apply Job Change</h3>
                <p className="text-xs text-slate-500">
                  {jobChangeDialog.employee.firstName} {jobChangeDialog.employee.lastName}
                </p>
              </div>
              <button
                onClick={closeJobChangeDialog}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                disabled={isJobChangeSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Change Type
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.changeType}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      changeType: e.target.value as JobChangeType,
                    }))
                  }
                >
                  <option value="JOB_UPDATE">Job Update</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="ROLE_CHANGE">Role Change</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Effective Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.effectiveDate}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      effectiveDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Role</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.role}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                >
                  {jobChangeForm.role &&
                    !uniqueRoles.includes(jobChangeForm.role) && (
                      <option value={jobChangeForm.role}>{jobChangeForm.role}</option>
                    )}
                  {uniqueRoles
                    .filter((role) => role && role !== "All")
                    .map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Position</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.position}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                >
                  {jobChangeForm.position &&
                    !uniquePositions.includes(jobChangeForm.position) && (
                      <option value={jobChangeForm.position}>{jobChangeForm.position}</option>
                    )}
                  {uniquePositions
                    .filter((position) => position && position !== "All")
                    .map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Department
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.department}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                >
                  {jobChangeForm.department &&
                    !uniqueDepartments.includes(jobChangeForm.department) && (
                      <option value={jobChangeForm.department}>{jobChangeForm.department}</option>
                    )}
                  {uniqueDepartments
                    .filter((department) => department && department !== "All")
                    .map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Work Location
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.workLocation}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      workLocation: e.target.value,
                    }))
                  }
                >
                  {jobChangeForm.workLocation &&
                    !uniqueLocations.includes(jobChangeForm.workLocation) && (
                      <option value={jobChangeForm.workLocation}>{jobChangeForm.workLocation}</option>
                    )}
                  {uniqueLocations
                    .filter((location) => location && location !== "All")
                    .map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Reporting Manager
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={jobChangeForm.clearManager}
                      onChange={(e) =>
                        setJobChangeForm((prev) => ({
                          ...prev,
                          clearManager: e.target.checked,
                          managerId: e.target.checked ? "" : prev.managerId,
                        }))
                      }
                    />
                    Clear manager assignment
                  </label>
                </div>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  value={jobChangeForm.managerId}
                  disabled={jobChangeForm.clearManager}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      managerId: e.target.value,
                    }))
                  }
                >
                  <option value="">Keep current manager</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} ({manager.code || `EMP-${manager.id}`})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                  Reason
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  placeholder="Optional reason for this change..."
                  value={jobChangeForm.reason}
                  onChange={(e) =>
                    setJobChangeForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                onClick={closeJobChangeDialog}
                disabled={isJobChangeSubmitting}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitJobChange}
                disabled={isJobChangeSubmitting}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJobChangeSubmitting ? "Saving..." : "Save Job Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {jobHistoryDialog.isOpen && jobHistoryDialog.employee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-4xl rounded-md border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Job History</h3>
                <p className="text-xs text-slate-500">
                  {jobHistoryDialog.employee.firstName} {jobHistoryDialog.employee.lastName}
                </p>
              </div>
              <button
                onClick={closeJobHistoryDialog}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto px-5 py-4">
              {isJobHistoryLoading ? (
                <p className="text-sm text-slate-500">Loading history...</p>
              ) : jobHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No job change history available yet.</p>
              ) : (
                <div className="space-y-3">
                  {jobHistory.map((entry) => (
                    <div key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          {entry.changeType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {entry.effectiveDate
                            ? `Effective ${new Date(entry.effectiveDate).toLocaleDateString()}`
                            : "Effective date not set"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Changed by {entry.changedByName} on{" "}
                        {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : "—"}
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
                        <p>
                          <span className="font-semibold">Role:</span>{" "}
                          {entry.oldRole || "—"} {"->"} {entry.newRole || "—"}
                        </p>
                        <p>
                          <span className="font-semibold">Position:</span>{" "}
                          {entry.oldPosition || "—"} {"->"} {entry.newPosition || "—"}
                        </p>
                        <p>
                          <span className="font-semibold">Department:</span>{" "}
                          {entry.oldDepartment || "—"} {"->"} {entry.newDepartment || "—"}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {entry.oldWorkLocation || "—"} {"->"} {entry.newWorkLocation || "—"}
                        </p>
                        <p>
                          <span className="font-semibold">Manager:</span>{" "}
                          {entry.oldManagerName || "—"} {"->"} {entry.newManagerName || "—"}
                        </p>
                      </div>
                      {entry.reason && (
                        <p className="mt-2 text-xs text-slate-700">
                          <span className="font-semibold">Reason:</span> {entry.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button
                onClick={closeJobHistoryDialog}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={confirmDialog.isOpen && Boolean(confirmDialog.employee) && Boolean(confirmDialog.action)}
        title={
          confirmDialog.action === "deactivate"
            ? "Confirm Deactivation"
            : "Confirm Reactivation"
        }
        message={
          confirmDialog.employee && confirmDialog.action
            ? confirmDialog.action === "deactivate"
              ? `Deactivate ${confirmDialog.employee.firstName} ${confirmDialog.employee.lastName}? Deactivated users cannot login or perform actions.`
              : `Reactivate ${confirmDialog.employee.firstName} ${confirmDialog.employee.lastName}? They will be able to login and perform actions again.`
            : ""
        }
        tone={confirmDialog.action === "deactivate" ? "error" : "success"}
        cancelText="Cancel"
        confirmText={
          isDialogActionLoading
            ? confirmDialog.action === "deactivate"
              ? "Deactivating..."
              : "Reactivating..."
            : confirmDialog.action === "deactivate"
            ? "Confirm Deactivate"
            : "Confirm Reactivate"
        }
        onClose={() =>
          setConfirmDialog({ isOpen: false, employee: null, action: null })
        }
        onConfirm={handleConfirmEmployeeStatusChange}
        isLoading={isDialogActionLoading}
      />

      <CommonDialog
        isOpen={messageDialog.isOpen}
        title={messageDialog.title}
        message={messageDialog.message}
        tone={messageDialog.tone}
        confirmText="OK"
        hideCancel
        onClose={() =>
          setMessageDialog({
            isOpen: false,
            title: "",
            message: "",
            tone: "success",
          })
        }
      />
    </div>
  );
}
