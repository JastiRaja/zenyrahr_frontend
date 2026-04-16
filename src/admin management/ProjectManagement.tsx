import React, { useState, useEffect } from "react";
import CommonDialog from "../components/CommonDialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

interface Project {
  id: number;
  name: string;
  description: string;
  status?: string;
}

const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  // ✅ Fetch All Projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`);

      const data = await response.json();

      // ✅ Ensure API data is mapped correctly
      const formattedProjects = data.map((proj: any) => ({
        id: proj.id,
        name: proj.projectName, // Ensure API returns projectName
        description: proj.description,
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // ✅ Add a New Project
  const handleAddProject = async () => {
    if (!newProject.name.trim() || !newProject.description.trim()) {
      setMessage("⚠️ Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: newProject.name,
          description: newProject.description,
        }),
      });

      if (response.ok) {
        setMessage("✅ Project added successfully!");
        setNewProject({ name: "", description: "" });
        fetchProjects();
      } else {
        setMessage("❌ Failed to add project.");
      }
    } catch (error) {
      console.error("Error adding project:", error);
      setMessage("❌ Error adding project.");
    }
  };

  // ✅ Update an Existing Project
  const handleUpdateProject = async () => {
    if (
      !editProject ||
      !editProject.name.trim() ||
      !editProject.description.trim()
    ) {
      setMessage("⚠️ Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/projects/${editProject.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: editProject.name,
            description: editProject.description,
          }),
        }
      );

      if (response.ok) {
        setMessage("✅ Project updated successfully!");
        setEditProject(null); // ✅ Reset after updating
        fetchProjects(); // ✅ Refresh projects
      } else {
        setMessage("❌ Failed to update project.");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      setMessage("❌ Error updating project.");
    }
  };

  // ✅ Delete a Project
  const handleDeleteProject = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ Project deleted successfully!");
        fetchProjects();
      } else {
        setMessage("❌ Failed to delete project.");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      setMessage("❌ Error deleting project.");
    }
  };
  const successMessage = message.startsWith("✅");

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-6 py-5 text-white">
          <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
          <p className="mt-1 text-sm text-sky-50">
            Create and manage project records.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 bg-white lg:grid-cols-4 lg:divide-y-0">
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Projects</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{projects.length}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">Editing</p>
            <p className="mt-1 text-xl font-bold text-sky-700">{editProject ? "Yes" : "No"}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">New Project Name</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
              {newProject.name || "Not entered"}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs uppercase text-slate-500">New Description</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
              {newProject.description || "Not entered"}
            </p>
          </div>
        </div>
      </section>

      {/* ✅ New Project Form */}
      <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Add New Project
        </h2>

        {message && (
          <div
            className={`mb-3 rounded-md border px-4 py-2 text-sm ${
              successMessage
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Project Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            className="w-full rounded-md border border-slate-300 p-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleAddProject}
          className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Add Project
        </button>
      </div>

      {/* ✅ Project Table */}
      <div className="overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 p-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Project List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Project Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {editProject?.id === project.id ? (
                        <input
                          type="text"
                          value={editProject.name}
                          onChange={(e) =>
                            setEditProject({
                              ...editProject,
                              name: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                        />
                      ) : (
                        project.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {editProject?.id === project.id ? (
                        <input
                          type="text"
                          value={editProject.description}
                          onChange={(e) =>
                            setEditProject({
                              ...editProject,
                              description: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                        />
                      ) : (
                        project.description
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div className="flex gap-2">
                      {editProject?.id === project.id ? (
                        <>
                          <button
                            onClick={handleUpdateProject}
                            className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditProject(null)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditProject(project)}
                          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTargetId(project.id)}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-slate-500">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CommonDialog
        isOpen={deleteTargetId !== null}
        title="Delete Project"
        message="Are you sure you want to delete this project?"
        tone="error"
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTargetId !== null) {
            handleDeleteProject(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default ProjectManagement;
