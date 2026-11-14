import { isValidRwandaPhone } from './whatsapp';

export interface ProductFormInput {
  photosCount: number;
  categoryId: number | null;
  name: string;
  price: number;
  oldPrice?: number | null;
  condition: 'new' | 'used';
  brand?: string;
  authentic: boolean;
  variants: Array<{ size_label: string; in_stock: boolean; qty: number | null }>;
  colors: string[];
  description?: string;
}

const PHONE_IN_TEXT_REGEX = /(?:\+?250\s*7\d{2}|07\d{2})[\s.-]?\d{3}[\s.-]?\d{3}/;
const LINK_IN_TEXT_REGEX = /(?:https?:\/\/|www\.|wa\.me\/|\.com\b|\.rw\b)/i;

export function containsPhoneOrLink(text: string): boolean {
  return PHONE_IN_TEXT_REGEX.test(text) || LINK_IN_TEXT_REGEX.test(text);
}

export function isAllCapsText(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  return letters.length >= 4 && letters === letters.toUpperCase();
}

export function validateProductForm(input: ProductFormInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.photosCount < 1 || input.photosCount > 5) {
    errors.photos = 'Shyiraho nibura ifoto 1 (ntizirenge 5).';
  }

  if (!input.categoryId) {
    errors.categoryId = 'Hitamo icyiciro cy’igicuruzwa.';
  }

  const trimmedName = input.name.trim();
  if (trimmedName.length < 5 || trimmedName.length > 60) {
    errors.name = 'Izina rigomba kuba hagati y’inyuguti 5 na 60.';
  } else if (containsPhoneOrLink(trimmedName)) {
    errors.name = 'Izina ntirigomba kubamo nimero ya telefoni cyangwa link.';
  } else if (isAllCapsText(trimmedName)) {
    errors.name = 'Ntukandike izina mu nyuguti nkuru zose.';
  }

  if (!Number.isInteger(input.price) || input.price < 500 || input.price > 5_000_000) {
    errors.price = 'Igiciro kigomba kuba hagati ya 500 na 5 000 000 RWF.';
  }

  if (input.oldPrice !== undefined && input.oldPrice !== null && input.oldPrice > 0) {
    if (!Number.isInteger(input.oldPrice) || input.oldPrice <= input.price) {
      errors.oldPrice = 'Igiciro cya kera kigomba kuruta igiciro cy’ubu.';
    }
  }

  const trimmedBrand = (input.brand ?? '').trim();
  if (trimmedBrand.length > 40) {
    errors.brand = 'Ikirango ntigomba kurenza inyuguti 40.';
  }
  if (trimmedBrand.length > 0 && !input.authentic) {
    errors.authentic = 'Emeza ko igicuruzwa ari Original kugira ngo ukoreshe izina ry’ikirango.';
  }

  if (input.variants.length < 1) {
    errors.variants = 'Hitamo nibura size 1.';
  } else {
    for (const v of input.variants) {
      if (v.qty !== null && (v.qty < 0 || v.qty > 999 || !Number.isInteger(v.qty))) {
        errors.variants = 'Umubare w’ibisigaye ugomba kuba hagati ya 0 na 999.';
        break;
      }
    }
  }

  if (input.colors.length > 5) {
    errors.colors = 'Ntushobora guhitamo amabara arenze 5.';
  }

  const trimmedDesc = (input.description ?? '').trim();
  if (trimmedDesc.length > 2000) {
    errors.description = 'Ibisobanuro ntibigomba kurenza inyuguti 2 000.';
  } else if (containsPhoneOrLink(trimmedDesc)) {
    errors.description = 'Ibisobanuro ntibigomba kubamo nimero ya telefoni cyangwa link.';
  }

  return errors;
}

export function validateShopProfile(input: {
  name: string;
  about: string;
  whatsapp: string;
  phone: string;
  delivery_text: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.name.trim().length < 2 || input.name.trim().length > 40) {
    errors.name = 'Izina ry’iduka rigomba kuba hagati y’inyuguti 2 na 40.';
  }
  if (input.about.trim().length > 3000) {
    errors.about = 'Ibisobanuro by’iduka ntibigomba kurenza inyuguti 3 000.';
  }
  if (!isValidRwandaPhone(input.whatsapp)) {
    errors.whatsapp = 'Nimero ya WhatsApp igomba kuba iya MTN/Airtel mu Rwanda (2507XXXXXXXX).';
  }
  if (!isValidRwandaPhone(input.phone)) {
    errors.phone = 'Nimero ya telefoni igomba kuba iya MTN/Airtel mu Rwanda (2507XXXXXXXX).';
  }
  if (input.delivery_text.trim().length > 120) {
    errors.delivery_text = 'Inyandiko yo gutanga ntigomba kurenza inyuguti 120.';
  }
  return errors;
}

export function validateReportForm(input: {
  type: string;
  details: string;
  reporterPhone?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.type) {
    errors.type = 'Hitamo ubwoko bw’ikibazo.';
  }
  const details = input.details.trim();
  if (details.length < 10 || details.length > 500) {
    errors.details = 'Ibisobanuro bigomba kuba hagati y’inyuguti 10 na 500.';
  }
  if (input.reporterPhone && input.reporterPhone.trim().length > 0 && !isValidRwandaPhone(input.reporterPhone)) {
    errors.reporterPhone = 'Nimero ya telefoni ntabwo yuzuye (2507XXXXXXXX).';
  }
  return errors;
}
