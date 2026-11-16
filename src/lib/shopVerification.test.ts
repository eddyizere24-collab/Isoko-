import test from 'node:test';
import assert from 'node:assert/strict';
import { isShopIdentityVerified } from './shopVerification';

test('approved or visible shop without identity verification is not marked Verified', () => {
  assert.equal(isShopIdentityVerified({ identity_status: 'unverified' }), false);
  assert.equal(isShopIdentityVerified({ identity_status: 'pending' }), false);
  assert.equal(isShopIdentityVerified({ identity_status: null }), false);
  assert.equal(isShopIdentityVerified(undefined), false);
});

test('only an explicit verified identity receives the public Verified seal', () => {
  assert.equal(isShopIdentityVerified({ identity_status: 'verified' }), true);
});
