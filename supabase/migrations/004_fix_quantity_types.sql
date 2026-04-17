-- Migration 004: Fix quantity column types
-- favorites.default_quantity and list_items.quantity should be text (e.g., "500g", "2 Kisten"),
-- not numeric. Price columns get explicit numeric(10,2) to match concept spec.

alter table favorites
  alter column default_quantity type text using default_quantity::text,
  alter column default_price type numeric(10,2) using default_price::numeric(10,2);

alter table list_items
  alter column quantity type text using quantity::text,
  alter column price type numeric(10,2) using price::numeric(10,2);
