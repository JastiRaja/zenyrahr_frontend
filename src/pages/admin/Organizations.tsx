import { FormEvent, useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCcw } from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import LoadingButton from "../../components/LoadingButton";

type Organization = {
  id: number;
  code?: string;
  name: string;
  address?: string;
  logoUrl?: string;
  active?: boolean;
  createdAt?: string;
  userCount?: number;
  activeUserCount?: number;
  maxActiveUsers?: number;
  employeeManagementEnabled?: boolean;
  selfServiceEnabled?: boolean;
  attendanceEnabled?: boolean;
  leaveManagementEnabled?: boolean;
  holidayManagementEnabled?: boolean;
  payrollEnabled?: boolean;
  travelEnabled?: boolean;
  expenseEnabled?: boolean;
  timesheetEnabled?: boolean;
};

type ModuleKey =
  | "employeeManagementEnabled"
  | "selfServiceEnabled"
  | "attendanceEnabled"
  | "timesheetEnabled"
  | "leaveManagementEnabled"
  | "holidayManagementEnabled"
  | "payrollEnabled"
  | "travelEnabled"
  | "expenseEnabled";

const MODULE_OPTIONS: { key: ModuleKey; label: string }[] = [
  { key: "employeeManagementEnabled", label: "Employee Management" },
  { key: "selfServiceEnabled", label: "Self Service" },
  { key: "attendanceEnabled", label: "Attendance" },
  { key: "timesheetEnabled", label: "Time Sheet" },
  { key: "leaveManagementEnabled", label: "Leave Management" },
  { key: "holidayManagementEnabled", label: "Holiday Management" },
  { key: "payrollEnabled", label: "Payroll" },
  { key: "travelEnabled", label: "Travel" },
  { key: "expenseEnabled", label: "Expense" },
];

type OrganizationForm = {
  code: string;
  name: string;
  address: string;
  logoUrl: string;
  maxActiveUsers: number;
  employeeManagementEnabled: boolean;
  selfServiceEnabled: boolean;
  attendanceEnabled: boolean;
  leaveManagementEnabled: boolean;
  holidayManagementEnabled: boolean;
  payrollEnabled: boolean;
  travelEnabled: boolean;
  expenseEnabled: boolean;
  timesheetEnabled: boolean;
};

const buildOrgCode = () => `ORG-${Date.now()}`;

const emptyForm = (): OrganizationForm => ({
  code: buildOrgCode(),
  name: "",
  address: "",
  logoUrl: "",
  maxActiveUsers: 25,
  employeeManagementEnabled: true,
  selfServiceEnabled: true,
  attendanceEnabled: true,
  leaveManagementEnabled: true,
  holidayManagementEnabled: true,
  payrollEnabled: true,
  travelEnabled: true,
  expenseEnabled: true,
  timesheetEnabled: true,
});

