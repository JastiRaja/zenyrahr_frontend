import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa"; // Import the icons

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;

export default function ManageEntities() {
  const [designations, setDesignations] = useState<
    { id: number; name: string }[]
  >([]);
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [workLocations, setWorkLocations] = useState<
    { id: number; name: string }[]
  >([]);
  const [newDesignation, setNewDesignation] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newWorkLocation, setNewWorkLocation] = useState("");

  useEffect(() => {
    // Fetch initial data for designations, departments, and work locations
    const fetchDesignations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Designation`);
        const data = await response.json();
        setDesignations(data);
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Department`);
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    const fetchWorkLocations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/location`);
        const data = await response.json();
        setWorkLocations(data);
      } catch (error) {
        console.error("Error fetching work locations:", error);
      }
    };

    fetchDesignations();
    fetchDepartments();
    fetchWorkLocations();
  }, []);

  const handleAddDesignation = async () => {
    if (
      newDesignation &&
      !designations.some((d) => d.name === newDesignation)
    ) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Designation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newDesignation }),
        });

        if (response.ok) {
          const newDesignationData = await response.json();
          setDesignations((prev) => [...prev, newDesignationData]);
          setNewDesignation("");
        } else {
          alert("Failed to add designation");
        }
      } catch (error) {
        console.error("Error adding designation:", error);
      }
    }
  };

  const handleDeleteDesignation = async (designationId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/Designation/${designationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDesignations((prev) =>
          prev.filter((designation) => designation.id !== designationId)
        );
      } else {
        alert("Failed to delete designation");
      }
    } catch (error) {
      console.error("Error deleting designation:", error);
    }
  };

  const handleAddDepartment = async () => {
    if (newDepartment && !departments.some((d) => d.name === newDepartment)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Department`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newDepartment }),
        });

        if (response.ok) {
          const newDepartmentData = await response.json();
          setDepartments((prev) => [...prev, newDepartmentData]);
          setNewDepartment("");
        } else {
          alert("Failed to add department");
        }
      } catch (error) {
        console.error("Error adding department:", error);
      }
    }
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/Department/${departmentId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDepartments((prev) =>
          prev.filter((department) => department.id !== departmentId)
        );
      } else {
        alert("Failed to delete department");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
    }
  };

  const handleAddWorkLocation = async () => {
    if (
      newWorkLocation &&
      !workLocations.some((w) => w.name === newWorkLocation)
    ) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/location`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newWorkLocation }),
        });

        if (response.ok) {
          const newWorkLocationData = await response.json();
          setWorkLocations((prev) => [...prev, newWorkLocationData]);
          setNewWorkLocation("");
        } else {
          alert("Failed to add work location");
        }
      } catch (error) {
        console.error("Error adding work location:", error);
      }
    }
  };

  const handleDeleteWorkLocation = async (workLocationId: number) => {
    try {
      // console.log(`Deleting work location with ID: ${workLocationId}`);
      const response = await fetch(
        `${API_BASE_URL}/api/location/${workLocationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // console.log(
        //   `Successfully deleted work location with ID: ${workLocationId}`
        // );
        setWorkLocations((prev) =>
          prev.filter((workLocation) => workLocation.id !== workLocationId)
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to delete work location:", errorData);
        alert("Failed to delete work location");
      }
    } catch (error) {
      console.error("Error deleting work location:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
        <p className="mt-2 text-lg text-gray-600">
          Add or delete designations, departments, and work locations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Designations
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Designation
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter new designation"
              />
              <button
                type="button"
                onClick={handleAddDesignation}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="min-w-full mt-4 border border-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {designations.map((designation) => (
                <tr key={designation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {designation.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteDesignation(designation.id)}
                      className="text-red-500 flex items-center"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Departments
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Department
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter new department"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="min-w-full mt-4 border border-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="text-red-500 flex items-center"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card p-6 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Work Locations
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Work Location
            </label>
            <div className="flex items-center mt-2">
              <input
                type="text"
                value={newWorkLocation}
                onChange={(e) => setNewWorkLocation(e.target.value)}
                className="block w-full pl-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter new work location"
              />
              <button
                type="button"
                onClick={handleAddWorkLocation}
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center"
              >
                <FaPlus className="mr-1" /> Add
              </button>
            </div>
          </div>
          <table className="min-w-full mt-4 border border-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Location
                </th>
                <th className="px-6 py-3 border-b border-gray-200 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workLocations.map((workLocation) => (
                <tr key={workLocation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workLocation.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkLocation(workLocation.id)}
                      className="text-red-500 flex items-center"
                    >
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
