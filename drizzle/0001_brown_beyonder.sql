CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`user_name` varchar(256),
	`action` varchar(128) NOT NULL,
	`entity_type` varchar(64),
	`entity_id` int,
	`details` text,
	`ip_address` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`department` varchar(128),
	`location` varchar(128),
	`type` enum('full_time','part_time','contract','intern') DEFAULT 'full_time',
	`description` text NOT NULL,
	`requirements` text,
	`salary` varchar(64),
	`is_active` boolean NOT NULL DEFAULT true,
	`closing_date` timestamp,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `careers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`charge_code` varchar(64),
	`charge_description` text NOT NULL,
	`severity` enum('felony','misdemeanor','infraction'),
	`statute` varchar(128),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_defendants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`defendant_id` int NOT NULL,
	`role` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_defendants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_number` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`status` enum('investigation','case_review','filed','arraignment','preliminary_hearing','trial','sentencing','closed','dismissed') NOT NULL DEFAULT 'investigation',
	`arresting_agency` varchar(128),
	`court` varchar(128),
	`lead_prosecutor_id` int,
	`filed_date` timestamp,
	`closed_date` timestamp,
	`outcome` varchar(64),
	`is_public` boolean NOT NULL DEFAULT false,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_case_number_unique` UNIQUE(`case_number`)
);
--> statement-breakpoint
CREATE TABLE `complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`complaint_number` varchar(64) NOT NULL,
	`type` enum('citizen_complaint','officer_misconduct','prosecutor_misconduct','administrative') NOT NULL,
	`complainant_name` varchar(256),
	`complainant_contact` varchar(256),
	`subject` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`status` enum('received','under_review','investigation','resolved','dismissed') NOT NULL DEFAULT 'received',
	`assigned_to` int,
	`resolution` text,
	`resolved_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complaints_id` PRIMARY KEY(`id`),
	CONSTRAINT `complaints_complaint_number_unique` UNIQUE(`complaint_number`)
);
--> statement-breakpoint
CREATE TABLE `court_hearings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`hearing_type` varchar(64) NOT NULL,
	`scheduled_at` timestamp NOT NULL,
	`courtroom` varchar(64),
	`judge` varchar(128),
	`status` enum('scheduled','completed','continued','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `court_hearings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defendants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(128) NOT NULL,
	`last_name` varchar(128) NOT NULL,
	`dob` varchar(16),
	`address` text,
	`phone` varchar(32),
	`email` varchar(320),
	`criminal_history` text,
	`gang_affiliation` varchar(128),
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defendants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`category` enum('form','policy','template','report','other') DEFAULT 'other',
	`description` text,
	`file_key` varchar(512),
	`file_url` varchar(512),
	`file_name` varchar(256),
	`file_size` bigint,
	`mime_type` varchar(128),
	`is_public` boolean NOT NULL DEFAULT false,
	`download_count` int DEFAULT 0,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`reference_number` varchar(64) NOT NULL,
	`type` enum('document','image','video','audio','physical','digital','other') NOT NULL,
	`description` text,
	`file_key` varchar(512),
	`file_url` varchar(512),
	`file_name` varchar(256),
	`file_size` bigint,
	`mime_type` varchar(128),
	`chain_of_custody` json,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_reference_number_unique` UNIQUE(`reference_number`)
);
--> statement-breakpoint
CREATE TABLE `evidence_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidence_id` int NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`details` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_research` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`category` enum('penal_code','case_law','policy','memorandum','training') NOT NULL,
	`content` text NOT NULL,
	`tags` varchar(512),
	`file_key` varchar(512),
	`file_url` varchar(512),
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legal_research_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`type` enum('case_update','hearing_reminder','warrant_update','new_complaint','new_tip','system') DEFAULT 'system',
	`is_read` boolean NOT NULL DEFAULT false,
	`related_id` int,
	`related_type` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `press_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`is_published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`author_id` int,
	`tags` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `press_releases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_notices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`notice_type` varchar(64),
	`is_published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp,
	`expires_at` timestamp,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_notices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`contact` varchar(256) NOT NULL,
	`request_type` enum('case_status','document_request','general_inquiry','other') NOT NULL,
	`description` text NOT NULL,
	`case_number_ref` varchar(64),
	`status` enum('received','processing','completed','rejected') NOT NULL DEFAULT 'received',
	`response` text,
	`responded_by` int,
	`responded_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `public_tips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`is_anonymous` boolean NOT NULL DEFAULT false,
	`name` varchar(256),
	`contact` varchar(256),
	`subject` varchar(256) NOT NULL,
	`description` text NOT NULL,
	`status` enum('received','under_review','actioned','closed') NOT NULL DEFAULT 'received',
	`assigned_to` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `public_tips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `victims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`first_name` varchar(128) NOT NULL,
	`last_name` varchar(128) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`address` text,
	`has_protection_order` boolean NOT NULL DEFAULT false,
	`protection_order_details` text,
	`compensation_status` enum('pending','approved','paid','denied','not_applicable') DEFAULT 'not_applicable',
	`advocate_id` int,
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `victims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `warrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int,
	`warrant_number` varchar(64) NOT NULL,
	`type` enum('search_warrant','arrest_warrant','subpoena') NOT NULL,
	`status` enum('draft','pending_approval','issued','executed','expired') NOT NULL DEFAULT 'draft',
	`subject` varchar(256),
	`description` text,
	`issued_by` varchar(128),
	`issued_at` timestamp,
	`executed_at` timestamp,
	`expires_at` timestamp,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `warrants_warrant_number_unique` UNIQUE(`warrant_number`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `da_role` enum('da','chief_deputy_da','division_chief','senior_prosecutor','deputy_da','investigator','legal_clerk','victim_advocate','intern','admin') DEFAULT 'intern';--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `badge_number` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true NOT NULL;