import type { BuyerLocation, CartItem } from '../types/marketplace';

export const RWANDA_PHONE_REGEX = /^2507[2389]\d{7}$/;

export function normalizeRwandaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('07') && digits.length === 10) {
    return `250${digits.slice(1)}`;
  }
  if (digits.startsWith('7') && digits.length === 9) {
    return `250${digits}`;
  }
  return digits;
}

export function isValidRwandaPhone(phone: string): boolean {
  return RWANDA_PHONE_REGEX.test(normalizeRwandaPhone(phone));
}

export function formatRwf(amount: number): string {
  const rounded = Math.round(amount);
  const str = String(Math.abs(rounded));
  const grouped = str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return rounded < 0 ? `-${grouped}` : grouped;
}

export function formatRwfCurrency(amount: number): string {
  return `${formatRwf(amount)} RWF`;
}

function formatLocationLines(location?: BuyerLocation | null): string[] {
  if (!location || !location.districtName) return [];
  const parts = [location.districtName];
  if (location.sectorName) parts.push(location.sectorName);
  const landmark = location.landmark?.trim() ? ` (${location.landmark.trim()})` : '';
  const lines = [`Aho ndi: ${parts.join(', ')}${landmark}`];
  if (typeof location.lat === 'number' && typeof location.lng === 'number') {
    lines.push(`https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`);
  }
  return lines;
}

export interface SingleProductWhatsAppInput {
  shopName: string;
  productName: string;
  size: string;
  color: string;
  price: number;
  productUrl: string;
  location?: BuyerLocation | null;
}

export function buildSingleProductWhatsAppMessage(input: SingleProductWhatsAppInput): string {
  const lines: string[] = [
    `Muraho ${input.shopName},`,
    `nabonye iki gicuruzwa ku Isoko:`,
    ``,
    input.productName,
    `Size: ${input.size}  Ibara: ${input.color || 'Bisanzwe'}`,
    `Igiciro: ${formatRwfCurrency(input.price)}`,
    input.productUrl,
    ``,
    `Mbese kirahari?`,
  ];

  const locLines = formatLocationLines(input.location);
  if (locLines.length > 0) {
    lines.push(...locLines);
  }

  let message = lines.join('\n');
  if (message.length > 1500) {
    message = message.slice(0, 1497) + '...';
  }
  return message;
}

export interface CartWhatsAppBatch {
  message: string;
  url: string;
  itemCount: number;
  subtotal: number;
}

export function buildCartWhatsAppMessages(params: {
  shopName: string;
  shopWhatsapp: string;
  items: CartItem[];
  location?: BuyerLocation | null;
  baseUrl?: string;
}): CartWhatsAppBatch[] {
  const activeItems = params.items.filter((it) => it.status !== 'sold_out' && it.sizeInStock !== false);
  if (activeItems.length === 0) return [];

  // Appendix A.3: Cart exceeding 10 items for one seller is split into batches of up to 10
  const chunks: CartItem[][] = [];
  for (let i = 0; i < activeItems.length; i += 10) {
    chunks.push(activeItems.slice(i, i + 10));
  }

  const normalizedPhone = normalizeRwandaPhone(params.shopWhatsapp);

  return chunks.map((chunk, chunkIdx) => {
    const subtotal = chunk.reduce((sum, it) => sum + (it.currentPrice ?? it.priceSeen) * it.qty, 0);
    const buildText = (includeFirstProductLink: boolean, maxDescLen: number): string => {
      const lines: string[] = [
        `Muraho ${params.shopName},`,
        chunks.length > 1
          ? `nashakaga ibi bicuruzwa nabonye ku Isoko (Igice ${chunkIdx + 1}/${chunks.length}):`
          : `nashakaga ibi bicuruzwa nabonye ku Isoko:`,
        ``,
      ];

      chunk.forEach((it, idx) => {
        const unitPrice = it.currentPrice ?? it.priceSeen;
        const nameTrimmed =
          it.productName.length > maxDescLen
            ? `${it.productName.slice(0, maxDescLen - 1)}…`
            : it.productName;
        const colorPart = it.color ? `, ${it.color}` : '';
        lines.push(
          `${idx + 1}. ${nameTrimmed} - size ${it.size}${colorPart} - ${formatRwfCurrency(unitPrice)} x ${it.qty}`
        );
      });

      if (includeFirstProductLink && params.baseUrl && chunk[0]) {
        lines.push(`${params.baseUrl}/p/${chunk[0].productId}`);
      }

      lines.push(``);
      lines.push(`Igiteranyo: ${formatRwfCurrency(subtotal)}`);
      lines.push(`(Igiciro cya delivery ntikirimo; twumvikane.)`);

      const locLines = formatLocationLines(params.location);
      if (locLines.length > 0) {
        lines.push(``);
        lines.push(...locLines);
      }

      lines.push(``);
      lines.push(`Mbese birahari? Twumvikane ku kwishyura no kubigeza aho ndi.`);
      return lines.join('\n');
    };

    // Appendix A.3: Max 1500 chars; drop extra links and shorten lines if needed
    let message = buildText(true, 60);
    if (message.length > 1500) {
      message = buildText(false, 60);
    }
    if (message.length > 1500) {
      message = buildText(false, 32);
    }
    if (message.length > 1500) {
      message = message.slice(0, 1497) + '...';
    }

    return {
      message,
      url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
      itemCount: chunk.reduce((s, it) => s + it.qty, 0),
      subtotal,
    };
  });
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizeRwandaPhone(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
