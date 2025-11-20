ALTER TABLE `categories` ADD `next_days` integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `concurrency` integer DEFAULT 1 NOT NULL;