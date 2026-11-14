import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductForm, validateReportForm, validateShopProfile } from './validation';

test('product form validation rejects phone numbers, links, all caps, and unauthenticated brands', () => {
  const bad = validateProductForm({
    photosCount: 0,
    categoryId: null,
    name: 'NIKE AIR 0788123456',
    price: 200,
    oldPrice: 100,
    condition: 'new',
    brand: 'Nike',
    authentic: false,
    variants: [],
    colors: ['Umukara', 'Umweru', 'Imvi', 'Ubururu', 'Umutuku', 'Icyatsi'],
    description: 'Reba kuri https://example.com',
  });

  assert.ok(bad.photos);
  assert.ok(bad.categoryId);
  assert.ok(bad.name);
  assert.ok(bad.price);
  assert.ok(bad.oldPrice);
  assert.ok(bad.authentic);
  assert.ok(bad.variants);
  assert.ok(bad.colors);
  assert.ok(bad.description);
});

test('product form validation passes for valid product data', () => {
  const ok = validateProductForm({
    photosCount: 3,
    categoryId: 104,
    name: 'Nike Air Force 1 Umweru',
    price: 45000,
    oldPrice: 60000,
    condition: 'new',
    brand: 'Nike',
    authentic: true,
    variants: [{ size_label: '42', in_stock: true, qty: 2 }],
    colors: ['Umweru', 'Icyatsi'],
    description: 'Inkweto za siporo nziza zikomoka mu ruganda.',
  });
  assert.deepEqual(ok, {});
});

test('shop profile and report validation catch bad phone formats and short descriptions', () => {
  const badShop = validateShopProfile({
    name: 'A',
    about: 'Iduka ryiza',
    whatsapp: '12345',
    phone: '250788123456',
    delivery_text: 'Gutanga i Kigali',
  });
  assert.ok(badShop.name);
  assert.ok(badShop.whatsapp);
  assert.equal(badShop.phone, undefined);

  const badReport = validateReportForm({
    type: 'fake_price',
    details: 'gito',
    reporterPhone: '0711000000',
  });
  assert.ok(badReport.details);
  assert.ok(badReport.reporterPhone);
});


test('product and shop descriptions accept useful long-form seller details', () => {
  const longDescription = 'Ibisobanuro by’igicuruzwa. '.repeat(45).slice(0, 1100);
  const product = validateProductForm({
    photosCount: 1,
    categoryId: 104,
    name: 'Inkweto nziza zo kugenda',
    price: 25000,
    condition: 'new',
    authentic: false,
    variants: [{ size_label: '42', in_stock: true, qty: 3 }],
    colors: [],
    description: longDescription,
  });
  assert.equal(product.description, undefined);

  const shop = validateShopProfile({
    name: 'Isoko Fashion',
    about: 'Ibyerekeye iduka n’uko dukorera abakiriya. '.repeat(25).slice(0, 900),
    whatsapp: '250788123456',
    phone: '250788123456',
    delivery_text: 'Dutanga ibicuruzwa mu Rwanda',
  });
  assert.equal(shop.about, undefined);
});
