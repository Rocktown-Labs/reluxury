ALTER TABLE `alteration_bookings` ADD `assigned_user_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `claimed_by` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `claimed_by_name` text;--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD `inbound_carrier` text;--> statement-breakpoint
ALTER TABLE `intake_submissions` ADD `inbound_tracking_number` text;