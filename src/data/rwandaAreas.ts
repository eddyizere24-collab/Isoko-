import type { Area } from '../types/marketplace';

export const PROVINCES_DISTRICTS: Array<{ province: string; districts: string[] }> = [
  {
    province: 'Umujyi wa Kigali',
    districts: ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  },
  {
    province: 'Amajyaruguru',
    districts: ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  },
  {
    province: 'Amajyepfo',
    districts: ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyarugruru', 'Ruhango'].map((d) =>
      d === 'Nyarugruru' ? 'Nyaruguru' : d
    ),
  },
  {
    province: 'Iburasirazuba',
    districts: ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  },
  {
    province: 'Iburengerazuba',
    districts: ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
  },
];

export const KIGALI_SECTORS: Record<string, string[]> = {
  Gasabo: [
    'Bumbogo', 'Gatsata', 'Gikomero', 'Gisozi', 'Jabana', 'Jali', 'Kacyiru',
    'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Remera', 'Rusororo', 'Rutunga',
  ],
  Kicukiro: [
    'Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Kigarama',
    'Masaka', 'Niboye', 'Nyarugunga',
  ],
  Nyarugenge: [
    'Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima',
    'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo',
  ],
};

function buildAreas(): Area[] {
  const list: Area[] = [];
  let id = 1;
  for (const group of PROVINCES_DISTRICTS) {
    for (const district of group.districts) {
      const districtId = id++;
      const isKigali = group.province === 'Umujyi wa Kigali';
      list.push({
        id: districtId,
        province: group.province,
        district,
        sector: null,
        parent_id: null,
        active: true,
      });
      const sectors = KIGALI_SECTORS[district] ?? [];
      for (const sector of sectors) {
        list.push({
          id: id++,
          province: group.province,
          district,
          sector,
          parent_id: districtId,
          active: isKigali,
        });
      }
    }
  }
  return list;
}

export const RWANDA_AREAS: Area[] = buildAreas();
export const RWANDA_DISTRICTS: Area[] = RWANDA_AREAS.filter((a) => a.sector === null);
export function getSectorsForDistrict(districtId: number): Area[] {
  return RWANDA_AREAS.filter((a) => a.parent_id === districtId);
}
export function findDistrictByName(name: string): Area | undefined {
  return RWANDA_DISTRICTS.find((d) => d.district.toLowerCase() === name.toLowerCase());
}
export function findSectorByName(districtId: number, name: string): Area | undefined {
  return RWANDA_AREAS.find(
    (a) => a.parent_id === districtId && a.sector?.toLowerCase() === name.toLowerCase()
  );
}
