import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa"; // Import the icons
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { isMainPlatformAdmin } from "../types/auth";
import { useNavigate } from "react-router-dom";

type EmployeeCodeSettings = {
  employeeCodePrefix: string;
  employeeCodePadding: number;
  nextEmployeeCodeNumber: number;
  allowManualEmployeeCodeOverride: boolean;
};

export default function ManageEntities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentRole = user?.role?.toLowerCase() || "";
  const isMainAdmin = isMainPlatformAdmin(currentRole);
  const isOrgAdmin = currentRole === "org_admin";
  const canManageRoleCatalog = isMainAdmin || isOrgAdmin;
  const [designations, setDesignations] = useState<
    { id: number; name: string; organization?: { id: number } }[]
  >([]);
  const [departments, setDepartments] = useState<
    { id: number; name: string; organization?: { id: number } }[]
  >([]);
  const [workLocations, setWorkLocations] = useState<
    { id: number; name: string; organization?: { id: number } }[]
  >([]);
  const [roles, setRoles] = useState<
    { id: number; name: string; organization?: { id: number } }[]
  >([]);
  const [organizations, setOrganizations] = useState<
    {
      id: number;
      name: string;
      address?: string;
      logoUrl?: string;
      active?: boolean;
      maxActiveUsers?: number;
      activeUserCount?: number;
      userCount?: number;
    }[]
  >([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newWorkLocation, setNewWorkLocation] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newOrganization, setNewOrganization] = useState<{
    name: string;
    address: string;
    logoUrl: string;
    maxActiveUsers: number;
  }>({
    name: "",
    address: "",
    logoUrl: "",
    maxActiveUsers: 25,
  });
  const [limitDrafts, setLimitDrafts] = useState<Record<number, number>>({});
  const [logoInputMode, setLogoInputMode] = useState<"url" | "upload">("url");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [employeeCodeSettings, setEmployeeCodeSettings] = useState<EmployeeCodeSettings>({
    employeeCodePrefix: "EMP",
    employeeCodePadding: 4,
    nextEmployeeCodeNumber: 1,
    allowManualEmployeeCodeOverride: false,
  });

  useEffect(() => {
    const query = isMainAdmin && selectedOrgId ? `?organizationId=${selectedOrgId}` : "";

    // Fetch initial data for designations, departments, and work locations
    const fetchDesignations = async () => {
      try {
        const response = await api.get(`/api/Designation${query}`);
        setDesignations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await api.get(`/api/Department${query}`);
        setDepartments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchWorkLocations = async () => {
      try {
        const response = await api.get(`/api/location${query}`);
        setWorkLocations(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching work locations:", error);
      }
    };

    const fetchOrganizations = async () => {
      if (!isMainAdmin) return;
      try {
        const response = await api.get("/api/organizations/overview");
        const data = response.data;
        setOrganizations(Array.isArray(data) ? data : []);
        if (Array.isArray(data)) {
          const drafts: Record<number, number> = {};
          data.forEach((org: any) => {
            drafts[org.id] = Number(org.maxActiveUsers || 0);
          });
          setLimitDrafts(drafts);
        }
        if (!selectedOrgId && Array.isArray(data) && data.length > 0) {
          setSelectedOrgId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    const fetchRoles = async () => {
      try {
        if (isMainAdmin && !selectedOrgId) {
          setRoles([]);
          return;
        }
        const response = await api.get(`/api/roles${query}`);
        setRoles(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    const fetchEmployeeCodeSettings = async () => {
      try {
        if (isMainAdmin) {
          if (!selectedOrgId) return;
          const response = await api.get<EmployeeCodeSettings>(
            `/api/organizations/${selectedOrgId}/employee-code-settings`
          );
          setEmployeeCodeSettings(response.data);
          return;
        }
        if (isOrgAdmin) {
          const response = await api.get<EmployeeCodeSettings>(
            "/api/organizations/current/employee-code-settings"
          );
          setEmployeeCodeSettings(response.data);
        }
      } catch (error) {
        console.error("Error fetching employee code settings:", error);
      }
    };

    fetchDesignations();
    fetchDepartments();
    fetchWorkLocations();
    fetchOrganizations();
    fetchRoles();
    fetchEmployeeCodeSettings();
  }, [isMainAdmin, selectedOrgId]);

  const handleAddDesignation = async () => {
    if (
      newDesignation &&
      !designations.some((d) => d.name === newDesignation)
    ) {
      try {
        if (isMainAdmin && !selectedOrgId) {
          setFeedback({ type: "error", text: "Select an organization first." });
          return;
        }
        const payload: any = { name: newDesignation };
        if (isMainAdmin) payload.organization = { id: selectedOrgId };
        const response = await api.post("/api/Designation", payload);
        setDesignations((prev) => [...prev, response.data]);
        setNewDesignation("");
        setFeedback({ type: "success", text: "Designation added successfully." });
      } catch (error) {
        console.error("Error adding designation:", error);
        setFeedback({ type: "error", text: "Error adding designation." });
      }
    }
  };

  const handleDeleteDesignation = async (designationId: number) => {
    try {
      await api.delete(`/api/Designation/${designationId}`);
      setDesignations((prev) =>
        prev.filter((designation) => designation.id !== designationId)
      );
      setFeedback({ type: "success", text: "Designation deleted successfully." });
    } catch (error) {
      console.error("Error deleting designation:", error);
      setFeedback({ type: "error", text: "Error deleting designation." });
    }
  };

  const handleAddDepartment = async () => {
    if (newDepartment && !departments.some((d) => d.name === newDepartment)) {
      try {
        if (isMainAdmin && !selectedOrgId) {
          setFeedback({ type: "error", text: "Select an organization first." });
          return;
        }
        const payload: any = { name: newDepartment };
        if (isMainAdmin) payload.organization = { id: selectedOrgId };
        const response = await api.post("/api/Department", payload);
        setDepartments((prev) => [...prev, response.data]);
        setNewDepartment("");
        setFeedback({ type: "success", text: "Department added successfully." });
      } catch (error) {
        console.error("Error adding department:", error);
        setFeedback({ type: "error", text: "Error adding department." });
      }
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    try {
      await api.delete(`/api/Department/${departmentId}`);
      setDepartments((prev) =>
        prev.filter((department) => department.id !== departmentId)
      );
      setFeedback({ type: "success", text: "Department deleted successfully." });
    } catch (error) {
      console.error("Error deleting department:", error);
      setFeedback({ type: "error", text: "Error deleting department." });
    }
  };

  const handleAddWorkLocation = async () => {
    if (
      newWorkLocation &&
      !workLocations.some((w) => w.name === newWorkLocation)
    ) {
      try {
        if (isMainAdmin && !selectedOrgId) {
          setFeedback({ type: "error", text: "Select an organization first." });
          return;
        }
        const payload: any = { name: newWorkLocation };
        if (isMainAdmin) payload.organization = { id: selectedOrgId };
        const response = await api.post("/api/location", payload);
        setWorkLocations((prev) => [...prev, response.data]);
        setNewWorkLocation("");
        setFeedback({ type: "success", text: "Work location added successfully." });
      } catch (error) {
        console.error("Error adding work location:", error);
        setFeedback({ type: "error", text: "Error adding work location." });
      }
    }
  };

  const handleDeleteWorkLocation = async (workLocationId: number) => {
    try {
      await api.delete(`/api/location/${workLocationId}`);
      setWorkLocations((prev) =>
        prev.filter((workLocation) => workLocation.id !== workLocationId)
      );
      setFeedback({ type: "success", text: "Work location deleted successfully." });
    } catch (error) {
      console.error("Error deleting work location:", error);
      setFeedback({ type: "error", text: "Error deleting work location." });
    }
  };

  const handleAddRole = async () => {
    if (!canManageRoleCatalog) {
      setFeedback({ type: "error", text: "Only organization admin can add roles." });
      return;
    }
    if (!newRole.trim()) return;
    if (roles.some((r) => r.name.toLowerCase() === newRole.trim().toLowerCase())) {
      setFeedback({ type: "error", text: "Role already exists." });
      return;
    }
    try {
      if (isMainAdmin && !selectedOrgId) {
        setFeedback({ type: "error", text: "Select an organization first." });
        return;
      }
      const query = isMainAdmin && selectedOrgId ? `?organizationId=${selectedOrgId}` : "";
      const response = await api.post(`/api/roles${query}`, { name: newRole });
      setRoles((prev) => [...prev, response.data]);
      setNewRole("");
      setFeedback({ type: "success", text: "Role added successfully." });
    } catch (error: any) {
      console.error("Error adding role:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Error adding role.";
      setFeedback({ type: "error", text: String(message) });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!canManageRoleCatalog) {
      setFeedback({ type: "error", text: "Only organization admin can delete roles." });
      return;
    }
    try {
      const query = isMainAdmin && selectedOrgId ? `?organizationId=${selectedOrgId}` : "";
      await api.delete(`/api/roles/${roleId}${query}`);
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      setFeedback({ type: "success", text: "Role deleted successfully." });
    } catch (error: any) {
      console.error("Error deleting role:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Error deleting role.";
      setFeedback({ type: "error", text: String(message) });
    }
  };

  const handleAddOrganization = async () => {
    if (!newOrganization.name.trim()) {
      setFeedback({ type: "error", text: "Organization name is required." });
      return;
    }
    try {
      let payload = { ...newOrganization };
      if (logoInputMode === "upload") {
        if (!logoFile) {
          setFeedback({ type: "error", text: "Please choose a logo image file." });
          return;
        }
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("organizationName", newOrganization.name);
        const uploadRes = await api.post("/api/organizations/upload-logo", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        payload.logoUrl = uploadRes.data?.logoUrl || "";
      }

      const response = await api.post("/api/organizations", payload);
      const organization = response.data;
      setOrganizations((prev) => [...prev, organization]);
      setNewOrganization({ name: "", address: "", logoUrl: "", maxActiveUsers: 25 });
      setLogoInputMode("url");
      setLogoFile(null);
      setFeedback({ type: "success", text: "Organization added successfully." });
    } catch (error: any) {
      console.error("Error adding organization:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Error adding organization.";
      setFeedback({ type: "error", text: String(message) });
    }
  };

  const handleLogoFileChange = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", text: "Please upload an image file for logo." });
      return;
    }
    setLogoFile(file);
    setFeedback({ type: "success", text: "Logo image attached." });
  };

  const handleDeleteOrganization = async (organizationId: number) => {
    try {
      await api.delete(`/api/organizations/${organizationId}`);
      setOrganizations((prev) => prev.filter((org) => org.id !== organizationId));
      setFeedback({ type: "success", text: "Organization deleted successfully." });
    } catch (error) {
      console.error("Error deleting organization:", error);
      setFeedback({ type: "error", text: "Error deleting organization." });
    }
  };

  const handleOrganizationStatus = async (organizationId: number, active: boolean) => {
    try {
      const endpoint = active ? "enable" : "disable";
      const response = await api.patch(`/api/organizations/${organizationId}/${endpoint}`);
      setOrganizations((prev) =>
        prev.map((item) => (item.id === organizationId ? response.data : item))
      );
      setFeedback({
        type: "success",
        text: active ? "Organization enabled successfully." : "Organization disabled successfully.",
      });
    } catch (error) {
      console.error("Error updating organization status:", error);
      setFeedback({ type: "error", text: "Failed to update organization status." });
    }
  };

  const handleAddOrgAdmin = (organizationId: number) => {
    navigate(
      `/employees/add?organizationId=${organizationId}&role=org_admin&returnTo=${encodeURIComponent(
        "/admin/manage-entities"
      )}`
    );
  };

  const handleUpdateActiveUserLimit = async (organizationId: number) => {
    const nextLimit = Number(limitDrafts[organizationId] || 0);
    if (!Number.isFinite(nextLimit) || nextLimit <= 0) {
      setFeedback({ type: "error", text: "Active user limit must be greater than zero." });
      return;
    }
    try {
      const response = await api.put(`/api/organizations/${organizationId}`, {
        maxActiveUsers: nextLimit,
      });
      setOrganizations((prev) =>
        prev.map((item) =>
          item.id === organizationId
            ? { ...item, maxActiveUsers: response.data?.maxActiveUsers ?? nextLimit }
            : item
        )
      );
      setFeedback({ type: "success", text: "Active user limit updated successfully." });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update active user limit.";
      setFeedback({ type: "error", text: String(message) });
    }
  };

  const handleUpdateEmployeeCodeSettings = async () => {
    try {
      const payload = {
        employeeCodePrefix: employeeCodeSettings.employeeCodePrefix,
        employeeCodePadding: Number(employeeCodeSettings.employeeCodePadding),
        nextEmployeeCodeNumber: Number(employeeCodeSettings.nextEmployeeCodeNumber),
        allowManualEmployeeCodeOverride: Boolean(employeeCodeSettings.allowManualEmployeeCodeOverride),
      };
      if (isMainAdmin) {
        if (!selectedOrgId) {
          setFeedback({ type: "error", text: "Select an organization first." });
          return;
        }
        const response = await api.put<EmployeeCodeSettings>(
          `/api/organizations/${selectedOrgId}/employee-code-settings`,
          payload
        );
        setEmployeeCodeSettings(response.data);
      } else {
        const response = await api.put<EmployeeCodeSettings>(
          "/api/organizations/current/employee-code-settings",
          payload
        );
        setEmployeeCodeSettings(response.data);
      }
      setFeedback({ type: "success", text: "Employee ID settings updated successfully." });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Failed to update employee ID settings.";
      setFeedback({ type: "error", text: String(message) });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Manage Entities</h1>
          <p className="mt-1 text-sm text-sky-50">
            Add or remove designations, departments, work locations, roles, and organizations.
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white sm:grid-cols-5 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Designations</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{designations.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Departments</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{departments.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Work Locations</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{workLocations.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Roles</p>
            <p className="mt-1 text-xl font-bold text-violet-700">{roles.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Organizations</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{organizations.length}</p>
          </div>
        </div>
      </section>

      {feedback && (
        <div className={`rounded-md border px-4 py-2 text-sm ${
          feedback.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>
          {feedback.text}
        </div>
      )}

      {isMainAdmin && (
        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <label className="block text-xs font-semibold uppercase text-slate-500">
            Organization Context (for entities)
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : "")}
            className="mt-2 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(isMainAdmin || isOrgAdmin) && (
        <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Employee ID Format
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Prefix
              </label>
              <input
                type="text"
                value={employeeCodeSettings.employeeCodePrefix}
                onChange={(e) =>
                  setEmployeeCodeSettings((prev) => ({
                    ...prev,
                    employeeCodePrefix: e.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="EMP"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Suffix Padding
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={employeeCodeSettings.employeeCodePadding}
                onChange={(e) =>
                  setEmployeeCodeSettings((prev) => ({
                    ...prev,
                    employeeCodePadding: Number(e.target.value) || 1,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Next Number
              </label>
              <input
                type="number"
                min={1}
                value={employeeCodeSettings.nextEmployeeCodeNumber}
                onChange={(e) =>
                  setEmployeeCodeSettings((prev) => ({
                    ...prev,
                    nextEmployeeCodeNumber: Number(e.target.value) || 1,
                  }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={employeeCodeSettings.allowManualEmployeeCodeOverride}
                  onChange={(e) =>
                    setEmployeeCodeSettings((prev) => ({
                      ...prev,
                      allowManualEmployeeCodeOverride: e.target.checked,
                    }))
                  }
                />
                Allow manual override (org admin)
              </label>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Preview:{" "}
              <span className="font-semibold text-slate-700">
                {employeeCodeSettings.employeeCodePrefix}
                {String(employeeCodeSettings.nextEmployeeCodeNumber).padStart(
                  employeeCodeSettings.employeeCodePadding,
                  "0"
                )}
              </span>
            </p>
            <button
              type="button"
              onClick={handleUpdateEmployeeCodeSettings}
              className="inline-flex items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Update Employee ID Settings
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Designations
          </h2>
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Add Designation
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="Enter new designation"
              />
              <button
                type="button"
                onClick={handleAddDesignation}
                className="ml-2 inline-flex items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="mt-3 min-w-full border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Designation
                </th>
                <th className="border-b border-slate-200 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {designations.map((designation) => (
                <tr key={designation.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-800">
                    {designation.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteDesignation(designation.id)}
                      className="inline-flex items-center text-rose-600 hover:text-rose-700"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Departments
          </h2>
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Add Department
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="Enter new department"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="ml-2 inline-flex items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="mt-3 min-w-full border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Department
                </th>
                <th className="border-b border-slate-200 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-800">
                    {department.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="inline-flex items-center text-rose-600 hover:text-rose-700"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Work Locations
          </h2>
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Add Work Location
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newWorkLocation}
                onChange={(e) => setNewWorkLocation(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="Enter new work location"
              />
              <button
                type="button"
                onClick={handleAddWorkLocation}
                className="ml-2 inline-flex items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="mt-3 min-w-full border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Work Location
                </th>
                <th className="border-b border-slate-200 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {workLocations.map((workLocation) => (
                <tr key={workLocation.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-800">
                    {workLocation.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkLocation(workLocation.id)}
                      className="inline-flex items-center text-rose-600 hover:text-rose-700"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Roles
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            {canManageRoleCatalog
              ? "Add organization-specific roles used in Add Employee."
              : "Role catalog can be managed by organization admin."}
          </p>
          {canManageRoleCatalog && (
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-slate-500">
              Add Role
            </label>
            <div className="mt-2 flex items-center">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="example: recruiter"
              />
              <button
                type="button"
                onClick={handleAddRole}
                className="ml-2 inline-flex items-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          )}
          <table className="mt-3 min-w-full border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Role Name
                </th>
                <th className="border-b border-slate-200 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-800">
                    {role.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-sm font-medium">
                    {canManageRoleCatalog ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        className="inline-flex items-center text-rose-600 hover:text-rose-700"
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Read only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isMainAdmin && (
      <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Organizations
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            type="text"
            value={newOrganization.name ?? ""}
            onChange={(e) =>
              setNewOrganization((prev) => ({ ...prev, name: e.target.value }))
            }
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            placeholder="Organization name"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="logoInputMode"
                  checked={logoInputMode === "url"}
                  onChange={() => {
                    setLogoInputMode("url");
                    setLogoFile(null);
                  }}
                />
                Logo URL
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="logoInputMode"
                  checked={logoInputMode === "upload"}
                  onChange={() => {
                    setLogoInputMode("upload");
                    setNewOrganization((prev) => ({ ...prev, logoUrl: "" }));
                  }}
                />
                Upload Image
              </label>
            </div>
            {logoInputMode === "url" ? (
              <input
                type="text"
                value={newOrganization.logoUrl ?? ""}
                onChange={(e) =>
                  setNewOrganization((prev) => ({ ...prev, logoUrl: e.target.value }))
                }
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="Logo URL (optional)"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleAddOrganization}
            className="inline-flex items-center justify-center rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            <FaPlus className="mr-1" /> Add Organization
          </button>
        </div>
        <div className="mt-3 max-w-xs">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Active User Limit
          </label>
          <input
            type="number"
            min={1}
            value={newOrganization.maxActiveUsers}
            onChange={(e) =>
              setNewOrganization((prev) => ({
                ...prev,
                maxActiveUsers: Number(e.target.value) || 1,
              }))
            }
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            placeholder="Max active users"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Active users are limited by this count. Inactive users are unlimited.
          </p>
        </div>
        <textarea
          value={newOrganization.address ?? ""}
          onChange={(e) =>
            setNewOrganization((prev) => ({ ...prev, address: e.target.value }))
          }
          className="mt-3 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          placeholder="Organization address (optional)"
          rows={2}
        />

        <table className="mt-3 min-w-full border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Name
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Logo
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Address
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Active Users
              </th>
              <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                Active Limit
              </th>
              <th className="border-b border-slate-200 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {organizations.map((organization) => (
              <tr key={organization.id}>
                <td className="px-3 py-2 text-sm text-slate-800">{organization.name}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {organization.logoUrl ? "Configured" : "Not set"}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {organization.address || "Not set"}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className={organization.active === false ? "text-rose-600" : "text-emerald-700"}>
                    {organization.active === false ? "Disabled" : "Active"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-700">
                  {organization.activeUserCount || 0}
                </td>
                <td className="px-3 py-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={limitDrafts[organization.id] ?? organization.maxActiveUsers ?? 1}
                      onChange={(e) =>
                        setLimitDrafts((prev) => ({
                          ...prev,
                          [organization.id]: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveUserLimit(organization.id)}
                      className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Update
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => handleAddOrgAdmin(organization.id)}
                    className="mr-2 inline-flex items-center text-sky-700 hover:text-sky-800"
                  >
                    Add Org Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOrganizationStatus(organization.id, organization.active === false)}
                    className="mr-2 inline-flex items-center text-amber-700 hover:text-amber-800"
                  >
                    {organization.active === false ? "Enable" : "Disable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrganization(organization.id)}
                    className="inline-flex items-center text-rose-600 hover:text-rose-700"
                  >
                    <FaTrash className="mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
