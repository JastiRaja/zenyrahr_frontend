import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Eye, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import CommonDialog from "../components/CommonDialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import api from "../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface Timesheet {
  id: number;
  employeeId?: number;
  date: string;
  hoursWorked: number;
  taskDescription: string;
  comments: string;
  project: {
    id: number;
    projectName: string;
  };
  status: string;
  approvedBy: string | null;
  approvalComments: string | null;
  rejectionReason: string | null;
}

interface EmployeeRecord {
  id: number;
  firstName: string;
  lastName: string;
  reportingManager?: {
    id: number;
    name?: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface AssignedProject {
  id: number;
  projectName: string;
  description?: string;
  startDate?: string;
  deadline?: string;
  status?: string;
}

const calculateTotalHours = (timesheet: Timesheet): number => {
  return timesheet.hoursWorked || 0;
};

export default function Timesheet() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const currentUserRole = String(user?.role || "").toLowerCase();
  const canViewAllTimesheets = ["hr", "org_admin"].includes(currentUserRole);
  const canViewTeamTimesheets = currentUserRole === "manager";
  const canSubmitTimesheet = hasPermission("submit", "timesheet");
  const canWithdrawOwnEntries = !canViewAllTimesheets && !canViewTeamTimesheets;

  interface TimesheetEntry {
    id: number;
    employeeId?: number;
    employeeName?: string | null;
    date: string;
    hoursWorked: number;
    taskDescription: string;
    comments: string;
    project: { id: number; projectName: string };
    status: string;
    approvedBy?: string | null;
    approvalComments?: string | null;
    rejectionReason?: string | null;
  }

  const [allEntries, setAllEntries] = useState<TimesheetEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimesheetEntry | null>(
    null
  );
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
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
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [reportingManager, setReportingManager] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [viewScopeLabel, setViewScopeLabel] = useState("My Timesheet");
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);

  // Fetch Employee Name & Reporting Manager
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserData = async () => {
      try {
        const response = await api.get(`/auth/employees/${user.id}`);

        if (response.data.firstName && response.data.lastName) {
          setEmployeeName(
            `${response.data.firstName} ${response.data.lastName}`
          );
        }

        if (response.data.reportingManager) {
          setReportingManager(response.data.reportingManager.name);
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setError("Failed to fetch employee data.");
      }
    };

    fetchUserData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || canViewAllTimesheets || canViewTeamTimesheets) {
      setAssignedProjects([]);
      return;
    }

    const fetchAssignedProjects = async () => {
      try {
        const response = await api.get(`/auth/employees/${user.id}/projects`);
        const rows = Array.isArray(response.data) ? response.data : [];
        const activeRows = rows.filter(
          (project) => String(project?.status || "ACTIVE").toUpperCase() === "ACTIVE"
        );
        setAssignedProjects(activeRows);
      } catch (err) {
        console.error("Error fetching assigned projects:", err);
        setAssignedProjects([]);
      }
    };

