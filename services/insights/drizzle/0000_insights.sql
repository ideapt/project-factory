CREATE TABLE events (id TEXT PRIMARY KEY, day TEXT NOT NULL, visitor TEXT NOT NULL, kind TEXT NOT NULL, created INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX events_day ON events(day);
--> statement-breakpoint
CREATE TABLE feedback (id TEXT PRIMARY KEY, day TEXT NOT NULL, visitor TEXT NOT NULL, rating INTEGER, category TEXT NOT NULL, message TEXT NOT NULL, created INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE tickets (id TEXT PRIMARY KEY, visitor TEXT NOT NULL, action TEXT NOT NULL, expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE limits (key TEXT PRIMARY KEY, amount INTEGER NOT NULL);
