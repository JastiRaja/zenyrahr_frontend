import { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import dayjs from "dayjs";
import { Check, X, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { isMainPlatformAdmin } from "../../types/auth";
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
      <span className="text-xs text-slate-500">{label}:</span>
      <span className={`text-xs font-semibold ${getStatusColor(status)}`}>
        {status || "N/A"}
      </span>
    </div>
  );
};

export default function ExpenseApprovals() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
  const [highlightedPendingKey, setHighlightedPendingKey] = useState<string | null>(null);
  const pendingCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

        // Open a specific pending request when navigated from dashboard notifications.
        const notificationType = searchParams.get("type");
        const itemId = Number(searchParams.get("itemId"));
        if ((notificationType === "expense" || notificationType === "travel") && itemId > 0) {
          const selected =
            notificationType === "expense"
              ? (Array.isArray(pendingExp.data)
                  ? pendingExp.data.find((e: Expense) => Number(e.id) === itemId)
                  : null)
              : (Array.isArray(pendingTrav.data)
                  ? pendingTrav.data.find((t: TravelRequest) => Number(t.id) === itemId)
                  : null);
          if (selected) {
            const cardKey = `${notificationType}-${itemId}`;
            setTabIndex(0);
            setHighlightedPendingKey(cardKey);
            // Scroll exact pending card into view first so user sees context.
            setTimeout(() => {
              pendingCardRefs.current[cardKey]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }, 0);
            // Then open details modal.
            setTimeout(() => {
              setSelectedRequest({ ...selected, _type: notificationType });
            }, 180);
            setModalComments("");
            setModalError("");
            setTimeout(() => setHighlightedPendingKey(null), 4000);
          }
          // Clear deep-link query params once consumed.
          window.history.replaceState({}, "", location.pathname);
        }
      } catch (err) {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovals();
  }, [user?.id, searchParams, location.pathname]);

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
    if (isMainPlatformAdmin(user.role)) return true;
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
    if (isMainPlatformAdmin(user.role)) return true;
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
      const response: any = await api.put(
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
      const response: any = await api.put(
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

  // Add helpers to determine if user can approve/reject at each level
  const canApproveFirstLevel = (item: Expense | TravelRequest) => {
    // Pending tab data is already filtered by backend authorization.
    // Use stage status here so org-configured approver roles (eg: org_admin) work.
    return item.firstLevelApprovalStatus?.toLowerCase() === 'pending';
  };
  const canApproveSecondLevel = (item: Expense | TravelRequest) => {
    // Eligible for second-level action after first-level approval.
    return (
      item.firstLevelApprovalStatus?.toLowerCase() === 'approved' &&
      item.secondLevelApprovalStatus?.toLowerCase() === 'pending'
    );
  };

  // Update modal approve/reject handlers to call correct endpoint
  const handleModalApprove = async () => {
    if (!selectedRequest) return;
    if (!modalComments.trim()) {
      setModalError("Comments are required");
      return;
    }
    try {
      const approverName = getApproverName();
      let response: any;
      if (selectedRequest._type === 'expense') {
        if (canApproveFirstLevel(selectedRequest)) {
          response = await api.put(
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
        } else if (canApproveSecondLevel(selectedRequest)) {
          response = await api.put(
            `/api/expenses/${selectedRequest.id}/approve-second-level`,
            null,
            {
              params: {
                approver: approverName,
                approverId: user?.id,
                comments: modalComments,
              },
            }
          );
        }
        if (response?.status === 200) {
          setPendingExpenses((prev) =>
            prev.map((exp) =>
              exp.id === selectedRequest.id
                ? {
                    ...exp,
                    firstLevelApprovalStatus: response.data.firstLevelApprovalStatus,
                    secondLevelApprovalStatus: response.data.secondLevelApprovalStatus,
                    firstLevelApprover: response.data.firstLevelApprover,
                    secondLevelApprover: response.data.secondLevelApprover,
                  }
                : exp
            )
          );
          setConfirmationMessage({ text: "Expense Approved ✅", type: "approve" });
          setSelectedRequest(null);
        }
      } else if (selectedRequest._type === 'travel') {
        if (canApproveFirstLevel(selectedRequest)) {
          response = await api.put(
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
        } else if (canApproveSecondLevel(selectedRequest)) {
          response = await api.put(
            `/api/travel-requests/${selectedRequest.id}/approve-second-level`,
            null,
            {
              params: {
                approver: approverName,
                approverId: user?.id,
                comments: modalComments,
              },
            }
          );
        }
        if (response?.status === 200) {
          setPendingTravel((prev) =>
            prev.map((t) =>
              t.id === selectedRequest.id
                ? {
                    ...t,
                    firstLevelApprovalStatus: response.data.firstLevelApprovalStatus,
                    secondLevelApprovalStatus: response.data.secondLevelApprovalStatus,
                    firstLevelApprover: response.data.firstLevelApprover,
                    secondLevelApprover: response.data.secondLevelApprover,
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
      const approverName = getApproverName();
      let response: any;
      if (selectedRequest._type === 'expense') {
        if (canApproveFirstLevel(selectedRequest)) {
          response = await api.put(
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
        } else if (canApproveSecondLevel(selectedRequest)) {
          response = await api.put(
            `/api/expenses/${selectedRequest.id}/reject-second-level`,
            null,
            {
              params: {
                approver: approverName,
                approverId: user?.id,
                comments: modalComments,
              },
            }
          );
        }
        if (response?.status === 200) {
          setPendingExpenses((prev) =>
            prev.map((exp) =>
              exp.id === selectedRequest.id
                ? {
                    ...exp,
                    firstLevelApprovalStatus: response.data.firstLevelApprovalStatus,
                    secondLevelApprovalStatus: response.data.secondLevelApprovalStatus,
                    firstLevelApprover: response.data.firstLevelApprover,
                    secondLevelApprover: response.data.secondLevelApprover,
                  }
                : exp
          ));
          setConfirmationMessage({ text: "Expense Rejected ❌", type: "reject" });
          setSelectedRequest(null);
        }
      } else if (selectedRequest._type === 'travel') {
        if (canApproveFirstLevel(selectedRequest)) {
          response = await api.put(
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
        } else if (canApproveSecondLevel(selectedRequest)) {
          response = await api.put(
            `/api/travel-requests/${selectedRequest.id}/reject-second-level`,
            null,
            {
              params: {
                approver: approverName,
                approverId: user?.id,
                comments: modalComments,
              },
            }
          );
        }
        if (response?.status === 200) {
          setPendingTravel((prev) =>
            prev.map((t) =>
              t.id === selectedRequest.id
                ? {
                    ...t,
                    firstLevelApprovalStatus: response.data.firstLevelApprovalStatus,
                    secondLevelApprovalStatus: response.data.secondLevelApprovalStatus,
                    firstLevelApprover: response.data.firstLevelApprover,
                    secondLevelApprover: response.data.secondLevelApprover,
                  }
                : t
          ));
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
    <div className="mx-auto max-w-6xl space-y-4 p-2">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Expense Approvals</h1>
          <p className="mt-1 text-sm text-sky-50">
            Review and process expense and travel approvals.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Pending Total</p>
            <p className="mt-1 text-xl font-bold text-amber-700">{filteredPending.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Approved Total</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{filteredApproved.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Expense Requests</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{pendingExpenses.length + approvedExpenses.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Travel Requests</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{pendingTravel.length + approvedTravel.length}</p>
          </div>
        </div>
      </section>

      {confirmationMessage && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            confirmationMessage.type === "approve"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {confirmationMessage.text}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <Tab.List className="mb-4 flex space-x-2">
          <Tab
            className={({ selected }) =>
              selected
                ? "rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            Pending
          </Tab>
          <Tab
            className={({ selected }) =>
              selected
                ? "rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            Approved
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From date"
              />
              <input
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To date"
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={amountMin}
                onChange={e => setAmountMin(e.target.value)}
                placeholder="Min amount"
                min="0"
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={amountMax}
                onChange={e => setAmountMax(e.target.value)}
                placeholder="Max amount"
                min="0"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredPending.map((item) => (
                <div
                  key={`approval-card-${item._type}-${item.id}`}
                  ref={(el) => {
                    pendingCardRefs.current[`${item._type}-${item.id}`] = el;
                  }}
                  className={`cursor-pointer rounded-md border bg-slate-50 p-4 transition hover:shadow-sm ${
                    highlightedPendingKey === `${item._type}-${item.id}`
                      ? "border-sky-400 ring-2 ring-sky-200"
                      : "border-slate-200"
                  }`}
                  onClick={() => { setSelectedRequest(item); setModalComments(""); setModalError(""); }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item._type === 'expense' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>{item._type === 'expense' ? 'Expense' : 'Travel'}</span>
                  </div>
                  {item._type === 'expense' ? (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">₹{item.amount}</p>
                      <p className="text-xs text-slate-500">{dayjs(item.date).format("YYYY-MM-DD")}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">{item.destination}</p>
                      <p className="text-xs text-slate-500">{dayjs(item.startDate).format("YYYY-MM-DD")} - {dayjs(item.endDate).format("YYYY-MM-DD")}</p>
                      <p className="text-sm text-slate-700">₹{item.budget}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  )}
                </div>
              ))}
              {filteredPending.length === 0 && (
                <div className="col-span-full text-center text-sm text-slate-500">No pending approvals found.</div>
              )}
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <input
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                placeholder="From date"
              />
              <input
                type="date"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                placeholder="To date"
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={amountMin}
                onChange={e => setAmountMin(e.target.value)}
                placeholder="Min amount"
                min="0"
              />
              <input
                type="number"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={amountMax}
                onChange={e => setAmountMax(e.target.value)}
                placeholder="Max amount"
                min="0"
              />
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                value={approvedStatus}
                onChange={e => setApprovedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredApproved.map((item) => (
                <div
                  key={`approval-card-${item._type}-${item.id}`}
                  className="cursor-pointer rounded-md border border-slate-200 bg-slate-50 p-4 transition hover:shadow-sm"
                  onClick={() => { setSelectedRequest(item); setModalComments(""); setModalError(""); }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item._type === 'expense' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>{item._type === 'expense' ? 'Expense' : 'Travel'}</span>
                  </div>
                  {item._type === 'expense' ? (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">₹{item.amount}</p>
                      <p className="text-xs text-slate-500">{dayjs(item.date).format("YYYY-MM-DD")}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </h3>
                      <p className="mt-2 text-sm text-slate-700">{item.destination}</p>
                      <p className="text-xs text-slate-500">{dayjs(item.startDate).format("YYYY-MM-DD")} - {dayjs(item.endDate).format("YYYY-MM-DD")}</p>
                      <p className="text-sm text-slate-700">₹{item.budget}</p>
                      <ExpenseStatus status={item.firstLevelApprovalStatus} label="First Level" />
                      <ExpenseStatus status={item.secondLevelApprovalStatus} label="Second Level" />
                    </>
                  )}
                </div>
              ))}
              {filteredApproved.length === 0 && (
                <div className="col-span-full text-center text-sm text-slate-500">No approved approvals found.</div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      </section>

      <ReactModal
        isOpen={!!selectedRequest}
        onRequestClose={() => setSelectedRequest(null)}
        className="fixed inset-0 flex items-center justify-center z-50 outline-none"
        overlayClassName="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40"
        ariaHideApp={false}
      >
        {selectedRequest && (
          <div className="relative w-full max-w-lg rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setSelectedRequest(null)}>&times;</button>
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
            {((selectedRequest && (canApproveFirstLevel(selectedRequest) || canApproveSecondLevel(selectedRequest))) ? (
              <div className="mt-6">
                <textarea
                  className="input-control mb-2"
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
            ) : null)}
          </div>
        )}
      </ReactModal>
    </div>
  );
}
