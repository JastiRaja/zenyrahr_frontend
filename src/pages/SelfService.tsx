import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  FileText,
  Wrench,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import useOrganizationMenuSettings from "../hooks/useOrganizationMenuSettings";

export default function SelfService() {
  const { id } = useParams<string>(); // Get the employee ID from the URL if present
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { menuSettings } = useOrganizationMenuSettings();
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    joinDate: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonalInfo = async (employeeId: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/auth/employees/${employeeId}`);
        const data = response.data;
        setPersonalInfo({
          name: `${data.firstName} ${data.lastName}`,
          email: data.username,
          phone: data.phone || "Not Available",
          address: data.address || "Not Available",
          department: data.department || "Not Available",
          joinDate: data.joinDate || "Not Available",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          "Unable to fetch personal information. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };


    if (id) {
      // If the manager is accessing another employee's page
      fetchPersonalInfo(id);
    } else {
      // If the employee is accessing their own page
      const storedUserData = localStorage.getItem("user");
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          if (userData?.id) {
            fetchPersonalInfo(userData.id);
          } else {
            setError("Invalid user data. Please log in again.");
          }
        } catch (error) {
          setError("Failed to parse user data. Please log in again.");
          console.error("Error parsing user data:", error);
          setLoading(false);
        }
      } else {
        setError("No user data found. Please log in again.");
        setLoading(false);
      }
    }
  }, [id]);

  type QuickAction = { name: string; icon: typeof Calendar; href: string };

  const selfQuickActions = useMemo((): QuickAction[] => {
    const items: QuickAction[] = [];
    if (menuSettings.leaveManagementEnabled && hasPermission("submit", "leave")) {
      items.push({ name: "Apply for Leave", icon: Calendar, href: "/leave/request" });
    }
    if (menuSettings.timesheetEnabled && hasPermission("submit", "timesheet")) {
      items.push({ name: "Submit Timesheet", icon: FileText, href: "/timesheet/submit" });
    }
    items.push({ name: "Service Request", icon: Wrench, href: "/service-request" });
    return items;
  }, [
    menuSettings.timesheetEnabled,
    menuSettings.leaveManagementEnabled,
    hasPermission,
  ]);
  const infoRows = [
    { label: "Employee", value: personalInfo.name, icon: UserCircle },
    { label: "Email", value: personalInfo.email, icon: Mail },
    { label: "Phone", value: personalInfo.phone, icon: Phone },
    { label: "Address", value: personalInfo.address, icon: MapPin },
    { label: "Department", value: personalInfo.department, icon: Building },
    { label: "Join Date", value: personalInfo.joinDate, icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Self Service Portal</h1>
          <p className="mt-1 text-sm text-sky-50">
            {id
              ? "Viewing employee profile and basic information."
              : "Access and manage your personal information and requests."}
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Profile Name</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {personalInfo.name || "Loading..."}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Department</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {personalInfo.department || "--"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Join Date</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {personalInfo.joinDate || "--"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Access Type</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">
              {id ? "Manager View" : "Self View"}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!error && !loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Personal Information</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {infoRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="rounded-md bg-white p-2">
                      <Icon className="h-4 w-4 text-sky-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase text-slate-500">{row.label}</p>
                      <p className="truncate text-sm font-medium text-slate-800">{row.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!id && (
              <button
                className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/UpdateEmployee")}
              >
                Edit Information
              </button>
            )}
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Quick Actions</h2>
            {!id ? (
              <div className="grid grid-cols-1 gap-3">
                {selfQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.name}
                      to={action.href}
                      className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <div className="rounded-md bg-white p-2">
                        <Icon className="h-4 w-4 text-sky-700" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {action.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                Quick actions are available only in self view.
              </div>
            )}
          </section>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-md border border-slate-300 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Loading self service details...
        </div>
      )}
    </div>
  );
}
