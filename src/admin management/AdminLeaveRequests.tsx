import { useState, useEffect } from "react";
import { Check, X, Search, Calendar } from "lucide-react";
import dayjs from "dayjs";
import api from "../api/axios";


interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface LeaveType {
  id: number;
  name: string;
  defaultBalance: number;
}

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  comments: string;
  createdAt: string;
  documentUrls?: string[];
}

interface LeaveRequestWithDetails extends LeaveRequest {
  employee: Employee;
  leaveType: LeaveType;
}

export default function AdminLeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch leave requests
      const requestsResponse = await api.get(`/api/leave-requests`);
      const requests: LeaveRequest[] = requestsResponse.data;

      // Fetch employees and leave types
      const [employeesResponse, leaveTypesResponse] = await Promise.all([
        api.get(`/auth/employees`),
        api.get(`/api/leave-types`),
      ]);

      const employees: Employee[] = employeesResponse.data;
      const leaveTypes: LeaveType[] = leaveTypesResponse.data;

      // Combine the data
      const requestsWithDetails: LeaveRequestWithDetails[] = requests.map(
        (request) => ({
          ...request,
          employee: employees.find((emp) => emp.id === request.employeeId)!,
          leaveType: leaveTypes.find(
            (type) => type.id === request.leaveTypeId
          )!,
        })
      );

      setLeaveRequests(requestsWithDetails);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/api/leave-requests/${id}/approve`);
      await fetchAllData(); // Refresh all data
    } catch (err) {
      console.error("Error approving leave request:", err);
      setError("Failed to approve leave request. Please try again.");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/api/leave-requests/${id}/reject`);
      await fetchAllData(); // Refresh all data
    } catch (err) {
      console.error("Error rejecting leave request:", err);
      setError("Failed to reject leave request. Please try again.");
    }
  };

  const pendingCount = leaveRequests.filter(
    (request) => request.status.toLowerCase() === "pending"
  ).length;
  const approvedCount = leaveRequests.filter(
    (request) => request.status.toLowerCase() === "approved"
  ).length;
  const rejectedCount = leaveRequests.filter(
    (request) => request.status.toLowerCase() === "rejected"
  ).length;
  const getStatusPill = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700";
      case "rejected":
        return "bg-rose-50 text-rose-700";
      case "pending":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const firstName = request.employee?.firstName || "";
    const lastName = request.employee?.lastName || "";
    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      request.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Employee Leave Requests</h1>
          <p className="mt-1 text-sm text-sky-50">
            Manage and process employee leave requests.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Requests</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{leaveRequests.length}</p>
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

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No leave requests found
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="cursor-pointer p-4 transition hover:bg-slate-50"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {request.employee?.firstName || ""} {request.employee?.lastName || ""}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {request.leaveType?.name || "Unknown Leave Type"} - {request.totalDays} days
                    </p>
                    <div className="mt-2 flex items-center text-xs text-slate-500">
                      <Calendar className="mr-1 h-4 w-4" />
                      {dayjs(request.startDate).format("MMM D, YYYY")} -{" "}
                      {dayjs(request.endDate).format("MMM D, YYYY")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusPill(request.status)}`}>
                      {request.status}
                    </span>
                    {request.status.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          className="rounded-md bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          className="rounded-md bg-rose-100 p-2 text-rose-700 hover:bg-rose-200"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Leave Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedRequest.employee?.firstName || ""} {selectedRequest.employee?.lastName || ""}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedRequest.leaveType?.name || "Unknown Leave Type"} - {selectedRequest.totalDays}{" "}
                  days
                </p>
              </div>

              <div className="flex items-center text-sm text-slate-500">
                <Calendar className="h-4 w-4 mr-1" />
                {dayjs(selectedRequest.startDate).format("MMM D, YYYY")} -{" "}
                {dayjs(selectedRequest.endDate).format("MMM D, YYYY")}
              </div>

              <div>
                <h4 className="font-medium text-slate-900">Comments</h4>
                <p className="mt-1 text-slate-600">
                  {selectedRequest.comments || "No comments provided"}
                </p>
              </div>

              {selectedRequest.documentUrls &&
                selectedRequest.documentUrls.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900">Attachments</h4>
                    <ul className="mt-1 space-y-1">
                      {selectedRequest.documentUrls.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Document {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="flex justify-end space-x-3">
                {selectedRequest.status.toLowerCase() === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
