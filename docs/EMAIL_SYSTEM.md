# Email Engine (SendGrid Integration) — DB Market (Vision V2)

## Overview
DB Market uses **SendGrid** as its sole transactional and operational mail engine. All Resend references have been completely replaced.

---

## Operational Mail Workflows

### 1. Customer Order Confirmation & Receipts
* Triggered automatically upon successful checkout (Online Payment or WhatsApp Order Commit).
* Contains order number, itemized list, delivery address in Abuja, and MetaBrain Operations contact details.

### 2. Supplier Fulfillment Dispatch Alerts
* Triggered when MetaBrain Operations initiates order fulfillment.
* Sends dispatch emails to respective suppliers detailing required items, pickup quantities, and hub delivery instructions.

### 3. Supplier Account & Payout Notifications
* **Account Authorization**: Alert sent when MetaBrain approves a supplier account.
* **Withdrawal Updates**: Email notifications sent when a supplier's withdrawal request is processed, approved, or transferred.

### 4. MetaBrain Operations Lead Alerts
* Instant notification sent to MetaBrain Operations whenever a customer requests a high-value commercial consultation or custom quote.

---

## SendGrid Configuration
* **Provider**: SendGrid Web API (`https://api.sendgrid.com/v3/mail/send`).
* **Authentication**: Environment variable `SENDGRID_API_KEY`.
* **Sender Identity**: Verified domain sender (e.g., `orders@dbmarket.ng` / `support@dbmarket.ng`).
