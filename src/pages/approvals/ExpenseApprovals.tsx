import { useState, useEffect } from "react";
import api from "../../api/axios";
import dayjs from "dayjs";
import { Check, X, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Tab } from '@headlessui/react';
import ReactModal from 'react-modal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface Employee {
  firstName: string;
  lastName: string;
  firstLevelApproval: boolean;
  secondLevelApproval: boolean;
}

interface Expense {
  id: number;
  employee: Employee | null;
  amount: number;
  status: string;
  date: string;
  category: string;
  description: string;
  comments?: string;
  firstLevelApprovalStatus: string;
  secondLevelApprovalStatus: string;
  firstLevelApprover?: string;
  secondLevelApprover?: string;
  documents?: { url: string, name?: string }[];
  documentUrls?: string[];
}

interface TravelRequest {
  id: number;
  employee: Employee | null;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: string;
  firstLevelApprovalStatus: string;
  secondLevelApprovalStatus: string;
  firstLevelApprover?: string;
  secondLevelApprover?: string;
  documents?: { url: string, name?: string }[];
  documentUrls?: string[];
}

const ExpenseStatus = ({
  status,
  label,
}: {
  status: string | undefined;
  label: string;
}) => {
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-600";
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`text-sm font-semibold ${getStatusColor(status)}`}>
        {status || "N/A"}
      </span>
    </div>
  );
};

