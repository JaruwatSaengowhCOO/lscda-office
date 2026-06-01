ALTER TABLE `users` ADD `username` varchar(64) UNIQUE;
--> statement-breakpoint
ALTER TABLE `users` ADD `password_hash` varchar(256);
