CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`patient_id` integer NOT NULL,
	`doctor_id` integer,
	`category_id` integer NOT NULL,
	`start_at` integer NOT NULL,
	`end_at` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`link` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `appointment_start_at`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `appointment_end_at`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `appointment_status`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `appointment_link`;