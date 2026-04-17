import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Plane,
  CreditCard,
  Receipt,
  Plus,
  Calendar,
  IndianRupee,
  X,
  FileText,
} from "lucide-react";
import api from "../api/axios";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";
import useOrganizationMenuSettings from "../hooks/useOrganizationMenuSettings";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

// Add the status color helper function
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

const getStatusBadgeClass = (status: string | undefined) => {
  if (!status) return "bg-slate-100 text-slate-700";
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-50 text-emerald-700";
    case "pending":
      return "bg-amber-50 text-amber-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-sky-50 text-sky-700";
  }
};

export default function Travel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  const { menuSettings, loading: menuLoading } = useOrganizationMenuSettings();
  const [trips, setTrips] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalComments, setApprovalComments] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [expenseApprovalComments, setExpenseApprovalComments] = useState("");
  const [expenseApprovalError, setExpenseApprovalError] = useState("");

  useEffect(() => {
    if (menuLoading) return;
    const fetchTripsAndExpenses = async () => {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      if (!menuSettings.travelEnabled && !menuSettings.expenseEnabled) {
        setTrips([]);
        setExpenses([]);
        setSelectedTrip(null);
        setSelectedExpense(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Determine which API endpoints to use based on user permissions
        const isManager = hasPermission("approve", "expenses");
        
        const [tripsResponse, expensesResponse] = await Promise.all([
          menuSettings.travelEnabled
            ? api.get(
                isManager
                  ? `${API_BASE_URL}/api/travel-requests`
                  : `${API_BASE_URL}/api/travel-requests/employee/${user.id}`
              )
            : Promise.resolve({ data: [] }),
          menuSettings.expenseEnabled
            ? api.get(
                isManager
                  ? `${API_BASE_URL}/api/expenses`
                  : `${API_BASE_URL}/api/expenses/employee/${user.id}`
              )
            : Promise.resolve({ data: [] }),
        ]);

        // Transform the response to ensure document data is properly structured
        const tripsWithDocs = tripsResponse.data.map((trip: any) => ({
          ...trip,
          documents: trip.documents || [],
          documentUrls: trip.documentUrls || []
        }));

        setTrips(tripsWithDocs);
        setExpenses(expensesResponse.data);

        // Check for notification parameters
        const notificationId = searchParams.get('notificationId');
        const notificationType = searchParams.get('type');
        const itemId = searchParams.get('itemId');

        if (notificationId && notificationType && itemId) {
          // Store notification ID in local storage
          localStorage.setItem('lastNotificationId', notificationId);

          // Open the corresponding modal based on type
          if (notificationType === 'trip') {
            const trip = tripsWithDocs.find((t: { id: number }) => t.id === parseInt(itemId));
            if (trip) {
              setSelectedTrip(trip);
            }
          } else if (notificationType === 'expense') {
            const expense = expensesResponse.data.find((e: { id: number }) => e.id === parseInt(itemId));
            if (expense) {
              setSelectedExpense(expense);
            }
          }

          // Remove the query parameters from the URL without navigation
          const newUrl = location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTripsAndExpenses();
  }, [
    user?.id,
    hasPermission,
    location,
    searchParams,
    menuLoading,
    menuSettings.travelEnabled,
    menuSettings.expenseEnabled,
  ]);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const pendingTrips = trips.filter(
    (trip) =>
      trip.firstLevelApprovalStatus === "PENDING" ||
      trip.secondLevelApprovalStatus === "PENDING"
  ).length;

  const handleSubmitExpense = () => {
    navigate("/travel/submit-expense");
  };

  const handleNewTripRequest = () => {
    navigate("/travel/new-trip");
  };

  const viewExpenseDetails = (expense: any) => {
    setSelectedExpense(expense);
  };

  const viewTripDetails = (trip: any) => {
    setSelectedTrip(trip);
  };

  const closeExpenseModal = () => {
    setSelectedExpense(null);
  };

  const closeTripModal = () => {
    setSelectedTrip(null);
  };

  const handleApprovalAction = async (tripId: number, level: "first" | "second", action: "approve" | "reject") => {
    if (!approvalComments.trim()) {
      setApprovalError("Comments are required for both approval and rejection");
      return;
    }

    try {
      const endpoint = level === "first" 
        ? `${API_BASE_URL}/api/travel-requests/${tripId}/${action}-first-level`
        : `${API_BASE_URL}/api/travel-requests/${tripId}/${action}-second-level`;

      const response = await api.put(endpoint, null, {
        params: {
          approverid: user?.id,
          comments: approvalComments
        }
      });

      // Update the trips list with the new status
      setTrips(trips.map(trip => 
        trip.id === tripId ? response.data : trip
      ));

      // Clear comments and error
      setApprovalComments("");
      setApprovalError("");
      
      // Close modal
      setSelectedTrip(null);
    } catch (error) {
      console.error("Error during approval/rejection:", error);
      setApprovalError("Failed to process request. Please try again.");
    }
  };

  const handleExpenseApprovalAction = async (expenseId: number, level: "first" | "second", action: "approve" | "reject") => {
    if (!expenseApprovalComments.trim()) {
      setExpenseApprovalError("Comments are required for both approval and rejection");
      return;
    }

    try {
      const endpoint = level === "first" 
        ? `${API_BASE_URL}/api/expenses/${expenseId}/${action}-first-level`
        : `${API_BASE_URL}/api/expenses/${expenseId}/${action}-second-level`;

      const response = await api.put(endpoint, null, {
        params: {
          approverid: user?.id,
          comments: expenseApprovalComments
        }
      });

      // Update the expenses list with the new status
      setExpenses(expenses.map(expense => 
        expense.id === expenseId ? response.data : expense
      ));

      // Clear comments and error
      setExpenseApprovalComments("");
      setExpenseApprovalError("");
      
      // Close modal
      setSelectedExpense(null);
    } catch (error) {
      console.error("Error during expense approval/rejection:", error);
      setExpenseApprovalError("Failed to process request. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Travel & Expense</h1>
              <p className="mt-1 text-sm text-sky-50">
                Manage your business trips and expense reports.
              </p>
            </div>
            <div className="mt-2 space-x-3 sm:mt-0">
              {menuSettings.expenseEnabled && (
                <button
                  onClick={handleSubmitExpense}
                  className="inline-flex items-center rounded-md border border-white/70 bg-transparent px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Submit Expense
                </button>
              )}
              {menuSettings.travelEnabled && (
                <button
                  onClick={handleNewTripRequest}
                  className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Trip Request
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          {menuSettings.travelEnabled && (
            <>
              <div className="px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Trip Requests</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{trips.length}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Pending Trips</p>
                <p className="mt-1 text-xl font-bold text-amber-700">{pendingTrips}</p>
              </div>
            </>
          )}
          {menuSettings.expenseEnabled && (
            <>
              <div className="px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Expenses</p>
                <p className="mt-1 text-xl font-bold text-indigo-700">{expenses.length}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs uppercase text-slate-500">Total Amount</p>
                <p className="mt-1 text-xl font-bold text-sky-700">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Upcoming & Recent Trips */}
      {menuSettings.travelEnabled && (
      <div className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Trip Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Destination
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Purpose
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Dates
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Budget
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  First Level Approval
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Second Level Approval
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 bg-white">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {trip.destination || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {trip.purpose || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {dayjs(trip.startDate).format("MMM D, YYYY")} - {dayjs(trip.endDate).format("MMM D, YYYY")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ₹{trip.budget}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(trip.firstLevelApprovalStatus)}`}>
                      {trip.firstLevelApprovalStatus || "PENDING"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(trip.secondLevelApprovalStatus)}`}>
                      {trip.secondLevelApprovalStatus || "PENDING"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewTripDetails(trip)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                    No trips available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Recent Expenses */}
      {menuSettings.expenseEnabled && (
      <div className="rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent Expenses
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  First Level Approval
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Second Level Approval
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200/70">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-indigo-50">
                        <Plane className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-slate-900">
                        {expense.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{expense.employee?.name}</div>
                    <div className="text-sm text-slate-500">{expense.employee?.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ₹{expense.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {dayjs(expense.date).format('MMM D, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(expense.firstLevelApprovalStatus)}`}>
                      {expense.firstLevelApprovalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(expense.secondLevelApprovalStatus)}`}>
                      {expense.secondLevelApprovalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewExpenseDetails(expense)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative max-h-[90vh] flex flex-col border border-slate-200/80">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">
                Trip to {selectedTrip.destination}
              </h3>
              <button
                className="text-slate-500 hover:text-slate-700 transition-colors"
                onClick={closeTripModal}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Employee Details Block */}
            <div className="px-6 pt-4">
              <div className="p-4 border border-indigo-100 rounded-xl bg-indigo-50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-slate-900 block">Requested By:</strong>
                  <span className="text-slate-800 text-lg font-medium">{selectedTrip.employee?.name || 'N/A'}</span>
                  <div className="text-slate-600 text-sm mt-1">
                    {selectedTrip.employee?.department ? `${selectedTrip.employee.department}` : ''}
                    {selectedTrip.employee?.role ? ` • ${selectedTrip.employee.role}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <strong className="text-slate-900 block">Travel Dates:</strong>
                  <p className="text-slate-600 mt-1">
                    {dayjs(selectedTrip.startDate).format("YYYY-MM-DD")} -{" "}
                    {dayjs(selectedTrip.endDate).format("YYYY-MM-DD")}
                  </p>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <strong className="text-slate-900 block">Purpose:</strong>
                  <p className="text-slate-600 mt-1">
                    {selectedTrip.purpose || "No purpose specified"}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <strong className="text-slate-900 block">Transportation:</strong>
                  <p className="text-slate-600 mt-1">
                    {selectedTrip.transportation || "No transportation specified"}
                  </p>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <strong className="text-slate-900 block">
                    Additional Details:
                  </strong>
                  <p className="text-slate-600 mt-1">
                    {selectedTrip.description || "No additional details provided"}
                  </p>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                  <strong className="text-slate-900 block">Budget:</strong>
                  <p className="text-slate-600 mt-1">
                    ₹{selectedTrip.budget || "0"}
                  </p>
                </div>

                {selectedTrip.transportationMode && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">
                      Transportation Mode:
                    </strong>
                    <p className="text-gray-600 mt-1">
                      {selectedTrip.transportationMode}
                    </p>
                  </div>
                )}

                {selectedTrip.accommodation && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">
                      Accommodation:
                    </strong>
                    <p className="text-gray-600 mt-1">
                      {selectedTrip.accommodation}
                    </p>
                  </div>
                )}

                {selectedTrip.comments && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">Comments:</strong>
                    <p className="text-gray-600 mt-1">{selectedTrip.comments}</p>
                  </div>
                )}

                {/* Approval Status */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Approval Status:</strong>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">First Level Approval:</span>
                      <span className={`font-medium ${getStatusColor(selectedTrip.firstLevelApprovalStatus)}`}>
                        {selectedTrip.firstLevelApprovalStatus || "PENDING"}
                      </span>
                    </div>
                    {selectedTrip.firstLevelApprovalComments && (
                      <p className="text-sm text-gray-600">
                        Comments: {selectedTrip.firstLevelApprovalComments}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Second Level Approval:</span>
                      <span className={`font-medium ${getStatusColor(selectedTrip.secondLevelApprovalStatus)}`}>
                        {selectedTrip.secondLevelApprovalStatus || "PENDING"}
                      </span>
                    </div>
                    {selectedTrip.secondLevelApprovalComments && (
                      <p className="text-sm text-gray-600">
                        Comments: {selectedTrip.secondLevelApprovalComments}
                      </p>
                    )}
                  </div>
                </div>

                {/* Approval Actions */}
                {(hasPermission("approve", "expenses") || hasPermission("admin", "all")) && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">Approval Actions:</strong>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Comments
                        </label>
                        <textarea
                          value={approvalComments}
                          onChange={(e) => {
                            setApprovalComments(e.target.value);
                            setApprovalError("");
                          }}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          rows={3}
                          placeholder="Enter your comments for approval..."
                        />
                        {approvalError && (
                          <p className="mt-2 text-sm text-red-600">{approvalError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {(selectedTrip.documents?.length > 0 || selectedTrip.documentUrls?.length > 0) && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">Documents:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedTrip.documents?.map((doc: any, index: number) => (
                        <div key={`doc-${index}`} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <a
                              href={doc.url || `${API_BASE_URL}/api/documents/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {doc.fileName || doc.name || `Document ${index + 1}`}
                            </a>
                          </div>
                        </div>
                      ))}
                      {selectedTrip.documentUrls?.map((url: string, index: number) => (
                        <div key={`url-${index}`} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.preventDefault();
                                window.open(url, '_blank');
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {`Document ${selectedTrip.documents?.length || 0 + index + 1}`}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer for Approval/Rejection Buttons */}
            {(hasPermission("approve", "expenses") || hasPermission("admin", "all")) && (
              <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
                <div className="flex flex-col space-y-3">
                  {/* First Level Buttons */}
                  {hasPermission("approve", "expenses") && 
                   selectedTrip.firstLevelApprovalStatus === "PENDING" && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleApprovalAction(selectedTrip.id, "first", "reject")}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300"
                      >
                        Reject (First Level)
                      </button>
                      <button
                        onClick={() => handleApprovalAction(selectedTrip.id, "first", "approve")}
                        className="btn-primary"
                      >
                        Approve (First Level)
                      </button>
                    </div>
                  )}

                  {/* Second Level Buttons */}
                  {hasPermission("admin", "all") && (
                    <div className="flex flex-col space-y-2">
                      {selectedTrip.firstLevelApprovalStatus !== "APPROVED" ? (
                        <p className="text-sm text-red-600 text-right">First level approval is required before second level approval</p>
                      ) : selectedTrip.secondLevelApprovalStatus === "PENDING" && (
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleApprovalAction(selectedTrip.id, "second", "reject")}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300"
                          >
                            Reject (Second Level)
                          </button>
                          <button
                            onClick={() => handleApprovalAction(selectedTrip.id, "second", "approve")}
                            className="btn-primary"
                          >
                            Approve (Second Level)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-lg">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedExpense.employee?.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedExpense.employee?.department} • {selectedExpense.employee?.role}
                </p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={closeExpenseModal}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Category:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedExpense.category || "No category specified"}
                  </p>
                </div>

                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Description:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedExpense.description || "No description provided"}
                  </p>
                </div>

                {/* Expense Amount */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Amount:</strong>
                  <p className="text-gray-600 mt-1">
                    ₹{selectedExpense.amount || "0"}
                  </p>
                </div>

                {/* Approval Status */}
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Approval Status:</strong>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">First Level:</span>
                      <span className={`text-sm font-medium ${getStatusColor(selectedExpense.firstLevelApprovalStatus)}`}>
                        {selectedExpense.firstLevelApprovalStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Second Level:</span>
                      <span className={`text-sm font-medium ${getStatusColor(selectedExpense.secondLevelApprovalStatus)}`}>
                        {selectedExpense.secondLevelApprovalStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Comments */}
                {(selectedExpense.approvalComments1 || selectedExpense.approvalComments2) && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">Approval Comments:</strong>
                    {selectedExpense.approvalComments1 && (
                      <p className="text-gray-600 mt-1">
                        First Level: {selectedExpense.approvalComments1}
                      </p>
                    )}
                    {selectedExpense.approvalComments2 && (
                      <p className="text-gray-600 mt-1">
                        Second Level: {selectedExpense.approvalComments2}
                      </p>
                    )}
                  </div>
                )}

                {/* Documents */}
                {selectedExpense.documentUrls && selectedExpense.documentUrls.length > 0 && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <strong className="text-gray-900 block">Documents:</strong>
                    <div className="mt-2 space-y-2">
                      {selectedExpense.documentUrls.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="block text-indigo-600 hover:text-indigo-800"
                        >
                          Document {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
