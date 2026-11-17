import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCartWhatsAppMessages,
  buildSellerWhatsAppLink,
  buildSingleProductWhatsAppMessage,
  formatRwf,
  formatRwfCurrency,
  isValidRwandaPhone,
  isUsableSellerWhatsAppPhone,
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

test('general listing WhatsApp message omits irrelevant size and color details', () => {
  const msg = buildSingleProductWhatsAppMessage({
    shopName: 'Iduka rya Aline',
    productName: 'Inzu iri i Kicukiro',
    size: 'Ntibireba',
    color: '',
    price: 12000000,
    productUrl: 'https://isoko.rw/p/house-1',
    location: null,
  });

  assert.match(msg, /Inzu iri i Kicukiro/);
  assert.equal(msg.includes('Size:'), false);
  assert.equal(msg.includes('Ibara:'), false);
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


test('general listing cart WhatsApp message omits the placeholder variant', () => {
  const item: CartItem = {
    productId: 'p-general', shopId: 'shop-1', shopName: 'Iduka', shopSlug: 'iduka',
    shopWhatsapp: '250788123456', shopPhone: '250788123456', productName: 'Imodoka Toyota',
    thumbUrl: '/img.webp', size: 'Ntibireba', color: '', priceSeen: 4500000,
    currentPrice: 4500000, qty: 1, status: 'active', sizeInStock: true, addedAt: 1,
  };
  const batches = buildCartWhatsAppMessages({
    shopName: 'Iduka', shopWhatsapp: '250788123456', items: [item],
  });
  assert.equal(batches.length, 1);
  assert.match(batches[0].message, /Imodoka Toyota/);
  assert.match(batches[0].message, /4 500 000 RWF/);
  assert.equal(batches[0].message.includes('size Ntibireba'), false);
});

test('seller WhatsApp CTA rejects missing, invalid and placeholder phone numbers', () => {
  assert.equal(isUsableSellerWhatsAppPhone(null), false);
  assert.equal(isUsableSellerWhatsAppPhone(''), false);
  assert.equal(isUsableSellerWhatsAppPhone('12345'), false);
  assert.equal(isUsableSellerWhatsAppPhone('250788000000'), false);
  assert.equal(isUsableSellerWhatsAppPhone('0788123456'), true);
  assert.equal(buildSellerWhatsAppLink(undefined, 'Muraho'), null);
  assert.equal(buildSellerWhatsAppLink('250788000000', 'Muraho'), null);
  assert.match(
    buildSellerWhatsAppLink('0788123456', 'Muraho') ?? '',
    /^https:\/\/wa\.me\/250788123456\?text=/
  );
});

test('cart does not construct a WhatsApp URL from the placeholder number', () => {
  const item: CartItem = {
    productId: 'p-1', shopId: 'shop-1', shopName: 'Iduka', shopSlug: 'iduka',
    shopWhatsapp: '250788000000', shopPhone: '', productName: 'Inkweto',
    thumbUrl: '/img.webp', size: '42', color: '', priceSeen: 20000,
    qty: 1, status: 'active', sizeInStock: true, addedAt: 1,
  };
  assert.deepEqual(buildCartWhatsAppMessages({
    shopName: 'Iduka', shopWhatsapp: '250788000000', items: [item],
  }), []);
});
