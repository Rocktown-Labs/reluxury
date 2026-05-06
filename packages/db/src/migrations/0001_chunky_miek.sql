CREATE TABLE IF NOT EXISTS `alteration_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`service_type` text NOT NULL,
	`item_description` text NOT NULL,
	`preferred_date` integer NOT NULL,
	`preferred_time` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`price` real,
	`notes` text,
	`admin_notes` text,
	`image_urls` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `alteration_bookings_user_idx` ON `alteration_bookings` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `alteration_bookings_status_idx` ON `alteration_bookings` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`size` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cart_items_user_idx` ON `cart_items` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `cart_items_product_idx` ON `cart_items` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `event_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'registered' NOT NULL,
	`notes` text,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `event_registrations_event_idx` ON `event_registrations` (`event_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `event_registrations_user_idx` ON `event_registrations` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_url` text,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`price` real DEFAULT 0 NOT NULL,
	`capacity` integer,
	`location` text,
	`instructor` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `events_active_idx` ON `events` (`is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `events_date_idx` ON `events` (`start_date`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`title` text NOT NULL,
	`price` real NOT NULL,
	`quantity` integer NOT NULL,
	`size` text,
	`image_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`delivery_method` text DEFAULT 'pickup' NOT NULL,
	`shipping_address` text,
	`shipping_cost` real DEFAULT 0 NOT NULL,
	`subtotal` real NOT NULL,
	`tax` real DEFAULT 0 NOT NULL,
	`total` real NOT NULL,
	`notes` text,
	`admin_notes` text,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `products` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`sale_price` real,
	`compare_at_price` real,
	`category_id` text,
	`brand` text,
	`condition` text DEFAULT 'good' NOT NULL,
	`gender` text DEFAULT 'women' NOT NULL,
	`sizes` text,
	`size_guide` text,
	`colors` text,
	`material` text,
	`sku` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`weight` real,
	`featured` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`tags` text,
	`meta_title` text,
	`meta_description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_featured_idx` ON `products` (`featured`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_active_idx` ON `products` (`is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_gender_idx` ON `products` (`gender`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `products_brand_idx` ON `products` (`brand`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `promotions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`image_url` text,
	`button_text` text,
	`button_link` text,
	`start_date` integer,
	`end_date` integer,
	`display_location` text DEFAULT 'both' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `store_settings_key_unique` ON `store_settings` (`key`);
