import type { Category } from '../types/marketplace';

export const COLORS_LIST: Array<{ name: string; hex: string }> = [
  { name: 'Umukara', hex: '#1B1F23' },
  { name: 'Umweru', hex: '#F8FAFC' },
  { name: 'Imvi', hex: '#94A3B8' },
  { name: 'Ubururu', hex: '#2563EB' },
  { name: 'Umutuku', hex: '#DC2626' },
  { name: 'Icyatsi', hex: '#0B6E4F' },
  { name: 'Umuhondo', hex: '#EAB308' },
  { name: 'Ikawa', hex: '#78350F' },
  { name: 'Roza', hex: '#EC4899' },
  { name: 'Amabara menshi', hex: 'conic-gradient(#0B6E4F, #E8A33D, #2563EB, #DC2626, #0B6E4F)' },
];

export const SIZE_SETS: Record<string, string[]> = {
  shoes_adult: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
  shoes_kids: Array.from({ length: 16 }, (_, i) => String(20 + i)),
  shoes_all: [
    '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35',
  ],
  clothes_letters: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  clothes_pants: Array.from({ length: 15 }, (_, i) => String(28 + i)),
  clothes_kids: ['0-1', '2-3', '4-5', '6-7', '8-10', '11-14'],
  clothes_all: [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL',
    '28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42',
    '0-1', '2-3', '4-5', '6-7', '8-10', '11-14',
  ],
  socks: ['36-40', '41-45', 'Ubunini bumwe', 'S', 'M', 'L', 'XL', 'XXL'],
  accessories: ['Ubunini bumwe', 'S', 'M', 'L'],
  phone_models: [
    'iPhone 13', 'iPhone 14', 'iPhone 15', 'Samsung A14', 'Samsung A24',
    'Samsung S23', 'Tecno Spark', 'Infinix Hot', 'Universal / Byose',
  ],
};

export const POPULAR_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Jordan', 'Vans', 'Converse',
  'Zara', 'H&M', 'Levi’s', 'Timberland', 'Clarks', 'Gucci', 'Casio',
];

