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
  GraduationCap,
  Briefcase,
  Heart,
  ShieldAlert,
  Users,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import useOrganizationMenuSettings from "../hooks/useOrganizationMenuSettings";

interface EducationRecord {
  id?: number;
  degree?: string;
  institution?: string;
  year?: string;
  field?: string;
}

interface ExperienceRecord {
  id?: number;
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface MedicalRecord {
  id?: number;
  condition?: string;
  date?: string;
  details?: string;
}

interface FamilyDetailRecord {
  id?: number;
  name?: string;
  relationship?: string;
  contact?: string;
}

interface EmployeeProfileResponse {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  address?: string;
  department?: string;
  joinDate?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactNumber?: string;
  alternateContactNumber?: string | number;
  allowEmergencyContactVisibilityToHr?: boolean;
  education?: EducationRecord[];
  experience?: ExperienceRecord[];
  skills?: string[];
  interests?: string[];
  medicalRecords?: MedicalRecord[];
  familyDetails?: FamilyDetailRecord[];
}

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
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactNumber: "",
    alternateContactNumber: "",
    allowEmergencyContactVisibilityToHr: false,
  });
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [experienceRecords, setExperienceRecords] = useState<ExperienceRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [familyDetails, setFamilyDetails] = useState<FamilyDetailRecord[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonalInfo = async (employeeId: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<EmployeeProfileResponse>(
          `/auth/employees/${employeeId}`
        );
        const data = response.data;
        setPersonalInfo({
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          email: data.username || "Not Available",
          phone: data.phone || "Not Available",
          address: data.address || "Not Available",
          department: data.department || "Not Available",
          joinDate: data.joinDate || "Not Available",
          emergencyContactName: data.emergencyContactName || "Not Available",
          emergencyContactRelation: data.emergencyContactRelation || "Not Available",
          emergencyContactNumber: data.emergencyContactNumber || "Not Available",
          alternateContactNumber: data.alternateContactNumber
            ? String(data.alternateContactNumber)
            : "Not Available",
          allowEmergencyContactVisibilityToHr: Boolean(
            data.allowEmergencyContactVisibilityToHr
          ),
        });
        setEducationRecords(Array.isArray(data.education) ? data.education : []);
        setExperienceRecords(Array.isArray(data.experience) ? data.experience : []);
        setMedicalRecords(Array.isArray(data.medicalRecords) ? data.medicalRecords : []);
        setFamilyDetails(Array.isArray(data.familyDetails) ? data.familyDetails : []);
        setSkills(Array.isArray(data.skills) ? data.skills.filter(Boolean) : []);
        setInterests(Array.isArray(data.interests) ? data.interests.filter(Boolean) : []);
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
  const isEmployeeManagementView = Boolean(id);
  const currentRole = (user?.role || "").toString().toLowerCase();
  const isHrOrOrgAdmin = currentRole === "hr" || currentRole === "org_admin";
  const canReadEmployees = hasPermission("read", "employees");
  const isHrOrgAdminEmployeeView =
    isEmployeeManagementView &&
    canReadEmployees &&
    isHrOrOrgAdmin;
  const canViewSensitiveContactDetails =
    isHrOrgAdminEmployeeView && personalInfo.allowEmergencyContactVisibilityToHr;
  const shouldShowSensitivePrivacyNotice =
    isHrOrgAdminEmployeeView && !personalInfo.allowEmergencyContactVisibilityToHr;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Self Service Portal</h1>
          <p className="mt-1 text-sm text-sky-50">
            {id
              ? "Viewing employee profile and emergency information."
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
              {id ? "Employee Management View" : "Self View"}
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

            {canViewSensitiveContactDetails && (
              <div className="mt-5">
                <h3 className="mb-3 text-base font-semibold text-slate-900">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Contact Name</p>
                    <p className="text-sm font-medium text-slate-800">
                      {personalInfo.emergencyContactName}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Relationship</p>
                    <p className="text-sm font-medium text-slate-800">
                      {personalInfo.emergencyContactRelation}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Emergency Number</p>
                    <p className="text-sm font-medium text-slate-800">
                      {personalInfo.emergencyContactNumber}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Alternate Number</p>
                    <p className="text-sm font-medium text-slate-800">
                      {personalInfo.alternateContactNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {shouldShowSensitivePrivacyNotice && (
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This employee has chosen not to share emergency contact details with HR/Org Admin.
              </div>
            )}

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

      {!error && !loading && isHrOrgAdminEmployeeView && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            </div>
            {educationRecords.length ? (
              <div className="space-y-3">
                {educationRecords.map((record, index) => (
                  <div key={record.id ?? `${record.degree}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {record.degree || "Degree not provided"}
                    </p>
                    <p className="text-sm text-slate-700">
                      {(record.field || "Field not provided")} - {(record.institution || "Institution not provided")}
                    </p>
                    <p className="text-xs text-slate-500">Year: {record.year || "Not provided"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No education records submitted yet.</p>
            )}
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Work Experience</h2>
            </div>
            {experienceRecords.length ? (
              <div className="space-y-3">
                {experienceRecords.map((record, index) => (
                  <div key={record.id ?? `${record.company}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {record.position || "Position not provided"}
                    </p>
                    <p className="text-sm text-slate-700">{record.company || "Company not provided"}</p>
                    <p className="text-xs text-slate-500">
                      {record.startDate || "N/A"} - {record.endDate || "Present"}
                    </p>
                    {record.description && (
                      <p className="mt-2 text-sm text-slate-600">{record.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No experience records submitted yet.</p>
            )}
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Skills & Interests</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs uppercase text-slate-500">Skills</p>
                {skills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No skills submitted yet.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-slate-500">Interests</p>
                {interests.length ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest, index) => (
                      <span
                        key={`${interest}-${index}`}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No interests submitted yet.</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Medical Records</h2>
            </div>
            {medicalRecords.length ? (
              <div className="space-y-3">
                {medicalRecords.map((record, index) => (
                  <div key={record.id ?? `${record.condition}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {record.condition || "Condition not provided"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Date: {record.date || "Not provided"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {record.details || "No additional details provided."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No medical records submitted yet.</p>
            )}
          </section>

          <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-900">Family Details</h2>
            </div>
            {canViewSensitiveContactDetails ? (
              familyDetails.length ? (
                <div className="space-y-3">
                  {familyDetails.map((detail, index) => (
                    <div
                      key={detail.id ?? `${detail.name}-${index}`}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {detail.name || "Name not provided"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Relationship: {detail.relationship || "Not provided"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Contact: {detail.contact || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No family details submitted yet.</p>
              )
            ) : (
              <p className="text-sm text-amber-700">
                Family details are hidden based on employee privacy settings.
              </p>
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
