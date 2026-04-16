import { useState, useEffect } from "react";
import api from "../../api/axios";
import dayjs from "dayjs";
import { X, Search, Eye } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

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
  revocationRequested?: boolean;
}

export default function LeaveApprovals() {
  const { user, hasPermission } = useAuth();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // console.log("Fetching all leave requests for approvals");
      const [leaveRequestsResponse, leaveBalancesResponse] =
        await Promise.all([
          api.get(`/api/leave-requests`),
          api.get(`/api/leave-balances`),
        ]);

      const processedRequests = leaveRequestsResponse.data.map(
        (request: LeaveRequest) => ({
          ...request,
          status:
            request.status === "APPROVED" && request.revocationRequested
              ? "REVOCATION_PENDING"
              : request.status,
          totalDays:
            dayjs(request.endDate).diff(dayjs(request.startDate), "day") + 1,
        })
      );

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

  useEffect(() => {
    if (!user?.id || !hasPermission("approve", "leave")) {
      setError(
        "Unauthorized access. You are not allowed to approve leave requests."
      );
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, hasPermission]);

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
      await api.put(`/api/leave-requests/${id}/approve`);
      await fetchData(); // Re-fetch after approval
      setSelectedRequest(null); // Close the popup
      setConfirmationMessage({ text: "Leave Approved ✅", type: "approve" });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to approve leave request ${id}.`);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.put(`/api/leave-requests/${id}/reject`);
      await fetchData(); // Re-fetch after rejection
      setSelectedRequest(null); // Close the popup
      setConfirmationMessage({ text: "Leave Rejected ❌", type: "reject" });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to reject leave request ${id}.`);
    }
  };

  const handleApproveRevoke = async (id: number) => {
    try {
      await api.put(`/api/leave-requests/${id}/approve-revoke`);
      await fetchData();
      setSelectedRequest(null);
      setConfirmationMessage({ text: "Revocation Approved ✅", type: "approve" });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to approve revocation for leave request ${id}.`);
    }
  };

  const handleRejectRevoke = async (id: number) => {
    try {
      await api.put(`/api/leave-requests/${id}/reject-revoke`);
      await fetchData();
      setSelectedRequest(null);
      setConfirmationMessage({ text: "Revocation Rejected ❌", type: "reject" });
      setTimeout(() => setConfirmationMessage(null), 3000);
    } catch {
      setError(`Failed to reject revocation for leave request ${id}.`);
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
  const pendingCount = leaveRequests.filter((request) => request.status === "PENDING").length;
  const revocationPendingCount = leaveRequests.filter((request) => request.status === "REVOCATION_PENDING").length;
  const approvedCount = leaveRequests.filter((request) => request.status === "APPROVED").length;
  const rejectedCount = leaveRequests.filter((request) => request.status === "REJECTED").length;
  const getStatusClass = (status: string) => {
    if (status === "APPROVED") return "text-emerald-700 bg-emerald-50";
    if (status === "PENDING") return "text-amber-700 bg-amber-50";
    if (status === "REVOCATION_PENDING") return "text-violet-700 bg-violet-50";
    if (status === "WITHDRAWN") return "text-slate-700 bg-slate-100";
    return "text-rose-700 bg-rose-50";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Leave Approvals</h1>
          <p className="mt-1 text-sm text-sky-50">Review and manage team leave requests.</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-5 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Requests</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{leaveRequests.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{pendingCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Revoke Pending</p>
            <p className="mt-1 text-xl font-bold text-violet-700">{revocationPendingCount}</p>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setSelectedRequest(null); // Clear selected request when changing filter
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="REVOCATION_PENDING">Revocation Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </div>
      </section>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {!loading && filteredRequests.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-slate-500">
            No leave requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-4 hover:shadow-sm"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {request.employee?.firstName} {request.employee?.lastName}
                </h3>
                <Eye className="h-4 w-4 text-slate-500" />
              </div>

              <div className="mt-2">
                <p className="text-xs font-medium text-slate-600">
                  {request.leaveType?.name || "Unknown Leave Type"}
                </p>
                <div className="mt-1 text-xs text-slate-500">
                  📅 {dayjs(request.startDate).format("YYYY-MM-DD")} →{" "}
                  {dayjs(request.endDate).format("YYYY-MM-DD")}
                </div>
                <p className="text-sm font-medium text-slate-700">
                  🕒 {request.totalDays} days
                </p>
                <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(request.status)}`}>
                  {request.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      </section>

      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
              onClick={() => setSelectedRequest(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedRequest.employee?.firstName}{" "}
                  {selectedRequest.employee?.lastName}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedRequest.employee?.department ||
                    "No department specified"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900">Leave Type</h4>
                  <p className="text-slate-600">
                    {selectedRequest.leaveType?.name}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Duration</h4>
                  <p className="text-slate-600">
                    {selectedRequest.totalDays} days
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Start Date</h4>
                  <p className="text-slate-600">
                    {dayjs(selectedRequest.startDate).format("YYYY-MM-DD")}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">End Date</h4>
                  <p className="text-slate-600">
                    {dayjs(selectedRequest.endDate).format("YYYY-MM-DD")}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900">Status</h4>
                <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-slate-900">Comments</h4>
                <p className="mt-1 text-slate-600 whitespace-pre-wrap">
                  {selectedRequest.comments || "No comments provided"}
                </p>
              </div>

              {selectedRequest.employee?.leaveBalances && (
                <div>
                  <h4 className="font-medium text-slate-900">Leave Balances</h4>
                  <ul className="mt-1 space-y-1">
                    {getLeaveBalancesForEmployee(
                      selectedRequest.employee.id
                    ).map((balance) => (
                      <li key={balance.id} className="text-slate-600">
                        {balance.leaveTypeName}: {balance.balance} days
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

              {selectedRequest.status === "PENDING" && (
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedRequest.id)}
                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              )}
              {selectedRequest.status === "REVOCATION_PENDING" && (
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => handleApproveRevoke(selectedRequest.id)}
                    className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Approve Revoke
                  </button>
                  <button
                    onClick={() => handleRejectRevoke(selectedRequest.id)}
                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Reject Revoke
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmationMessage && (
        <div
          className={`fixed right-5 top-5 rounded-md px-4 py-2 text-sm font-medium text-white shadow-md ${
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
