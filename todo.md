# LSCDA Office - Project TODO

## Phase 1: Database Schema & Setup
- [x] Extended users table with DA roles (da, chief_deputy_da, division_chief, senior_prosecutor, deputy_da, investigator, legal_clerk, victim_advocate, intern)
- [x] cases table (case_number, defendant_id, charges, arresting_agency, lead_prosecutor_id, court, status, description, filed_date)
- [x] case_charges table
- [x] defendants table (name, dob, address, criminal_history, gang_affiliation, notes)
- [x] case_defendants join table
- [x] court_hearings table (case_id, date, time, courtroom, judge, hearing_type, status)
- [x] warrants table (case_id, type, status, issued_by, issued_date, executed_date, description)
- [x] evidence table (case_id, reference_number, type, description, file_key, file_url, chain_of_custody, uploaded_by)
- [x] victims table (name, case_id, contact_info, protection_order, compensation_status, notes)
- [x] complaints table (type, complainant_name, subject, description, status, assigned_to, resolution)
- [x] documents table (title, category, file_key, file_url, is_public, uploaded_by)
- [x] press_releases table (title, content, published_at, is_published, author_id)
- [x] public_notices table (title, content, published_at, is_published)
- [x] careers table (title, department, description, requirements, is_active)
- [x] legal_research table (title, category, content, tags, created_by)
- [x] notifications table (user_id, title, message, type, is_read, related_id, related_type)
- [x] activity_logs table (user_id, action, entity_type, entity_id, details)
- [x] public_tips table (anonymous, name, contact, subject, description, status)
- [x] public_requests table (name, contact, request_type, description, case_number_ref, status)

## Phase 2: Backend Routers
- [x] users router (list, update role, get profile)
- [x] cases router (create, list, get, update, close, assign, search public)
- [x] defendants router (create, list, get, update, search)
- [x] hearings router (create, list, get, update)
- [x] warrants router (create, list, get, update)
- [x] evidence router (create, list, get, upload file, audit log)
- [x] victims router (create, list, get, update)
- [x] complaints router (create, list, get, update)
- [x] documents router (create, list, get, upload, public download)
- [x] press_releases router (create, list, get, publish)
- [x] public_notices router (create, list, get, publish)
- [x] careers router (create, list, get, update)
- [x] legal_research router (create, list, get, update)
- [x] notifications router (list, mark read, mark all read)
- [x] reports router (monthly prosecution, conviction stats, case closure, export)
- [x] public_tips router (submit, list admin)
- [x] public_requests router (submit, list admin, update status)
- [x] activity_logs router (list, create)

## Phase 3: Frontend Theme & Layout
- [x] Global CSS theme (dark navy/gold elegant theme)
- [x] PublicLayout component (top nav, footer)
- [x] InternalLayout using DashboardLayout (sidebar with all sections)
- [x] App.tsx routing for all pages

## Phase 4: Public Website Pages
- [x] Home page (hero, stats, mission, news preview, CTA)
- [x] About DA Office page
- [x] Organizational Structure page
- [x] Press Releases page (list + detail)
- [x] Public Notices page
- [x] Careers page (list + detail)
- [x] Contact Us page
- [x] Submit Tip page (แจ้งเบาะแส)
- [x] Submit Request page (ส่งคำร้อง)
- [x] Case Status Check page (ตรวจสอบสถานะคดี)
- [x] Document Download page (ดาวน์โหลดเอกสาร)

## Phase 5: Internal - Dashboard & Case Management
- [x] Dashboard page (stats cards, recent activity, upcoming hearings)
- [x] Cases list page (filter by status, search)
- [x] Case create/edit form
- [x] Case detail page (tabs: overview, charges, evidence, hearings, defendants, victims)
- [x] Defendants list page (search)
- [x] Defendant create/edit form
- [x] Defendant detail page
- [x] Prosecutors list page (staff management)
- [x] Prosecutor detail page (cases, schedule)

## Phase 6: Court Calendar, Warrants, Evidence, Legal Research
- [x] Court Calendar page (day/week/month views)
- [x] Warrant list page (filter by type/status)
- [x] Warrant create/edit form
- [x] Evidence list page
- [x] Evidence upload form (PDF, DOCX, images, videos, audio)
- [x] Evidence detail page (chain of custody, audit log)
- [x] Legal Research Center page (tabs: Penal Code, Case Law, Policies, Memorandums, Training)
- [x] Legal Research create/edit form

## Phase 7: Victim Services, Complaints, Reports, Notifications
- [x] Victim Services list page
- [x] Victim create/edit form
- [x] Complaints list page (filter by type/status)
- [x] Complaint create/edit form
- [x] Complaint detail page
- [x] Reports page (monthly prosecution, conviction stats, case closure)
- [x] Report export PDF/Excel
- [x] Notifications panel/page
- [x] Notification bell in header

## Phase 8: Tests & Delivery
- [x] Vitest tests for key routers (34/34 tests passing)
- [x] Final checkpoint

## Phase 9: UI Fixes & New Pages (User Request)
- [x] Fix navigation dropdown hover bug (menu disappears when moving mouse to submenu)
- [x] Replace logo/favicon with DA Office badge (DAOCoLS.webp)
- [x] Add History page (ความเป็นมา)
- [x] Add Rules & Regulations page (กฎระเบียบการทำงาน)
- [x] Add Privacy Policy page
- [x] Wire new pages into About dropdown navigation
