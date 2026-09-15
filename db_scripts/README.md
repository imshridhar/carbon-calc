# CarbonCalc DB Scripts

## Overview

This folder contains PostgreSQL schema and seed scripts for CarbonCalc. The scripts now cover milestone 3 and 4 data structures, including goals, badges, leaderboards, marketplace items, transactions, and notifications.

## Files

- `create_schema.sql` creates tables, foreign keys, and indexes.
- `seed_data.sql` inserts sample admin data, marketplace items, badges, and notifications.

## Example usage

```bash
psql -U postgres -d carboncalc -f create_schema.sql
psql -U postgres -d carboncalc -f seed_data.sql
```

## Schema summary

- `users`
- `lifestyle_surveys`
- `carbon_entries`
- `goals`
- `badges`
- `leaderboards`
- `marketplace`
- `transactions`
- `notifications`
- `otps`

## Notes

- `marketplace` includes `carbon_offset_value`.
- `transactions` includes a `status` field for purchase tracking.
- `notifications` stores user alerts, badge updates, goal completion messages, and marketplace confirmations.
