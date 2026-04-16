import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Eye, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import LeaveSummary from "./leave/LeaveSummary"; // Import Leave Summary component
import CommonDialog from "../components/CommonDialog";
import api from "../api/axios";

interface LeaveRequest {
  id: number;
  leaveType: { id: number; name: string; defaultBalance: number };
  startDate: string;
  endDate: string;
  totalDays?: number;
  status: string;
  comments: string;
  approvedBy?: string | null;
  createdAt?: string;
  documentUrls?: string[]; // ✅ Stores uploaded document URLs
  revocationRequested?: boolean;
}

export default function Leave() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reportingManager, setReportingManager] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState("all");
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

  // ✅ Fetch Employee Name & Reporting Manager
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
        console.error("❌ Error fetching employee data:", err);
        setError("Failed to fetch employee data.");
      }
    };

    fetchUserData();
  }, [user?.id]);

  // ✅ Fetch Leave Requests
  useEffect(() => {
    if (!user?.id) return;

    const fetchLeaveRequests = async () => {
      try {
        const response = await api.get(`/api/leave-requests/employee/${user.id}`);

        // Ensure response.data is an array
        const leaveData = Array.isArray(response.data) ? response.data : [];
        
        const processedRequests = Array.isArray(leaveData) ? leaveData.map(
          (request: LeaveRequest) => ({
            ...request,
            status:
              request.status === "APPROVED" && request.revocationRequested
                ? "REVOCATION_PENDING"
                : request.status,
            totalDays:
              dayjs(request.endDate).diff(dayjs(request.startDate), "day") + 1,
            approvedBy:
              request.status === "WITHDRAWN"
                ? employeeName
                : request.status !== "PENDING"
                ? reportingManager
                : null,
          })
        ) : [];

        // Sort requests by createdAt in descending order (most recent first)
        const sortedRequests = processedRequests.sort(
          (a: LeaveRequest, b: LeaveRequest) =>
            dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
        );

        setLeaveRequests(sortedRequests);
      } catch (err) {
        console.error("❌ Error fetching leave requests:", err);
        setError("Failed to fetch leave requests.");
      }
    };

    fetchLeaveRequests();
    const interval = setInterval(fetchLeaveRequests, 30000);
    return () => clearInterval(interval);
  }, [user?.id, reportingManager, employeeName]);

  // ✅ Withdraw Leave Request
  const handleWithdraw = async (id: number) => {
    if (!selectedRequest) return;
    try {
      const isRevocation = selectedRequest.status === "APPROVED";
      const endpoint = isRevocation
        ? `/api/leave-requests/${id}/revoke-request`
        : `/api/leave-requests/${id}/withdraw`;
      await api.put(endpoint);

      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? {
                ...req,
                status: isRevocation ? "REVOCATION_PENDING" : "WITHDRAWN",
                approvedBy: isRevocation ? reportingManager : employeeName,
              }
            : req
        )
      );
      setSelectedRequest(null);
      setWithdrawDialogOpen(false);
      setMessageDialog({
        isOpen: true,
        title: isRevocation ? "Revocation Requested" : "Leave Request Withdrawn",
        message: isRevocation
          ? "Your revocation request has been sent for HR approval."
          : "Your leave request has been withdrawn successfully.",
        tone: "success",
      });
    } catch (error) {
      console.error("❌ Error withdrawing leave request:", error);
      const backendMessage = (error as any)?.response?.data?.message;
      setWithdrawDialogOpen(false);
      setMessageDialog({
        isOpen: true,
        title: "Withdrawal Failed",
        message: backendMessage || "Failed to withdraw leave request.",
        tone: "error",
      });
    }
  };

  const filteredRequests = Array.isArray(leaveRequests) ? leaveRequests.filter((request) => {
    if (filterStatus === "all") return true;
    return request.status.toLowerCase() === filterStatus.toLowerCase();
  }) : [];
  const approvedCount = filteredRequests.filter((request) => request.status === "APPROVED").length;
  const pendingCount = filteredRequests.filter((request) => request.status === "PENDING").length;
  const revocationPendingCount = filteredRequests.filter((request) => request.status === "REVOCATION_PENDING").length;
  const rejectedCount = filteredRequests.filter((request) => request.status === "REJECTED").length;
  const withdrawnCount = filteredRequests.filter((request) => request.status === "WITHDRAWN").length;
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
              <p className="mt-1 text-sm text-sky-50">
                Track and manage your leave balances.
              </p>
            </div>
            <button
              onClick={() => navigate("/leave/request")}
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Request Leave
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
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
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Revoke Pending / Withdrawn</p>
            <p className="mt-1 text-xl font-bold text-violet-700">{revocationPendingCount} / <span className="text-slate-700">{withdrawnCount}</span></p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REVOCATION_PENDING">Revocation Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
      </section>

      <LeaveSummary />

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-slate-500">
            No leave requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="relative cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-4 transition hover:shadow-sm"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {request.leaveType?.name || "Unknown Leave Type"}
                </h3>
                <Eye className="h-4 w-4 text-slate-500" />
              </div>

              <p className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusClass(request.status)}`}>
                {request.status}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {dayjs(request.startDate).format("YYYY-MM-DD")} to{" "}
                {dayjs(request.endDate).format("YYYY-MM-DD")}
              </p>
              <p className="text-sm font-medium text-slate-700">{request.totalDays} days</p>
            </div>
          ))
        )}
      </div>
      </section>

      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-50">
          <div className="relative w-full max-w-2xl rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <button
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
              onClick={() => setSelectedRequest(null)}
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-3">
              {selectedRequest.leaveType?.name || "Unknown Leave Type"}
            </h3>
            <p className="text-sm font-semibold text-slate-700">
              {selectedRequest.status}
            </p>
            <p className="text-sm text-slate-500">
              {dayjs(selectedRequest.startDate).format("YYYY-MM-DD")} to{" "}
              {dayjs(selectedRequest.endDate).format("YYYY-MM-DD")}
            </p>
            <p className="text-sm font-medium text-slate-700">
              {selectedRequest.totalDays} days
            </p>

            {Array.isArray(selectedRequest?.documentUrls) && selectedRequest.documentUrls.map((fileUrl, index) => (
              <div key={index} className="mt-4">
                <h4 className="text-sm font-semibold text-slate-900">Uploaded Documents:</h4>
                <ul className="mt-2">
                  <li>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {decodeURIComponent(
                        fileUrl.split("/").pop() || `Document ${index + 1}`
                      )}
                    </a>
                  </li>
                </ul>
              </div>
            ))}

            {(selectedRequest.status === "PENDING" || selectedRequest.status === "APPROVED") && (
              <button
                className="mt-4 inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                onClick={() => setWithdrawDialogOpen(true)}
              >
                <Trash2 className="h-5 w-5 mr-2" />
                {selectedRequest.status === "APPROVED" ? "Request Revoke" : "Withdraw Request"}
              </button>
            )}
          </div>
        </div>
      )}

      <CommonDialog
        isOpen={withdrawDialogOpen && Boolean(selectedRequest)}
        title={selectedRequest?.status === "APPROVED" ? "Request Leave Revocation" : "Confirm Withdrawal"}
        message={
          selectedRequest?.status === "APPROVED"
            ? "Send this leave revocation request to HR for approval?"
            : "Are you sure you want to withdraw this leave request?"
        }
        tone="error"
        confirmText={selectedRequest?.status === "APPROVED" ? "Request Revoke" : "Confirm Withdraw"}
        cancelText="Cancel"
        onConfirm={() => {
          if (selectedRequest) handleWithdraw(selectedRequest.id);
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
