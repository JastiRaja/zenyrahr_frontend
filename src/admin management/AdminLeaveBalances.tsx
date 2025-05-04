import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  balance: number;
  employeeName?: string;
  leaveTypeName?: string;
}

interface Employee {
  id: number;
  name: string;
}

interface LeaveType {
  id: number;
  name: string;
}

export default function AdminLeaveBalances() {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form State for Adding New Leave Balance
  const [newEmployeeId, setNewEmployeeId] = useState<number | null>(null);
  const [newLeaveTypeId, setNewLeaveTypeId] = useState<number | null>(null);
  const [newTotalBalance, setNewTotalBalance] = useState<number>(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

  useEffect(() => {
    fetchAllData();
  }, []);

  // **Fetch Data from API**
  const fetchAllData = async () => {
    try {
      const [leaveBalancesRes, employeesRes, leaveTypesRes] = await Promise.all(
        [
          axios.get(`${API_BASE_URL}/api/leave-balances`),
          axios.get(`${API_BASE_URL}/auth/employees`),
          axios.get(`${API_BASE_URL}/api/leave-types`),
        ]
      );

      console.log("✅ API Responses:", {
        leaveBalancesRes,
        employeesRes,
        leaveTypesRes,
      });

      const employeeList = Array.isArray(employeesRes.data)
        ? employeesRes.data
        : [];
      const leaveTypeList = Array.isArray(leaveTypesRes.data)
        ? leaveTypesRes.data
        : [];

      setEmployees(employeeList);
      setLeaveTypes(leaveTypeList);

      // Map employeeId & leaveTypeId to names
      const enrichedLeaveBalances = Array.isArray(leaveBalancesRes.data)
        ? leaveBalancesRes.data.map((balance: LeaveBalance) => ({
            ...balance,
            employeeName:
              employeeList.find((e: Employee) => e.id === balance.employeeId)
                ?.name || "Unknown",
            leaveTypeName:
              leaveTypeList.find(
                (lt: LeaveType) => lt.id === balance.leaveTypeId
              )?.name || "Unknown",
          }))
        : [];

      setLeaveBalances(enrichedLeaveBalances);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
  };

  // **Add New Leave Balance**
  const addLeaveBalance = async () => {
    if (!newEmployeeId || !newLeaveTypeId || newTotalBalance <= 0) {
      alert(
        "Please select an employee, leave type, and enter a valid balance."
      );
      return;
    }

    const payload = {
      employee: { id: newEmployeeId },
      leaveType: { id: newLeaveTypeId },
      balance: newTotalBalance,
    };

    console.log("📨 Sending Leave Balance Data:", payload);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/leave-balances`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("✅ Leave Balance Added Successfully:", response.data);

      // **Update UI instantly**
      setLeaveBalances((prevBalances) => [
        ...prevBalances,
        {
          id: response.data.id,
          employeeId: newEmployeeId,
          leaveTypeId: newLeaveTypeId,
          balance: newTotalBalance,
          employeeName:
            employees.find((e) => e.id === newEmployeeId)?.name || "Unknown",
          leaveTypeName:
            leaveTypes.find((lt) => lt.id === newLeaveTypeId)?.name ||
            "Unknown",
        },
      ]);

      // **Ensure backend data is consistent**
      await fetchAllData();

      setNewEmployeeId(null);
      setNewLeaveTypeId(null);
      setNewTotalBalance(0);
    } catch (err) {
      console.error("❌ Error adding leave balance:", err);
    }
  };

  // **Pagination Controls**
  const totalPages = Math.ceil(leaveBalances.length / itemsPerPage);
  const paginatedBalances = leaveBalances
    .filter((b) => b.employeeName?.toLowerCase().includes(search.toLowerCase()))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Admin - Manage Leave Balances
      </h1>

      {/* Search Bar */}
      <div className="flex mb-4 items-center gap-2">
        <input
          type="text"
          placeholder="Search Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-md w-full"
        />
        <Search className="w-5 h-5 text-gray-500" />
      </div>

      {/* Add Leave Balance Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Leave Balance</h2>
        <div className="grid grid-cols-3 gap-4">
          <select
            className="border p-2 rounded-md"
            value={newEmployeeId || ""}
            onChange={(e) => setNewEmployeeId(Number(e.target.value))}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>

          <select
            className="border p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newLeaveTypeId || ""}
            onChange={(e) => setNewLeaveTypeId(Number(e.target.value))}
          >
            <option value="" disabled>
              Select Leave Type
            </option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id} className="py-2">
                {lt.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Total Balance (Days)"
            value={newTotalBalance}
            onChange={(e) => setNewTotalBalance(Number(e.target.value))}
            className="border p-2 rounded-md"
          />

          <button
            onClick={addLeaveBalance}
            className="bg-blue-500 text-white p-2 rounded-md flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Leave Balance
          </button>
        </div>
      </div>

      {/* Leave Balances Table */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Employee Leave Balances</h2>
        {paginatedBalances.length === 0 ? (
          <p className="text-gray-500">No leave balances found.</p>
        ) : (
          <>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">#</th>
                  <th className="border border-gray-300 p-2">Employee</th>
                  <th className="border border-gray-300 p-2">Leave Type</th>
                  <th className="border border-gray-300 p-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBalances.map((balance, index) => (
                  <tr key={balance.id} className="border border-gray-300">
                    <td className="border border-gray-300 p-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {balance.employeeName}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {balance.leaveTypeName}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {balance.balance} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-between p-4">
              <button
                className="text-blue-500"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-5 h-5 inline" /> Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="text-blue-500"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="w-5 h-5 inline" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
