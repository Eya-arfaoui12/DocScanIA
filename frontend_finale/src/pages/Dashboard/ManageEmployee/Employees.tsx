import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import ConfirmDialog from "../../../components/ui/dialog/ConfirmDialog";
import { getAllUsers, deleteUser, toggleUserActive, AdminUser } from "../../../services/adminUserService";

interface Filters {
  search: string;
  role: string;
  status: string;
}

export default function AdminUserTable() {
  const navigate = useNavigate(); 
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState<Filters>({ search: "", role: "", status: "" });
  const [showFilters, setShowFilters] = useState(false);
  
  // État pour le dialogue de confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    userId: number | null;
    userName: string;
  }>({
    isOpen: false,
    userId: null,
    userName: ""
  });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = filters.search
        ? user.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.search.toLowerCase())
        : true;
      const matchesRole = filters.role ? user.role === filters.role : true;
      const matchesStatus =
        filters.status === "Active"
          ? user.is_active
          : filters.status === "Inactive"
          ? !user.is_active
          : true;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, filters]);

  const handleEdit = (id: number) => {
    navigate(`/admin/manage-employees/edit/${id}`);
  };  
  // Ouvrir le dialogue de confirmation
  const handleDeleteClick = (user: AdminUser) => {
    setDeleteDialog({
      isOpen: true,
      userId: user.id,
      userName: user.username || user.email
    });
  };

  // Confirmer la suppression
  const confirmDelete = async () => {
    if (!deleteDialog.userId) return;
    
    try {
      await deleteUser(deleteDialog.userId);
      setUsers((prev) => prev.filter((u) => u.id !== deleteDialog.userId));
      // Fermer le dialogue
      setDeleteDialog({ isOpen: false, userId: null, userName: "" });
    } catch (err) {
      console.error(err);
      // Vous pouvez ajouter une notification d'erreur ici
    }
  };

  const handleBlock = async (user: AdminUser) => {
    try {
      const updated = await toggleUserActive(user.id, !user.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({ search: "", role: "", status: "" });
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const getStatusColor = (is_active: boolean) => (is_active ? "success" : "error");

  const roleOptions = [...new Set(users.map(u => u.role))];
  

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Users</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your platform users</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              Filter
              {hasActiveFilters && (
                <span className="flex items-center justify-center w-5 h-5 text-xs bg-blue-600 text-white rounded-full">
                  {Object.values(filters).filter((v) => v !== "").length}
                </span>
              )}
            </Button>
            <Button size="sm" variant="primary" onClick={() => navigate("add")}>
              Add User
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 pb-6 border-b border-gray-100 dark:border-white/[0.05]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Roles</option>
                  {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-6 sm:grid-cols-4">
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Users</div>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {users.filter(u => u.is_active).length}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Active</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {users.filter(u => !u.is_active).length}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Inactive</div>
          </div>
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredUsers.length}</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Filtered</div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader>User</TableCell>
                <TableCell isHeader>Email</TableCell>
                <TableCell isHeader>Role</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-5 py-4 text-start flex items-center gap-3">
                      {user.image && <img src={user.image} alt={user.username} className="w-10 h-10 rounded-full object-cover" />}
                      <span>{user.username}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">{user.email}</TableCell>
                    <TableCell className="px-4 py-3">{user.role}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={getStatusColor(user.is_active)} size="sm">
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(user.id)}
                          className="p-1 text-blue-600 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Block/Unblock Button */}
                        <button
                          onClick={() => handleBlock(user)}
                          className={`p-1 transition-colors rounded ${
                            user.is_active
                              ? "text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              : "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}
                          title={user.is_active ? "Block" : "Unblock"}
                        >
                          {user.is_active ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="p-1 text-red-600 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center justify-between gap-4 p-6 border-t border-gray-100 sm:flex-row dark:border-white/[0.05]">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold">{filteredUsers.length}</span> of <span className="font-semibold">{users.length}</span> users
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="primary" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>

      {/* Dialogue de confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, userId: null, userName: "" })}
        onConfirm={confirmDelete}
        title="Supprimer l'utilisateur"
        message={
          <div>
            <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong className="text-gray-900 dark:text-white">{deleteDialog.userName}</strong> ?</p>
            <p className="mt-2 text-red-600 dark:text-red-400">Cette action est irréversible.</p>
          </div>
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
      />
    </>
  );
}