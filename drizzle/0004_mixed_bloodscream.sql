CREATE TABLE `case_document_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`document_id` int NOT NULL,
	`version` int NOT NULL,
	`file_key` varchar(512),
	`file_url` varchar(512),
	`file_name` varchar(256),
	`file_size` bigint,
	`uploaded_by` int,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `case_document_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`document_type` enum('criminal_complaint','arrest_report','investigation_report','search_warrant_affidavit','arrest_warrant_application','subpoena','motion','plea_agreement','sentencing_memorandum','court_order','evidence_report','other') NOT NULL DEFAULT 'other',
	`author_id` int,
	`author_name` varchar(256),
	`file_key` varchar(512),
	`file_url` varchar(512),
	`file_name` varchar(256),
	`file_size` bigint,
	`mime_type` varchar(128),
	`version` int NOT NULL DEFAULT 1,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `case_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `witnesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`case_id` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`address` text,
	`witness_type` enum('eyewitness','expert','character','law_enforcement','other') NOT NULL DEFAULT 'other',
	`statement` text,
	`is_protected` boolean NOT NULL DEFAULT false,
	`notes` text,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `witnesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cases` MODIFY COLUMN `status` enum('investigation','submitted_to_da','case_review','rejected','filed','warrant_requested','warrant_issued','arraignment','preliminary_hearing','pre_trial','trial','verdict','sentencing','appeal','closed','dismissed') NOT NULL DEFAULT 'investigation';--> statement-breakpoint
ALTER TABLE `warrants` MODIFY COLUMN `type` enum('arrest_warrant','search_warrant','bench_warrant','subpoena') NOT NULL;--> statement-breakpoint
ALTER TABLE `warrants` MODIFY COLUMN `status` enum('draft','pending_approval','approved','denied','executed','expired') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `cases` ADD `priority` enum('low','medium','high','critical') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `cases` ADD `investigating_agency` varchar(128);--> statement-breakpoint
ALTER TABLE `cases` ADD `assigned_judge` varchar(128);--> statement-breakpoint
ALTER TABLE `cases` ADD `defendant_name` varchar(256);--> statement-breakpoint
ALTER TABLE `cases` ADD `defendant_id` int;--> statement-breakpoint
ALTER TABLE `cases` ADD `filing_date` timestamp;--> statement-breakpoint
ALTER TABLE `evidence` ADD `submitted_by_name` varchar(256);--> statement-breakpoint
ALTER TABLE `evidence` ADD `date_collected` timestamp;--> statement-breakpoint
ALTER TABLE `evidence` ADD `location_collected` varchar(256);--> statement-breakpoint
ALTER TABLE `warrants` ADD `requested_by` varchar(128);--> statement-breakpoint
ALTER TABLE `warrants` ADD `approved_by` varchar(128);--> statement-breakpoint
ALTER TABLE `warrants` ADD `date_requested` timestamp;--> statement-breakpoint
ALTER TABLE `warrants` ADD `date_approved` timestamp;