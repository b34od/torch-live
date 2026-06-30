export const ROLE_HOME = {
  student: "/student/now",
  staff: "/staff/now",
  admin: "/admin",
};

const STUDENT_NAV = [
  { href: "/student/now", label: "Now", mobileLabel: "Now" },
  { href: "/student/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/student/updates", label: "Updates", mobileLabel: "Updates" },
  { href: "/student/resources", label: "Resources", mobileLabel: "Resources" },
  { href: "/student/guilds", label: "Guilds", mobileLabel: "Guilds" },
  { href: "/student/directory", label: "Directory", mobileLabel: "Directory" },
];

const STUDENT_MOBILE_NAV = [
  { href: "/student/now", label: "Now", mobileLabel: "Now" },
  { href: "/student/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/student/resources", label: "Resources", mobileLabel: "Resources" },
];

const STAFF_NAV = [
  { href: "/staff/now", label: "Now", mobileLabel: "Now" },
  { href: "/staff/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/staff/updates", label: "Updates", mobileLabel: "Updates" },
  { href: "/staff/resources", label: "Resources", mobileLabel: "Resources" },
  { href: "/staff/guilds", label: "Guilds", mobileLabel: "Guilds" },
  { href: "/staff/directory", label: "Directory", mobileLabel: "Directory" },
];

const STAFF_MOBILE_NAV = [
  { href: "/staff/now", label: "Now", mobileLabel: "Now" },
  { href: "/staff/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/staff/resources", label: "Resources", mobileLabel: "Resources" },
];

const ADMIN_PRIMARY_NAV = [
  { href: "/admin", label: "Overview", mobileLabel: "Overview", exact: true },
  { href: "/admin/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/admin/announcements", label: "Announcements", mobileLabel: "Announcements" },
  { href: "/admin/users", label: "Users", mobileLabel: "Users" },
  { href: "/admin/guilds", label: "Guilds", mobileLabel: "Guilds" },
];

const ADMIN_SECONDARY_NAV = [
  { href: "/admin/directory", label: "Directory" },
  { href: "/admin/profile", label: "My Info" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/settings", label: "Settings" },
];

const ADMIN_MOBILE_NAV = [
  { href: "/admin", label: "Overview", mobileLabel: "Overview", exact: true },
  { href: "/admin/schedule", label: "Schedule", mobileLabel: "Schedule" },
  { href: "/admin/users", label: "Users", mobileLabel: "Users" },
];

export const ROLE_NAV = {
  student: {
    primary: STUDENT_NAV,
    secondary: [],
    mobile: STUDENT_MOBILE_NAV,
  },
  staff: {
    primary: STAFF_NAV,
    secondary: [],
    mobile: STAFF_MOBILE_NAV,
  },
  admin: {
    primary: ADMIN_PRIMARY_NAV,
    secondary: ADMIN_SECONDARY_NAV,
    mobile: ADMIN_MOBILE_NAV,
  },
};

export function getRoleNav(role) {
  return ROLE_NAV[role] || { primary: [], secondary: [], mobile: [] };
}
