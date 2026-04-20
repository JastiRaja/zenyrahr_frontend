import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { isMainPlatformAdmin, MAIN_PLATFORM_ADMIN_ROLE } from "../../types/auth";
import api from "../../api/axios";
import CommonDialog from "../../components/CommonDialog";
import LoadingButton from "../../components/LoadingButton";

type NamedOption = {
  name: string;
};

type OrganizationOption = {
  id: number;
  name: string;
  logoUrl?: string;
  address?: string;
};

type EmployeeCodeSettings = {
  employeeCodePrefix: string;
  employeeCodePadding: number;
  nextEmployeeCodeNumber: number;
  allowManualEmployeeCodeOverride: boolean;
};

type ExistingEmployee = {
  id: number;
  username?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
};

export default function AddEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, user } = useAuth();
  const canManageEmployees = hasPermission("manage", "employees");
  const isMainAdmin = isMainPlatformAdmin(user?.role);
  const isOrgAdmin = user?.role?.toLowerCase() === "org_admin";
  const isHr = user?.role?.toLowerCase() === "hr";
  const searchParams = new URLSearchParams(location.search);
  const initialRole = (searchParams.get("role") || "").toLowerCase();
  const initialOrganizationId = searchParams.get("organizationId") || "";
  const returnToParam = searchParams.get("returnTo") || "";
  const safeReturnTo = returnToParam.startsWith("/") ? returnToParam : "";
  const isOrgAdminSetupMode = isMainAdmin && initialRole === "org_admin";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    workLocation: "",
    role: initialRole,
    organizationId: initialOrganizationId,
  });

  const [designations, setDesignations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [workLocations, setWorkLocations] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [existingEmployees, setExistingEmployees] = useState<ExistingEmployee[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [employeeCodeSettings, setEmployeeCodeSettings] = useState<EmployeeCodeSettings | null>(null);
  const [manualEmployeeCode, setManualEmployeeCode] = useState("");
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    tone: "default" | "success" | "error";
    redirectTo: string | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    tone: "default",
    redirectTo: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizePhone = (value: string) => value.replace(/[^\d]/g, "");

  useEffect(() => {
    if (!isOrgAdminSetupMode) return;
    setFormData((prev) => ({
      ...prev,
      role: "org_admin",
      department: prev.department || "org_admin",
      position: prev.position || "org_admin",
    }));
  }, [isOrgAdminSetupMode]);

  useEffect(() => {
    if (!canManageEmployees) return;

    // Fetch initial data for designations, departments, and work locations
    const fetchDesignations = async () => {
      try {
        const response = await api.get<NamedOption[]>("/api/Designation");
        const data = response.data;
        setDesignations(data.map((item) => item.name));
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await api.get<NamedOption[]>("/api/Department");
        const data = response.data;
        setDepartments(data.map((item) => item.name));
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchWorkLocations = async () => {
      try {
        const response = await api.get<NamedOption[]>("/api/location");
        const data = response.data;
        setWorkLocations(data.map((item) => item.name));
      } catch (error) {
        console.error("Error fetching work locations:", error);
      }
    };

    const fetchOrganizations = async () => {
      if (!isMainAdmin) return;
      try {
        const response = await api.get<OrganizationOption[]>("/api/organizations");
        const data = response.data;
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    const fetchRoles = async () => {
      try {
        if (isMainAdmin && !formData.organizationId) {
          setRoles([]);
          return;
        }
        const query = isMainAdmin ? `?organizationId=${formData.organizationId}` : "";
        const response = await api.get<NamedOption[]>(`/api/roles${query}`);
        const data = Array.isArray(response.data) ? response.data : [];
        setRoles(data.map((item) => item.name));
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    const fetchEmployeeCodeSettings = async () => {
      try {
        if (isMainAdmin && formData.organizationId) {
          const response = await api.get<EmployeeCodeSettings>(
            `/api/organizations/${formData.organizationId}/employee-code-settings`
          );
          setEmployeeCodeSettings(response.data);
          return;
        }
        if (isMainAdmin && !formData.organizationId) {
          setEmployeeCodeSettings(null);
          return;
        }
        const response = await api.get<EmployeeCodeSettings>("/api/organizations/current/employee-code-settings");
        setEmployeeCodeSettings(response.data);
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
  }, [canManageEmployees, isMainAdmin, formData.organizationId]);

  useEffect(() => {
    if (!canManageEmployees) return;
    const fetchEmployees = async () => {
      try {
        const response = await api.get<ExistingEmployee[]>("/auth/employees");
        setExistingEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching existing employees:", error);
      }
    };
    fetchEmployees();
  }, [canManageEmployees]);

  const roleOptions = Array.from(
    new Set([...roles, ...(formData.role ? [formData.role] : [])])
  );
  const assignableRoleOptions = roleOptions.filter((role) => {
    const normalized = role.toLowerCase();
    if (isHr || isOrgAdmin) {
      return normalized !== MAIN_PLATFORM_ADMIN_ROLE && normalized !== "org_admin";
    }
    return true;
  });

  const normalizedEmail = normalizeEmail(formData.username);
  const normalizedPhone = normalizePhone(formData.phone);

  const duplicateEmailEmployee = existingEmployees.find(
    (employee) => normalizeEmail(employee.username || "") === normalizedEmail
  );
  const duplicatePhoneEmployee = normalizedPhone
    ? existingEmployees.find(
        (employee) => normalizePhone(employee.phone || "") === normalizedPhone
      )
    : null;

  const hasDuplicateConflict = Boolean(duplicateEmailEmployee || duplicatePhoneEmployee);
  const isValidPhone = normalizedPhone.length >= 10 && normalizedPhone.length <= 15;
  const isValidManualCode = !manualEmployeeCode.trim()
    || /^[A-Z0-9_-]{3,32}$/i.test(manualEmployeeCode.trim());

  const onboardingChecks = [
    { label: "Name", done: Boolean(formData.firstName.trim() && formData.lastName.trim()) },
    { label: "Work email", done: Boolean(normalizedEmail) && !duplicateEmailEmployee },
    { label: "Phone", done: Boolean(formData.phone.trim()) && isValidPhone },
    { label: "Department", done: Boolean(formData.department.trim()) },
    { label: "Role", done: Boolean(formData.role.trim()) },
    { label: "Designation", done: Boolean(formData.position.trim()) },
    { label: "Join date", done: isOrgAdminSetupMode ? true : Boolean(formData.joinDate) },
    { label: "Location", done: isOrgAdminSetupMode ? true : Boolean(formData.workLocation) },
    {
      label: "Organization",
      done: isMainAdmin ? Boolean(formData.organizationId) : true,
    },
  ];
  const completedChecks = onboardingChecks.filter((item) => item.done).length;
  const onboardingProgress = Math.round((completedChecks / onboardingChecks.length) * 100);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    try {
      if (hasDuplicateConflict) {
        setDialogState({
          isOpen: true,
          title: "Possible Duplicate Found",
          message: "An employee with the same email or phone already exists. Please verify details before continuing.",
          tone: "error",
          redirectTo: null,
        });
        return;
      }
      if (!isValidPhone) {
        setDialogState({
          isOpen: true,
          title: "Invalid Phone Number",
          message: "Please enter a valid phone number between 10 and 15 digits.",
          tone: "error",
          redirectTo: null,
        });
        return;
      }
      if (!isValidManualCode) {
        setDialogState({
          isOpen: true,
          title: "Invalid Manual Employee ID",
          message: "Manual Employee ID can only include A-Z, 0-9, underscore, and hyphen (3-32 chars).",
          tone: "error",
          redirectTo: null,
        });
        return;
      }
      if (isMainAdmin && formData.role === "org_admin" && !formData.organizationId) {
        setDialogState({
          isOpen: true,
          title: "Organization Required",
          message: "Please select an organization for Organization Admin.",
          tone: "error",
          redirectTo: null,
        });
        return;
      }
      const payload: Record<string, unknown> = {
        ...formData,
        username: normalizedEmail,
      };
      if (isOrgAdmin && employeeCodeSettings?.allowManualEmployeeCodeOverride && manualEmployeeCode.trim()) {
        payload.code = manualEmployeeCode.trim().toUpperCase();
      }
      if (isMainAdmin && formData.organizationId) {
        payload.organization = { id: Number(formData.organizationId) };
      } else if (isMainAdmin) {
        payload.organization = null;
      }
      delete payload.organizationId;
      setSubmitting(true);
      await api.post("/auth/register", payload);
      const redirectTo = safeReturnTo
        ? safeReturnTo
        : isMainAdmin && formData.role === "org_admin"
        ? "/admin/organizations"
        : "/employees";

      setDialogState({
        isOpen: true,
        title: "Registration Successful",
        message: "A one-time password has been sent to the email.",
        tone: "success",
        redirectTo,
      });
    } catch (error: any) {
      console.error("Error during registration:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Failed to register user. Please check permissions and organization settings.";
      setDialogState({
        isOpen: true,
        title: "Registration Failed",
        message: String(message),
        tone: "error",
        redirectTo: null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Keep hooks order stable; gate UI after hooks are initialized.
  if (!canManageEmployees) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="mt-4 text-slate-600">
            Only authorized users can manage employees.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 ">
          Create Your Account
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Enter your details below to register
        </p>
        {isMainAdmin && formData.role === "org_admin" && formData.organizationId && (
          <p className="mt-2 text-sm text-sky-700">
            Organization Admin setup mode is enabled for organization ID {formData.organizationId}.
          </p>
        )}
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">Onboarding Completion</p>
          <p className="text-sm font-semibold text-sky-700">{completedChecks}/{onboardingChecks.length} complete</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-600 transition-all"
            style={{ width: `${onboardingProgress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {onboardingChecks.map((item) => (
            <span
              key={item.label}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.done
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {item.done ? "Done" : "Pending"}: {item.label}
            </span>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-control"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-control"
                placeholder="Enter last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-control"
                placeholder="Enter email"
                required
              />
              {duplicateEmailEmployee && (
                <p className="mt-1 text-xs text-rose-600">
                  This email is already linked to {duplicateEmailEmployee.firstName || "an employee"} {duplicateEmailEmployee.lastName || ""}.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-control"
                placeholder="Enter phone number"
                required
              />
              {!isValidPhone && formData.phone.trim() && (
                <p className="mt-1 text-xs text-rose-600">
                  Enter a valid phone number with 10-15 digits.
                </p>
              )}
              {duplicatePhoneEmployee && (
                <p className="mt-1 text-xs text-rose-600">
                  This phone number already exists for {duplicatePhoneEmployee.firstName || "an employee"} {duplicatePhoneEmployee.lastName || ""}.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Employment Details
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Department
              </label>
              {isOrgAdminSetupMode ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  className="input-control bg-slate-50"
                  readOnly
                />
              ) : (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-control"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Role
              </label>
              {isOrgAdminSetupMode ? (
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  className="input-control bg-slate-50"
                  readOnly
                />
              ) : (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-control"
                  required
                >
                  <option value="">Select Role</option>
                  {assignableRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {(isOrgAdmin || isMainAdmin) && employeeCodeSettings && (
              <div className="sm:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Employee ID Settings
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Auto format: <span className="font-semibold text-slate-800">{employeeCodeSettings.employeeCodePrefix}{String(employeeCodeSettings.nextEmployeeCodeNumber).padStart(employeeCodeSettings.employeeCodePadding, "0")}</span>
                </p>
                {!employeeCodeSettings.allowManualEmployeeCodeOverride && (
                  <div className="mt-2 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                    Auto-generated ID is enabled (manual override disabled)
                  </div>
                )}
                {isOrgAdmin && employeeCodeSettings.allowManualEmployeeCodeOverride && (
                  <div className="mt-3 max-w-sm">
                    <label className="block text-xs font-semibold uppercase text-slate-500">
                      Manual Employee ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={manualEmployeeCode}
                      onChange={(e) => setManualEmployeeCode(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                      placeholder={`${employeeCodeSettings.employeeCodePrefix}${String(employeeCodeSettings.nextEmployeeCodeNumber).padStart(employeeCodeSettings.employeeCodePadding, "0")}`}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Allowed: A-Z, 0-9, underscore, hyphen (3-32 chars). Must be unique.
                    </p>
                    {!isValidManualCode && (
                      <p className="mt-1 text-[11px] text-rose-600">
                        Invalid format for manual employee ID.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Designation
              </label>
              {isOrgAdminSetupMode ? (
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  className="input-control bg-slate-50"
                  readOnly
                />
              ) : (
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="input-control"
                  required
                >
                  <option value="">Select Designation</option>
                  {designations.map((designation) => (
                    <option key={designation} value={designation}>
                      {designation}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Join Date {isOrgAdminSetupMode ? "(Optional)" : ""}
              </label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className="input-control"
                required={!isOrgAdminSetupMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Work Location {isOrgAdminSetupMode ? "(Optional)" : ""}
              </label>
              <select
                name="workLocation"
                value={formData.workLocation}
                onChange={handleChange}
                className="input-control"
                required={!isOrgAdminSetupMode}
              >
                <option value="">Select Work Location</option>
                {workLocations.map((workLocation) => (
                  <option key={workLocation} value={workLocation}>
                    {workLocation}
                  </option>
                ))}
              </select>
            </div>

            {isMainAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Organization
              </label>
              <select
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                className="input-control"
              >
                <option value="">Select Organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(safeReturnTo || "/employees")}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <LoadingButton
            type="submit"
            loading={submitting}
            loadingText="Registering..."
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
            disabled={hasDuplicateConflict || !isValidPhone || !isValidManualCode}
          >
            Register
          </LoadingButton>
        </div>
      </form>
      <CommonDialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        tone={dialogState.tone}
        confirmText="OK"
        hideCancel
        onClose={() => {
          const route = dialogState.redirectTo;
          setDialogState({
            isOpen: false,
            title: "",
            message: "",
            tone: "default",
            redirectTo: null,
          });
          if (route) {
            navigate(route);
          }
        }}
      />
    </div>
  );
}
