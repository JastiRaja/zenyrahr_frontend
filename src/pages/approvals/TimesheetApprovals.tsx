import { useState, useEffect } from "react";
import api from "../../api/axios";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Check, X, Eye, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../contexts/AuthContext";
import CommonDialog from "../../components/CommonDialog";

dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  reportingManager?: {
    id: number;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface Project {
  id: number;
  projectName: string;
}

interface Timesheet {
  id: number;
  employeeId: number;
  employee?: Employee | null;
  project: Project;
  date: string;
  hoursWorked: number;
  description: string;
  requiredComments: string;
  status: string;
  createdAt?: string;
  currentApprovalLevel?: number;
  maxApprovalLevel?: number;
  canCurrentUserApprove?: boolean;
}

export default function TimesheetApprovals() {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(
    null
  );
  const [confirmationMessage, setConfirmationMessage] = useState<{
    text: string;
    type: "approve" | "reject";
  } | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [decisionDialog, setDecisionDialog] = useState<{
    isOpen: boolean;
    action: "approve" | "reject" | null;
    timesheet: Timesheet | null;
  }>({
    isOpen: false,
    action: null,
    timesheet: null,
  });
  const [decisionComment, setDecisionComment] = useState("");

  useEffect(() => {
    const role = String(user?.role || "").toLowerCase();
    const canApproveTimesheets = ["manager", "hr", "org_admin"].includes(role);

    if (!user?.id || !canApproveTimesheets) {
      setError(
        "Unauthorized access. Only managers, HR, or organization admins can view this page."
      );
      return;
    }

    const fetchApprovalData = async () => {
      setLoading(true);
      try {
        const [employeeResponse, timesheetResponse] = await Promise.all([
          api.get(`/auth/employees`),
          api.get(`/api/timesheet`),
        ]);

        const employeesData: Employee[] = Array.isArray(employeeResponse.data)
          ? employeeResponse.data
          : [];
        const timesheetsData: Timesheet[] = Array.isArray(timesheetResponse.data)
          ? timesheetResponse.data
          : [];

        const currentUserId = Number(user.id);
        const canViewAllTimesheets = ["hr", "org_admin"].includes(role);
        const visibleEmployeeIds = canViewAllTimesheets
          ? null
          : new Set(
              employeesData
                .filter((employee) => employee.reportingManager?.id === currentUserId)
                .map((employee) => employee.id)
            );

        const scopedTimesheets = canViewAllTimesheets
          ? timesheetsData
          : timesheetsData.filter((timesheet) =>
              visibleEmployeeIds?.has(timesheet.employeeId)
            );
        const scopedEmployees = canViewAllTimesheets
          ? employeesData
          : employeesData.filter((employee) => visibleEmployeeIds?.has(employee.id));

        setEmployees(scopedEmployees);

        const timesheetsWithEmployees = await Promise.all(
          scopedTimesheets.map(async (ts) => {
            if (!ts.employeeId) return ts;

            try {
              const employee = employeesData.find((entry) => entry.id === ts.employeeId);
              if (employee) {
                return { ...ts, employee };
              }
              const empResponse = await api.get(`/auth/employees/${ts.employeeId}`);
              return { ...ts, employee: empResponse.data };
            } catch (employeeError) {
              console.error(`Error fetching employee for ID ${ts.employeeId}:`, employeeError);
              return { ...ts, employee: null };
            }
          })
        );

        setTimesheets(timesheetsWithEmployees);

        if (timesheetsWithEmployees.length > 0) {
          const latestDate: dayjs.Dayjs = timesheetsWithEmployees.reduce(
            (latest: dayjs.Dayjs, entry: Timesheet) => {
              const entryDate: dayjs.Dayjs = dayjs(entry.date);
              return entryDate.isAfter(latest) ? entryDate : latest;
            },
            dayjs(timesheetsWithEmployees[0].date)
          );

          const startOfWeek = latestDate.startOf("isoWeek").toDate();
          const endOfWeek = latestDate.startOf("isoWeek").add(4, "day").toDate();
          setStartDate(startOfWeek);
          setEndDate(endOfWeek);
        } else {
          const today = dayjs();
          setStartDate(today.startOf("isoWeek").toDate());
          setEndDate(today.startOf("isoWeek").add(4, "day").toDate());
        }

        setError(null);
      } catch (err) {
        setError("Failed to fetch timesheets.");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalData();
  }, [user]);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  const handleApprove = async (id: number, approvalComment: string) => {
    if (!user?.id) {
      setError("User is not authenticated.");
      return;
    }

    try {
      const apiUrl = `/api/timesheet/approve/${id}?employeeId=${
        user.id
      }&approved=true&requiredComments=${encodeURIComponent(approvalComment)}`;

      const response = await api.put<Timesheet>(apiUrl);
      const updated = response.data;

      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === id
            ? {
                ...ts,
                ...updated,
                employee: ts.employee,
              }
            : ts
        )
      );
      setSelectedTimesheet((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              ...updated,
              employee: prev.employee,
            }
          : prev
      );

      setConfirmationMessage({
        text:
          String(updated?.status || "").toUpperCase() === "APPROVED"
            ? "Timesheet Approved ✅"
            : `Level ${updated?.currentApprovalLevel || 2} pending for next approver ✅`,
        type: "approve",
      });
    } catch (error) {
      console.error("❌ Error approving timesheet:", error);
      setError("Failed to approve timesheet.");
    }
  };

  const handleReject = async (id: number, rejectionComment: string) => {
    if (!user?.id) {
      setError("User is not authenticated.");
      return;
    }

    try {
      const apiUrl = `/api/timesheet/reject/${id}?employeeId=${
        user.id
      }&requiredComments=${encodeURIComponent(rejectionComment)}`;

      const response = await api.put<Timesheet>(apiUrl);
      const updated = response.data;

      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === id
            ? {
                ...ts,
                ...updated,
                employee: ts.employee,
              }
            : ts
        )
      );
      setSelectedTimesheet((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              ...updated,
              employee: prev.employee,
            }
          : prev
      );

      setConfirmationMessage({ text: "Timesheet Rejected ❌", type: "reject" });
    } catch (error) {
      console.error("❌ Error rejecting timesheet:", error);
      setError("Failed to reject timesheet.");
    }
  };

  const openDecisionDialog = (action: "approve" | "reject", timesheet: Timesheet) => {
    setDecisionComment("");
    setDecisionDialog({
      isOpen: true,
      action,
      timesheet,
    });
  };

  const closeDecisionDialog = () => {
    setDecisionDialog({
      isOpen: false,
      action: null,
      timesheet: null,
    });
    setDecisionComment("");
  };

  const handleDecisionConfirm = async () => {
    if (!decisionDialog.action || !decisionDialog.timesheet) return;
    if (!decisionComment.trim()) {
      setError(
        decisionDialog.action === "approve"
          ? "Approval comments are required."
          : "Rejection reason is required."
      );
      return;
    }

    if (decisionDialog.action === "approve") {
      await handleApprove(decisionDialog.timesheet.id, decisionComment.trim());
    } else {
      await handleReject(decisionDialog.timesheet.id, decisionComment.trim());
    }

    closeDecisionDialog();
  };

  const getDaysInRange = (start: Date, end: Date) => {
    const days = [];
    let current = dayjs(start);
    const endDay = dayjs(end);

    while (current.isSameOrBefore(endDay, "day")) {
      days.push(current.toDate());
      current = current.add(1, "day");
    }

    return days;
  };

  let daysInWeek =
    startDate && endDate ? getDaysInRange(startDate, endDate) : [];
  daysInWeek = daysInWeek.sort((a, b) => dayjs(b).diff(dayjs(a)));

  const filteredTimesheets = timesheets
    .filter((timesheet) => {
      const matchesEmployee = selectedEmployee
        ? timesheet.employeeId === selectedEmployee.id
        : true;
      const matchesFilterStatus =
        filterStatus === "all" ||
        timesheet.status.toLowerCase() === filterStatus.toLowerCase();
      const matchesSearchTerm = timesheet.employee
        ? `${timesheet.employee.firstName} ${timesheet.employee.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true;

      return matchesEmployee && matchesFilterStatus && matchesSearchTerm;
    })
    .sort((a, b) => {
      return dayjs(b.date).diff(dayjs(a.date));
    });

  const calculateTotalHoursPerWeek = (
    timesheets: Timesheet[],
    startDate: Date,
    endDate: Date,
    employeeId: number
  ) => {
    const totalHours = timesheets.reduce((total, timesheet) => {
      const timesheetDate = dayjs(timesheet.date);
      if (
        timesheetDate.isBetween(startDate, endDate, "day", "[]") &&
        timesheet.status !== "WITHDRAWN" &&
        timesheet.status !== "REJECTED" &&
        timesheet.employeeId === employeeId
      ) {
        return total + timesheet.hoursWorked;
      }
      return total;
    }, 0);
    return totalHours;
  };

  const totalHoursPerWeek =
    selectedEmployee && startDate && endDate
      ? calculateTotalHoursPerWeek(
          timesheets,
          startDate,
          endDate,
          selectedEmployee.id
        )
      : 0;
  const approvedCount = filteredTimesheets.filter(
    (entry) => entry.status === "APPROVED"
  ).length;
  const pendingCount = filteredTimesheets.filter(
    (entry) => entry.status === "PENDING"
  ).length;
  const rejectedCount = filteredTimesheets.filter(
    (entry) => entry.status === "REJECTED"
  ).length;
  const getStatusClass = (status: string) => {
    if (status === "APPROVED") return "text-emerald-700 bg-emerald-50";
    if (status === "PENDING") return "text-amber-700 bg-amber-50";
    if (status === "WITHDRAWN") return "text-slate-700 bg-slate-100";
    return "text-rose-700 bg-rose-50";
  };

  const filteredEmployees = employees.filter((employee) =>
    `${employee.firstName} ${employee.lastName}`
      .toLowerCase()
      .includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">
            Timesheet Approvals
          </h1>
          <p className="mt-1 text-sm text-sky-50">
            Review and approve or reject team timesheets.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Hours</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{totalHoursPerWeek} hrs</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{pendingCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Approved</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{approvedCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Rejected</p>
            <p className="mt-1 text-xl font-bold text-rose-700">{rejectedCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-slate-500">
              From
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="MMMM d, yyyy"
              className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholderText="Start Date"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-slate-500">To</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              dateFormat="MMMM d, yyyy"
              className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholderText="End Date"
            />
          </div>
          <div className="flex flex-col relative">
            <label className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Select Employee
            </label>
            <div className="relative">
              <div
                className="block w-full cursor-pointer rounded-md border border-slate-300 bg-white py-2 pl-3 pr-10 text-sm leading-5 text-slate-700"
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                {selectedEmployee
                  ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                  : "All"}
              </div>
              {showEmployeeDropdown && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  <input
                    type="text"
                    className="mx-2 mb-1 block w-[calc(100%-1rem)] rounded-md border border-slate-300 py-2 pl-3 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                    placeholder="Search employee..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  />
                  <ul className="py-1">
                    <li
                      className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 hover:bg-sky-700 hover:text-white"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setShowEmployeeDropdown(false);
                      }}
                    >
                      All
                    </li>
                    {filteredEmployees.map((employee) => (
                      <li
                        key={employee.id}
                        className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 hover:bg-sky-700 hover:text-white"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        {employee.firstName} {employee.lastName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full rounded-md border border-slate-300 py-2 pl-3 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      {confirmationMessage && (
        <div
          className={`fixed right-5 top-5 rounded-md p-4 text-white shadow-lg transition-all ${
            confirmationMessage.type === "approve"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {confirmationMessage.text}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {daysInWeek.map((day) => {
          const dayEntries = filteredTimesheets.filter((entry) =>
            dayjs(entry.date).isSame(day, "day")
          );
          return (
            <div
              key={day.toString()}
              className="relative cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-4 transition hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {dayjs(day).format("ddd, MMM D YYYY")}
                </h3>
                <Eye className="h-4 w-4 text-slate-500" />
              </div>
              {dayEntries.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No timesheet entries available.
                </p>
              ) : (
                dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedTimesheet(entry)}
                  >
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {entry.employee
                        ? `${entry.employee.firstName} ${entry.employee.lastName}`
                        : "Unknown Employee"}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                      {entry.project.projectName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.hoursWorked} hours
                    </p>
                    <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(entry.status)}`}>
                      {entry.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
        {filteredTimesheets.length === 0 && (
          <div className="col-span-full text-center text-slate-500">
            No employee found.
          </div>
        )}
      </div>
      </section>

      {selectedTimesheet && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-lg">
            <button
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              onClick={() => setSelectedTimesheet(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900">
              {selectedTimesheet.project.projectName}
            </h3>
            <p className="text-sm text-slate-600">
              👤{" "}
              {selectedTimesheet.employee
                ? `${selectedTimesheet.employee.firstName} ${selectedTimesheet.employee.lastName}`
                : "Unknown Employee"}
            </p>
            <p className="text-sm text-slate-500">
              📅 {dayjs(selectedTimesheet.date).format("DD MMM YYYY")}
            </p>
            <p className="text-sm text-slate-700">
              ⏳ Total Hours: {selectedTimesheet.hoursWorked} hrs
            </p>
            {String(selectedTimesheet.status || "").toUpperCase() === "PENDING" &&
              selectedTimesheet.currentApprovalLevel &&
              selectedTimesheet.maxApprovalLevel && (
                <p className="mt-1 text-xs font-semibold text-sky-700">
                  Approval Stage: Level {selectedTimesheet.currentApprovalLevel} of{" "}
                  {selectedTimesheet.maxApprovalLevel}
                </p>
              )}
            <p className="mt-3 text-sm font-semibold text-slate-900">Task Description:</p>
            <p className="text-slate-600">{selectedTimesheet.description}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Comments:</p>
            <p className="text-slate-600">
              {selectedTimesheet.requiredComments || "No comments provided."}
            </p>

            {selectedTimesheet.status === "PENDING" &&
              selectedTimesheet.canCurrentUserApprove !== false && (
              <div className="mt-4 flex space-x-3">
                <button
                  className="rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-700"
                  onClick={() => openDecisionDialog("approve", selectedTimesheet)}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  className="rounded-md bg-rose-600 p-2 text-white hover:bg-rose-700"
                  onClick={() => openDecisionDialog("reject", selectedTimesheet)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {selectedTimesheet.status === "PENDING" &&
              selectedTimesheet.canCurrentUserApprove === false && (
                <p className="mt-3 text-xs font-medium text-amber-700">
                  Waiting for another approver at the current level.
                </p>
              )}
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={decisionDialog.isOpen}
        title={
          decisionDialog.action === "approve"
            ? "Approve Timesheet"
            : "Reject Timesheet"
        }
        message={
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              {decisionDialog.action === "approve"
                ? "Add approval comments before approving this entry."
                : "Provide a rejection reason before rejecting this entry."}
            </p>
            <textarea
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder={
                decisionDialog.action === "approve"
                  ? "Enter approval comments..."
                  : "Enter rejection reason..."
              }
            />
          </div>
        }
        tone={decisionDialog.action === "approve" ? "success" : "error"}
        confirmText={
          decisionDialog.action === "approve"
            ? "Confirm Approve"
            : "Confirm Reject"
        }
        cancelText="Cancel"
        onConfirm={handleDecisionConfirm}
        onClose={closeDecisionDialog}
      />
    </div>
  );
}