export default function Organizations() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [limitDrafts, setLimitDrafts] = useState<Record<number, number>>({});
  const [logoInputMode, setLogoInputMode] = useState<"url" | "upload">("url");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [form, setForm] = useState<OrganizationForm>(emptyForm());

  const sortedOrganizations = useMemo(
    () => [...organizations].sort((a, b) => b.id - a.id),
    [organizations]
  );

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const overviewResponse = await api.get<Organization[]>("/api/organizations/overview");
      const overviewList = Array.isArray(overviewResponse.data) ? overviewResponse.data : [];
      setOrganizations(overviewList);
      const drafts: Record<number, number> = {};
      overviewList.forEach((org) => {
        drafts[org.id] = Number(org.maxActiveUsers || 0);
      });
      setLimitDrafts(drafts);
    } catch (fetchError: any) {
      const message =
        fetchError?.response?.data?.message ||
        fetchError?.response?.data?.ErrorMessage ||
        "Unable to load organizations.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleUpdateActiveLimit = async (organizationId: number) => {
    const nextLimit = Number(limitDrafts[organizationId] || 0);
    if (!Number.isFinite(nextLimit) || nextLimit <= 0) {
      setError("Active user limit must be greater than zero.");
      return;
    }
    try {
      setError(null);
      await api.put(`/api/organizations/${organizationId}`, { maxActiveUsers: nextLimit });
      setSuccessMessage("Active user limit updated.");
      fetchOrganizations();
    } catch (updateError: any) {
      const message =
        updateError?.response?.data?.message ||
        updateError?.response?.data?.ErrorMessage ||
        "Unable to update active user limit.";
      setError(message);
    }
  };

  const handleOrganizationStatus = async (organizationId: number, enable: boolean) => {
    try {
      setError(null);
      const endpoint = enable ? "enable" : "disable";
      await api.patch(`/api/organizations/${organizationId}/${endpoint}`);
      setSuccessMessage(
        enable ? "Organization enabled successfully." : "Organization disabled successfully."
      );
      fetchOrganizations();
    } catch (statusError: any) {
      const message =
        statusError?.response?.data?.message ||
        statusError?.response?.data?.ErrorMessage ||
        "Unable to update organization status.";
      setError(message);
    }
  };

  const handleToggleMenuFeature = async (
    organization: Organization,
    key: ModuleKey
  ) => {
    try {
      setError(null);
      const nextValue = organization[key] === false;
      await api.put(`/api/organizations/${organization.id}`, { [key]: nextValue });
      setSuccessMessage(
        `${MODULE_OPTIONS.find((option) => option.key === key)?.label || "Module"} ${
          nextValue ? "enabled" : "disabled"
        } for ${organization.name}.`
      );
      fetchOrganizations();
    } catch (toggleError: any) {
      const message =
        toggleError?.response?.data?.message ||
        toggleError?.response?.data?.ErrorMessage ||
        "Unable to update menu settings.";
      setError(message);
    }
  };

  const handleAddOrgAdmin = (organizationId: number) => {
    navigate(
      `/employees/add?organizationId=${organizationId}&role=org_admin&returnTo=${encodeURIComponent(
        "/admin/organizations"
      )}`
    );
  };

  const handleCreateOrganization = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Organization name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage("");
    try {
      let logoUrl = form.logoUrl.trim();
      if (logoInputMode === "upload") {
        if (!logoFile) {
          setError("Please choose a logo image file.");
          setSubmitting(false);
          return;
        }
        const uploadFormData = new FormData();
        uploadFormData.append("file", logoFile);
        uploadFormData.append("organizationName", form.name.trim());
        const uploadResponse = await api.post("/api/organizations/upload-logo", uploadFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        logoUrl = uploadResponse.data?.logoUrl || "";
      }

      const payload = {
        code: form.code.trim() || buildOrgCode(),
        name: form.name.trim(),
        address: form.address.trim(),
        logoUrl,
        maxActiveUsers: Number(form.maxActiveUsers),
        employeeManagementEnabled: form.employeeManagementEnabled,
        selfServiceEnabled: form.selfServiceEnabled,
        attendanceEnabled: form.attendanceEnabled,
        timesheetEnabled: form.timesheetEnabled,
        leaveManagementEnabled: form.leaveManagementEnabled,
        holidayManagementEnabled: form.holidayManagementEnabled,
        payrollEnabled: form.payrollEnabled,
        travelEnabled: form.travelEnabled,
        expenseEnabled: form.expenseEnabled,
        active: true,
        deleted: false,
      };
      const response = await api.post<Organization>("/api/organizations", payload);
      setOrganizations((prev) => [response.data, ...prev]);
      setForm(emptyForm());
      setLogoInputMode("url");
      setLogoFile(null);
      setSuccessMessage("Organization created successfully.");
    } catch (createError: any) {
      const message =
        createError?.response?.data?.message ||
        createError?.response?.data?.ErrorMessage ||
        "Unable to create organization.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
              <p className="mt-1 text-sm text-sky-50">
                Main admin can add and review all organizations.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchOrganizations}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh List
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 divide-y divide-slate-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Total Organizations</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{organizations.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {organizations.filter((org) => org.active !== false).length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Disabled</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">
              {organizations.filter((org) => org.active === false).length}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Add Organization
        </h2>
        <form onSubmit={handleCreateOrganization} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Organization Code
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="ORG-00001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Organization Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Practio"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Logo URL (Optional)
            </label>
            <div className="mb-2 flex items-center gap-3 text-xs text-slate-600">
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
                    setForm((prev) => ({ ...prev, logoUrl: "" }));
                  }}
                />
                Upload Image
              </label>
            </div>
            {logoInputMode === "url" ? (
              <input
                type="url"
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logoUrl: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                placeholder="https://example.com/logo.png"
              />
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Address (Optional)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="City, State"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Active User Limit
            </label>
            <input
              type="number"
              min={1}
              value={form.maxActiveUsers}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxActiveUsers: Number(event.target.value) || 1 }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              placeholder="Max active users"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Sidebar Modules
            </label>
            <div className="grid grid-cols-1 gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 sm:grid-cols-2">
              {MODULE_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form[option.key]}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, [option.key]: event.target.checked }))
                    }
                  />
                  Enable {option.label}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <LoadingButton
              type="submit"
              loading={submitting}
              loadingText="Creating..."
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              leadingIcon={<Plus className="mr-2 h-4 w-4" />}
            >
              Create Organization
            </LoadingButton>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Organization
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Code
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Address
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Registered Users</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Active Users</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Active Limit</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Update Limit</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Sidebar Modules</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-slate-500">
                    Loading organizations...
                  </td>
                </tr>
              )}
              {!loading &&
                sortedOrganizations.map((organization) => (
                  <tr key={organization.id}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900">{organization.name}</span>
                      </div>
                      {organization.logoUrl && (
                        <p className="mt-1 text-xs text-slate-500">Logo configured</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {organization.code || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {organization.address || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {organization.userCount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {organization.activeUserCount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {organization.maxActiveUsers || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={limitDrafts[organization.id] ?? organization.maxActiveUsers ?? 1}
                          onChange={(event) =>
                            setLimitDrafts((prev) => ({
                              ...prev,
                              [organization.id]: Number(event.target.value) || 1,
                            }))
                          }
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveLimit(organization.id)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="grid min-w-[420px] grid-cols-2 gap-1.5 xl:grid-cols-3">
                        {MODULE_OPTIONS.map((option) => {
                          const enabled = organization[option.key] !== false;
                          return (
                            <button
                              key={`${organization.id}-${option.key}`}
                              type="button"
                              onClick={() => handleToggleMenuFeature(organization, option.key)}
                              className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                                enabled
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {option.label}: {enabled ? "On" : "Off"}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          organization.active === false
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {organization.active === false ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddOrgAdmin(organization.id)}
                          className="rounded-md border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                        >
                          Add Org Admin
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleOrganizationStatus(
                              organization.id,
                              organization.active === false
                            )
                          }
                          className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                            organization.active === false
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          {organization.active === false ? "Enable" : "Disable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && sortedOrganizations.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-slate-500">
                    No organizations found. Add your first organization above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
