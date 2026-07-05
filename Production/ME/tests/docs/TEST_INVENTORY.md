TEST INVENTORY
==============

Module | Feature | Priority | Automation Status | Test Case Count | Smoke | Regression | API | E2E | Notes
---|---|---|---|---|---|---|---|---|---
Authentication | User login (password + jwt) | Critical |  |  |  |  |  |  |
Authentication | Multi-factor authentication (OTP/SMS) | Critical |  |  |  |  |  |  |
Authentication | Password reset / change | Critical |  |  |  |  |  |  |
Authentication | Session management / logout | High |  |  |  |  |  |  |
Authentication | Role-based access control (RBAC) | Critical |  |  |  |  |  |  |

Public Website | Home page content and navigation | Medium |  |  |  |  |  |  |
Public Website | Search landing and results | Medium |  |  |  |  |  |  |
Public Website | Product listing and details | High |  |  |  |  |  |  |

Vendor Portal | Vendor onboarding / registration | High |  |  |  |  |  |  |
Vendor Portal | Vendor product management (CRUD) | High |  |  |  |  |  |  |
Vendor Portal | Vendor order management | High |  |  |  |  |  |  |

Admin Portal | Admin authentication & sessions | Critical |  |  |  |  |  |  |
Admin Portal | User & role management | Critical |  |  |  |  |  |  |
Admin Portal | Catalog management (products/categories) | High |  |  |  |  |  |  |
Admin Portal | Reporting & exports | High |  |  |  |  |  |  |

Super Admin Portal | Tenant management / global settings | Critical |  |  |  |  |  |  |
Super Admin Portal | Audit trails & compliance views | High |  |  |  |  |  |  |

Delivery Partner Portal | Delivery partner login & profile | High |  |  |  |  |  |  |
Delivery Partner Portal | Assignment & tracking flows | High |  |  |  |  |  |  |

Products | Product create / read / update / delete | High |  |  |  |  |  |  |
Products | Bulk import / export | Medium |  |  |  |  |  |  |
Categories | Category management CRUD | High |  |  |  |  |  |  |

Inventory | Stock reservation & release | Critical |  |  |  |  |  |  |
Inventory | Inventory concurrency / race conditions | Critical |  |  |  |  |  |  |
Inventory | Warehouse transfer flows | High |  |  |  |  |  |  |

Orders | Order placement | Critical |  |  |  |  |  |  |
Orders | Order lifecycle (status transitions) | Critical |  |  |  |  |  |  |
Orders | Order cancellation and refunds | High |  |  |  |  |  |  |

Cart | Add/remove items | High |  |  |  |  |  |  |
Cart | Cart persistence (sessions) | High |  |  |  |  |  |  |

Checkout | Checkout validation & calculation | Critical |  |  |  |  |  |  |
Checkout | Shipping calculation & selection | High |  |  |  |  |  |  |
Checkout | Promotions & coupon application | Medium |  |  |  |  |  |  |

Payments | Payment gateway integrations (Razorpay) | Critical |  |  |  |  |  |  |
Payments | Webhook handling & idempotency | Critical |  |  |  |  |  |  |
Payments | Refunds & settlement flows | High |  |  |  |  |  |  |

Logistics | Shipment creation & tracking | High |  |  |  |  |  |  |
Logistics | Delivery status updates & notifications | High |  |  |  |  |  |  |

Notifications | Email / SMS / in-app notifications | High |  |  |  |  |  |  |
Notifications | Notification preferences & throttling | Medium |  |  |  |  |  |  |

Reports | Scheduled reports generation & export | Medium |  |  |  |  |  |  |
Reports | Ad-hoc reporting & filters | Medium |  |  |  |  |  |  |

Settings | Tenant settings & configuration | Medium |  |  |  |  |  |  |
Profile | User profile CRUD & preferences | Medium |  |  |  |  |  |  |

Search | Keyword search relevance | Medium |  |  |  |  |  |  |
Search | Facets and filters | Medium |  |  |  |  |  |  |

Analytics | Event tracking and reporting | Medium |  |  |  |  |  |  |
Analytics | Dashboard metrics & export | Medium |  |  |  |  |  |  |

Security | CSRF protection & token handling | Critical |  |  |  |  |  |  |
Security | Permission model & sensitive endpoints | Critical |  |  |  |  |  |  |

Performance | Page load and checkout throughput | Critical |  |  |  |  |  |  |
Accessibility | WCAG checks for main user flows | Medium |  |  |  |  |  |  |

Notes:
- Priority column is filled. All other columns are placeholders to be populated during test implementation and scoping.