    void fetchAssignedProjects();
  }, [user?.id, canViewAllTimesheets, canViewTeamTimesheets]);

  // Fetch All Timesheet Entries
  useEffect(() => {
    if (!user?.id) return;

    const fetchTimesheets = async () => {
      try {
        setLoading(true);
        const [employeeResponse, timesheetResponse] = await Promise.all([
          api.get(`/auth/employees`),
          canViewAllTimesheets || canViewTeamTimesheets
            ? api.get(`/api/timesheet`)
            : api.get(`/api/timesheet/employee/${user.id}`),
        ]);

        const employeesData: EmployeeRecord[] = Array.isArray(employeeResponse.data)
          ? employeeResponse.data
          : [];
        const allTimesheetData: Timesheet[] = Array.isArray(timesheetResponse.data)
          ? timesheetResponse.data
          : [];
        const currentUserId = Number(user.id);
        const managedEmployeeIds = new Set(
          employeesData
            .filter((employee) => employee.reportingManager?.id === currentUserId)
            .map((employee) => employee.id)
        );

        const timesheetData = canViewAllTimesheets
          ? allTimesheetData
          : canViewTeamTimesheets
            ? allTimesheetData.filter((timesheet) => managedEmployeeIds.has(Number(timesheet.employeeId)))
            : allTimesheetData;
        
        const processedTimesheets = timesheetData.map((timesheet: Timesheet) => ({
          ...timesheet,
          employeeName:
            employeesData.find((employee) => employee.id === Number(timesheet.employeeId))
              ? `${
                  employeesData.find((employee) => employee.id === Number(timesheet.employeeId))!.firstName
                } ${
                  employeesData.find((employee) => employee.id === Number(timesheet.employeeId))!.lastName
                }`
              : null,
          totalHours: calculateTotalHours(timesheet),
        }));

        setAllEntries(processedTimesheets);
        setViewScopeLabel(
          canViewAllTimesheets
            ? "Organization Timesheets"
            : canViewTeamTimesheets
              ? "Team Timesheets"
              : "My Timesheet"
        );

        // Set initial date range to the latest week only if there are timesheets
        if (processedTimesheets.length > 0) {
          const latestDate: dayjs.Dayjs = processedTimesheets.reduce(
            (latest: dayjs.Dayjs, entry: TimesheetEntry) => {
              const entryDate: dayjs.Dayjs = dayjs(entry.date);
              return entryDate.isAfter(latest) ? entryDate : latest;
            },
            dayjs(processedTimesheets[0].date)
          );

          const startOfWeek = latestDate.startOf("isoWeek").toDate();
          const endOfWeek = latestDate.startOf("isoWeek").add(4, "day").toDate();
          setStartDate(startOfWeek);
          setEndDate(endOfWeek);
        } else {
          // If no timesheets, set to current week
          const today = dayjs();
          setStartDate(today.startOf("isoWeek").toDate());
          setEndDate(today.startOf("isoWeek").add(4, "day").toDate());
        }
      } catch (err) {
        console.error("Error fetching timesheets:", err);
        setError("Failed to fetch timesheets.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
    const interval = setInterval(fetchTimesheets, 30000);
    return () => clearInterval(interval);
  }, [user?.id, canViewAllTimesheets, canViewTeamTimesheets]);

  // Filter Entries Based on Selected Date Range
  useEffect(() => {
    if (!startDate || !endDate) return;

    const filtered = allEntries.filter((entry) => {
      const entryDate = dayjs(entry.date);
      return entryDate.isBetween(startDate, endDate, "day", "[]");
    });

    // Sort entries by date in descending order (most recent first)
    const sortedEntries = filtered.sort((a, b) =>
      dayjs(b.date).diff(dayjs(a.date))
    );

    setFilteredEntries(sortedEntries);
  }, [startDate, endDate, allEntries]);

  // Generate a list of all days in the selected week
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
  // Sort days in descending order
  daysInWeek = daysInWeek.sort((a, b) => dayjs(b).diff(dayjs(a)));

  // Withdraw Timesheet Entry
  const handleWithdraw = async (id: number) => {
    try {
      await api.put(`/api/timesheet/withdraw/${id}`, {
        status: "WITHDRAWN",
      });
      setAllEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, status: "WITHDRAWN", approvedBy: employeeName }
            : entry
        )
      );
      setMessageDialog({
        isOpen: true,
        title: "Timesheet Withdrawn",
        message: "The timesheet entry has been withdrawn successfully.",
        tone: "success",
      });
      setSelectedEntry(null);
      setWithdrawDialogOpen(false);
    } catch (error) {
      console.error("Error withdrawing timesheet:", error);
      setMessageDialog({
        isOpen: true,
        title: "Withdrawal Failed",
        message: "Failed to withdraw timesheet.",
        tone: "error",
      });
      setWithdrawDialogOpen(false);
    }
  };

  // Prepare data for charts, excluding withdrawn entries
  const nonWithdrawnEntries = filteredEntries.filter(
    (entry) => entry.status !== "WITHDRAWN"
  );

  const weeklyHours = daysInWeek.map((day) => {
    const dayEntries = nonWithdrawnEntries.filter((entry) =>
      dayjs(entry.date).isSame(day, "day")
    );
    return dayEntries.reduce((total, entry) => total + entry.hoursWorked, 0);
  });

  const projectHours = nonWithdrawnEntries.reduce((acc: any, entry) => {
    if (!acc[entry.project.projectName]) {
      acc[entry.project.projectName] = 0;
    }
    acc[entry.project.projectName] += entry.hoursWorked;
    return acc;
  }, {});

  const barData = {
    labels: daysInWeek.map((day) => dayjs(day).format("MMM D")),
    datasets: [
      {
        label: "Hours Worked",
        data: weeklyHours,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(projectHours),
    datasets: [
      {
        label: "Hours Worked",
        data: Object.values(projectHours),
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 99, 132, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const totalHoursLogged = nonWithdrawnEntries.reduce(
    (total, entry) => total + entry.hoursWorked,
    0
  );
  const approvedEntries = filteredEntries.filter(
    (entry) => entry.status === "APPROVED"
  ).length;
  const pendingEntries = filteredEntries.filter(
    (entry) => entry.status === "PENDING"
  ).length;
  const withdrawnEntries = filteredEntries.filter(
    (entry) => entry.status === "WITHDRAWN"
  ).length;
  const getStatusClass = (status: string) => {
    if (status === "APPROVED") return "text-emerald-700 bg-emerald-50";
    if (status === "PENDING") return "text-amber-700 bg-amber-50";
    if (status === "WITHDRAWN") return "text-slate-700 bg-slate-100";
    return "text-rose-700 bg-rose-50";
  };
  const summaryLabel = useMemo(() => {
    if (canViewAllTimesheets) return "Scope";
    if (canViewTeamTimesheets) return "Manager";
    return "Employee";
  }, [canViewAllTimesheets, canViewTeamTimesheets]);
  const summaryValue = useMemo(() => {
    if (canViewAllTimesheets) return "All employees";
    if (canViewTeamTimesheets) return employeeName || "Manager";
    return employeeName || "Loading...";
  }, [canViewAllTimesheets, canViewTeamTimesheets, employeeName]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {viewScopeLabel}
              </h1>
              <p className="mt-1 text-sm text-sky-50">
                {canViewAllTimesheets
                  ? "Review timesheets across the organization."
                  : canViewTeamTimesheets
                    ? "Review timesheets for employees assigned to you."
                    : "Track and manage your work hours."}
              </p>
            </div>
            {canSubmitTimesheet && (
              <button
                onClick={() => navigate("/timesheet/submit")}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Time Entry
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">{summaryLabel}</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {summaryValue}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Manager</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {reportingManager || "Not assigned"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Hours</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {totalHoursLogged} hrs
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Range Entries</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {filteredEntries.length}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
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
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholderText="Start Date"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold uppercase text-slate-500">
              To
            </label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              dateFormat="MMMM d, yyyy"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholderText="End Date"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:ml-auto">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-xs uppercase text-slate-500">Approved</p>
              <p className="text-sm font-bold text-emerald-700">{approvedEntries}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-xs uppercase text-slate-500">Pending</p>
              <p className="text-sm font-bold text-amber-700">{pendingEntries}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center">
              <p className="text-xs uppercase text-slate-500">Withdrawn</p>
              <p className="text-sm font-bold text-slate-700">{withdrawnEntries}</p>
            </div>
          </div>
        </div>
      </section>

      {!canViewAllTimesheets && !canViewTeamTimesheets && (
        <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assigned Projects</h2>
              <p className="text-sm text-slate-500">
                Review your project details before logging work.
              </p>
              <Link
                to="/timesheet/projects"
                className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:text-sky-900"
              >
                Open full project list (active & completed)
              </Link>
            </div>
            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
              {assignedProjects.length} active
            </span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {assignedProjects.length > 0 ? (
              assignedProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    navigate("/timesheet/submit", {
                      state: {
                        preselectedProject: {
                          id: project.id,
                          projectName: project.projectName,
                        },
                      },
                    })
                  }
                  className="rounded-md border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{project.projectName}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {String(project.status || "ACTIVE").toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                    {project.description?.trim() || "No project description added yet."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Start: {project.startDate || "-"}</span>
                    <span>Deadline: {project.deadline || "-"}</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-sky-700">
                    Click to add a time entry for this project
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 lg:col-span-2">
                No active projects are assigned yet. Contact HR or your manager to assign a project before submitting time.
              </div>
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div className="rounded-md border border-slate-300 bg-white py-10 text-center text-slate-500">
          Loading timesheet entries...
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {daysInWeek.map((day) => {
            const dayEntries = filteredEntries.filter((entry) =>
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
                    <div key={entry.id} onClick={() => setSelectedEntry(entry)}>
                      {entry.employeeName && (
                        <p className="mt-2 text-xs font-semibold uppercase text-slate-500">
                          {entry.employeeName}
                        </p>
                      )}
                      <p className="mt-2 truncate text-sm font-semibold text-slate-900">
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
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm md:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Hours Worked per Week
          </h2>
          <div className="w-full h-64">
            <Bar
              data={barData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm md:col-span-1">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Hours Worked per Project
          </h2>
          <div className="w-full h-52 flex justify-center">
            <Pie
              data={pieData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-50">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <button
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              onClick={() => setSelectedEntry(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-3">
              {selectedEntry.project.projectName}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {dayjs(selectedEntry.date).format("dddd, MMMM D, YYYY")}
            </p>
            <p className="text-sm text-slate-700">
              {selectedEntry.hoursWorked} hours worked
            </p>
            {selectedEntry.employeeName && (
              <p className="text-sm text-slate-600">Employee: {selectedEntry.employeeName}</p>
            )}

            <div className="mt-3 w-full break-words rounded-md border border-slate-200 bg-slate-50 p-4">
              <strong className="text-slate-900">Task Description:</strong>
              <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                {selectedEntry.taskDescription}
              </p>
            </div>

            <div className="mt-3 w-full break-words rounded-md border border-slate-200 bg-slate-50 p-4">
              <strong className="text-slate-900">Comments:</strong>
              <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                {selectedEntry.comments || "No comments provided."}
              </p>
            </div>

            {selectedEntry.approvalComments && (
              <div className="mt-3 w-full break-words rounded-md border border-slate-200 bg-slate-50 p-4">
                <strong className="text-slate-900">Approval Comments:</strong>
                <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                  {selectedEntry.approvalComments}
                </p>
              </div>
            )}

            {selectedEntry.rejectionReason && (
              <div className="mt-3 w-full break-words rounded-md border border-slate-200 bg-slate-50 p-4">
                <strong className="text-slate-900">Rejection Reason:</strong>
                <p className="text-slate-600 mt-1 whitespace-pre-wrap">
                  {selectedEntry.rejectionReason}
                </p>
              </div>
            )}

            {selectedEntry.status !== "PENDING" && (
              <p className="mt-3 text-sm text-slate-500">
                <strong>{selectedEntry.status} by:</strong>{" "}
                {selectedEntry.approvedBy || "Unknown"}
              </p>
            )}

            {selectedEntry.status === "PENDING" && canWithdrawOwnEntries && (
              <button
                className="mt-4 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                onClick={() => setWithdrawDialogOpen(true)}
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={withdrawDialogOpen && Boolean(selectedEntry)}
        title="Confirm Withdrawal"
        message="Are you sure you want to withdraw this timesheet entry?"
        tone="error"
        confirmText="Confirm Withdraw"
        cancelText="Cancel"
        onConfirm={() => {
          if (selectedEntry) handleWithdraw(selectedEntry.id);
        }}
        onClose={() => setWithdrawDialogOpen(false)}
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
