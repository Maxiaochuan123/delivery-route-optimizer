CREATE TABLE `delivery_routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`order_id` integer NOT NULL,
	`sequence` integer NOT NULL,
	`distance_to_next` integer,
	`duration_to_next` integer,
	FOREIGN KEY (`session_id`) REFERENCES `delivery_sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `delivery_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start_location` text NOT NULL,
	`start_lat` real,
	`start_lng` real,
	`total_distance` integer,
	`total_duration` integer,
	`order_count` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `frequent_addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`alias` text,
	`lat` real,
	`lng` real,
	`usage_count` integer DEFAULT 1 NOT NULL,
	`last_used` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`lat` real,
	`lng` real,
	`customer_name` text,
	`items` text,
	`notes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
