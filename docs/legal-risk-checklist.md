# TORCH Live Legal and Risk Checklist (Operational Baseline)

Updated: May 25, 2026

This is an operations baseline, not legal advice. Final policy language and state/federal compliance interpretation must be reviewed by qualified counsel.

## 1) Confirmed Program Profile (Provided by Bryan)

### Entity and Contacts
1. Operating organization: Torch Leadership Academy, Inc.
2. President and legal/risk owner: Bryan O'Donnell (`bo@torchleadershipacademy.org`)
3. General support mailbox: `info@torchleadershipacademy.org`
4. Mailing address: 148 Heather Road, Haddon Township, NJ 08017
5. Phone: (609) 300-6397

### Audience and Eligibility
1. Student ages: 14-18
2. Staff ages: 16+
3. Under-13 users: not permitted
4. Access: authorized TORCH participants and volunteers only
5. Program posture: youth-protection and crisis-management controls aligned to TORCH requirements and Stockton expectations

### School and FERPA Relationship
1. TORCH is not a school and is not acting on behalf of a school district.
2. TORCH is not state-funded for this program.
3. TORCH Live does not store education records received from schools.

### Messaging Posture
1. Messaging type: transactional and operational only
2. Marketing/promotional messaging: none
3. Operational contact: `info@torchleadershipacademy.org`

### Data Scope in TORCH Live
1. Core account profile data: name, email, role, program year, active status
2. Operational data: schedule, announcements, resources
3. Technical data: authentication/session and audit/security logs
4. Sensitive student records: not intended to be stored in app

## 2) Retention and Deletion Policy (Recommended Baseline)

These are recommended defaults for MVP operations unless counsel directs otherwise.

1. `user_profiles` (student/staff/admin profile rows): retain 3 program years, then delete unless legal hold is active.
2. `auth.users` entries for deactivated student/staff accounts: retain 3 program years, then delete in same cycle as profile deletion.
3. `announcements`: retain 3 program years for operational history and incident reconstruction.
4. `announcement_reads`: retain 2 program years.
5. `student_schedule_items` and `staff_schedule_items`: retain 5 program years for planning and historical reference.
6. `resource_categories` and `resource_items`: retain until replaced, then archive or remove annually.
7. `audit_log`: retain 5 program years minimum.

### Deactivate vs Delete Rules
1. End of each program year: deactivate all student/staff accounts for completed year.
2. Offboarding during year: deactivate immediately.
3. Deletion window: perform annual deletion sweep for records beyond retention period.
4. Deletion authority: Bryan (or designated technical owner) only.

### Operational Cadence
1. Weekly (during active program): review admin roster and deactivate unauthorized accounts.
2. Monthly (off-season): access review and stale account cleanup.
3. Annual (post-program, within 30 days): rollover + retention enforcement sweep.
4. Annual (within 45 days): legal page and SOP review with counsel notes.

## 3) Incident Response Ownership and Timeline (Recommended Baseline)

### Ownership
1. Incident owner: Bryan O'Donnell (or designated technical owner)
2. Technical responders: authorized TORCH technical admins only
3. Communications owner: TORCH leadership (Bryan or assigned delegate)

### Severity Definitions
1. `SEV-1`: confirmed or suspected unauthorized access to personal data, active compromise, or app-wide outage during live operations.
2. `SEV-2`: material feature outage or failed auth flow without confirmed compromise.
3. `SEV-3`: isolated user issues with workaround available.

### Timeline
1. `T+0 to 15 min`: acknowledge incident, freeze risky admin changes, assign owner.
2. `T+15 to 60 min`: triage scope, collect evidence, rotate exposed credentials if indicated.
3. `T+60 to 240 min`: apply containment and recovery actions, validate core flows.
4. `Within 24 hours`: internal incident summary, impact classification, legal-notification decision.
5. `As required by applicable law`: external notifications without unreasonable delay after facts are confirmed.

### Required Evidence
1. Timeline of events and who performed each action
2. Affected systems/data categories
3. Screenshots/log extracts
4. Recovery validation notes
5. Follow-up prevention actions

## 4) Accessibility and Safety Process (Recommended Baseline)

### Accessibility Process
1. Publish accessibility contact in legal pages (`info@torchleadershipacademy.org`).
2. Provide a simple issue report path (email subject: "TORCH Live Accessibility Request").
3. Acknowledge accessibility requests within 2 business days.
4. Track requests and resolution status in an internal log.
5. Run a quarterly manual check of core flows: login, schedule, announcements, resources.

### Safety Process
1. Keep explicit notice that app is not a 911/emergency dispatch service.
2. Duplicate urgent safety notices in non-app channels (onsite staff radio/text/verbal chain).
3. Require staff to treat direct instructions and emergency protocol as source of truth over app state.
4. Include safety escalation contact in every program operations packet.

## 5) Vendor, DPA, and Data Sharing Posture (Recommended Baseline)

### Current Processor Set
1. Supabase (auth/database)
2. Vercel (hosting/deployment)
3. SMTP provider for transactional email

### Data Sharing Rules
1. No sale of personal data.
2. No targeted advertising use of participant data.
3. No third-party sharing beyond service providers required to operate TORCH Live.
4. Any new vendor requires documented review before use.

### Contract and Governance Routine
1. Maintain a vendor register with owner, purpose, data categories, and contract links.
2. Store accepted terms/DPA references in one controlled folder.
3. Review vendor terms and security posture annually.
4. Re-validate DNS/SPF/DKIM/DMARC and sender settings before each program cycle.

## 6) Implementation Tasks Completed in App

1. Public legal pages are live at `/legal/privacy`, `/legal/terms`, and `/legal/safety`.
2. Login/legal footer links are present in app UI.
3. Admin-only controls gate user lifecycle and content operations.
4. Role and active-account checks are enforced in auth/middleware.

## 7) Remaining Decisions to Confirm

1. Confirm whether `bo@torchleadershipacademy.org` should be publicly listed on all legal pages, or internal-only.
2. Confirm final legal-hold process (who can pause deletion and how it is documented).
3. Confirm where guardian waivers/consents are stored and who audits completion each cycle.
4. Confirm counsel-approved notification template language for serious incidents.

## 8) References for Counsel Review

1. NJ Data Privacy Act text (P.L.2023, c.266): https://pub.njleg.state.nj.us/Bills/2022/PL23/266_.PDF
2. NJ Cyber Crimes Unit breach reporting guidance: https://www.nj.gov/oag/njsp/division/investigations/cyber-crimes.shtml
3. FERPA overview (U.S. Department of Education): https://studentprivacy.ed.gov/faq/what-ferpa
4. COPPA business guidance (FTC): https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa-frequently-asked-questions
5. CAN-SPAM compliance guide (FTC): https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
6. ADA web accessibility guidance (DOJ): https://www.ada.gov/resources/web-guidance/
