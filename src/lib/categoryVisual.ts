import {
  Briefcase,
  Car,
  Footprints,
  Glasses,
  Hammer,
  Package,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Tractor,
  type LucideIcon,
} from 'lucide-react';

const VEHICLES = ['imodoka', 'moto-amagare', 'ibyuma-by-imodoka'];
const HOME = ['ibikoresho-byo-mu-nzu', 'intebe-ameza', 'ibitanda-matela', 'igikoni'];
const FARM = ['ubuhinzi', 'ibikoresho-by-ubuhinzi', 'imbuto-ifumbire', 'amatungo'];
const ELECTRONICS = ['ikoranabuhanga', 'telefoni', 'mudasobwa-televiziyo', 'ibikoresho-by-amashanyarazi', 'amatelefoni'];
const BUILDING = ['ubwubatsi', 'ibikoresho-byo-kubaka', 'ibikoresho-by-intoki'];

/** Icon for a category slug (top level and sub categories). */
export function getCategoryIcon(slug: string): LucideIcon {
  if (VEHICLES.includes(slug)) return Car;
  if (HOME.includes(slug)) return Sofa;
  if (FARM.includes(slug)) return Tractor;
  if (ELECTRONICS.includes(slug) || slug.includes('cases') || slug.includes('power')) return Smartphone;
  if (BUILDING.includes(slug)) return Hammer;
  if (slug === 'ibindi-bicuruzwa') return Package;
  if (slug.includes('inkweto') || slug.includes('sandali') || slug.includes('bote')) return Footprints;
  if (slug.includes('imyenda') || slug.includes('ankara') || slug.includes('ikoti')) return Shirt;
  if (slug.includes('indorerwamo') || slug.includes('amasaha') || slug.includes('ingofero')) return Glasses;
  if (slug.includes('amasogisi') || slug.includes('imbere')) return Sparkles;
  return Briefcase;
}

/** Category icons share the brand red on a soft yellow tile, so the rail reads as one family. */
export function getCategoryIconColor(_slug: string): string {
  return '#C0392B';
}
