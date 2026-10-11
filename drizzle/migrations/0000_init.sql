CREATE TABLE `songs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`artist` text DEFAULT '' NOT NULL,
	`song_key` text,
	`body` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`source_url` text,
	`transpose` integer DEFAULT 0 NOT NULL,
	`simplify` integer DEFAULT false NOT NULL,
	`scroll_speed` integer DEFAULT 3 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `songs_source_uidx` ON `songs` (`source`,`source_id`);