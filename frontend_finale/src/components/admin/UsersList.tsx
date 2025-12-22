import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import type { AdminUser } from "../../services/adminUserService";

interface UsersListProps {
  users: AdminUser[];
}

export default function UsersList({ users }: UsersListProps) {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const getRoleBadge = (role: string) => {
    return role === "admin" ? (
      <Badge size="sm" color="error">Admin</Badge>
    ) : (
      <Badge size="sm" color="success">User</Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge size="sm" color="success">Active</Badge>
    ) : (
      <Badge size="sm" color="error">Inactive</Badge>
    );
  };

  const getInitials = (email: string, username?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Active Users
          </h3>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Recent active users in the system
          </p>
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View All Users
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Export List
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No users found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.username || user.email}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-semibold ${getAvatarColor(user.id)}`}>
                    {getInitials(user.email, user.username)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800 text-sm dark:text-white/90">
                    {user.username || user.email.split('@')[0]}
                  </p>
                  <p className="text-gray-500 text-xs dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getRoleBadge(user.role)}
                {getStatusBadge(user.is_active)}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full mt-4 py-2.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
        View All Users →
      </button>
    </div>
  );
}