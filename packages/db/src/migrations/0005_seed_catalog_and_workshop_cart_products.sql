INSERT OR IGNORE INTO `categories` (`id`, `name`, `slug`, `description`, `sort_order`, `is_active`)
VALUES
  ('cat-dresses', 'Dresses', 'dresses', 'Elevated dresses for events and everyday luxury.', 1, true),
  ('cat-tops', 'Tops', 'tops', 'Curated tops and blouses in premium fabrics.', 2, true),
  ('cat-denim', 'Denim', 'denim', 'Premium denim and tailored jeans.', 3, true),
  ('cat-outerwear', 'Outerwear', 'outerwear', 'Statement coats and jackets.', 4, true),
  ('cat-accessories', 'Accessories', 'accessories', 'Bags, belts, and finishing pieces.', 5, true),
  ('cat-workshops', 'Workshops', 'workshops', 'Cart backing records for ReLUXURY workshops and classes.', 99, false);
--> statement-breakpoint
UPDATE `categories` SET `is_active` = false WHERE `id` = 'cat-workshops';
--> statement-breakpoint
INSERT OR IGNORE INTO `products` (`id`, `title`, `slug`, `description`, `price`, `sale_price`, `category_id`, `brand`, `condition`, `gender`, `sizes`, `colors`, `material`, `sku`, `quantity`, `featured`, `is_active`, `updated_at`)
VALUES
  ('prod-golden-wrap-dress', 'Golden Hour Wrap Dress', 'golden-hour-wrap-dress', 'Silky wrap dress with soft drape and flattering waist tie.', 148, 118, 'cat-dresses', 'ReLUXURY Studio', 'excellent', 'women', '["S","M","L"]', '["champagne","black"]', 'Silk blend', 'RLX-DR-001', 6, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-tailored-crepe-blazer', 'Tailored Crepe Blazer', 'tailored-crepe-blazer', 'Structured blazer with clean lines and luxe hand feel.', 176, NULL, 'cat-outerwear', 'ReLUXURY Studio', 'like_new', 'women', '["S","M","L"]', '["ivory","charcoal"]', 'Crepe', 'RLX-OW-002', 4, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-signature-denim', 'Signature Straight Denim', 'signature-straight-denim', 'High-rise straight leg denim with soft stretch.', 98, 84, 'cat-denim', 'ReLUXURY Studio', 'excellent', 'women', '["26","27","28","29","30"]', '["indigo"]', 'Denim', 'RLX-DN-003', 12, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-satin-button-shirt', 'Satin Button Shirt', 'satin-button-shirt', 'Polished satin shirt for work or evening styling.', 92, NULL, 'cat-tops', 'ReLUXURY Studio', 'new', 'women', '["XS","S","M","L"]', '["ivory","sage"]', 'Satin', 'RLX-TP-004', 9, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-structured-mini-bag', 'Structured Mini Bag', 'structured-mini-bag', 'Compact handbag with removable strap and gold hardware.', 132, 108, 'cat-accessories', 'ReLUXURY Studio', 'like_new', 'unisex', NULL, '["black","tan"]', 'Leather', 'RLX-AC-005', 7, true, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-soft-knit-midi', 'Soft Knit Midi Dress', 'soft-knit-midi-dress', 'Body-skimming knit midi with refined neckline.', 124, NULL, 'cat-dresses', 'ReLUXURY Studio', 'excellent', 'women', '["S","M","L"]', '["mocha","black"]', 'Viscose blend', 'RLX-DR-006', 5, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-cropped-twill-jacket', 'Cropped Twill Jacket', 'cropped-twill-jacket', 'Modern cropped jacket with clean utility details.', 154, NULL, 'cat-outerwear', 'ReLUXURY Studio', 'new', 'women', '["S","M","L"]', '["sand","olive"]', 'Cotton twill', 'RLX-OW-007', 6, false, true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('prod-relaxed-linen-top', 'Relaxed Linen Top', 'relaxed-linen-top', 'Breathable linen top with elevated relaxed fit.', 74, 62, 'cat-tops', 'ReLUXURY Studio', 'new', 'women', '["S","M","L","XL"]', '["white","oat"]', 'Linen', 'RLX-TP-008', 14, false, true, cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `product_images` (`id`, `product_id`, `url`, `alt`, `sort_order`, `is_primary`)
VALUES
  ('img-001', 'prod-golden-wrap-dress', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=1200&q=80', 'Golden Hour Wrap Dress', 0, true),
  ('img-002', 'prod-tailored-crepe-blazer', 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1200&q=80', 'Tailored Crepe Blazer', 0, true),
  ('img-003', 'prod-signature-denim', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80', 'Signature Straight Denim', 0, true),
  ('img-004', 'prod-satin-button-shirt', 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=1200&q=80', 'Satin Button Shirt', 0, true),
  ('img-005', 'prod-structured-mini-bag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80', 'Structured Mini Bag', 0, true),
  ('img-006', 'prod-soft-knit-midi', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80', 'Soft Knit Midi Dress', 0, true),
  ('img-007', 'prod-cropped-twill-jacket', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80', 'Cropped Twill Jacket', 0, true),
  ('img-008', 'prod-relaxed-linen-top', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80', 'Relaxed Linen Top', 0, true);
--> statement-breakpoint
INSERT OR IGNORE INTO `events` (`id`, `title`, `slug`, `description`, `image_url`, `start_date`, `end_date`, `price`, `capacity`, `location`, `instructor`, `is_active`, `updated_at`)
VALUES
  ('workshop-2026-04-12', 'Beginner Sewing Foundations', 'beginner-sewing-workshop', 'A beginner-friendly workshop covering machine setup, straight seams, and confidence-building projects.', NULL, 1776016800000, NULL, 35, 18, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-04-26', 'Denim Hem Clinic', 'denim-hem-clinic', 'Bring your jeans and leave with perfect hems. Learn measurements, pinning technique, and professional finishing.', NULL, 1777226400000, NULL, 30, 14, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-05-03', 'Closet Refresh Alteration Lab', 'closet-refresh-alteration-lab', 'Learn quick fit fixes for everyday pieces and leave with a practical alteration checklist for your wardrobe.', NULL, 1777831200000, NULL, 40, 16, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-05-10', 'Sewing 101: First Garment Start', 'sewing-101-first-garment-start', 'Pattern basics, cutting flow, and first-garment construction fundamentals for new makers.', NULL, 1778436000000, NULL, 45, 20, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-05-17', 'Zipper & Button Repair Session', 'zipper-button-repair-session', 'Hands-on repair workshop focused on replacing zippers, reinforcing seams, and button restoration.', NULL, 1779040800000, NULL, 30, 15, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-05-24', 'Summer Dress Fit & Finish', 'summer-dress-fit-finish', 'Workshop focused on dress fit adjustments, lining touch-ups, and clean finishing techniques.', NULL, 1779645600000, NULL, 50, 12, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-06-07', 'Upcycle Your Favorite Piece', 'upcycle-your-favorite-piece', 'Creative sewing workshop that transforms one tired garment into a fresh, wearable statement piece.', NULL, 1780855200000, NULL, 55, 14, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer)),
  ('workshop-2026-06-21', 'Intermediate Pattern Hacking', 'intermediate-pattern-hacking', 'For returning students: modify base patterns for custom silhouettes, sleeves, and elevated fit.', NULL, 1782064800000, NULL, 60, 12, 'ReLUXURY Studio, Maumelle', 'Ashley Reed', true, cast(unixepoch('subsecond') * 1000 as integer));
--> statement-breakpoint
INSERT OR IGNORE INTO `products` (`id`, `title`, `slug`, `description`, `price`, `category_id`, `brand`, `condition`, `gender`, `sizes`, `colors`, `quantity`, `featured`, `is_active`, `updated_at`)
SELECT `id`, `title`, 'event-' || `slug`, COALESCE(`description`, ''), `price`, 'cat-workshops', 'ReLUXURY Studio', 'new', 'unisex', '["Registration"]', '["Workshop"]', COALESCE(`capacity`, 999), false, `is_active`, cast(unixepoch('subsecond') * 1000 as integer)
FROM `events`;
--> statement-breakpoint
UPDATE `products`
SET
  `category_id` = 'cat-workshops',
  `featured` = false,
  `is_active` = (SELECT `is_active` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `price` = (SELECT `price` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `quantity` = COALESCE((SELECT `capacity` FROM `events` WHERE `events`.`id` = `products`.`id`), 999),
  `slug` = 'event-' || (SELECT `slug` FROM `events` WHERE `events`.`id` = `products`.`id`),
  `title` = (SELECT `title` FROM `events` WHERE `events`.`id` = `products`.`id`)
WHERE `id` IN (SELECT `id` FROM `events`);
