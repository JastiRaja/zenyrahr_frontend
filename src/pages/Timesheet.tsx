import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, X } from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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

export default function Timesheet() {
  const navigate = useNavigate();
  const { user } = useAuth();

  interface TimesheetEntry {
    id: number;
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
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [reportingManager, setReportingManager] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Fetch Employee Name & Reporting Manager
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/employees/${user.id}`
        );

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

  // Fetch All Timesheet Entries
  useEffect(() => {
    if (!user?.id) return;

    const fetchTimesheets = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/timesheet/employee/${user.id}`
        );

        const processedEntries = response.data.map((entry: any) => ({
          id: entry.id,
          date: entry.date || "",
          hoursWorked: entry.hoursWorked ?? 0,
          taskDescription:
            entry.taskDescription || entry.description || "No Description",
          comments: entry.comments || entry.requiredComments || "No Comments",
          project: entry.project
            ? { id: entry.project.id, projectName: entry.project.projectName }
            : { id: 0, projectName: "No Project" },
          status: entry.status || "PENDING",
          approvedBy:
            entry.status === "WITHDRAWN"
              ? employeeName // Withdrawn by employee
              : entry.status === "APPROVED"
              ? reportingManager // Approved by Manager
              : entry.status === "REJECTED"
              ? reportingManager // Rejected by Manager
              : null, // PENDING has no value
          approvalComments: entry.approvalComments || null,
          rejectionReason: entry.rejectionReason || null,
        }));

        setAllEntries(processedEntries);

        // Set initial date range to the latest week
        const latestDate: dayjs.Dayjs = processedEntries.reduce(
          (latest: dayjs.Dayjs, entry: TimesheetEntry) => {
            const entryDate: dayjs.Dayjs = dayjs(entry.date);
            return entryDate.isAfter(latest) ? entryDate : latest;
          },
          dayjs(processedEntries[0].date)
        );

        const startOfWeek = latestDate.startOf("isoWeek").toDate();
        const endOfWeek = latestDate.startOf("isoWeek").add(4, "day").toDate();
        setStartDate(startOfWeek);
        setEndDate(endOfWeek);
      } catch (error) {
        console.error("Error fetching timesheets:", error);
        setError("Failed to load timesheet entries.");
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [user?.id, reportingManager, employeeName]);

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
    if (!window.confirm("Are you sure you want to withdraw this timesheet?"))
      return;

    try {
      await axios.put(`${API_BASE_URL}/timesheet/withdraw/${id}`, {
        status: "WITHDRAWN",
      });
      setAllEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, status: "WITHDRAWN", approvedBy: employeeName }
            : entry
        )
      );
      setSelectedEntry(null); // Close popup after withdrawal
    } catch (error) {
      console.error("Error withdrawing timesheet:", error);
      alert("Failed to withdraw timesheet.");
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Timesheet Management
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Track and manage your work hours
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/timesheet/submit")}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Entry
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="mb-4 flex space-x-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">From</label>
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

      {/* Grid Layout for Timesheet Entries */}
      {loading ? (
        <div className="text-center text-gray-500">
          Loading timesheet entries...
        </div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {daysInWeek.map((day) => {
            const dayEntries = filteredEntries.filter((entry) =>
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
                    <div key={entry.id} onClick={() => setSelectedEntry(entry)}>
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
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Bar Chart (Takes 2 columns) */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Hours Worked per Week
          </h2>
          <div className="w-full h-64">
            {" "}
            {/* Adjust chart size */}
            <Bar
              data={barData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Pie Chart (Takes 1 column) */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Hours Worked per Project
          </h2>
          <div className="w-full h-52 flex justify-center">
            {" "}
            {/* Centering for smaller size */}
            <Pie
              data={pieData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </div>

      {/* Popup with Approved/Rejected/Withdrawn By */}
      {selectedEntry && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedEntry(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {selectedEntry.project.projectName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dayjs(selectedEntry.date).format("dddd, MMMM D, YYYY")}
            </p>
            <p className="text-sm text-gray-700">
              {selectedEntry.hoursWorked} hours worked
            </p>

            <div className="mt-3 p-4 border rounded-md bg-gray-50 break-words w-full">
              <strong className="text-gray-900">Task Description:</strong>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {selectedEntry.taskDescription}
              </p>
            </div>

            <div className="mt-3 p-4 border rounded-md bg-gray-50 break-words w-full">
              <strong className="text-gray-900">Comments:</strong>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {selectedEntry.comments || "No comments provided."}
              </p>
            </div>

            {selectedEntry.approvalComments && (
              <div className="mt-3 p-4 border rounded-md bg-gray-50 break-words w-full">
                <strong className="text-gray-900">Approval Comments:</strong>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedEntry.approvalComments}
                </p>
              </div>
            )}

            {selectedEntry.rejectionReason && (
              <div className="mt-3 p-4 border rounded-md bg-gray-50 break-words w-full">
                <strong className="text-gray-900">Rejection Reason:</strong>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                  {selectedEntry.rejectionReason}
                </p>
              </div>
            )}

            {selectedEntry.status !== "PENDING" && (
              <p className="mt-3 text-sm text-gray-500">
                <strong>{selectedEntry.status} by:</strong>{" "}
                {selectedEntry.approvedBy || "Unknown"}
              </p>
            )}

            {selectedEntry.status === "PENDING" && (
              <button
                className="mt-4 p-2 bg-red-600 text-white rounded-lg"
                onClick={() => handleWithdraw(selectedEntry.id)}
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