export default function ExpenseApprovals() {
  const { user } = useAuth();
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([]);
  const [approvedExpenses, setApprovedExpenses] = useState<Expense[]>([]);
  const [pendingTravel, setPendingTravel] = useState<TravelRequest[]>([]);
  const [approvedTravel, setApprovedTravel] = useState<TravelRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<{
    text: string;
    type: "approve" | "reject";
  } | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [approvedStatus, setApprovedStatus] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [modalComments, setModalComments] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setError("Unauthorized access. Please login to continue.");
      return;
    }
    const fetchApprovals = async () => {
      setLoading(true);
      try {
        const [pendingExp, approvedExp, pendingTrav, approvedTrav] = await Promise.all([
          api.get(`/api/expenses/pending`),
          api.get(`/api/expenses/approved`),
          api.get(`/api/travel-requests/pending`),
          api.get(`/api/travel-requests/approved`),
        ]);
        setPendingExpenses(pendingExp.data);
        setApprovedExpenses(approvedExp.data);
        setPendingTravel(pendingTrav.data);
        setApprovedTravel(approvedTrav.data);
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, [user]);

  useEffect(() => {
    if (confirmationMessage) {
      const timer = setTimeout(() => {
        setConfirmationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmationMessage]);

  const getApproverName = () => {
    return (
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      "Unknown Approver"
    );
  };

  const canApproveExpense = (expense: Expense) => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    if (role === "admin") return true;
    if (role === "manager") {
      return expense.firstLevelApprovalStatus?.toLowerCase() === "pending";
    }
    if (role === "hr") {
      return expense.firstLevelApprovalStatus?.toLowerCase() === "approved" &&
             expense.secondLevelApprovalStatus?.toLowerCase() === "pending";
    }
    return false;
  };

  const canApproveTravel = (travel: TravelRequest) => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    if (role === "admin") return true;
    if (role === "manager") {
      return travel.firstLevelApprovalStatus?.toLowerCase() === "pending";
    }
    if (role === "hr") {
      return travel.firstLevelApprovalStatus?.toLowerCase() === "approved" &&
             travel.secondLevelApprovalStatus?.toLowerCase() === "pending";
    }
    return false;
  };

  const handleApprove = async (id: number) => {
    if (!id) {
      setError("Invalid expense ID");
      return;
    }

    if (!user) {
      setError("You must be logged in to approve expenses");
      return;
    }

    try {
      const approverName = getApproverName();
      const response = await api.put(
        `/api/expenses/${id}/approve-first-level`,
        null,
        {
          params: {
            approver: approverName,
            approverId: user?.id,
            comments: `Approved by ${approverName}`,
          },
        }
      );

      if (response.status === 200) {
      setPendingExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? {
                ...exp,
                firstLevelApprovalStatus: "approved",
                firstLevelApprover: approverName,
              }
            : exp
        )
      );

      setConfirmationMessage({ text: "Expense Approved ✅", type: "approve" });
      }
    } catch (error: any) {
      console.error("Error approving expense:", error);
      setError(
        error.response?.data?.error || 
        "Failed to approve expense. Please try again."
      );
    }
  };

  const handleReject = async (id: number) => {
    if (!id) {
      setError("Invalid expense ID");
      return;
    }

    if (!user) {
      setError("You must be logged in to reject expenses");
      return;
    }

    try {
      const approverName = getApproverName();
      const response = await api.put(
        `/api/expenses/${id}/reject-first-level`,
        null,
        {
          params: {
            approver: approverName,
            approverId: user?.id,
            comments: `Rejected by ${approverName}`,
          },
        }
      );

      if (response.status === 200) {
      setPendingExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? {
                ...exp,
                firstLevelApprovalStatus: "rejected",
                firstLevelApprover: approverName,
              }
            : exp
        )
      );

      setConfirmationMessage({ text: "Expense Rejected ❌", type: "reject" });
      }
    } catch (error: any) {
      console.error("Error rejecting expense:", error);
      setError(
        error.response?.data?.error || 
        "Failed to reject expense. Please try again."
      );
    }
  };

  // Approve/Reject handlers for modal
  const handleModalApprove = async () => {
    if (!selectedRequest) return;
    if (!modalComments.trim()) {
      setModalError("Comments are required");
      return;
    }
    try {
      if (selectedRequest._type === 'expense') {
        const approverName = getApproverName();
        const response = await api.put(
          `/api/expenses/${selectedRequest.id}/approve-first-level`,
          null,
          {
            params: {
              approver: approverName,
              approverId: user?.id,
              comments: modalComments,
            },
          }
        );
        if (response.status === 200) {
          setPendingExpenses((prev) =>
            prev.map((exp) =>
              exp.id === selectedRequest.id
                ? {
                    ...exp,
                    firstLevelApprovalStatus: "approved",
                    firstLevelApprover: approverName,
                  }
                : exp
            )
          );
          setConfirmationMessage({ text: "Expense Approved ✅", type: "approve" });
          setSelectedRequest(null);
        }
      } else if (selectedRequest._type === 'travel') {
        const approverName = getApproverName();
        const response = await api.put(
          `/api/travel-requests/${selectedRequest.id}/approve-first-level`,
          null,
          {
            params: {
              approver: approverName,
              approverId: user?.id,
              comments: modalComments,
            },
          }
        );
        if (response.status === 200) {
          setPendingTravel((prev) =>
            prev.map((t) =>
              t.id === selectedRequest.id
                ? {
                    ...t,
                    firstLevelApprovalStatus: "approved",
                    firstLevelApprover: approverName,
                  }
                : t
            )
          );
          setConfirmationMessage({ text: "Travel Approved ✅", type: "approve" });
          setSelectedRequest(null);
        }
      }
    } catch (error: any) {
      setModalError(error.response?.data?.error || "Failed to approve. Please try again.");
    }
  };
  const handleModalReject = async () => {
    if (!selectedRequest) return;
    if (!modalComments.trim()) {
      setModalError("Comments are required");
      return;
    }
    try {
      if (selectedRequest._type === 'expense') {
        const approverName = getApproverName();
        const response = await api.put(
          `/api/expenses/${selectedRequest.id}/reject-first-level`,
          null,
          {
            params: {
              approver: approverName,
              approverId: user?.id,
              comments: modalComments,
            },
          }
        );
        if (response.status === 200) {
          setPendingExpenses((prev) =>
            prev.map((exp) =>
              exp.id === selectedRequest.id
                ? {
                    ...exp,
                    firstLevelApprovalStatus: "rejected",
                    firstLevelApprover: approverName,
                  }
                : exp
            )
          );
          setConfirmationMessage({ text: "Expense Rejected ❌", type: "reject" });
          setSelectedRequest(null);
        }
      } else if (selectedRequest._type === 'travel') {
        const approverName = getApproverName();
        const response = await api.put(
          `/api/travel-requests/${selectedRequest.id}/reject-first-level`,
          null,
          {
            params: {
              approver: approverName,
              approverId: user?.id,
              comments: modalComments,
            },
          }
        );
        if (response.status === 200) {
          setPendingTravel((prev) =>
            prev.map((t) =>
              t.id === selectedRequest.id
                ? {
                    ...t,
                    firstLevelApprovalStatus: "rejected",
                    firstLevelApprover: approverName,
                  }
                : t
            )
          );
          setConfirmationMessage({ text: "Travel Rejected ❌", type: "reject" });
          setSelectedRequest(null);
        }
      }
    } catch (error: any) {
      setModalError(error.response?.data?.error || "Failed to reject. Please try again.");
    }
  };

  // Helper to check if a status is pending or active
  const isPending = (status: string | undefined) => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === 'pending' || s === 'active';
  };

  // Combine and filter
  const combinedPending = [
    ...pendingExpenses.map(e => ({ ...e, _type: 'expense' })),
    ...pendingTravel.map(t => ({ ...t, _type: 'travel' })),
  ];
  const combinedApproved = [
    ...approvedExpenses.map(e => ({ ...e, _type: 'expense' })),
    ...approvedTravel.map(t => ({ ...t, _type: 'travel' })),
  ];
  const filterCombined = (arr: any[]) => arr.filter(item => {
    const employeeName = item.employee
      ? `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase()
      : "";
    const matchesName = employeeName.includes(searchTerm.toLowerCase());
    const dateField = item._type === 'expense' ? item.date : item.startDate;
    const matchesDate = (!dateFrom || dayjs(dateField).isAfter(dayjs(dateFrom).subtract(1, 'day')))
      && (!dateTo || dayjs(dateField).isBefore(dayjs(dateTo).add(1, 'day')));
    const amountField = item._type === 'expense' ? item.amount : item.budget;
    const matchesAmount = (!amountMin || amountField >= Number(amountMin)) && (!amountMax || amountField <= Number(amountMax));
    const matchesStatus = item._type === 'expense'
      ? (!approvedStatus || item.status === approvedStatus)
      : (!approvedStatus || item.status.toLowerCase() === approvedStatus.toLowerCase());
    return matchesName && matchesDate && matchesAmount && matchesStatus;
  });
  const filteredPending = filterCombined(combinedPending);
  const filteredApproved = filterCombined(combinedApproved);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
        {confirmationMessage && (
          <div
            className={`px-4 py-2 rounded-md ${
              confirmationMessage.type === "approve"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {confirmationMessage.text}
          </div>
        )}
      </div>

      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <Tab.List className="flex space-x-2 border-b mb-4">
          <Tab className={({ selected }) =>
            selected
              ? "px-4 py-2 border-b-2 border-indigo-600 font-semibold text-indigo-700"
              : "px-4 py-2 text-gray-500 hover:text-indigo-700"
          }>Pending</Tab>
          <Tab className={({ selected }) =>
            selected
              ? "px-4 py-2 border-b-2 border-indigo-600 font-semibold text-indigo-700"
              : "px-4 py-2 text-gray-500 hover:text-indigo-700"
          }>Approved</Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From date"
              />
              <input
                type="date"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To date"
              />
              <input
                type="number"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={amountMin}
                onChange={e => setAmountMin(e.target.value)}
                placeholder="Min amount"
                min="0"
              />
              <input
                type="number"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={amountMax}
                onChange={e => setAmountMax(e.target.value)}
                placeholder="Max amount"
                min="0"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPending.map((item) => (
                <div
                  key={`approval-card-${item._type}-${item.id}`}
                  className="p-5 rounded-lg shadow-md border bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedRequest(item); setModalComments(""); setModalError(""); }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item._type === 'expense' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{item._type === 'expense' ? 'Expense' : 'Travel'}</span>
                  </div>
                  {item._type === 'expense' ? (
                    <>
                      <h3 className="text-md font-semibold text-gray-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="text-sm text-gray-700 mt-2">💰 ₹{item.amount}</p>
                      <p className="text-sm text-gray-500">📅 {dayjs(item.date).format("YYYY-MM-DD")}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-md font-semibold text-gray-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="text-sm text-gray-700 mt-2">🏷️ {item.destination}</p>
                      <p className="text-sm text-gray-500">📅 {dayjs(item.startDate).format("YYYY-MM-DD")} - {dayjs(item.endDate).format("YYYY-MM-DD")}</p>
                      <p className="text-sm text-gray-700">💰 ₹{item.budget}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  )}
                </div>
              ))}
              {filteredPending.length === 0 && (
                <div className="col-span-full text-center text-gray-500">No pending approvals found.</div>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From date"
              />
              <input
                type="date"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To date"
              />
              <input
                type="number"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={amountMin}
                onChange={e => setAmountMin(e.target.value)}
                placeholder="Min amount"
                min="0"
              />
              <input
                type="number"
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={amountMax}
                onChange={e => setAmountMax(e.target.value)}
                placeholder="Max amount"
                min="0"
              />
              <select
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md"
                value={approvedStatus}
                onChange={e => setApprovedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredApproved.map((item) => (
                <div
                  key={`approval-card-${item._type}-${item.id}`}
                  className="p-5 rounded-lg shadow-md border bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => { setSelectedRequest(item); setModalComments(""); setModalError(""); }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item._type === 'expense' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{item._type === 'expense' ? 'Expense' : 'Travel'}</span>
                  </div>
                  {item._type === 'expense' ? (
                    <>
                      <h3 className="text-md font-semibold text-gray-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="text-sm text-gray-700 mt-2">💰 ₹{item.amount}</p>
                      <p className="text-sm text-gray-500">📅 {dayjs(item.date).format("YYYY-MM-DD")}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-md font-semibold text-gray-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="text-sm text-gray-700 mt-2">🏷️ {item.destination}</p>
                      <p className="text-sm text-gray-500">📅 {dayjs(item.startDate).format("YYYY-MM-DD")} - {dayjs(item.endDate).format("YYYY-MM-DD")}</p>
                      <p className="text-sm text-gray-700">💰 ₹{item.budget}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  )}
                </div>
              ))}
              {filteredApproved.length === 0 && (
                <div className="col-span-full text-center text-gray-500">No approved approvals found.</div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <ReactModal
        isOpen={!!selectedRequest}
        onRequestClose={() => setSelectedRequest(null)}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40"
        ariaHideApp={false}
      >
        {selectedRequest && (
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setSelectedRequest(null)}>&times;</button>
            <div className="mb-4 flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${selectedRequest._type === 'expense' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{selectedRequest._type === 'expense' ? 'Expense' : 'Travel'}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{selectedRequest._type === 'expense' ? 'Expense Details' : 'Travel Details'}</h2>
            <div className="space-y-2">
              <div><b>Submitted By:</b> {selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</div>
              {selectedRequest._type === 'expense' ? (
                <>
                  <div><b>Amount:</b> ₹{selectedRequest.amount}</div>
                  <div><b>Date:</b> {dayjs(selectedRequest.date).format('YYYY-MM-DD')}</div>
                  <div><b>Category:</b> {selectedRequest.category}</div>
                  <div><b>Description:</b> {selectedRequest.description}</div>
                </>
              ) : (
                <>
                  <div><b>Destination:</b> {selectedRequest.destination}</div>
                  <div><b>Purpose:</b> {selectedRequest.purpose}</div>
                  <div><b>Dates:</b> {dayjs(selectedRequest.startDate).format('YYYY-MM-DD')} - {dayjs(selectedRequest.endDate).format('YYYY-MM-DD')}</div>
                  <div><b>Budget:</b> ₹{selectedRequest.budget}</div>
                  <div><b>Status:</b> {selectedRequest.status}</div>
                </>
              )}
              <div><b>First Level Approval:</b> {selectedRequest.firstLevelApprovalStatus}</div>
              <div><b>Second Level Approval:</b> {selectedRequest.secondLevelApprovalStatus}</div>
              {/* Documents section */}
              {(selectedRequest.documents && selectedRequest.documents.length > 0) && (
                <div>
                  <b>Documents:</b>
                  <ul>
                    {selectedRequest.documents.map((doc: any, idx: number) => (
                      <li key={idx}>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {doc.name || `Document ${idx + 1}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedRequest.documentUrls && selectedRequest.documentUrls.length > 0 && (
                <div>
                  <b>Documents:</b>
                  <ul>
                    {selectedRequest.documentUrls.map((url: string, idx: number) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(url, '_blank');
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          {`Document ${idx + 1}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {((selectedRequest._type === 'expense' && canApproveExpense(selectedRequest) && isPending(selectedRequest.firstLevelApprovalStatus)) ||
              (selectedRequest._type === 'travel' && canApproveTravel(selectedRequest) && isPending(selectedRequest.firstLevelApprovalStatus))) ? (
              <div className="mt-6">
                <textarea
                  className="w-full border rounded p-2 mb-2"
                  rows={3}
                  placeholder="Enter comments for approval/rejection"
                  value={modalComments}
                  onChange={e => { setModalComments(e.target.value); setModalError(""); }}
                />
                {modalError && <div className="text-red-600 text-sm mb-2">{modalError}</div>}
                <div className="flex gap-4 justify-end">
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleModalApprove}>Approve</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleModalReject}>Reject</button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </ReactModal>
    </div>
  );
}
