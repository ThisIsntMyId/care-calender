ALTER TABLE `tasks` RENAME COLUMN "scheduled_start_at" TO "appointment_start_at";--> statement-breakpoint
ALTER TABLE `tasks` RENAME COLUMN "scheduled_end_at" TO "appointment_end_at";--> statement-breakpoint
ALTER TABLE `tasks` ADD `appointment_link` text;--> statement-breakpoint
ALTER TABLE `doctors` ADD `appointment_link` text;--> statement-breakpoint
ALTER TABLE `patients` ADD `timezone` text NOT NULL;