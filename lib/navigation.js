export const ROLE_HOME = {
  student: "/student/now",
  staff: "/staff/now",
  admin: "/admin/schedule",
};

export const ROLE_NAV = {
  student: [
    { href: "/student/now", label: "Now" },
    { href: "/student/schedule", label: "Schedule" },
    { href: "/student/updates", label: "Updates" },
    { href: "/student/resources", label: "Resources" },
  ],
  staff: [
    { href: "/staff/now", label: "Now" },
    { href: "/staff/schedule", label: "Schedule" },
    { href: "/staff/updates", label: "Updates" },
    { href: "/staff/resources", label: "Resources" },
  ],
  admin: [
    { href: "/admin/schedule", label: "Schedule" },
    { href: "/admin/announcements", label: "Announcements" },
    { href: "/admin/resources", label: "Resources" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/settings", label: "Settings" },
  ],
};
