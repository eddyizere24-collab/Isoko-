import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCartWhatsAppMessages,
  buildSingleProductWhatsAppMessage,
  formatRwf,
  formatRwfCurrency,
  isValidRwandaPhone,
  normalizeRwandaPhone,
} from './whatsapp';
import type { CartItem } from '../types/marketplace';

test('formatRwf formats numbers with space thousands separators and no decimals', () => {
  assert.equal(formatRwf(45000), '45 000');
  assert.equal(formatRwf(500), '500');
  assert.equal(formatRwf(1250000), '1 250 000');
  assert.equal(formatRwfCurrency(45000), '45 000 RWF');
});

test('phone normalization and validation strictly accept Rwandan MTN/Airtel numbers', () => {
  assert.equal(normalizeRwandaPhone('0788123456'), '250788123456');
  assert.equal(normalizeRwandaPhone('+250 788 123 456'), '250788123456');
  assert.equal(isValidRwandaPhone('250788123456'), true);
  assert.equal(isValidRwandaPhone('250732123456'), true);
  assert.equal(isValidRwandaPhone('250722123456'), true);
  assert.equal(isValidRwandaPhone('250791123456'), true);
  assert.equal(isValidRwandaPhone('250711123456'), false);
  assert.equal(isValidRwandaPhone('12345'), false);
});

test('single product WhatsApp message includes location and Google Maps link when present', () => {
  const msg = buildSingleProductWhatsAppMessage({
    shopName: 'Iduka rya Mugisha',
    productName: 'Nike Air Force',
    size: '42',
    color: 'Umweru',
    price: 45000,
    productUrl: 'https://isoko.rw/p/p1',
    location: {
      districtId: 1,
      districtName: 'Gasabo',
      sectorId: 9,
      sectorName: 'Kimironko',
      landmark: 'Hafi ya gare',
      lat: -1.944072,
      lng: 30.105584,
    },
  });

  assert.match(msg, /Muraho Iduka rya Mugisha,/);
  assert.match(msg, /Igiciro: 45 000 RWF/);
  assert.match(msg, /Aho ndi: Gasabo, Kimironko \(Hafi ya gare\)/);
  assert.match(msg, /https:\/\/maps\.google\.com\/\?q=-1\.944072,30\.105584/);
  assert.ok(msg.length <= 1500);
});

test('single product WhatsApp message omits empty location lines when unset', () => {
  const msg = buildSingleProductWhatsAppMessage({
    shopName: 'Iduka rya Aline',
    productName: 'Ankara Jacket',
    size: 'M',
    color: 'Ubururu',
    price: 28000,
    productUrl: 'https://isoko.rw/p/p2',
    location: null,
  });

  assert.equal(msg.includes('Aho ndi:'), false);
  assert.equal(msg.includes('maps.google.com'), false);
});

test('cart WhatsApp splits orders > 10 items per seller and ignores sold_out items', () => {
  const items: CartItem[] = Array.from({ length: 12 }, (_, idx) => ({
    productId: `p-${idx}`,
    shopId: 'shop-1',
    shopName: 'Iduka rya Mugisha',
    shopSlug: 'mugisha',
    shopWhatsapp: '250788123456',
    shopPhone: '250788123456',
    productName: `Inkweto ${idx + 1}`,
    thumbUrl: '/img.jpg',
    size: '42',
    color: 'Umukara',
    priceSeen: 20000,
    currentPrice: 20000,
    qty: 1,
    status: idx === 11 ? 'sold_out' : 'active',
    sizeInStock: true,
    addedAt: Date.now(),
  }));

  const batches = buildCartWhatsAppMessages({
    shopName: 'Iduka rya Mugisha',
    shopWhatsapp: '250788123456',
    items,
  });

  assert.equal(batches.length, 2); // 11 active items -> 10 + 1
  assert.equal(batches[0].itemCount, 10);
  assert.equal(batches[0].subtotal, 200000);
  assert.equal(batches[1].itemCount, 1);
  assert.equal(batches[1].subtotal, 20000);
  assert.ok(batches[0].message.length <= 1500);
  assert.ok(batches[1].url.startsWith('https://wa.me/250788123456?text='));
});
