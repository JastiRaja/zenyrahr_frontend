import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { isMainPlatformAdmin } from "../types/auth";

type LeaveType = {
  id: number;
  name: string;
  defaultBalance: number;
};

type PolicyAllocation = {
  leaveTypeId: number;
  leaveTypeName: string;
  days: number;
};

type CommonLeavePolicyResponse = {
  yearMode: "CALENDAR" | "FINANCIAL";
  yearStart: number;
  employeeCount: number;
  allocations: PolicyAllocation[];
};

type OrganizationOption = {
  id: number;
  name: string;
};

export default function AdminLeaveBalances() {
  const { user, hasPermission } = useAuth();
  const isMainAdmin = isMainPlatformAdmin(user?.role);
  const canManageLeaveTypes =
    isMainAdmin || hasPermission("manage", "leave-balance") || hasPermission("manage", "leave-types");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [yearMode, setYearMode] = useState<"CALENDAR" | "FINANCIAL">("CALENDAR");
  const [yearStart, setYearStart] = useState<number>(new Date().getFullYear());
  const [allocations, setAllocations] = useState<Record<number, number>>({});

  const [newLeaveTypeName, setNewLeaveTypeName] = useState("");
  const [newLeaveTypeDays, setNewLeaveTypeDays] = useState<number>(0);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");

  const buildAllocationMap = (items: PolicyAllocation[] | LeaveType[]) => {
    const next: Record<number, number> = {};
    items.forEach((item: any) => {
      const id = Number(item.leaveTypeId ?? item.id);
      const days = Number(item.days ?? item.defaultBalance ?? 0);
      if (!Number.isNaN(id)) {
        next[id] = Number.isNaN(days) ? 0 : days;
      }
    });
    return next;
  };

  const fetchData = async () => {
    if (isMainAdmin && !selectedOrgId) {
      setLeaveTypes([]);
      setAllocations({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const scopeParams = isMainAdmin ? { params: { organizationId: selectedOrgId } } : undefined;
    try {
      const [leaveTypesRes, policyRes] = await Promise.all([
        api.get<LeaveType[]>("/api/leave-types", scopeParams),
        api.get<CommonLeavePolicyResponse>("/api/leave-balances/common-policy", scopeParams),
      ]);
      const types = Array.isArray(leaveTypesRes.data) ? leaveTypesRes.data : [];
      setLeaveTypes(types);

      const policy = policyRes.data;
      setYearMode((policy?.yearMode || "CALENDAR") as "CALENDAR" | "FINANCIAL");
      setYearStart(policy?.yearStart || new Date().getFullYear());

      const mapFromPolicy = buildAllocationMap(policy?.allocations || []);
      if (Object.keys(mapFromPolicy).length === 0) {
        setAllocations(buildAllocationMap(types));
      } else {
        setAllocations(mapFromPolicy);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to load leave policy data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!isMainAdmin) return;
      try {
        const res = await api.get<OrganizationOption[]>("/api/organizations");
        const list = Array.isArray(res.data) ? res.data : [];
        setOrganizations(list);
        if (!selectedOrgId && list.length > 0) {
          setSelectedOrgId(list[0].id);
        }
      } catch {
        setOrganizations([]);
      }
    };
    fetchOrganizations();
  }, [isMainAdmin, selectedOrgId]);

  useEffect(() => {
    fetchData();
  }, [selectedOrgId, isMainAdmin]);

  const upsertLeaveType = async () => {
    if (isMainAdmin && !selectedOrgId) {
      setError("Select an organization to manage its leave types.");
      return;
    }
    if (!newLeaveTypeName.trim()) {
      setError("Leave type name is required.");
      return;
    }
    if (newLeaveTypeDays < 0) {
      setError("Leave days cannot be negative.");
      return;
    }
    try {
      const payload = {
        name: newLeaveTypeName.trim(),
        defaultBalance: Number(newLeaveTypeDays),
      };
      const res = await api.post(
        "/api/leave-types",
        payload,
        isMainAdmin ? { params: { organizationId: selectedOrgId } } : undefined
      );
      const created = res.data as LeaveType;
      setLeaveTypes((prev) => [...prev, created]);
      setAllocations((prev) => ({
        ...prev,
        [created.id]: Number(newLeaveTypeDays),
      }));
      setNewLeaveTypeName("");
      setNewLeaveTypeDays(0);
      setMessage("Leave type added. You can now apply policy.");
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to add leave type."
      );
    }
  };

  const applyPolicy = async () => {
    const rows = leaveTypes
      .map((type) => ({
        leaveTypeId: type.id,
        days: Number(allocations[type.id] ?? 0),
      }))
      .filter((item) => item.days >= 0);

    if (rows.length === 0) {
      setError("Please configure at least one leave type.");
      return;
    }
    if (isMainAdmin && !selectedOrgId) {
      setError("Select an organization first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post<CommonLeavePolicyResponse>(
        "/api/leave-balances/common-policy/apply",
        {
          yearMode,
          yearStart,
          allocations: rows,
        },
        isMainAdmin ? { params: { organizationId: selectedOrgId } } : undefined
      );
      const response = res.data;
      setAllocations(buildAllocationMap(response.allocations || []));
      setMessage(
        `Leave policy applied successfully for ${response.employeeCount} employees.`
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to apply common leave policy."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Common Leave Policy</h1>
          <p className="mt-1 text-sm text-sky-50">
            Set leave days once and apply to all employees in your organization.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        {isMainAdmin && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Organization Context
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : "")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Policy Year</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            value={yearMode}
            onChange={(e) => setYearMode(e.target.value as "CALENDAR" | "FINANCIAL")}
          >
            <option value="CALENDAR">Jan - Dec (Calendar Year)</option>
            <option value="FINANCIAL">Apr - Mar (Financial Year)</option>
          </select>
          <input
            type="number"
            value={yearStart}
            onChange={(e) => setYearStart(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            placeholder="Year start (e.g. 2026)"
          />
          <button
            type="button"
            onClick={applyPolicy}
            disabled={loading || saving || (isMainAdmin && !selectedOrgId)}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {saving ? "Applying..." : "Apply To All Employees"}
          </button>
        </div>
      </section>

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Leave Days By Type
        </h2>
        {loading ? (
          <p className="py-4 text-sm text-slate-500">Loading...</p>
        ) : leaveTypes.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">
            {isMainAdmin && !selectedOrgId
              ? "Select an organization to view its leave types."
              : `No leave types found. ${canManageLeaveTypes ? "Add one below." : "Ask admin to add leave types."}`}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {leaveTypes.map((type) => (
              <div key={type.id} className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
                <label className="text-sm text-slate-700">{type.name}</label>
                <input
                  type="number"
                  min={0}
                  value={allocations[type.id] ?? 0}
                  onChange={(e) =>
                    setAllocations((prev) => ({
                      ...prev,
                      [type.id]: Number(e.target.value),
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">days</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {canManageLeaveTypes && (
        <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Add Leave Type</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="text"
              value={newLeaveTypeName}
              onChange={(e) => setNewLeaveTypeName(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Sick Leave"
            />
            <input
              type="number"
              min={0}
              value={newLeaveTypeDays}
              onChange={(e) => setNewLeaveTypeDays(Number(e.target.value))}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Days"
            />
            <button
              type="button"
              onClick={upsertLeaveType}
              className="rounded-md border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              Add Leave Type
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
