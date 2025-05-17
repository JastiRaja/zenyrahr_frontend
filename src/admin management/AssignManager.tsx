import { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

const AssignManager = () => {
  interface Employee {
    id: number;
    code: string;
    firstName: string;
    lastName: string;
    reportingManager?: {
      id: number;
      code: string;
      firstName: string;
      lastName: string;
    };
  }

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedManager, setSelectedManager] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [assignments, setAssignments] = useState<
    {
      employeeId: number;
      employeeDetails: string;
      managerId: number | null;
      managerDetails: string;
    }[]
  >([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
    null
  );
  const [newManagerSelection, setNewManagerSelection] = useState<{
    [key: number]: { value: number; label: string } | null;
  }>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.employeeDetails
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      assignment.managerDetails
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/employees`);
      setEmployees(response.data);

      const mappedAssignments = response.data.map((emp: Employee) => ({
        employeeId: emp.id,
        employeeDetails: `${emp.code} - ${emp.firstName} ${emp.lastName}`,
        managerId: emp.reportingManager ? emp.reportingManager.id : null,
        managerDetails: emp.reportingManager
          ? `${emp.reportingManager.code} - ${emp.reportingManager.firstName} ${emp.reportingManager.lastName}`
          : "Not Assigned",
      }));

      setAssignments(mappedAssignments);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Assign or Reassign Manager
  const handleAssignManager = async () => {
    if (!selectedEmployees.length || !selectedManager) {
      setMessage("Please select at least one employee and a manager.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await Promise.all(
        selectedEmployees.map((emp) =>
          axios.put(
            `${API_BASE_URL}/api/auth/employees/${emp.value}/manager/${selectedManager.value}`
          )
        )
      );

      setMessage(
        `✅ ${selectedManager.label} has been assigned to selected employees!`
      );
      fetchEmployees();
      setSelectedEmployees([]);
      setSelectedManager(null);
    } catch (error) {
      setMessage("⚠️ Error assigning manager. Check if the API is running.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Reassign Manager (Update an existing manager)
  const handleReassignManager = async (employeeId: number) => {
    const newManager = newManagerSelection[employeeId];

    if (!newManager) {
      setMessage("Please select a new manager.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await axios.put(
        `${API_BASE_URL}/api/auth/employees/${employeeId}/manager/${newManager.value}`
      );

      setMessage(`✅ Manager updated successfully!`);
      setEditingEmployeeId(null); // Exit editing mode
      fetchEmployees(); // Refresh assignments
    } catch (error) {
      setMessage("⚠️ Error reassigning manager.");
      console.error("Error reassigning manager:", error);
    } finally {
      setLoading(false);
    }
  };

  // Remove Assigned Manager
  const handleRemoveManager = async (employeeId: number) => {
    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE_URL}/api/auth/employees/${employeeId}/manager`
      );
      setMessage("✅ Manager removed successfully!");
      fetchEmployees();
    } catch (error) {
      setMessage("⚠️ Error removing manager.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Transform employee list into select dropdown format
  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.code} - ${emp.firstName} ${emp.lastName}`,
  }));

  return (
    // <div className="max-w-4xl mx-auto mt-2 p-6 bg-white shadow-lg rounded-lg">
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Assign, Reassign, or Remove Reporting Manager
      </h2>

      {message && (
        <div className="text-center text-sm font-medium text-white bg-red-500 p-2 rounded-md mb-4">
          {message}
        </div>
      )}

      {/* Side-by-Side Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Employees
          </label>
          <Select
            options={employeeOptions}
            value={selectedEmployees}
            onChange={(newValue) => setSelectedEmployees([...newValue])}
            placeholder="🔍 Search employees..."
            isMulti
            isSearchable
            className="rounded-md shadow-sm"
          />
        </div>

        {/* Manager Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Manager
          </label>
          <Select
            options={employeeOptions}
            value={selectedManager}
            onChange={setSelectedManager}
            placeholder="🔍 Search manager..."
            isSearchable
            className="rounded-md shadow-sm"
          />
        </div>
      </div>

      {/* Assign Button */}
      <div className="mt-6 text-center">
        <button
          onClick={handleAssignManager}
          className={`w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-md hover:from-blue-600 hover:to-blue-800 transition-all duration-300 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading
            ? "⏳ Assigning..."
            : "✅ Assign Manager to Selected Employees"}
        </button>
      </div>

      {/* ✅ Assigned Managers Table with Reassign & Remove Options */}
      {/* ✅ Search Input for Filtering the Table */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="🔍 Search employee or manager..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-80 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-300"
        />
      </div>

      {/* ✅ Assigned Managers Table with Search Filter */}
      <h3 className="text-lg font-semibold mt-6 mb-3">Assigned Managers</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-md shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border">Employee (Code & Name)</th>
              <th className="py-2 px-4 border">Manager (Code & Name)</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="py-2 px-4 border">{item.employeeDetails}</td>
                  <td className="py-2 px-4 border">
                    {editingEmployeeId === item.employeeId ? (
                      <Select
                        options={employeeOptions}
                        value={newManagerSelection[item.employeeId] || null}
                        onChange={(selected) =>
                          setNewManagerSelection((prev) => ({
                            ...prev,
                            [item.employeeId]: selected,
                          }))
                        }
                        placeholder="Select new manager..."
                        isSearchable
                      />
                    ) : (
                      item.managerDetails
                    )}
                  </td>
                  <td className="py-2 px-4 border flex justify-center space-x-2">
                    {editingEmployeeId === item.employeeId ? (
                      <button
                        onClick={() => handleReassignManager(item.employeeId)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingEmployeeId(item.employeeId)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                      >
                        Reassign
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveManager(item.employeeId)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-2 px-4 text-center text-gray-500">
                  No matching employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignManager;
