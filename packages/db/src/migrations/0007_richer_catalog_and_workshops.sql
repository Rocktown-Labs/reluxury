INSERT OR IGNORE INTO `products` (`id`, `title`, `slug`, `description`, `price`, `sale_price`, `category_id`, `brand`, `condition`, `gender`, `sizes`, `colors`, `material`, `sku`, `quantity`, `featured`, `is_active`, `updated_at`)
VALUES
  ('prod-mens-wool-topcoat', 'Men''s Wool Topcoat', 'mens-wool-topcoat', 'A tailored wool-blend topcoat with clean shoulders and an easy layer-ready fit.', 188, NULL, 'cat-outerwear', 'ReLUXURY Studio', 'excellent', 'men', '["M","L","XL"]', '["charcoal"]', 'Wool blend', 'RLX-MN-009', 3, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-linen-camp-shirt', 'Men''s Linen Camp Shirt', 'mens-linen-camp-shirt', 'Breathable linen camp shirt with a relaxed open collar and refined drape.', 68, NULL, 'cat-tops', 'ReLUXURY Studio', 'like_new', 'men', '["S","M","L","XL"]', '["ivory","sage"]', 'Linen', 'RLX-MN-010', 8, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-selvedge-denim', 'Men''s Selvedge Straight Denim', 'mens-selvedge-straight-denim', 'Structured straight-leg denim with a crisp dark rinse and premium hand feel.', 118, 96, 'cat-denim', 'ReLUXURY Studio', 'excellent', 'men', '["30","32","34","36"]', '["indigo"]', 'Cotton denim', 'RLX-MN-011', 6, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-leather-belt', 'Men''s Leather Belt', 'mens-leather-belt', 'Full-grain leather belt with understated hardware and a polished everyday finish.', 54, NULL, 'cat-accessories', 'ReLUXURY Studio', 'like_new', 'men', '["32","34","36","38"]', '["black","cognac"]', 'Leather', 'RLX-MN-012', 9, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-cashmere-crewneck', 'Men''s Cashmere Crewneck', 'mens-cashmere-crewneck', 'Soft cashmere crewneck sweater with a timeless fit for layering or standalone wear.', 132, NULL, 'cat-tops', 'ReLUXURY Studio', 'excellent', 'men', '["M","L","XL"]', '["heather grey","navy"]', 'Cashmere', 'RLX-MN-013', 4, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-tailored-trouser', 'Men''s Tailored Trouser', 'mens-tailored-trouser', 'Flat-front tailored trouser with a clean taper and versatile dress-casual styling.', 104, 88, 'cat-denim', 'ReLUXURY Studio', 'excellent', 'men', '["30","32","34","36"]', '["black","stone"]', 'Wool blend', 'RLX-MN-014', 5, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-suede-bomber', 'Men''s Suede Bomber Jacket', 'mens-suede-bomber-jacket', 'Soft suede bomber with rib trim and a quietly elevated weekend feel.', 214, NULL, 'cat-outerwear', 'ReLUXURY Studio', 'like_new', 'men', '["M","L"]', '["tan"]', 'Suede', 'RLX-MN-015', 2, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-mens-weekend-overshirt', 'Men''s Weekend Overshirt', 'mens-weekend-overshirt', 'Midweight overshirt with utility pockets, easy layering, and a soft brushed finish.', 86, NULL, 'cat-outerwear', 'ReLUXURY Studio', 'good', 'men', '["S","M","L","XL"]', '["olive","navy"]', 'Cotton twill', 'RLX-MN-016', 7, false, true, cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `product_images` (`id`, `product_id`, `url`, `alt`, `sort_order`, `is_primary`)
VALUES
  ('img-009', 'prod-mens-wool-topcoat', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', 'Men''s Wool Topcoat', 0, true),
  ('img-010', 'prod-mens-linen-camp-shirt', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80', 'Men''s Linen Camp Shirt', 0, true),
  ('img-011', 'prod-mens-selvedge-denim', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80', 'Men''s Selvedge Straight Denim', 0, true),
  ('img-012', 'prod-mens-leather-belt', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80', 'Men''s Leather Belt', 0, true),
  ('img-013', 'prod-mens-cashmere-crewneck', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80', 'Men''s Cashmere Crewneck', 0, true),
  ('img-014', 'prod-mens-tailored-trouser', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80', 'Men''s Tailored Trouser', 0, true),
  ('img-015', 'prod-mens-suede-bomber', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80', 'Men''s Suede Bomber Jacket', 0, true),
  ('img-016', 'prod-mens-weekend-overshirt', 'https://images.unsplash.com/photo-1506629905607-d9f297d3f5f5?auto=format&fit=crop&w=1200&q=80', 'Men''s Weekend Overshirt', 0, true);
--> statement-breakpoint
UPDATE `events`
SET
  `description` = 'For returning students: modify base patterns for custom silhouettes, sleeves, hems, and elevated fit. Bring one base pattern or choose from studio samples.',
  `end_date` = COALESCE(`end_date`, 1782072000000),
  `image_url` = COALESCE(`image_url`, 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80'),
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `id` = 'workshop-2026-06-21';
--> statement-breakpoint
INSERT OR IGNORE INTO `events` (`id`, `title`, `slug`, `description`, `image_url`, `start_date`, `end_date`, `price`, `capacity`, `location`, `instructor`, `is_active`, `updated_at`)
VALUES
  ('workshop-2026-07-12', 'Sewing Machine Confidence Clinic', 'sewing-machine-confidence-clinic', 'A hands-on confidence class for threading, tension, troubleshooting, stitch selection, and tidy practice seams. Bring your machine or use a studio machine.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80', 1783882800000, 1783890000000, 45, 12, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-07-26', 'Denim Repair & Visible Mending', 'denim-repair-visible-mending', 'Learn durable denim patches, hand mending, reinforcement stitches, and tasteful visible repair details for jeans, jackets, and workwear.', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80', 1785092400000, 1785099600000, 55, 14, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-08-09', 'Intro to Garment Alterations', 'intro-to-garment-alterations', 'A practical alteration workshop covering hems, taking in side seams, simple sleeve fixes, measuring, pinning, and choosing the right finish.', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?auto=format&fit=crop&w=1200&q=80', 1786302000000, 1786309200000, 60, 12, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-08-23', 'Closet Upcycle Studio', 'closet-upcycle-studio', 'Bring one piece from your closet and rework it with guided design choices, fitting adjustments, trim ideas, and machine sewing support.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80', 1787511600000, 1787518800000, 65, 10, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `products` (`id`, `title`, `slug`, `description`, `price`, `category_id`, `brand`, `condition`, `gender`, `sizes`, `colors`, `quantity`, `featured`, `is_active`, `updated_at`)
SELECT `id`, `title`, 'event-' || `slug`, COALESCE(`description`, ''), `price`, 'cat-workshops', 'ReLUXURY Studio', 'new', 'unisex', '["Registration"]', '["Workshop"]', COALESCE(`capacity`, 999), false, `is_active`, cast(unixepoch('subsecond') * 1000 as integer)
FROM `events`
WHERE `id` LIKE 'workshop-%';
--> statement-breakpoint
UPDATE `products`
SET
  `category_id` = 'cat-workshops',
  `featured` = false,
  `is_active` = (SELECT `is_active` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `price` = (SELECT `price` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `quantity` = COALESCE((SELECT `capacity` FROM `events` WHERE `events`.`id` = `products`.`id`), 999),
  `slug` = 'event-' || (SELECT `slug` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `title` = (SELECT `title` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer)
WHERE `id` IN (SELECT `id` FROM `events` WHERE `id` LIKE 'workshop-%');
--> statement-breakpoint
INSERT OR IGNORE INTO `product_images` (`id`, `product_id`, `url`, `alt`, `sort_order`, `is_primary`)
SELECT 'img-' || `id`, `id`, `image_url`, `title`, 0, true
FROM `events`
WHERE `id` LIKE 'workshop-%' AND `image_url` IS NOT NULL;
