import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/components/AuthProvider";
import { FaTasks, FaBell, FaUser, FaCog, FaSignOutAlt, FaChevronDown } from "react-icons/fa";

export default function Navigation() {
  const { user, logout, isAdmin } = useAuthContext();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FaTasks className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Azzrk Task Manager</h1>
            <p className="text-sm text-gray-500">
              {isAdmin ? "Admin Dashboard" : "Member Dashboard"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-testid="button-user-menu">
              <Button variant="ghost" className="flex items-center gap-3 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <FaUser className="text-sm" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-700">{user?.displayName}</span>
                <FaChevronDown className="text-gray-400 text-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem data-testid="menu-profile">
                <FaUser className="mr-3 text-gray-400" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-settings">
                <FaCog className="mr-3 text-gray-400" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                <FaSignOutAlt className="mr-3 text-gray-400" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
