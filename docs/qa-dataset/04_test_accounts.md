# QA Dataset Manifest — Test Accounts

This document prescribes the official QA account naming conventions and placeholders. DO NOT use real credentials here.

## Naming & Credential Conventions
- Email convention: `<role>.<index>@qa.mokshith.local` (e.g., vendor.01@qa.mokshith.local).  
- Mobile convention: synthetic 10-digit numbers in a QA block (e.g., 9999000001..9999999999).  
- Password convention: use a standard placeholder `QaPassw0rd!` in docs — actual test provisioning uses hashed values or secrets managed by CI. Never place real secrets in repo.

## Accounts (examples)
- Super Admin  
  - Identifier: superadmin@qa.mokshith.local  
  - Mobile: 9999999999  
  - Role: SUPER_ADMIN  
  - Approval: ACTIVE  

- Admins (3)  
  - admin.01@qa.mokshith.local, admin.02..., admin.03...  
  - Role: ADMIN  
  - Approval: ACTIVE

- Vendors (10)  
  - vendor.01@qa.mokshith.local … vendor.10@qa.mokshith.local  
  - Each linked to a company record and vendor profile.  
  - Approval mix: 8 APPROVED, 1 PENDING, 1 REJECTED.

- Delivery Partners (10)  
  - dp.01@qa.mokshith.local … dp.10@qa.mokshith.local

- Customers (500)  
  - customer.0001@qa.mokshith.local … customer.0500@qa.mokshith.local  
  - Mobile: 9999000001 … 9999000500

## Approval status & relationships
- Vendor users link to their Company and Vendor record. Vendors must follow approval workflows via the UI/API.  
- Admins and Super Admins can approve vendors and manage platform settings.

## Creation method
- Admin/admin fixtures for top-level accounts (super admin, admins) are seeded as controlled fixtures.  
- Vendor and customer accounts are preferably created via automated onboarding flows to ensure business rules are applied.

## Security note
- Placeholder passwords must be replaced by CI secrets or ephemeral credentials during automated provisioning. Never commit real passwords.

