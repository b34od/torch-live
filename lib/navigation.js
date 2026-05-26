export const ROLE_HOME = {
  student: "/student/now",
  staff: "/staff/now",
  admin: "/admin/schedule",
};

export const ROLE_NAV = {
  student: [
    { href: "/student/now", label: "Now", mobileLabel: "Now" },
    { href: "/student/schedule", label: "Schedule", mobileLabel: "Schedule" },
    { href: "/student/updates", label: "Updates", mobileLabel: "Updates" },
    { href: "/student/resources", label: "Resources", mobileLabel: "Resources" },
  ],
  staff: [
    { href: "/staff/now", label: "Now", mobileLabel: "Now" },
    { href: "/staff/schedule", label: "Schedule", mobileLabel: "Schedule" },
    { href: "/staff/updates", label: "Updates", mobileLabel: "Updates" },
    { href: "/staff/resources", label: "Resources", mobileLabel: "Resources" },
  ],
  admin: [
    { href: "/admin/schedule", label: "Schedule", mobileLabel: "Schedule" },
    { href: "/admin/announcements", label: "Announcements", mobileLabel: "Updates" },
    { href: "/admin/resources", label: "Resources", mobileLabel: "Res" },
    { href: "/admin/users", label: "Users", mobileLabel: "Users" },
    { href: "/admin/settings", label: "Settings", mobileLabel: "Settings" },
  ],
};
