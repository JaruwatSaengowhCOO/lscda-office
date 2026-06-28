-- Migration: Full DA Case Management System
-- Adds new statuses, fields, tables for witnesses and case documents

-- 1. Update case status enum to add new workflow statuses
ALTER TABLE `cases` MODIFY COLUMN `status` ENUM(
  'investigation',
  'submitted_to_da',
  'case_review',
  'rejected',
  'filed',
  'warrant_requested',
  'warrant_issued',
  'arraignment',
  'preliminary_hearing',
  'pre_trial',
  'trial',
  'verdict',
  'sentencing',
  'appeal',
  'closed',
  'dismissed'
) NOT NULL DEFAULT 'investigation';

-- 2. Add new fields to cases table
ALTER TABLE `cases`
  ADD COLUMN `priority` ENUM('low','medium','high','critical') DEFAULT 'medium' AFTER `status`,
  ADD COLUMN `assigned_judge` VARCHAR(128) AFTER `lead_prosecutor_id`,
  ADD COLUMN `investigating_agency` VARCHAR(128) AFTER `assigned_judge`,
  ADD COLUMN `defendant_name` VARCHAR(256) AFTER `investigating_agency`,
  ADD COLUMN `defendant_id` INT AFTER `defendant_name`,
  ADD COLUMN `filing_date` TIMESTAMP NULL AFTER `filed_date`;

-- 3. Update warrant type enum to add bench_warrant
ALTER TABLE `warrants` MODIFY COLUMN `type` ENUM(
  'arrest_warrant',
  'search_warrant',
  'bench_warrant',
  'subpoena'
) NOT NULL;

-- 4. Update warrant status enum to add denied
ALTER TABLE `warrants` MODIFY COLUMN `status` ENUM(
  'draft',
  'pending_approval',
  'approved',
  'denied',
  'executed',
  'expired'
) NOT NULL DEFAULT 'draft';

-- Add requested_by and approved_by fields to warrants
ALTER TABLE `warrants`
  ADD COLUMN `requested_by` VARCHAR(128) AFTER `issued_by`,
  ADD COLUMN `approved_by` VARCHAR(128) AFTER `requested_by`,
  ADD COLUMN `date_requested` TIMESTAMP NULL AFTER `approved_by`,
  ADD COLUMN `date_approved` TIMESTAMP NULL AFTER `date_requested`;

-- 5. Create case_documents table
CREATE TABLE IF NOT EXISTS `case_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL,
  `title` VARCHAR(256) NOT NULL,
  `document_type` ENUM(
    'criminal_complaint',
    'arrest_report',
    'investigation_report',
    'search_warrant_affidavit',
    'arrest_warrant_application',
    'subpoena',
    'motion',
    'plea_agreement',
    'sentencing_memorandum',
    'court_order',
    'evidence_report',
    'other'
  ) NOT NULL DEFAULT 'other',
  `author_id` INT,
  `author_name` VARCHAR(256),
  `file_key` VARCHAR(512),
  `file_url` VARCHAR(512),
  `file_name` VARCHAR(256),
  `file_size` BIGINT,
  `mime_type` VARCHAR(128),
  `version` INT NOT NULL DEFAULT 1,
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_case_documents_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Create case_document_versions table
CREATE TABLE IF NOT EXISTS `case_document_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `version` INT NOT NULL,
  `file_key` VARCHAR(512),
  `file_url` VARCHAR(512),
  `file_name` VARCHAR(256),
  `file_size` BIGINT,
  `uploaded_by` INT,
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_doc_versions_doc_id` (`document_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create witnesses table
CREATE TABLE IF NOT EXISTS `witnesses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_id` INT NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `phone` VARCHAR(32),
  `email` VARCHAR(320),
  `address` TEXT,
  `witness_type` ENUM('eyewitness','expert','character','law_enforcement','other') NOT NULL DEFAULT 'other',
  `statement` TEXT,
  `is_protected` BOOLEAN NOT NULL DEFAULT FALSE,
  `notes` TEXT,
  `created_by` INT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_witnesses_case_id` (`case_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Add more fields to evidence table
ALTER TABLE `evidence`
  ADD COLUMN `submitted_by_name` VARCHAR(256) AFTER `uploaded_by`,
  ADD COLUMN `date_collected` TIMESTAMP NULL AFTER `submitted_by_name`,
  ADD COLUMN `location_collected` VARCHAR(256) AFTER `date_collected`;
