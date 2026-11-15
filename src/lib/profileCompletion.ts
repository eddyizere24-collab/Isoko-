import type { Profile, Shop } from '../types/marketplace';

export interface ProfileCompletionItem {
  key: string;
  label: string;
  completed: boolean;
}

export interface ProfileCompletionSummary {
  percent: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletionItem[];
}

export function calculateProfileCompletion(
  profile: Pick<Profile, 'full_name' | 'avatar_path' | 'bio'> | null | undefined,
  shop: Pick<
    Shop,
    | 'name'
    | 'logo_path'
    | 'cover_path'
    | 'about'
    | 'district_id'
    | 'landmark'
    | 'hours_text'
    | 'delivery_text'
    | 'social_links'
  > | null | undefined
): ProfileCompletionSummary {
  const hasSocial = Boolean(
    shop?.social_links &&
      Object.values(shop.social_links).some((v) => typeof v === 'string' && v.trim().length > 0)
  );

  const items: ProfileCompletionItem[] = [
    {
      key: 'full_name',
      label: 'Amazina yawe',
      completed: Boolean(profile?.full_name && profile.full_name.trim().length >= 2),
    },
    {
      key: 'avatar',
      label: 'Ifoto yawe (profile)',
      completed: Boolean(profile?.avatar_path && profile.avatar_path.trim().length > 0),
    },
    {
      key: 'logo',
      label: "Logo y'iduka",
      completed: Boolean(shop?.logo_path && shop.logo_path.trim().length > 0),
    },
    {
      key: 'cover',
      label: "Ifoto yo hejuru y'iduka",
      completed: Boolean(shop?.cover_path && shop.cover_path.trim().length > 0),
    },
    {
      key: 'about',
      label: "Ibyerekeye iduka cyangwa wowe",
      completed: Boolean(
        (shop?.about && shop.about.trim().length >= 5) ||
          (profile?.bio && profile.bio.trim().length >= 5)
      ),
    },
    {
      key: 'location',
      label: "Akarere n'aho uherereye",
      completed: Boolean(shop?.district_id && shop.landmark && shop.landmark.trim().length >= 2),
    },
    {
      key: 'ops',
      label: 'Amasaha yo gukora na delivery',
      completed: Boolean(
        shop?.hours_text &&
          shop.hours_text.trim().length >= 3 &&
          shop?.delivery_text &&
          shop.delivery_text.trim().length >= 3
      ),
    },
    {
      key: 'social',
      label: 'Urubuga nkoranyambaga',
      completed: hasSocial,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return { percent, completedCount, totalCount, items };
}
