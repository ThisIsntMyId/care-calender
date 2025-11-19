CREATE TABLE `doctor_category_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`doctor_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`weight` integer DEFAULT 50 NOT NULL,
	`last_assigned_at` integer,
	`round_robin_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `selection_algorithm` text DEFAULT 'round_robin' NOT NULL;