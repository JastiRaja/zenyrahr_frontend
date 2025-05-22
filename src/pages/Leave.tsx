import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Eye, Trash2 } from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import LeaveSummary from "./leave/LeaveSummary"; // Import Leave Summary component

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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

  // ✅ Fetch Employee Name & Reporting Manager
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
        const response = await axios.get(
          `${API_BASE_URL}/api/leave-requests/employee/${user.id}`
        );

        // Ensure response.data is an array
        const leaveData = Array.isArray(response.data) ? response.data : [];
        
        const processedRequests = Array.isArray(leaveData) ? leaveData.map(
          (request: LeaveRequest) => ({
            ...request,
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
    if (
      !window.confirm("Are you sure you want to withdraw this leave request?")
    )
      return;

    try {
      await axios.put(`${API_BASE_URL}/api/leave-requests/${id}/withdraw`);

      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status: "WITHDRAWN", approvedBy: employeeName }
            : req
        )
      );
      setSelectedRequest(null); // Close popup after withdrawal
    } catch (error) {
      console.error("❌ Error withdrawing leave request:", error);
      alert("Failed to withdraw leave request.");
    }
  };

  const filteredRequests = Array.isArray(leaveRequests) ? leaveRequests.filter((request) => {
    if (filterStatus === "all") return true;
    return request.status.toLowerCase() === filterStatus.toLowerCase();
  }) : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-2 text-lg text-gray-600">
            Track and manage your leave balances
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 sm:text-sm rounded-md"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
          <button
            onClick={() => navigate("/leave/request")}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Leave Summary Component */}
      <LeaveSummary />

      {/* Leave Requests Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No leave requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="p-5 rounded-lg shadow-md border bg-white transition-all relative cursor-pointer hover:shadow-lg"
              onClick={() => setSelectedRequest(request)}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-900">
                  {request.leaveType?.name || "Unknown Leave Type"}
                </h3>
                <Eye className="h-5 w-5 text-gray-600" />
              </div>

              {/* Status */}
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

              {/* Date & Days */}
              <p className="text-sm text-gray-500">
                {dayjs(request.startDate).format("YYYY-MM-DD")} to{" "}
                {dayjs(request.endDate).format("YYYY-MM-DD")}
              </p>
              <p className="text-sm text-gray-700">{request.totalDays} days</p>
            </div>
          ))
        )}
      </div>

      {/* Leave Request Details Popup */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full relative transition-all">
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedRequest(null)}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Popup Content */}
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {selectedRequest.leaveType?.name || "Unknown Leave Type"}
            </h3>
            <p className="text-sm font-semibold text-gray-700">
              {selectedRequest.status}
            </p>
            <p className="text-sm text-gray-500">
              {dayjs(selectedRequest.startDate).format("YYYY-MM-DD")} to{" "}
              {dayjs(selectedRequest.endDate).format("YYYY-MM-DD")}
            </p>
            <p className="text-sm text-gray-700">
              {selectedRequest.totalDays} days
            </p>

            {/* ✅ Uploaded Files */}
            {Array.isArray(selectedRequest?.documentUrls) && selectedRequest.documentUrls.map((fileUrl, index) => (
              <div key={index} className="mt-4">
                <h4 className="text-md font-semibold">Uploaded Documents:</h4>
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

            {/* ✅ Withdraw Button */}
            {selectedRequest.status === "PENDING" && (
              <button
                className="mt-4 p-2 bg-red-600 text-white rounded-lg flex items-center"
                onClick={() => handleWithdraw(selectedRequest.id)}
              >
                <Trash2 className="h-5 w-5 mr-2" /> Withdraw Request
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
