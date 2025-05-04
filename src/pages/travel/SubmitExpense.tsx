import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Tag,
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Trash2,
} from "react-feather";
import { useAuth } from "../../contexts/AuthContext"; // Import the useAuth hook
import { IndianRupee } from "lucide-react";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function SubmitExpense() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Use the useAuth hook to get the user and authentication status
  interface Expense {
    id: number;
    date: string;
    category: string;
    amount: string;
    description: string;
    documents: File[];
    firstLevelApprovalStatus: string;
    secondLevelApprovalStatus: string;
  }

  const [formEntries, setFormEntries] = useState<Expense[]>([
    {
      id: Date.now(),
      date: "",
      category: "",
      amount: "",
      description: "",
      documents: [],
      firstLevelApprovalStatus: "PENDING",
      secondLevelApprovalStatus: "PENDING",
    },
  ]);
  const [notification, setNotification] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [lastMonthAmount, setLastMonthAmount] = useState(0);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/expenses`);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const data = await response.json();
      // Ensure documents property is always an array
      const expensesWithDocuments = data.map((expense: any) => ({
        ...expense,
        documents: expense.documents || [],
      }));

      // Calculate summary data
      const total: number = expensesWithDocuments.reduce(
        (sum: number, expense: Expense) =>
          sum + parseFloat(expense.amount || "0"),
        0
      );
      setTotalAmount(total);

      const pending: number = expensesWithDocuments
        .filter(
          (expense: Expense) =>
            expense.firstLevelApprovalStatus === "PENDING" ||
            expense.secondLevelApprovalStatus === "PENDING"
        )
        .reduce(
          (sum: number, expense: Expense) =>
            sum + parseFloat(expense.amount || "0"),
          0
        );
      setPendingAmount(pending);

      const lastMonth: number = expensesWithDocuments
        .filter((expense: Expense) => {
          const expenseDate: Date = new Date(expense.date);
          const now: Date = new Date();
          return (
            expenseDate.getMonth() === now.getMonth() - 1 &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce(
          (sum: number, expense: Expense) =>
            sum + parseFloat(expense.amount || "0"),
          0
        );
      setLastMonthAmount(lastMonth);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = () => {
    setFormEntries([
      ...formEntries,
      {
        id: Date.now(),
        date: "",
        category: "",
        amount: "",
        description: "",
        documents: [],
        firstLevelApprovalStatus: "PENDING",
        secondLevelApprovalStatus: "PENDING",
      },
    ]);
  };

  const removeExpense = (id: number) => {
    setFormEntries(formEntries.filter((expense) => expense.id !== id));
  };

  const handleRemoveFile = (expenseId: number, fileIndex: number) => {
    setFormEntries((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === expenseId
          ? {
              ...expense,
              documents: expense.documents.filter(
                (_, idx) => idx !== fileIndex
              ),
            }
          : expense
      )
    );
  };

  const handleInputChange = (id: number, field: string, value: string) => {
    setFormEntries((prevExpenses) =>
      prevExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense
      )
    );
  };

  const handleFileChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files);
      setFormEntries((prevExpenses) =>
        prevExpenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                documents: [...expense.documents, ...uploadedFiles],
              }
            : expense
        )
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      setNotification("User not authenticated. Please log in again.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      for (const expense of formEntries) {
        const formData = new FormData();

        const payload = {
          date: expense.date,
          category: expense.category,
          amount: parseFloat(expense.amount) || 0,
          description: expense.description,
          employee: { id: user.id }, // Use the user ID from the context
        };

        formData.append("expense", JSON.stringify(payload));

        expense.documents.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch(`${API_BASE_URL}/api/expenses`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to submit expense");
        }
      }

      setNotification("Successfully submitted");
      setTimeout(() => setNotification(null), 3000);
      navigate("/travel");
    } catch (error) {
      console.error("Error submitting form:", error);
      setNotification("Submission failed");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit Expense</h1>
        <p className="mt-2 text-lg text-gray-600">
          Record and submit your business expenses
        </p>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        {[
          {
            label: "Total Amount",
            value: `₹${totalAmount.toFixed(2)}`,
            type: "This Report",
          },
          {
            label: "Pending",
            value: `₹${pendingAmount.toFixed(2)}`,
            type: "All Reports",
          },
          {
            label: "Last Month",
            value: `₹${lastMonthAmount.toFixed(2)}`,
            type: "Approved",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 hover:border-purple-200 transition-colors duration-300"
          >
            <h3 className="text-sm font-medium text-purple-600">
              {stat.label}
            </h3>
            <p className="mt-2 flex items-baseline">
              <span className="text-2xl font-semibold text-purple-900">
                {stat.value}
              </span>
              <span className="ml-2 text-sm text-purple-500">{stat.type}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Notification Section */}
      {notification && (
        <div
          className={`mb-4 p-4 rounded-md flex items-center ${
            notification.includes("Successfully")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {notification.includes("Successfully") ? (
            <CheckCircle className="h-6 w-6 mr-2" />
          ) : (
            <XCircle className="h-6 w-6 mr-2" />
          )}
          <span>{notification}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {formEntries.map((expense) => (
          <div
            key={expense.id}
            className="card p-6 bg-gradient-to-br from-white to-purple-50 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Expense Details
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 items-start border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                {/* Date Field */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="date"
                      className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      value={expense.date}
                      onChange={(e) =>
                        handleInputChange(expense.id, "date", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Category Field */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-purple-400" />
                    </div>
                    <select
                      className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      value={expense.category}
                      onChange={(e) =>
                        handleInputChange(
                          expense.id,
                          "category",
                          e.target.value
                        )
                      }
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Travel">Travel</option>
                      <option value="Meals">Meals</option>
                      <option value="Accommodation">Accommodation</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Amount Field */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* <DollarSign className="h-5 w-5 text-purple-400" /> */}
                      <IndianRupee className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      className="block w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                      value={expense.amount}
                      onChange={(e) =>
                        handleInputChange(expense.id, "amount", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Description Field */}
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="block w-full px-3 py-2 border border-purple-200 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    value={expense.description}
                    onChange={(e) =>
                      handleInputChange(
                        expense.id,
                        "description",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {/* File Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Receipts
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-purple-200 border-dashed rounded-md hover:border-purple-300 transition-colors duration-300">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-12 w-12 text-purple-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                          <span>Upload files</span>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(expense.id, e)}
                            className="sr-only"
                            multiple
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Files List */}
                {expense.documents.length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Uploaded Files
                    </h4>
                    <ul className="mt-2 space-y-2 text-sm text-gray-700">
                      {expense.documents.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between"
                        >
                          <span>{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(expense.id, index)}
                            className="text-red-500 hover:text-red-700 flex items-center"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Remove Expense Button */}
              {formEntries.length > 1 && (
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="text-red-500 hover:text-red-700 flex items-center"
                  >
                    <Trash2 className="h-5 w-5 mr-1" />
                    Remove Expense
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={addExpense}
            className="px-4 py-2 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300"
          >
            Submit Expenses
          </button>
        </div>
      </form>
    </div>
  );
}
