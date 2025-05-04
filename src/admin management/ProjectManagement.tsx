import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    fetchProjects();
  }, []);

  // ✅ Fetch All Projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);

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
      const response = await fetch(`${API_BASE_URL}/projects`, {
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
        `${API_BASE_URL}/projects/${editProject.id}`,
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
    if (!window.confirm("Are you sure you want to delete this project?"))
      return;

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        Project Management
      </h1>

      {/* ✅ New Project Form */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Add New Project
        </h2>

        {message && <div className="text-red-500 font-medium">{message}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            className="w-full p-3 border rounded-md text-gray-700 focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Project Description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({ ...newProject, description: e.target.value })
            }
            className="w-full p-3 border rounded-md text-gray-700 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleAddProject}
          className="mt-4 px-6 py-3 bg-green-500 text-white rounded-md shadow hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
        >
          Add Project
        </button>
      </div>

      {/* ✅ Project Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <h2 className="p-6 border-b text-lg font-medium text-gray-900">
          Project List
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
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
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        project.name
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
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
                          className="w-full p-2 border rounded-md"
                        />
                      ) : (
                        project.description
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 flex gap-2">
                      {editProject?.id === project.id ? (
                        <>
                          <button
                            onClick={handleUpdateProject}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditProject(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditProject(project)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-500">
                    No projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;
