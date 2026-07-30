# Lookbook & Material Selections — DB Market (Vision V2)

## Overview
Lookbooks allow architects, contractors, and homeowners to curate material selections for building projects.

---

## Client & Database Architecture
* **Guest Users**: Selections are saved in `localStorage` in the browser.
* **Logged-In Users**: Selections sync to `public.collections` and `public.collection_items` in Supabase.
* **Session Merging**: Upon signing up or logging in, local storage selections automatically merge into the user's database profile via Supabase RPC.

---

## Commerce Integration
* **Bulk Cart Transfer**: Users can click "Add Lookbook to Cart" to transfer an entire curated selection into an active purchase order.
* **WhatsApp PDF & Link Export**: Generates a shareable URL or printable specification sheet to share with project clients or send to MetaBrain Operations for bulk pricing.
