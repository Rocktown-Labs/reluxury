CREATE TABLE `audit_log` (
	`action` text NOT NULL,
	`actor_user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`details` text,
	`entity_id` text,
	`entity_type` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `intake_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`intake_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`intake_id`) REFERENCES `intake_submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `intake_photos_intake_idx` ON `intake_photos` (`intake_id`);--> statement-breakpoint
CREATE TABLE `intake_submissions` (
	`admin_notes` text,
	`appointment_at` integer,
	`contact_email` text NOT NULL,
	`contact_name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`inbound_label_url` text,
	`offer_amount` real,
	`offer_status` text DEFAULT 'none' NOT NULL,
	`phone` text,
	`reviewed_by` text,
	`ship_from_address` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`type` text DEFAULT 'dropoff' NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `intake_submissions_user_idx` ON `intake_submissions` (`user_id`);--> statement-breakpoint
CREATE INDEX `intake_submissions_status_idx` ON `intake_submissions` (`status`);--> statement-breakpoint
CREATE TABLE `shifts` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`created_by` text,
	`end_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`notes` text,
	`position` text,
	`staff_id` text,
	`start_at` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`staff_id`) REFERENCES `staff_members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `shifts_staff_idx` ON `shifts` (`staff_id`);--> statement-breakpoint
CREATE INDEX `shifts_start_idx` ON `shifts` (`start_at`);--> statement-breakpoint
CREATE TABLE `staff_invitations` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`invited_by` text NOT NULL,
	`name` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`role` text DEFAULT 'custom' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`token` text NOT NULL,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_invitations_token_unique` ON `staff_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `staff_invitations_email_idx` ON `staff_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `staff_invitations_token_idx` ON `staff_invitations` (`token`);--> statement-breakpoint
CREATE TABLE `staff_members` (
	`alias` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`forward_address` text,
	`id` text PRIMARY KEY NOT NULL,
	`invited_by` text,
	`is_active` integer DEFAULT true NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`role` text DEFAULT 'custom' NOT NULL,
	`title` text,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_members_alias_unique` ON `staff_members` (`alias`);--> statement-breakpoint
CREATE UNIQUE INDEX `staff_members_user_id_unique` ON `staff_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `staff_members_user_idx` ON `staff_members` (`user_id`);--> statement-breakpoint
ALTER TABLE `alteration_bookings` ADD `assigned_user_id` text REFERENCES user(id);--> statement-breakpoint
CREATE INDEX `alteration_bookings_assigned_idx` ON `alteration_bookings` (`assigned_user_id`);--> statement-breakpoint
ALTER TABLE `events` ADD `assigned_user_id` text REFERENCES user(id);--> statement-breakpoint
CREATE INDEX `events_assigned_idx` ON `events` (`assigned_user_id`);