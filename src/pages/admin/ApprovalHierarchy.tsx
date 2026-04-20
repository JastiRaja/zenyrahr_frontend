import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import useOrganizationMenuSettings from "../../hooks/useOrganizationMenuSettings";

type ModuleKey = "LEAVE" | "TRAVEL" | "EXPENSE" | "TIMESHEET";
type ApproverType = "REPORTING_MANAGER" | "ROLE" | "SPECIFIC_USER";

type ApprovalStep = {
  levelNo: number;
  requesterRole?: string | null;
  approverType: ApproverType;
  approverRole?: string | null;
  approverUserId?: number | null;
  approverUserName?: string | null;
};

type ModuleConfig = {
  module: ModuleKey;
  steps: ApprovalStep[];
};

type EmployeeOption = {
  id: number;
  code?: string;
  firstName: string;
  lastName: string;
  role?: string;
};

type RoleOption = {
  id: number;
  name: string;
};

const moduleLabels: Record<ModuleKey, string> = {
  LEAVE: "Leave",
  TRAVEL: "Travel",
  EXPENSE: "Expense",
  TIMESHEET: "Timesheet",
};

export default function ApprovalHierarchy() {
  const { hasPermission } = useAuth();
  const { menuSettings, loading: menuSettingsLoading } = useOrganizationMenuSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>("");
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const sortedModules = useMemo(
    () =>
      [...modules].sort(
        (a, b) =>
          (["LEAVE", "TIMESHEET", "TRAVEL", "EXPENSE"] as ModuleKey[]).indexOf(a.module) -
          (["LEAVE", "TIMESHEET", "TRAVEL", "EXPENSE"] as ModuleKey[]).indexOf(b.module)
      ),
    [modules]
  );
  const visibleModules = useMemo(() => {
    return sortedModules.filter((moduleConfig) => {
      if (moduleConfig.module === "LEAVE") return menuSettings.leaveManagementEnabled;
      if (moduleConfig.module === "TIMESHEET") return menuSettings.timesheetEnabled;
      if (moduleConfig.module === "TRAVEL") return menuSettings.travelEnabled;
      if (moduleConfig.module === "EXPENSE") return menuSettings.expenseEnabled;
      return true;
    });
  }, [
    sortedModules,
    menuSettings.leaveManagementEnabled,
    menuSettings.timesheetEnabled,
    menuSettings.travelEnabled,
    menuSettings.expenseEnabled,
  ]);
  const mappedLeaveRequesterRoles = useMemo(() => {
    const leaveModule = modules.find((module) => module.module === "LEAVE");
    if (!leaveModule) return [];
    return leaveModule.steps
      .map((step) => String(step.requesterRole || "").trim().toLowerCase())
      .filter(Boolean);
  }, [modules]);
  const assignedEmployeeRoles = useMemo(() => {
    return employees
      .map((employee) => String(employee.role || "").trim().toLowerCase())
      .filter(Boolean);
  }, [employees]);
  const roleOptions = useMemo(() => {
    const fromCatalog = roles
      .map((role) => String(role.name || "").trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set([...fromCatalog, "org_admin"]));
  }, [roles]);
  const leaveRequesterRoleOptions = useMemo(() => {
    const fromCatalog = roles
      .map((role) => String(role.name || "").trim().toLowerCase())
      .filter(Boolean);
    const preferredAssigned = Array.from(
      new Set([...assignedEmployeeRoles, ...mappedLeaveRequesterRoles])
    );
    if (preferredAssigned.length > 0) {
      return preferredAssigned;
    }
    return Array.from(new Set([...fromCatalog, "org_admin"]));
  }, [roles, assignedEmployeeRoles, mappedLeaveRequesterRoles]);
  const recommendedLeaveMappings = useMemo(() => {
    const next: ApprovalStep[] = [];
    let levelNo = 1;
    if (leaveRequesterRoleOptions.includes("employee")) {
      next.push({
        levelNo,
        requesterRole: "employee",
        approverType: "REPORTING_MANAGER",
        approverRole: null,
        approverUserId: null,
        approverUserName: null,
      });
      levelNo += 1;
    }
    if (leaveRequesterRoleOptions.includes("manager")) {
      const managerApprover = roleOptions.includes("hr") ? "hr" : "org_admin";
      next.push({
        levelNo,
        requesterRole: "manager",
        approverType: "ROLE",
        approverRole: managerApprover,
        approverUserId: null,
        approverUserName: null,
      });
      levelNo += 1;
    }
    if (leaveRequesterRoleOptions.includes("hr")) {
      next.push({
        levelNo,
        requesterRole: "hr",
        approverType: "ROLE",
        approverRole: "org_admin",
        approverUserId: null,
        approverUserName: null,
      });
      levelNo += 1;
    }
    if (leaveRequesterRoleOptions.includes("org_admin")) {
      next.push({
        levelNo,
        requesterRole: "org_admin",
        approverType: "ROLE",
        approverRole: "org_admin",
        approverUserId: null,
        approverUserName: null,
      });
      levelNo += 1;
    }
    if (next.length === 0) {
      next.push({
        levelNo: 1,
        requesterRole: "org_admin",
        approverType: "ROLE",
        approverRole: "org_admin",
        approverUserId: null,
        approverUserName: null,
      });
    }
    return next;
  }, [leaveRequesterRoleOptions, roleOptions]);

  const canManageHierarchy = hasPermission("manage", "settings");

  useEffect(() => {
    if (!canManageHierarchy) {
      setLoading(false);
      setError("You do not have permission to manage approval hierarchy.");
      return;
    }
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [hierarchyRes, employeeRes, roleRes] = await Promise.all([
          api.get<ModuleConfig[]>("/api/approval-hierarchy/current"),
          api.get<EmployeeOption[]>("/auth/employees"),
          api.get<RoleOption[]>("/api/roles"),
        ]);
        setModules(Array.isArray(hierarchyRes.data) ? hierarchyRes.data : []);
        setEmployees(Array.isArray(employeeRes.data) ? employeeRes.data : []);
        setRoles(Array.isArray(roleRes.data) ? roleRes.data : []);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Unable to load approval hierarchy.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [canManageHierarchy]);

  const updateStep = (
    module: ModuleKey,
    levelNo: number,
    patch: Partial<ApprovalStep>
  ) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.module !== module) return m;
        return {
          ...m,
          steps: m.steps.map((s) =>
            s.levelNo === levelNo
              ? {
                  ...s,
                  ...patch,
                }
              : s
          ),
        };
      })
    );
  };

  const addLevel = (module: ModuleKey) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.module !== module) return m;
        const nextLevel = (m.steps[m.steps.length - 1]?.levelNo || 0) + 1;
        return {
          ...m,
          steps: [
            ...m.steps,
            {
              levelNo: nextLevel,
              requesterRole: module === "LEAVE" ? "employee" : null,
              approverType: module === "LEAVE" ? "REPORTING_MANAGER" : "ROLE",
              approverRole: module === "LEAVE" ? null : "org_admin",
              approverUserId: null,
              approverUserName: null,
            },
          ],
        };
      })
    );
  };

  const removeLevel = (module: ModuleKey, levelNo: number) => {
    setModules((prev) =>
      prev.map((m) => {
        if (m.module !== module) return m;
        const filtered = m.steps.filter((s) => s.levelNo !== levelNo);
        return {
          ...m,
          steps: filtered.map((s, idx) => ({ ...s, levelNo: idx + 1 })),
        };
      })
    );
  };

  const applyRecommendedLeaveMappings = () => {
    setModules((prev) =>
      prev.map((m) =>
        m.module === "LEAVE"
          ? {
              ...m,
              steps: recommendedLeaveMappings.map((step) => ({ ...step })),
            }
          : m
      )
    );
    setSuccess("Recommended leave role mappings applied. Save to persist.");
    setError(null);
  };

  const handleSave = async () => {
    const leaveModule = sortedModules.find((m) => m.module === "LEAVE");
    if (leaveModule) {
      const duplicateRequesterRoles = new Set<string>();
      const seenRequesterRoles = new Set<string>();
      for (const step of leaveModule.steps) {
        const requesterRole = String(step.requesterRole || "").toLowerCase().trim();
        if (!requesterRole) {
          setError("Each leave mapping must include requester role.");
          return;
        }
        if (seenRequesterRoles.has(requesterRole)) {
          duplicateRequesterRoles.add(requesterRole);
        }
        seenRequesterRoles.add(requesterRole);
        if (
          step.approverType === "ROLE" &&
          requesterRole === String(step.approverRole || "").toLowerCase().trim()
        ) {
          setError(`Requester role and approver role cannot be the same for "${requesterRole}".`);
          return;
        }
      }
      if (duplicateRequesterRoles.size > 0) {
        setError(
          `Duplicate leave requester role mappings found: ${Array.from(duplicateRequesterRoles).join(", ")}`
        );
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccess("");
    try {
      const payload = {
        modules: sortedModules.map((m) => ({
          module: m.module,
          steps: [...m.steps]
            .sort((a, b) => a.levelNo - b.levelNo)
            .map((s, idx) => ({
              levelNo: idx + 1,
              requesterRole: m.module === "LEAVE" ? (s.requesterRole || "").toLowerCase() : null,
              approverType: s.approverType,
              approverRole: s.approverType === "ROLE" ? s.approverRole || "" : null,
              approverUserId: s.approverType === "SPECIFIC_USER" ? s.approverUserId || null : null,
            })),
        })),
      };
      const response = await api.put<ModuleConfig[]>("/api/approval-hierarchy/current", payload);
      setModules(Array.isArray(response.data) ? response.data : []);
      setSuccess("Approval hierarchy updated successfully.");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "Unable to save approval hierarchy.";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (!canManageHierarchy) {
    return (
      <div className="mx-auto max-w-3xl rounded-md border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700">
        You do not have permission to manage approval hierarchy.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Approval Hierarchy</h1>
          <p className="mt-1 text-sm text-sky-50">
            Configure who approves leave, timesheet, travel, and expense requests level by level.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {loading || menuSettingsLoading ? (
        <div className="rounded-md border border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
          Loading hierarchy...
        </div>
      ) : (
        <>
          {visibleModules.map((moduleConfig) => (
            <section
              key={moduleConfig.module}
              className="rounded-md border border-slate-300 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {moduleLabels[moduleConfig.module]} Approval
                </h2>
                <div className="flex items-center gap-2">
                  {moduleConfig.module === "LEAVE" && (
                    <button
                      type="button"
                      onClick={applyRecommendedLeaveMappings}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                    >
                      Apply Recommended Mapping
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => addLevel(moduleConfig.module)}
                    className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    {moduleConfig.module === "LEAVE" ? "Add Role Mapping" : "Add Level"}
                  </button>
                </div>
              </div>
              {moduleConfig.module === "LEAVE" && (
                <p className="mb-3 text-xs text-slate-500">
                  Map each requester role to one approver strategy. One requester role can have only one mapping.
                </p>
              )}

              <div className="space-y-2">
                {moduleConfig.steps
                  .sort((a, b) => a.levelNo - b.levelNo)
                  .map((step) => (
                    <div
                      key={`${moduleConfig.module}-${step.levelNo}`}
                      className={`grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 ${
                        moduleConfig.module === "LEAVE"
                          ? "md:grid-cols-[130px_180px_220px_1fr_auto]"
                          : "md:grid-cols-[110px_220px_1fr_auto]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-700">
                        {moduleConfig.module === "LEAVE" ? "Requester Role" : `Level ${step.levelNo}`}
                      </div>
                      {moduleConfig.module === "LEAVE" && (
                        <select
                          value={step.requesterRole || ""}
                          onChange={(event) =>
                            updateStep(moduleConfig.module, step.levelNo, {
                              requesterRole: event.target.value,
                            })
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                        >
                          <option value="">Select requester role</option>
                          {leaveRequesterRoleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      )}
                      <select
                        value={step.approverType}
                        onChange={(event) =>
                          updateStep(moduleConfig.module, step.levelNo, {
                            approverType: event.target.value as ApproverType,
                            approverRole: null,
                            approverUserId: null,
                            approverUserName: null,
                          })
                        }
                        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                      >
                        <option value="REPORTING_MANAGER">Reporting Manager</option>
                        <option value="ROLE">Role</option>
                        <option value="SPECIFIC_USER">Specific User</option>
                      </select>

                      {step.approverType === "ROLE" ? (
                        <select
                          value={step.approverRole || ""}
                          onChange={(event) =>
                            updateStep(moduleConfig.module, step.levelNo, {
                              approverRole: event.target.value,
                            })
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                        >
                          <option value="">Select role</option>
                          {roleOptions
                            .filter((role) =>
                              moduleConfig.module === "LEAVE"
                                ? role !== String(step.requesterRole || "").toLowerCase()
                                : true
                            )
                            .map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                            ))}
                        </select>
                      ) : step.approverType === "SPECIFIC_USER" ? (
                        <select
                          value={step.approverUserId || ""}
                          onChange={(event) => {
                            const nextId = Number(event.target.value) || null;
                            const emp = employees.find((e) => e.id === nextId);
                            updateStep(moduleConfig.module, step.levelNo, {
                              approverUserId: nextId,
                              approverUserName: emp
                                ? `${emp.firstName} ${emp.lastName}`
                                : null,
                            });
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
                        >
                          <option value="">Select user</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.code ? `${emp.code} - ` : ""}
                              {emp.firstName} {emp.lastName} ({emp.role || "employee"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-600">
                          Direct manager of requester
                        </div>
                      )}

                      {moduleConfig.steps.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeLevel(moduleConfig.module, step.levelNo)}
                          className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
              </div>
            </section>
          ))}

          {visibleModules.length === 0 && (
            <div className="rounded-md border border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
              No approval hierarchy modules are enabled for this organization.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Hierarchy"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

