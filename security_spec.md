# Security Specification (Phase 0: Payload-First Security TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Any path not explicitly matched in `firestore.rules` is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity**: All write operations require an authenticated user (`request.auth != null`) with a verified email (`request.auth.token.email_verified == true`).
3. **Admin Privileges**: Admin privileges (`isAdmin()`) are granted ONLY if a trusted document exists at `/databases/$(database)/documents/admins/$(request.auth.uid)` OR if `request.auth.token.email == 'normanescobar804@gmail.com' && request.auth.token.email_verified == true`.
4. **Open Platform Seller & Ad Ownership**: Any verified user with an existing `/users/$(request.auth.uid)` profile (or `isAdmin()`) can publish products in `/products/{productId}` and business ads in `/business_ads/{adId}` where `incoming().authorId == request.auth.uid`. Only the document creator (`existing().authorId == request.auth.uid`) or `isAdmin()` can update or delete their product or business ad, and `authorId` is immutable.
5. **PII Isolation (Split Collection)**: Customer PII (`email`, `phone`, `address`, `indriveReference`, `preferredPaymentMethod`) is isolated in `/users/{userId}/private/{docId}` where `docId == 'info'` and parent `/users/{userId}` must exist (Master Gate). Read and write access is strictly restricted to `isOwner(userId) || isAdmin()`.
6. **Order Ownership & Relational Integrity**: An order in `/orders/{orderId}` can only be created if `incoming().customerId == request.auth.uid`, `exists(/databases/$(database)/documents/users/$(request.auth.uid))` is true, and `incoming().status == 'pendiente'`. Terminal state `'entregado'` locks customer updates (`existing().status != 'entregado' || isAdmin()`).
7. **Secure List Queries**: No blanket `allow list: if isSignedIn();` rules exist on private collections. Listing `/orders` requires `resource.data.customerId == request.auth.uid || isAdmin()`. Listing `/notifications` requires `resource.data.recipientId == request.auth.uid || isAdmin()`.
8. **Temporal Integrity & Path Variable Hardening**: All `create` operations require `incoming().createdAt == request.time && incoming().updatedAt == request.time`. All `update` operations require `incoming().updatedAt == request.time` and immutable `incoming().createdAt == existing().createdAt`. Every single-document operation (`get`, `create`, `update`, `delete`) validates document IDs via `isValidId(id)`.

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Shadow Field Injection on User Profile)**:
   `{ "uid": "user_1", "displayName": "Ana", "city": "Managua", "favoritesCsv": "", "loyaltyPoints": 0, "isAdmin": true, "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }` -> Rejected by `hasOnly()`.
2. **Payload 2 (Identity Spoofing on Order Creation)**:
   `{ "id": "ord_1", "customerId": "victim_uid", ... }` -> Rejected by `data.customerId == request.auth.uid`.
3. **Payload 3 (Unverified Email Product Creation Spoof)**:
   Auth token `{ email: "normanescobar804@gmail.com", email_verified: false }` attempting to create a product -> Rejected by `request.auth.token.email_verified == true`.
4. **Payload 4 (Orphaned Private Info Without Parent User)**:
   Creating `/users/user_1/private/info` when `/users/user_1` does not exist -> Rejected by Master Gate `exists(/databases/$(database)/documents/users/$(userId))`.
5. **Payload 5 (PII Lateral Read Attack)**:
   Authenticated `user_2` attempting `get` on `/users/user_1/private/info` -> Rejected by `isOwner(userId) || isAdmin()`.
6. **Payload 6 (Order Terminal State Bypass)**:
   Customer attempting to update `/orders/ord_1` when `existing().status == 'entregado'` -> Rejected by Terminal State Lock `existing().status != 'entregado'`.
7. **Payload 7 (Customer Self-Approving Payment Status)**:
   Customer attempting to update `paymentStatus` to `'pagado'` on `/orders/ord_1` -> Rejected by Tiered Action-Based Update (`paymentStatus` can only be set to `'verificando'` by customer).
8. **Payload 8 (Client Timestamp Forgery)**:
   Creating an order with `createdAt: Timestamp.fromMillis(1000000)` instead of `request.time` -> Rejected by `incoming().createdAt == request.time`.
9. **Payload 9 (Immortal Field Mutation)**:
   Updating an order by changing `createdAt` or `customerId` -> Rejected by `incoming().createdAt == existing().createdAt && incoming().customerId == existing().customerId`.
10. **Payload 10 (ID Poisoning / 2KB Document ID)**:
    Creating `/orders/bad$id!@#` -> Rejected by `isValidId(orderId)`.
11. **Payload 11 (Unfiltered List Scraping on Orders)**:
    Authenticated `user_2` running an unconstrained `list` query on `/orders` -> Rejected by `resource.data.customerId == request.auth.uid`.
12. **Payload 12 (Value Poisoning on Notification Update)**:
    Recipient updating `read` field with a string `"yes"` instead of boolean -> Rejected by `isValidOrderNotification(incoming())` wrapper in `allow update`.
