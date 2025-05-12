import React, { useState, useEffect } from "react";
import axios from "axios";
import { Check, X, Search, Eye, Calendar } from "lucide-react";
import dayjs from "dayjs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

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
      const requestsResponse = await axios.get(
        `${API_BASE_URL}/api/leave-requests`
      );
      const requests: LeaveRequest[] = requestsResponse.data;

      // Fetch employees and leave types
      const [employeesResponse, leaveTypesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/employees`),
        axios.get(`${API_BASE_URL}/api/leave-types`),
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
      await axios.put(`${API_BASE_URL}/api/leave-requests/${id}/approve`);
      await fetchAllData(); // Refresh all data
    } catch (err) {
      console.error("Error approving leave request:", err);
      setError("Failed to approve leave request. Please try again.");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axios.put(`${API_BASE_URL}/api/leave-requests/${id}/reject`);
      await fetchAllData(); // Refresh all data
    } catch (err) {
      console.error("Error rejecting leave request:", err);
      setError("Failed to reject leave request. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      request.employee.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.employee.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      request.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Employee Leave Requests
      </h1>
      <p className="text-gray-600 mb-6">
        Manage and approve/reject employee leave requests here.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No leave requests found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.employee.firstName} {request.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {request.leaveType.name} - {request.totalDays} days
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {dayjs(request.startDate).format("MMM D, YYYY")} -{" "}
                      {dayjs(request.endDate).format("MMM D, YYYY")}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                    {request.status.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(request.id);
                          }}
                          className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(request.id);
                          }}
                          className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
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
      </div>

      {/* Leave Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Leave Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRequest.employee.firstName}{" "}
                  {selectedRequest.employee.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedRequest.leaveType.name} - {selectedRequest.totalDays}{" "}
                  days
                </p>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {dayjs(selectedRequest.startDate).format("MMM D, YYYY")} -{" "}
                {dayjs(selectedRequest.endDate).format("MMM D, YYYY")}
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Comments</h4>
                <p className="mt-1 text-gray-600">
                  {selectedRequest.comments || "No comments provided"}
                </p>
              </div>

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

              <div className="flex justify-end space-x-3">
                {selectedRequest.status.toLowerCase() === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setSelectedRequest(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
