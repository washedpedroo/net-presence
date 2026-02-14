"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Clock
} from "lucide-react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["ADMIN", "GP", "DIPENDENTE"] },
    { name: "Utenti", href: "/dashboard/users", icon: Users, roles: ["ADMIN"] },
    { name: "Dipendenti", href: "/dashboard/employees", icon: Users, roles: ["ADMIN", "GP"] },
    { name: "Timbrature", href: "/dashboard/timbrature", icon: Clock, roles: ["ADMIN", "GP"] },
    { name: "Giustificativi", href: "/dashboard/giustificativi", icon: FileText, roles: ["ADMIN", "GP", "DIPENDENTE"] },
    { name: "Le Mie Presenze", href: "/dashboard/mie-presenze", icon: Calendar, roles: ["DIPENDENTE"] },
    { name: "Report", href: "/dashboard/report", icon: FileText, roles: ["ADMIN", "GP"] },
    { name: "Configurazioni", href: "/dashboard/configurazioni", icon: Settings, roles: ["ADMIN"] },
  ];

  const filteredNav = navigation.filter((item) =>
    item.roles.includes(user.role || "")
  );

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <h1 className="text-white text-xl font-bold">Gestione Presenze</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-2">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Ruolo: {user.role === "ADMIN" ? "Amministratore" : user.role === "GP" ? "Gestore Presenze" : "Dipendente"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Esci
        </button>
      </div>
    </div>
  );
}
