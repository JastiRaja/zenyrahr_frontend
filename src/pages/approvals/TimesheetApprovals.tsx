import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Check, X, Eye, Search } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

dayjs.extend(isoWeek);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
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

  useEffect(() => {
    if (!user?.id || (user.role !== "manager" && user.role !== "admin")) {
      setError(
        "Unauthorized access. Only managers or admins can view this page."
      );
      return;
    }

    const fetchTimesheets = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/timesheet/employee/${user.id}`
        );
        const timesheetsData: Timesheet[] = response.data;

        const timesheetsWithEmployees = await Promise.all(
          timesheetsData.map(async (ts) => {
            if (!ts.employeeId) return ts;

            try {
              const empResponse = await axios.get(
                `${API_BASE_URL}/auth/employees/${ts.employeeId}`
              );
              return { ...ts, employee: empResponse.data };
            } catch (err) {
              console.error(
                `Error fetching employee for ID ${ts.employeeId}:`,
                err
              );
              return { ...ts, employee: null };
            }
          })
        );

        setTimesheets(timesheetsWithEmployees);

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
      } catch (err) {
        setError("Failed to fetch timesheets.");
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/employees`);
        setEmployees(response.data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };

    fetchTimesheets();
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  const handleApprove = async (id: number) => {
    if (!user?.id) {
      setError("User is not authenticated.");
      return;
    }

    const approvalComment = prompt("Enter approval comments:");
    if (!approvalComment) return;

    try {
      const apiUrl = `${API_BASE_URL}/timesheet/approve/${id}?employeeId=${
        user.id
      }&approved=true&requiredComments=${encodeURIComponent(approvalComment)}`;

      await axios.put(apiUrl);

      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === id
            ? { ...ts, status: "APPROVED", requiredComments: approvalComment }
            : ts
        )
      );

      setConfirmationMessage({
        text: "Timesheet Approved ✅",
        type: "approve",
      });
    } catch (error) {
      console.error("❌ Error approving timesheet:", error);
      setError("Failed to approve timesheet.");
    }
  };

  const handleReject = async (id: number) => {
    if (!user?.id) {
      setError("User is not authenticated.");
      return;
    }

    const rejectionComment = prompt("Enter reason for rejection:");
    if (!rejectionComment) return;

    try {
      const apiUrl = `${API_BASE_URL}/timesheet/reject/${id}?employeeId=${
        user.id
      }&requiredComments=${encodeURIComponent(rejectionComment)}`;

      await axios.put(apiUrl);

      setTimesheets((prev) =>
        prev.map((ts) =>
          ts.id === id
            ? { ...ts, status: "REJECTED", requiredComments: rejectionComment }
            : ts
        )
      );

      setConfirmationMessage({ text: "Timesheet Rejected ❌", type: "reject" });
    } catch (error) {
      console.error("❌ Error rejecting timesheet:", error);
      setError("Failed to reject timesheet.");
    }
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

  const filteredEmployees = employees.filter((employee) =>
    `${employee.firstName} ${employee.lastName}`
      .toLowerCase()
      .includes(employeeSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Timesheet Approvals
        </h1>
        <p className="mt-2 text-gray-600">
          Review and approve/reject team timesheets
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              From
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="MMMM d, yyyy"
              className="w-full border rounded-md p-2"
              placeholderText="Start Date"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">To</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              dateFormat="MMMM d, yyyy"
              className="w-full border rounded-md p-2"
              placeholderText="End Date"
            />
          </div>
        </div>
        <div className="flex gap-3 flex-1">
          <div className="flex flex-col flex-1 relative">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Select Employee
            </label>
            <div className="relative">
              <div
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer"
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                {selectedEmployee
                  ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                  : "All"}
              </div>
              {showEmployeeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <input
                    type="text"
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search employee..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  />
                  <ul className="py-1">
                    <li
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
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
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
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
            <label className="mb-1 text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Total Hours This Week: {totalHoursPerWeek} hours
        </h2>
      </div>

      {confirmationMessage && (
        <div
          className={`fixed top-5 right-5 p-4 text-white rounded-lg shadow-lg transition-all ${
            confirmationMessage.type === "approve"
              ? "bg-green-600"
              : "bg-red-600"
          }`}
        >
          {confirmationMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {daysInWeek.map((day) => {
          const dayEntries = filteredTimesheets.filter((entry) =>
            dayjs(entry.date).isSame(day, "day")
          );
          return (
            <div
              key={day.toString()}
              className="p-5 rounded-lg shadow-md border bg-white transition-all relative cursor-pointer hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-900">
                  {dayjs(day).format("dddd, MMMM D, YYYY")}
                </h3>
                <Eye className="h-5 w-5 text-gray-600" />
              </div>
              {dayEntries.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  No timesheet entries available.
                </p>
              ) : (
                dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedTimesheet(entry)}
                  >
                    <p className="mt-2 text-sm font-bold text-gray-900">
                      {entry.employee
                        ? `${entry.employee.firstName} ${entry.employee.lastName}`
                        : "Unknown Employee"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {entry.project.projectName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.hoursWorked} hours
                    </p>
                    <p
                      className={`text-sm font-semibold ${
                        entry.status === "APPROVED"
                          ? "text-green-600"
                          : entry.status === "PENDING"
                          ? "text-yellow-600"
                          : entry.status === "WITHDRAWN"
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {entry.status}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
        {filteredTimesheets.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            No employee found.
          </div>
        )}
      </div>

      {selectedTimesheet && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedTimesheet(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900">
              {selectedTimesheet.project.projectName}
            </h3>
            <p className="text-sm text-gray-600">
              👤{" "}
              {selectedTimesheet.employee
                ? `${selectedTimesheet.employee.firstName} ${selectedTimesheet.employee.lastName}`
                : "Unknown Employee"}
            </p>
            <p className="text-sm text-gray-500">
              📅 {dayjs(selectedTimesheet.date).format("DD MMM YYYY")}
            </p>
            <p className="text-sm text-gray-700">
              ⏳ Total Hours: {selectedTimesheet.hoursWorked} hrs
            </p>
            <p className="text-sm font-semibold">Task Description:</p>
            <p className="text-gray-600">{selectedTimesheet.description}</p>
            <p className="text-sm font-semibold">Comments:</p>
            <p className="text-gray-600">
              {selectedTimesheet.requiredComments || "No comments provided."}
            </p>

            {selectedTimesheet.status === "PENDING" && (
              <div className="mt-4 flex space-x-3">
                <button
                  className="p-2 rounded-full bg-green-600 text-white"
                  onClick={() => handleApprove(selectedTimesheet.id)}
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-full bg-red-600 text-white"
                  onClick={() => handleReject(selectedTimesheet.id)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
