"use client";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiSearch,
  FiMoon,
  FiSun,
  FiX,
  FiCheck,
  FiUserPlus,
  FiDownload,
} from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";

type Prospect = {
  id: number;
  name: string;
  email: string;
  company: string;
  status: "New" | "Contacted" | "Converted" | "Rejected";
  source: "LinkedIn" | "Email" | "Twitter" | "Website";
  date_added: string;
  notes?: string;
};

export default function ProspectingTool() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const correctPassword = "lsd";

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
      setPassword("");
    }
  };

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newProspect, setNewProspect] = useState<
    Omit<Prospect, "id" | "date_added">
  >({
    name: "",
    email: "",
    company: "",
    status: "New",
    source: "LinkedIn",
    notes: "",
  });
  const [statusFilter, setStatusFilter] = useState<Prospect["status"] | "All">(
    "All"
  );
  const [sourceFilter, setSourceFilter] = useState<Prospect["source"] | "All">(
    "All"
  );
  const [sortBy, setSortBy] = useState<
    "name" | "company" | "status" | "date_added"
  >("date_added");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<number[]>([]);
  const [isAddingProspect, setIsAddingProspect] = useState(false);
  const [message, setMessage] = useState("");

  // For editing
  const [editingProspectId, setEditingProspectId] = useState<number | null>(null);
  const [editingProspectData, setEditingProspectData] = useState<
    Partial<Prospect>
  >({});

  // For viewing prospect details
  const [viewingProspect, setViewingProspect] = useState<Prospect | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      async function fetchProspects() {
        const { data, error } = await supabase.from("prospects").select("*");
        if (error) {
          console.error("Error loading prospects:", error);
        } else {
          setProspects(data || []);
        }
      }
      fetchProspects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const filteredProspects = prospects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((p) => statusFilter === "All" || p.status === statusFilter)
    .filter((p) => sourceFilter === "All" || p.source === sourceFilter)
    .sort((a, b) => {
      if (sortBy === "date_added")
        return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
      return a[sortBy].localeCompare(b[sortBy]);
    });

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Adding prospect...");
    const prospectToAdd = {
      ...newProspect,
      date_added: new Date().toISOString().split("T")[0],
    };
    const { data, error } = await supabase
      .from("prospects")
      .insert([prospectToAdd])
      .select()
      .single();
    if (error) {
      console.error("Failed to add prospect:", error);
      setMessage("Failed to add prospect. Please try again.");
    } else if (data) {
      setProspects([...prospects, data]);
      setNewProspect({
        name: "",
        email: "",
        company: "",
        status: "New",
        source: "LinkedIn",
        notes: "",
      });
      setIsAddingProspect(false);
      setMessage("Prospect added successfully!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteProspect = async (id: number) => {
    const { error } = await supabase.from("prospects").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete prospect:", error);
    } else {
      setProspects(prospects.filter((p) => p.id !== id));
      setSelectedProspects(selectedProspects.filter((sid) => sid !== id));
    }
  };

  const toggleSelectProspect = (id: number) => {
    setSelectedProspects(
      selectedProspects.includes(id)
        ? selectedProspects.filter((selectedId) => selectedId !== id)
        : [...selectedProspects, id]
    );
  };

  const exportToCSV = () => {
    const headers = [
      "ID,Name,Email,Company,Status,Source,Date Added,Notes",
    ].join("\n");
    const csv = prospects
      .map((p) =>
        [
          p.id,
          p.name,
          p.email,
          p.company,
          p.status,
          p.source,
          p.date_added,
          p.notes || "",
        ].join(",")
      )
      .join("\n");
    const csvData = [headers, csv].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prospects.csv";
    link.click();
  };

  const closeView = () => setViewingProspect(null);

  return !isAuthenticated ? (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-50">
          Enter Password to Access
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50"
          autoFocus
        />
        <button
          type="submit"
          className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105"
        >
          Unlock
        </button>
      </form>
    </div>
  ) : (
    <Layout>
      <div
        className={`min-h-screen p-8 ${
          darkMode ? "bg-gray-900 text-gray-50" : "bg-gray-50 text-gray-900"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Potential Clients List
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddingProspect(!isAddingProspect)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-md"
            >
              <FiUserPlus /> {isAddingProspect ? "Cancel" : "Add Prospect"}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </div>
        {/* Message Display */}
        {message && (
          <div className="mb-4 p-3 rounded border border-purple-500 bg-purple-100 text-purple-800">
            {message}
          </div>
        )}
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Search, Filters, and Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Prospect["status"] | "All")
                }
                className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as Prospect["source"] | "All")
                }
                className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="All">All Sources</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Email">Email</option>
                <option value="Twitter">Twitter</option>
                <option value="Website">Website</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "name"
                      | "company"
                      | "status"
                      | "date_added"
                  )
                }
                className="p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-50 focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="date_added">Sort by: Date Added</option>
                <option value="name">Sort by: Name</option>
                <option value="company">Sort by: Company</option>
                <option value="status">Sort by: Status</option>
              </select>
            </div>
            {/* Bulk Actions */}
            {selectedProspects.length > 0 && (
              <div className="flex gap-4 mb-4">
                <button
                  onClick={async () => {
                    for (const id of selectedProspects) {
                      await handleDeleteProspect(id);
                    }
                    setSelectedProspects([]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-md"
                >
                  <FiTrash2 /> Delete Selected
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-md"
                >
                  <FiDownload /> Export Selected
                </button>
              </div>
            )}
            {/* Prospect Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedProspects(
                              e.target.checked ? prospects.map((p) => p.id) : []
                            )
                          }
                          checked={
                            selectedProspects.length === prospects.length &&
                            prospects.length > 0
                          }
                          aria-label="Select all prospects"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Added
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {filteredProspects.map((prospect) => {
                      const isEditing = editingProspectId === prospect.id;
                      return (
                        <tr
                          key={prospect.id}
                          className={
                            selectedProspects.includes(prospect.id)
                              ? "bg-purple-50 dark:bg-purple-900/30"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProspects.includes(prospect.id)}
                              onChange={() => toggleSelectProspect(prospect.id)}
                              aria-label={`Select prospect ${prospect.name}`}
                            />
                          </td>
                          {/* Editable Name */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-50 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                value={
                                  editingProspectData.name ?? prospect.name
                                }
                                onChange={(e) =>
                                  setEditingProspectData({
                                    ...editingProspectData,
                                    name: e.target.value,
                                  })
                                }
                                className="w-full p-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
                              />
                            ) : (
                              prospect.name
                            )}
                          </td>
                          {/* Editable Email */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {isEditing ? (
                              <input
                                type="email"
                                value={
                                  editingProspectData.email ?? prospect.email
                                }
                                onChange={(e) =>
                                  setEditingProspectData({
                                    ...editingProspectData,
                                    email: e.target.value,
                                  })
                                }
                                className="w-full p-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
                              />
                            ) : (
                              prospect.email
                            )}
                          </td>
                          {/* Editable Company */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300 font-medium">
                            {isEditing ? (
                              <input
                                type="text"
                                value={
                                  editingProspectData.company ?? prospect.company
                                }
                                onChange={(e) =>
                                  setEditingProspectData({
                                    ...editingProspectData,
                                    company: e.target.value,
                                  })
                                }
                                className="w-full p-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50"
                              />
                            ) : (
                              prospect.company
                            )}
                          </td>
                          {/* Status Editable */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editingProspectData.status ?? prospect.status}
                                onChange={(e) =>
                                  setEditingProspectData({
                                    ...editingProspectData,
                                    status: e.target.value as Prospect["status"],
                                  })
                                }
                                className={`p-1 rounded-md text-xs font-semibold ${
                                  (editingProspectData.status ?? prospect.status) === "New"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : (editingProspectData.status ?? prospect.status) === "Contacted"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : (editingProspectData.status ?? prospect.status) === "Converted"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Converted">Converted</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  prospect.status === "New"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : prospect.status === "Contacted"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : prospect.status === "Converted"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                {prospect.status}
                              </span>
                            )}
                          </td>
                          {/* Source Display */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {prospect.source}
                          </td>
                          {/* Date Added Display */}
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {prospect.date_added}
                          </td>
                          {/* Actions: Edit / Save / Cancel / Delete / View */}
                          <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={async () => {
                                    if (
                                      !editingProspectData.name ||
                                      !editingProspectData.email ||
                                      !editingProspectData.company
                                    ) {
                                      alert(
                                        "Name, Email, and Company cannot be empty."
                                      );
                                      return;
                                    }
                                    const { error } = await supabase
                                      .from("prospects")
                                      .update(editingProspectData)
                                      .eq("id", prospect.id);
                                    if (!error) {
                                      setProspects((prev) =>
                                        prev.map((p) =>
                                          p.id === prospect.id
                                            ? { ...p, ...editingProspectData }
                                            : p
                                        )
                                      );
                                      setEditingProspectId(null);
                                      setEditingProspectData({});
                                      setMessage("Prospect updated successfully!");
                                      setTimeout(() => setMessage(""), 3000);
                                    } else {
                                      console.error("Update failed:", error);
                                      alert("Update failed. Please try again.");
                                    }
                                  }}
                                  className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-all"
                                  title="Save"
                                >
                                  <FiCheck />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProspectId(null);
                                    setEditingProspectData({});
                                  }}
                                  className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all"
                                  title="Cancel"
                                >
                                  <FiX />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProspectId(prospect.id);
                                    setEditingProspectData(prospect);
                                  }}
                                  className="p-1.5 text-blue-500 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all transform hover:scale-110"
                                  title="Edit"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteProspect(prospect.id)}
                                  className="p-1.5 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all transform hover:scale-110"
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                                <button
                                  onClick={() => setViewingProspect(prospect)}
                                  className="p-1.5 text-green-600 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-all transform hover:scale-110"
                                  title="View Lead Details"
                                >
                                  <FiEye />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* Right Side: Add Prospect Form */}
          {isAddingProspect && (
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 h-fit sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                  Add New Prospect
                </h2>
                <button
                  onClick={() => setIsAddingProspect(false)}
                  className="p-1.5 text-gray-500 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  aria-label="Cancel adding prospect"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddProspect} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.name}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.email}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.company}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, company: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.status}
                    onChange={(e) =>
                      setNewProspect({
                        ...newProspect,
                        status: e.target.value as Prospect["status"],
                      })
                    }
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Source
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.source}
                    onChange={(e) =>
                      setNewProspect({
                        ...newProspect,
                        source: e.target.value as Prospect["source"],
                      })
                    }
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Email">Email</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-50 transition-all"
                    value={newProspect.notes}
                    onChange={(e) =>
                      setNewProspect({ ...newProspect, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale-105"
                >
                  <FiCheck /> Add Prospect
                </button>
              </form>
            </div>
          )}
        </div>

        {/* View Prospect Modal */}
        {viewingProspect && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={closeView}
          >
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-50">
                {viewingProspect.name}'s Details
              </h2>
              <p>
                <strong>Email:</strong> {viewingProspect.email}
              </p>
              <p>
                <strong>Company:</strong> {viewingProspect.company}
              </p>
              <p>
                <strong>Status:</strong> {viewingProspect.status}
              </p>
              <p>
                <strong>Source:</strong> {viewingProspect.source}
              </p>
              <p>
                <strong>Date Added:</strong> {viewingProspect.date_added}
              </p>
              <p>
                <strong>Notes:</strong> {viewingProspect.notes || "None"}
              </p>
              <button
                onClick={closeView}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
