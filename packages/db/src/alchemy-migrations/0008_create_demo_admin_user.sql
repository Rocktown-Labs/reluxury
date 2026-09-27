INSERT OR IGNORE INTO `user` (`id`, `name`, `email`, `email_verified`, `role`, `banned`, `created_at`, `updated_at`)
VALUES ('demo_admin_user_id_reluxury', 'ReLUXURY Demo Admin', 'reluxuryadmin@demo.com', 1, 'admin', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `account` (`id`, `account_id`, `provider_id`, `user_id`, `password`, `created_at`, `updated_at`)
VALUES ('demo_admin_account_id_reluxury', 'demo_admin_user_id_reluxury', 'credential', 'demo_admin_user_id_reluxury', '37f3e53b22832df7c32287113ec152a6:da77fef70cf7e3e17eac00d3b2bf88b3c2ba5d54b3b8520dd79a2c26919ddb9009548008efd653ddfdff0679b7ac7fd3e281f281d6aa3d83a2a673cec8a45b55', cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
