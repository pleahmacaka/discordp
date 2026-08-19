CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`discord_user_id` text NOT NULL,
	`user_name` text NOT NULL,
	`guild_id` text,
	`channel_id` text,
	`source` text NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`latency_ms` integer NOT NULL,
	`ok` integer NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `events_created_at_idx` ON `events` (`created_at`);--> statement-breakpoint
CREATE INDEX `events_user_idx` ON `events` (`discord_user_id`);