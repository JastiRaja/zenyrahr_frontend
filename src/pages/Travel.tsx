import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Plane,
  CreditCard,
  Receipt,
  Plus,
  MapPin,
  Calendar,
  IndianRupee,
  X,
  FileText,
} from "lucide-react";
import axios from "axios";
import dayjs from "dayjs";
import { useAuth } from "../contexts/AuthContext";

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

export default function Travel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
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
    const fetchTripsAndExpenses = async () => {
      if (!user?.id) {
        console.error("User not authenticated");
        return;
      }

      try {
        setLoading(true);
        
        // Determine which API endpoints to use based on user permissions
        const isManager = hasPermission("approve", "expenses");
        
        const tripsEndpoint = isManager 
          ? `${API_BASE_URL}/api/travel-requests` 
          : `${API_BASE_URL}/api/travel-requests/employee/${user.id}`;
        
        const expensesEndpoint = isManager
          ? `${API_BASE_URL}/api/expenses`
          : `${API_BASE_URL}/api/expenses/employee/${user.id}`;

        const [tripsResponse, expensesResponse] = await Promise.all([
          axios.get(tripsEndpoint),
          axios.get(expensesEndpoint),
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
  }, [user?.id, hasPermission, location, searchParams]);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

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

      const response = await axios.put(endpoint, null, {
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

      const response = await axios.put(endpoint, null, {
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
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel & Expense</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your business trips and expenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button
            onClick={handleSubmitExpense}
            className="btn-secondary inline-flex items-center"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Submit Expense
          </button>
          <button
            onClick={handleNewTripRequest}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Trip Request
          </button>
        </div>
      </div>

      {/* Upcoming & Recent Trips */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Trip Requests</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {trips.length > 0 ? (
            trips.map((trip) => (
              <div
                key={trip.id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {trip.destination}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{trip.purpose}</p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {trip.startDate} - {trip.endDate}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <IndianRupee className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Budget: {trip.budget}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => viewTripDetails(trip)}
                    className="btn-secondary text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No trips available</div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Expenses
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-indigo-50">
                        <Plane className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {expense.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{expense.employee?.name}</div>
                    <div className="text-sm text-gray-500">{expense.employee?.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{expense.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dayjs(expense.date).format('MMM D, YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${getStatusColor(
                        expense.firstLevelApprovalStatus
                      )}`}
                    >
                      {expense.firstLevelApprovalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-medium ${getStatusColor(
                        expense.secondLevelApprovalStatus
                      )}`}
                    >
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

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-lg">
              <h3 className="text-xl font-bold text-gray-900">
                Trip to {selectedTrip.destination}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={closeTripModal}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Employee Details Block */}
            <div className="px-6 pt-4">
              <div className="p-4 border rounded-md bg-indigo-50 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <strong className="text-gray-900 block">Requested By:</strong>
                  <span className="text-gray-800 text-lg font-medium">{selectedTrip.employee?.name || 'N/A'}</span>
                  <div className="text-gray-600 text-sm mt-1">
                    {selectedTrip.employee?.department ? `${selectedTrip.employee.department}` : ''}
                    {selectedTrip.employee?.role ? ` • ${selectedTrip.employee.role}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Travel Dates:</strong>
                  <p className="text-gray-600 mt-1">
                    {dayjs(selectedTrip.startDate).format("YYYY-MM-DD")} -{" "}
                    {dayjs(selectedTrip.endDate).format("YYYY-MM-DD")}
                  </p>
                </div>

                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Purpose:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedTrip.purpose || "No purpose specified"}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Transportation:</strong>
                  <p className="text-gray-600 mt-1">
                    {selectedTrip.transportation || "No transportation specified"}
                  </p>
                </div>
                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">
                    Additional Details:
                  </strong>
                  <p className="text-gray-600 mt-1">
                    {selectedTrip.description || "No additional details provided"}
                  </p>
                </div>

                <div className="p-4 border rounded-md bg-gray-50">
                  <strong className="text-gray-900 block">Budget:</strong>
                  <p className="text-gray-600 mt-1">
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