export const INITIAL_CATEGORIES: Category[] = [
  // Top-level categories (P1: 1-4, P3: 5)
  { id: 1, parent_id: null, slug: 'inkweto', name_rw: 'Inkweto', name_en: 'Shoes', sort: 1, size_set: 'shoes_all', active: true, phase: 'P1' },
  { id: 2, parent_id: null, slug: 'imyenda', name_rw: 'Imyenda', name_en: 'Clothing', sort: 2, size_set: 'clothes_all', active: true, phase: 'P1' },
  { id: 3, parent_id: null, slug: 'amasogisi', name_rw: "Amasogisi n'imyenda y'imbere", name_en: 'Socks & Underwear', sort: 3, size_set: 'socks', active: true, phase: 'P1' },
  { id: 4, parent_id: null, slug: 'ibindi', name_rw: 'Ibindi byo kwambara', name_en: 'Accessories', sort: 4, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 5, parent_id: null, slug: 'amatelefoni', name_rw: "Ibikoresho by'amatelefoni", name_en: 'Phone Accessories', sort: 5, size_set: 'phone_models', active: false, phase: 'P3' },

  // Subcategories for Inkweto (parent_id: 1)
  { id: 101, parent_id: 1, slug: 'inkweto-abagabo', name_rw: "Z'abagabo", name_en: 'Men Shoes', sort: 1, size_set: 'shoes_adult', active: true, phase: 'P1' },
  { id: 102, parent_id: 1, slug: 'inkweto-abagore', name_rw: "Z'abagore", name_en: 'Women Shoes', sort: 2, size_set: 'shoes_adult', active: true, phase: 'P1' },
  { id: 103, parent_id: 1, slug: 'inkweto-abana', name_rw: "Z'abana", name_en: 'Kids Shoes', sort: 3, size_set: 'shoes_kids', active: true, phase: 'P1' },
  { id: 104, parent_id: 1, slug: 'inkweto-siporo', name_rw: 'Siporo (sneakers)', name_en: 'Sneakers', sort: 4, size_set: 'shoes_adult', active: true, phase: 'P1' },
  { id: 105, parent_id: 1, slug: 'sandali', name_rw: "Sandali n'inkweto zoroheje", name_en: 'Sandals', sort: 5, size_set: 'shoes_adult', active: true, phase: 'P1' },
  { id: 106, parent_id: 1, slug: 'inkweto-bwiza', name_rw: 'Inkweto zo mu bwiza (zo gusohokana)', name_en: 'Dress Shoes', sort: 6, size_set: 'shoes_adult', active: true, phase: 'P1' },
  { id: 107, parent_id: 1, slug: 'bote', name_rw: 'Bote', name_en: 'Boots', sort: 7, size_set: 'shoes_adult', active: true, phase: 'P1' },

  // Subcategories for Imyenda (parent_id: 2)
  { id: 201, parent_id: 2, slug: 'imyenda-abagabo', name_rw: 'Abagabo', name_en: 'Men Clothing', sort: 1, size_set: 'clothes_all', active: true, phase: 'P1' },
  { id: 202, parent_id: 2, slug: 'imyenda-abagore', name_rw: 'Abagore', name_en: 'Women Clothing', sort: 2, size_set: 'clothes_letters', active: true, phase: 'P1' },
  { id: 203, parent_id: 2, slug: 'imyenda-abana', name_rw: 'Abana', name_en: 'Kids Clothing', sort: 3, size_set: 'clothes_kids', active: true, phase: 'P1' },
  { id: 204, parent_id: 2, slug: 'imyenda-siporo', name_rw: 'Imyenda ya siporo', name_en: 'Sportswear', sort: 4, size_set: 'clothes_letters', active: true, phase: 'P1' },
  { id: 205, parent_id: 2, slug: 'ankara', name_rw: "Ankara n'imyenda gakondo", name_en: 'Ankara & Traditional', sort: 5, size_set: 'clothes_letters', active: true, phase: 'P1' },
  { id: 206, parent_id: 2, slug: 'ibikoti-amajire', name_rw: "Ibikoti n'amajire (jackets, hoodies)", name_en: 'Jackets & Hoodies', sort: 6, size_set: 'clothes_letters', active: true, phase: 'P1' },

  // Subcategories for Amasogisi n'imyenda y'imbere (parent_id: 3)
  { id: 301, parent_id: 3, slug: 'amasogisi-abagabo', name_rw: "Amasogisi y'abagabo", name_en: 'Men Socks', sort: 1, size_set: 'socks', active: true, phase: 'P1' },
  { id: 302, parent_id: 3, slug: 'amasogisi-abagore', name_rw: "Y'abagore", name_en: 'Women Socks', sort: 2, size_set: 'socks', active: true, phase: 'P1' },
  { id: 303, parent_id: 3, slug: 'amasogisi-abana', name_rw: "Y'abana", name_en: 'Kids Socks', sort: 3, size_set: 'socks', active: true, phase: 'P1' },
  { id: 304, parent_id: 3, slug: 'imyenda-imbere', name_rw: "Imyenda y'imbere", name_en: 'Underwear', sort: 4, size_set: 'clothes_letters', active: true, phase: 'P1' },
  { id: 305, parent_id: 3, slug: 'ibikoresho-rugo', name_rw: "Imitako n'ibikoresho byo mu rugo", name_en: 'Home Textiles', sort: 5, size_set: 'accessories', active: true, phase: 'P1' },

  // Subcategories for Ibindi byo kwambara (parent_id: 4)
  { id: 401, parent_id: 4, slug: 'amasakoshi', name_rw: 'Amasakoshi', name_en: 'Bags', sort: 1, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 402, parent_id: 4, slug: 'imikandara', name_rw: 'Imikandara', name_en: 'Belts', sort: 2, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 403, parent_id: 4, slug: 'ingofero', name_rw: 'Ingofero', name_en: 'Hats', sort: 3, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 404, parent_id: 4, slug: 'amasaha', name_rw: 'Amasaha', name_en: 'Watches', sort: 4, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 405, parent_id: 4, slug: 'indorerwamo', name_rw: 'Indorerwamo', name_en: 'Sunglasses', sort: 5, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 406, parent_id: 4, slug: 'imitako', name_rw: 'Imitako', name_en: 'Jewelry', sort: 6, size_set: 'accessories', active: true, phase: 'P1' },
  { id: 407, parent_id: 4, slug: 'ibitambaro', name_rw: "Ibitambaro n'ibisa", name_en: 'Scarves', sort: 7, size_set: 'accessories', active: true, phase: 'P1' },

  // Subcategories for Ibikoresho by'amatelefoni (parent_id: 5, P3)
  { id: 501, parent_id: 5, slug: 'cases', name_rw: 'Ibifata (cases)', name_en: 'Cases', sort: 1, size_set: 'phone_models', active: true, phase: 'P3' },
  { id: 502, parent_id: 5, slug: 'screen-protectors', name_rw: 'Ibirinda ecran', name_en: 'Screen Protectors', sort: 2, size_set: 'phone_models', active: true, phase: 'P3' },
  { id: 503, parent_id: 5, slug: 'chargers', name_rw: 'Chargers', name_en: 'Chargers', sort: 3, size_set: 'phone_models', active: true, phase: 'P3' },
  { id: 504, parent_id: 5, slug: 'earphones', name_rw: 'Earphones', name_en: 'Earphones', sort: 4, size_set: 'phone_models', active: true, phase: 'P3' },
  { id: 505, parent_id: 5, slug: 'power-banks', name_rw: 'Power banks', name_en: 'Power Banks', sort: 5, size_set: 'phone_models', active: true, phase: 'P3' },
];
