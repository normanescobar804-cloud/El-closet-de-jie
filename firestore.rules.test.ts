/**
 * Phase 0 Test Runner Specification for Firestore Security Rules
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on User Profile',
    collectionPath: '/users/user_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      uid: 'user_1',
      displayName: 'Ana',
      city: 'Managua',
      favoritesCsv: '',
      loyaltyPoints: 0,
      isAdmin: true
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Identity Spoofing on Order Creation',
    collectionPath: '/orders/ord_1',
    operation: 'create',
    auth: { uid: 'attacker_1', email: 'attacker@example.com', email_verified: true },
    payload: {
      id: 'ord_1',
      customerId: 'victim_1'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'Unverified Email Admin Spoof',
    collectionPath: '/products/prod_1',
    operation: 'create',
    auth: { uid: 'spoof_admin', email: 'normanescobar804@gmail.com', email_verified: false },
    payload: {
      id: 'prod_1',
      name: 'Fake Product'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Orphaned Private Info Without Parent User',
    collectionPath: '/users/nonexistent_user/private/info',
    operation: 'create',
    auth: { uid: 'nonexistent_user', email: 'u@example.com', email_verified: true },
    payload: {
      uid: 'nonexistent_user',
      email: 'u@example.com',
      phone: '88888888',
      address: 'Managua',
      indriveReference: '',
      preferredPaymentMethod: 'lafise_transfer'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'PII Lateral Read Attack',
    collectionPath: '/users/user_1/private/info',
    operation: 'get',
    auth: { uid: 'user_2', email: 'user2@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Order Terminal State Bypass',
    collectionPath: '/orders/ord_delivered',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      paymentReference: 'REF-NEW'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Customer Self-Approving Payment Status',
    collectionPath: '/orders/ord_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      paymentStatus: 'pagado'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery',
    collectionPath: '/orders/ord_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      createdAt: '2020-01-01T00:00:00Z'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Immortal Field Mutation on Order Update',
    collectionPath: '/orders/ord_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      customerId: 'user_2'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'ID Poisoning Attack',
    collectionPath: '/orders/invalid$id!@#',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      id: 'invalid$id!@#'
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Unfiltered List Scraping on Orders',
    collectionPath: '/orders',
    operation: 'list',
    auth: { uid: 'user_2', email: 'user2@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Value Poisoning on Notification Update',
    collectionPath: '/notifications/notif_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: {
      read: 'yes_string_instead_of_boolean'
    },
    expectedResult: 'PERMISSION_DENIED'
  }
];
