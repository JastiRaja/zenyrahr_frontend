import React, { useEffect, useMemo, useState } from "react";
import CommonDialog from "../components/CommonDialog";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { isMainPlatformAdmin } from "../types/auth";

interface Project {
  id: number;
  projectName: string;
  description: string;
  startDate: string;
  deadline: string;
  status: "ACTIVE" | "COMPLETED";
  employeeIds: number[];
}

interface EmployeeOption {
  id: number;
  code?: string;
  firstName: string;
  lastName: string;
  role?: string;
}

type ProjectForm = {
  projectName: string;
  description: string;
  startDate: string;
  deadline: string;
  status: "ACTIVE" | "COMPLETED";
  employeeIds: number[];
};

const emptyForm: ProjectForm = {
  projectName: "",
  description: "",
  startDate: "",
  deadline: "",
  status: "ACTIVE",
  employeeIds: [],
};

const MAX_PROJECT_DESCRIPTION_LENGTH = 10000;

const ProjectManagement: React.FC = () => {
  const { user } = useAuth();
  const isReadOnlyAdmin = isMainPlatformAdmin(user?.role);
  const canEditProjects = !isReadOnlyAdmin;
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const loadData = async () => {
    try {
      const [projectsResponse, employeesResponse] = await Promise.all([
        api.get("/api/projects"),
        api.get("/auth/employees"),
      ]);
      setProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
      setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : []);
    } catch (error) {
      console.error("Error fetching project data:", error);
      setMessage("Failed to load projects or employees.");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeCount = useMemo(
    () => projects.filter((project) => project.status === "ACTIVE").length,
    [projects]
  );

  const assignedCount = useMemo(
    () => projects.filter((project) => project.employeeIds.length > 0).length,
    [projects]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingProjectId(null);
  };

  const handleEmployeeToggle = (employeeId: number) => {
    setForm((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter((id) => id !== employeeId)
        : [...prev.employeeIds, employeeId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.projectName.trim() || !form.startDate || !form.deadline) {
      setMessage("Project name, start date, and deadline are required.");
      return;
    }
    if (form.description.trim().length > MAX_PROJECT_DESCRIPTION_LENGTH) {
      setMessage(`Project description cannot exceed ${MAX_PROJECT_DESCRIPTION_LENGTH} characters.`);
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const payload = {
        projectName: form.projectName.trim(),
        description: form.description.trim(),
        startDate: form.startDate,
        deadline: form.deadline,
        status: form.status,
        employeeIds: form.employeeIds,
      };

      if (editingProjectId) {
        await api.put(`/api/projects/${editingProjectId}`, payload);
        setMessage("Project updated successfully.");
      } else {
        await api.post("/api/projects", payload);
        setMessage("Project created successfully.");
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Error saving project:", error);
      setMessage(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setForm({
      projectName: project.projectName,
      description: project.description || "",
      startDate: project.startDate || "",
      deadline: project.deadline || "",
      status: project.status || "ACTIVE",
      employeeIds: project.employeeIds || [],
    });
  };

  const getEmployeeNames = (employeeIds: number[]) => {
    return employees
      .filter((employee) => employeeIds.includes(employee.id))
      .map((employee) =>
        `${employee.code ? `${employee.code} - ` : ""}${employee.firstName} ${employee.lastName}`
      );
  };

  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await api.delete(`/api/projects/${id}`);
      setMessage("Project deleted successfully.");
      await loadData();
    } catch (error) {
      console.error("Error deleting project:", error);
      setMessage("Failed to delete project.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="mt-1 text-sm text-sky-50">
            HR can create organization projects, assign employees, and mark work as active or completed.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Projects</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Active</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{activeCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Assigned</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{assignedCount}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Mode</p>
            <p className="mt-1 text-xl font-bold text-sky-700">
              {editingProjectId ? "Edit" : "Create"}
            </p>
          </div>
        </div>
      </section>

      {canEditProjects && (
      <section className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {editingProjectId ? "Update Project" : "Create Project"}
        </h2>

        {message && (
          <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Project Name
            </label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as "ACTIVE" | "COMPLETED",
                }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Deadline
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>Describe scope, goals, and key delivery expectations.</span>
            <span>
              {form.description.length}/{MAX_PROJECT_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Assign Employees
          </label>
          <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {employees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form.employeeIds.includes(employee.id)}
                    onChange={() => handleEmployeeToggle(employee.id)}
                  />
                  <span>
                    {employee.code ? `${employee.code} - ` : ""}
                    {employee.firstName} {employee.lastName}
                    {employee.role ? ` (${employee.role})` : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingProjectId ? "Update Project" : "Create Project"}
          </button>
          {editingProjectId && (
            <button
              onClick={resetForm}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </section>
      )}

      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 p-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Project List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Project</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Assigned Employees</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="font-semibold">{project.projectName}</div>
                      <div className="whitespace-pre-wrap break-words text-xs text-slate-500">
                        {project.description || "No description"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          project.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {project.employeeIds.length}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openProjectDetails(project)}
                          className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-500">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CommonDialog
        isOpen={deleteTargetId !== null}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        tone="error"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTargetId !== null) {
            void handleDeleteProject(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-md border border-slate-200 bg-white p-6 shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setSelectedProject(null)}
            >
              Close
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{selectedProject.projectName}</h2>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
              {selectedProject.description || "No description provided."}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Start Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedProject.startDate || "-"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Deadline</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedProject.deadline || "-"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase text-slate-500">Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedProject.status}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Assigned Employees</p>
              <div className="mt-2 space-y-2">
                {getEmployeeNames(selectedProject.employeeIds).length > 0 ? (
                  getEmployeeNames(selectedProject.employeeIds).map((name) => (
                    <div
                      key={name}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      {name}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No employees assigned.</p>
                )}
              </div>
            </div>

            {canEditProjects && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    startEditing(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteTargetId(selectedProject.id);
                    setSelectedProject(null);
                  }}
                  className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
