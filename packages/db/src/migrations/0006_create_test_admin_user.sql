INSERT OR IGNORE INTO `user` (`id`, `name`, `email`, `email_verified`, `role`, `banned`, `created_at`, `updated_at`)
VALUES ('owner_user_id_reluxury_demo', 'Reluxury Owner', 'owner@reluxurydemo.com', 1, 'admin', 0, cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `account` (`id`, `account_id`, `provider_id`, `user_id`, `password`, `created_at`, `updated_at`)
VALUES ('owner_account_id_reluxury_demo', 'owner_user_id_reluxury_demo', 'credential', 'owner_user_id_reluxury_demo', 'bf1dc00371fa701582d30d3a9f1f7de6:7818e3c92b3e58320ee6aaf82433b266d134bcfd70568e3622be19c6d2e4cdb168ae28baaa50737b9a81b158ea2778b030a966a83d287b0398d46c6c87cb1c96', cast(unixepoch('subsecond') * 1000 as integer), cast(unixepoch('subsecond') * 1000 as integer));
