import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Users, Bell, Settings, LogOut, Cpu, Upload,
} from "lucide-react";

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview" },
  { to: "/admin/courses", icon: BookOpen, label: "Manage Courses" },
  { to: "/admin/students", icon: Users, label: "Students" },
  { to: "/admin/upload", icon: Upload, label: "Upload Content" },
  { to: "/admin/announcements", icon: Bell, label: "Announcements" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 hidden lg:flex">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
          <span className="font-display font-bold">NEXUS AI</span>
        </Link>
        <span className="text-xs text-primary font-medium mt-1 block">Admin Panel</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
