/**
 * Only the explicit identity-verification state earns the public Verified seal.
 * Seller approval means listing is allowed; it does not mean KYC is verified.
 */
export function isShopIdentityVerified(
  shop: { identity_status?: string | null } | null | undefined
): boolean {
  return shop?.identity_status === 'verified';
}
