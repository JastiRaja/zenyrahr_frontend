import { useState, useEffect } from "react";
import Select from "react-select";
import { Search } from "lucide-react";
import api from "../api/axios";

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
    role: string;
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
      const response = await api.get(`/auth/employees`);
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
          api.put(`/auth/employees/${emp.value}/manager/${selectedManager.value}`)
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

      await api.put(`/auth/employees/${employeeId}/manager/${newManager.value}`);

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
      await api.delete(`/auth/employees/${employeeId}/manager`);
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

  // Filter only managers for the manager dropdown
  const managerOptions = employees
    .filter(emp => emp.role && emp.role.toLowerCase() === "manager")
    .map(emp => ({
      value: emp.id,
      label: `${emp.code} - ${emp.firstName} ${emp.lastName}`,
    }));

  const assignedCount = assignments.filter(
    (assignment) => assignment.managerId !== null
  ).length;
  const unassignedCount = assignments.length - assignedCount;
  const successMessage = message.startsWith("✅");
  const selectMenuProps = {
    menuPortalTarget:
      typeof window !== "undefined" ? document.body : undefined,
    menuPosition: "fixed" as const,
    styles: {
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      menu: (base: any) => ({ ...base, zIndex: 9999 }),
    },
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Assign Manager</h1>
          <p className="mt-1 text-sm text-sky-50">
            Assign, reassign, or remove reporting managers for employees.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Employees</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{assignments.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Managers</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{managerOptions.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Assigned</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{assignedCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Unassigned</p>
            <p className="mt-1 text-xl font-bold text-rose-700">{unassignedCount}</p>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            successMessage
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Select Employees
          </label>
          <Select
            options={employeeOptions}
            value={selectedEmployees}
            onChange={(newValue) => setSelectedEmployees([...newValue])}
            placeholder="Search employees..."
            isMulti
            isSearchable
            className="rounded-md shadow-sm"
            {...selectMenuProps}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Select Manager
          </label>
          <Select
            options={managerOptions}
            value={selectedManager}
            onChange={setSelectedManager}
            placeholder="Search manager..."
            isSearchable
            className="rounded-md shadow-sm"
            {...selectMenuProps}
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleAssignManager}
          className={`rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading
            ? "Assigning..."
            : "Assign Manager to Selected Employees"}
        </button>
      </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Assigned Managers
          </h3>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Employee (Code & Name)</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Manager (Code & Name)</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-slate-800">{item.employeeDetails}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {editingEmployeeId === item.employeeId ? (
                        <Select
                          options={managerOptions}
                          value={newManagerSelection[item.employeeId] || null}
                          onChange={(selected) =>
                            setNewManagerSelection((prev) => ({
                              ...prev,
                              [item.employeeId]: selected,
                            }))
                          }
                          placeholder="Select new manager..."
                          isSearchable
                          {...selectMenuProps}
                        />
                      ) : (
                        item.managerDetails
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {editingEmployeeId === item.employeeId ? (
                          <button
                            onClick={() => handleReassignManager(item.employeeId)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingEmployeeId(item.employeeId)}
                            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                          >
                            Reassign
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveManager(item.employeeId)}
                          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No matching employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AssignManager;
