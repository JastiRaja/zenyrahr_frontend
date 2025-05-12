import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { Check, X, Search, Eye } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  leaveTypeName: string;
  balance: number;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  leaveBalances: LeaveBalance[];
}

interface LeaveType {
  id: number;
  name: string;
}

interface LeaveRequest {
  id: number;
  employee: Employee | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  comments: string;
  status: string;
  totalDays?: number;
  createdAt?: string;
  documentUrls?: string[]; // ✅ Add documentUrls to store uploaded document URLs
}

export default function LeaveApprovals() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  interface ConfirmationMessage {
    text: string;
    type: "approve" | "reject";
  }
  const [confirmationMessage, setConfirmationMessage] =
    useState<ConfirmationMessage | null>(null);

  useEffect(() => {
    if (!user?.id || (user.role !== "manager" && user.role !== "admin")) {
      setError(
        "Unauthorized access. Only managers or admins can view this page."
      );
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching all leave requests for approvals");
        const [leaveRequestsResponse, leaveBalancesResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/api/leave-requests`),
            axios.get(`${API_BASE_URL}/api/leave-balances`),
          ]);

        console.log(
          "Received leave requests for approval:",
          leaveRequestsResponse.data
        );

        const processedRequests = leaveRequestsResponse.data.map(
          (request: LeaveRequest) => ({
            ...request,
            totalDays:
              dayjs(request.endDate).diff(dayjs(request.startDate), "day") + 1,
          })
        );

        console.log(
          "Processed leave requests for approval:",
          processedRequests
        );

        // Sort by createdAt in descending order (most recent first)
        const sortedRequests = processedRequests.sort(
          (a: LeaveRequest, b: LeaveRequest) => {
            return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
          }
        );

        setLeaveRequests(sortedRequests);
        setLeaveBalances(leaveBalancesResponse.data);
      } catch (err) {
        console.error("❌ Error fetching approval data:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Add refresh interval to periodically check for new leaves
    const interval = setInterval(fetchData, 30000); // Check every 30 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [user]);

  // ✅ Use Effect to Remove Confirmation Message After 3 Seconds
  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);

      return () => clearTimeout(timer); // ✅ Cleanup timeout on unmount
    }
  }, [confirmationMessage]);

  const handleApprove = async (id: number) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leave-requests/${id}/approve`);

      // Remove the approved leave from the list
      setLeaveRequests((prev) => prev.filter((req) => req.id !== id));
      setConfirmationMessage({ text: "Leave Approved ✅", type: "approve" });

      // Auto-hide confirmation message after 3 seconds
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to approve leave request ${id}.`);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leave-requests/${id}/reject`);

      // Remove the rejected leave from the list
      setLeaveRequests((prev) => prev.filter((req) => req.id !== id));
      setConfirmationMessage({ text: "Leave Rejected ❌", type: "reject" });

      // Auto-hide confirmation message after 3 seconds
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to reject leave request ${id}.`);
    }
  };

  const getLeaveBalancesForEmployee = (employeeId: number) => {
    return leaveBalances.filter((balance) => balance.employeeId === employeeId);
  };

  const filteredRequests = leaveRequests.filter((request) => {
    try {
      const employeeName = request.employee
        ? `${request.employee.firstName} ${request.employee.lastName}`.toLowerCase()
        : "";
      const matchesSearchTerm = employeeName.includes(searchTerm.toLowerCase());

      // Enhanced status filtering with better error handling
      let matchesStatus = true;
      if (filterStatus !== "all") {
        matchesStatus =
          request.status?.toLowerCase() === filterStatus.toLowerCase();
      }

      return matchesSearchTerm && matchesStatus;
    } catch (error) {
      console.error("Error filtering request:", error);
      return false; // Skip problematic requests
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="mt-2 text-gray-600">Review and manage leave requests.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedRequest(null); // Clear selected request when changing filter
            }}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Leave Requests Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {!loading && filteredRequests.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No leave requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="p-5 rounded-lg shadow-md border bg-white cursor-pointer hover:shadow-lg"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-900">
                  {request.employee?.firstName} {request.employee?.lastName}
                </h3>
                <Eye className="h-5 w-5 text-gray-600" />
              </div>

              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {request.leaveType?.name || "Unknown Leave Type"}
                </p>
                <div className="text-sm text-gray-500 mt-1">
                  📅 {dayjs(request.startDate).format("YYYY-MM-DD")} →{" "}
                  {dayjs(request.endDate).format("YYYY-MM-DD")}
                </div>
                <p className="text-sm text-gray-700">
                  🕒 {request.totalDays} days
                </p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    request.status === "APPROVED"
                      ? "text-green-600"
                      : request.status === "PENDING"
                      ? "text-yellow-600"
                      : request.status === "WITHDRAWN"
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {request.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded View (Popup) */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedRequest(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="space-y-4">
              {/* Employee Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedRequest.employee?.firstName}{" "}
                  {selectedRequest.employee?.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedRequest.employee?.department ||
                    "No department specified"}
                </p>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Leave Type</h4>
                  <p className="text-gray-600">
                    {selectedRequest.leaveType?.name}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Duration</h4>
                  <p className="text-gray-600">
                    {selectedRequest.totalDays} days
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Start Date</h4>
                  <p className="text-gray-600">
                    {dayjs(selectedRequest.startDate).format("YYYY-MM-DD")}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">End Date</h4>
                  <p className="text-gray-600">
                    {dayjs(selectedRequest.endDate).format("YYYY-MM-DD")}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <p
                  className={`text-sm font-semibold ${
                    selectedRequest.status === "APPROVED"
                      ? "text-green-600"
                      : selectedRequest.status === "PENDING"
                      ? "text-yellow-600"
                      : selectedRequest.status === "WITHDRAWN"
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedRequest.status}
                </p>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-medium text-gray-900">Comments</h4>
                <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                  {selectedRequest.comments || "No comments provided"}
                </p>
              </div>

              {/* Leave Balances */}
              {selectedRequest.employee?.leaveBalances && (
                <div>
                  <h4 className="font-medium text-gray-900">Leave Balances</h4>
                  <ul className="mt-1 space-y-1">
                    {getLeaveBalancesForEmployee(
                      selectedRequest.employee.id
                    ).map((balance) => (
                      <li key={balance.id} className="text-gray-600">
                        {balance.leaveTypeName}: {balance.balance} days
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attachments */}
              {selectedRequest.documentUrls &&
                selectedRequest.documentUrls.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Attachments</h4>
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

              {/* Action Buttons */}
              {selectedRequest.status === "PENDING" && (
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Show Confirmation Popup (Green for Approve, Red for Reject) */}
      {confirmationMessage && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg shadow-md ${
            confirmationMessage.type === "approve"
              ? "bg-green-500"
              : "bg-red-500"
          } text-white`}
        >
          {confirmationMessage.text}
        </div>
      )}
    </div>
  );
}
