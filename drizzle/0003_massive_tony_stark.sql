CREATE TABLE `role_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`da_role` enum('da','chief_deputy_da','division_chief','senior_prosecutor','deputy_da','investigator','legal_clerk','victim_advocate','intern','admin') NOT NULL,
	`permission` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `role_permissions_id` PRIMARY KEY(`id`)
);
