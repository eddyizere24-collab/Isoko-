import type {
  AuditLogEntry, MarketplaceSettings, PriceHistoryEntry, Product, Profile,
  PromoCampaign, Report, SellerKyc, Shop, Synonym,
} from '../types/marketplace';
import {
  getNeonJwt, getNeonUser, neon, neonFunctionUrl, normalizePhone,
  objectKeyFromPublicUrl,
} from './neon';

export async function claimFirstAdminAccount(payload:{
  fullName:string;phone:string;password:string;bootstrapCode:string;
}):Promise<{token:string;userId:string;role:'admin';expiresAt:number;profile:Profile;shop:null}> {
  const phone=normalizePhone(payload.phone);
  const email=phone+'@login.isoko.invalid';
  let user=await getNeonUser();
  if(user?.email&&user.email!==email) {
    throw new Error('Sohoka muri konti urimo mbere yo gutangiza Admin wa mbere.');
  }
  if(!user) {
    const signup=await neon.auth.signUp.email({
      email,password:payload.password,name:payload.fullName.trim(),
    }) as any;
    if(signup?.error) {
      const retry=await neon.auth.signIn.email({email,password:payload.password}) as any;
      if(retry?.error) fail(signup.error,'Konti ya Admin ntiyafunguwe.');
    }
    user=await getNeonUser();
  }
  if(!user?.id) throw new Error('Konti ntiyafunguwe neza. Ongera ugerageze.');

  const result=dataOf<any>(await neon.rpc('claim_first_admin_v1',{
    p_full_name:payload.fullName.trim(),
    p_phone:phone,
    p_code:payload.bootstrapCode.trim(),
  }),'Gushyiraho Admin wa mbere byanze.');
  const profile=result as Profile;
  return {
    token:'managed-neon-auth',
    userId:profile.id,
    role:'admin',
    expiresAt:Date.now()+12*60*60*1000,
    profile,
    shop:null,
  };
}

export interface BootstrapResponse {
  categories: any[];
  areas: any[];
  synonyms: Synonym[];
  campaigns: PromoCampaign[];
  settings: MarketplaceSettings;
  shops: Shop[];
  products: Product[];
}

function fail(error: any, fallback: string): never {
  const message = error?.message ?? error?.details ?? error?.hint ?? fallback;
  const translations: Record<string, string> = {
    AUTH_REQUIRED: 'Injira mbere yo gukomeza.',
    SELLER_PROFILE_NOT_FOUND: 'Konti y’umucuruzi ntiyabonetse.',
    SELLER_SHOP_NOT_FOUND: 'Iduka ryawe ntiriraboneka.',
    PRICE_INVALID: 'Igiciro nticyemewe.',
    OLD_PRICE_INVALID: 'Igiciro cya mbere kigomba kuruta igiciro gishya.',
    CATEGORY_INVALID: 'Hitamo icyiciro kiriho.',
    PRODUCT_IMAGES_REQUIRED: 'Shyiraho nibura ifoto imwe, nturenze eshanu.',
    PRODUCT_VARIANTS_REQUIRED: 'Hitamo nibura size imwe.',
    PRODUCT_LIMIT_REACHED: 'Wageze ku mubare ntarengwa w’ibicuruzwa kuri konti yawe.',
    PRODUCT_ALREADY_HIDDEN: 'Iki gicuruzwa gisanzwe gihishe.',
    PRODUCT_NOT_HIDDEN_BY_OWNER: 'Iki gicuruzwa nticyahishwe nawe, bityo ntushobora kugisubiza ahagaragara.',
    PRODUCT_STATUS_NOT_HIDABLE: 'Imiterere y’iki gicuruzwa ntishobora guhishwa ubu.',
    SELLER_SHOP_NOT_ACTIVE: 'Iduka ryawe ntirikora. Vugana na Admin.',
    PRODUCT_NOT_FOUND_OR_FORBIDDEN: 'Igicuruzwa ntikiboneka cyangwa ntabwo ari icyawe.',
    PRODUCT_NOT_ACTIVE: 'Iki gicuruzwa ntikiri mu bicuruzwa bigaragara.',
    PRODUCT_STATUS_NOT_RESTORABLE: 'Iki gicuruzwa ntigishobora gusubizwa mu bubiko muri iyi status.',
    TERMS_REQUIRED: 'Emeza amategeko n’amasezerano mbere yo gukomeza.',
    RWANDA_PHONE_INVALID: 'Nimero igomba kuba iyo mu Rwanda (2507XXXXXXXX).',
    NATIONAL_ID_INVALID: 'Nimero y’indangamuntu igomba kugira imibare 16.',
    NATIONAL_ID_ALREADY_USED: 'Iyi ndangamuntu isanzwe ikoreshwa kuri Isoko.',
    KYC_FILES_REQUIRED: 'Shyiraho amafoto yose asabwa ya KYC.',
    KYC_FILES_MUST_BE_PRIVATE: 'Amafoto ya KYC agomba kuba mu bubiko bw’ibanga.',
    DISTRICT_INVALID: 'Hitamo akarere kari ku rutonde.',
    SECTOR_INVALID: 'Umurenge wahisemo nturi muri aka karere.',
    ACCOUNT_ALREADY_REGISTERED: 'Iyi konti isanzwe ifite iduka.',
    PHONE_ALREADY_REGISTERED: 'Iyi nimero isanzwe ifite konti.',
    ADMIN_REQUIRED: 'Uburenganzira bwa Admin burakenewe.',
    REPORT_RATE_LIMIT: 'Warengeje umubare wa raporo muri iki gihe.',
    KYC_ACCESS_DENIED: 'Ntabwo wemerewe kubona inyandiko za KYC.',
    EMAIL_ALREADY_REGISTERED: 'Iyi email isanzwe ifite konti kuri ISOKO. Injira aho kongera kwiyandikisha.',
    ACCOUNT_EMAIL_REQUIRED: 'Email ya konti ntiyabonetse. Ongera winjire.',
    SHOP_NAME_REQUIRED: 'Andika izina ry’iduka ryawe.'
  };
  throw new Error(translations[message] ?? String(message));
}

function dataOf<T>(result: any, fallback: string): T {
  if (result?.error) fail(result.error, fallback);
  return result?.data as T;
}

function first<T>(data: any): T | null {
  if (!data) return null;
  return (Array.isArray(data) ? data[0] : data) as T ?? null;
}

function mapShop(row: any): Shop {
  return {
    ...row,
    logo_path: row.logo_path ?? null,
    cover_path: row.cover_path ?? null,
    social_links: row.social_links ?? {},
    active_product_count: Number(row.active_product_count ?? 0),
  } as Shop;
}

function mapProduct(row: any): Product {
  return {
    ...row,
    price: Number(row.price),
    old_price: row.old_price == null ? null : Number(row.old_price),
    images: row.images ?? row.product_images ?? [],
    variants: row.variants ?? row.product_variants ?? [],
    shop: row.shop ? mapShop(row.shop) : undefined,
    popularity_7d: Number(row.popularity_7d ?? 0),
    views_7d: Number(row.views_7d ?? 0),
    wa_clicks_7d: Number(row.wa_clicks_7d ?? 0),
  } as Product;
}

function mapCampaign(row: any): PromoCampaign {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle, kicker: row.kicker ?? '',
    ctaLabel: row.ctaLabel ?? row.cta_label ?? '',
    targetPath: row.targetPath ?? row.target_path ?? '/',
    imageUrl: row.imageUrl ?? row.image_url ?? '',
    shopId: row.shopId ?? row.shop_id ?? null,
    shopName: row.shopName ?? row.shop_name ?? null,
    active: Boolean(row.active), sortOrder: Number(row.sortOrder ?? row.sort_order ?? 0),
    impressions: Number(row.impressions ?? 0), clicks: Number(row.clicks ?? 0),
    created_at: row.created_at,
  };
}

async function currentAccount(): Promise<{ user: any; profile: Profile; shop: Shop | null }> {
  const user = await getNeonUser();
  if (!user?.id) throw new Error('Injira mbere yo gukomeza.');
  const profileResult = dataOf<any>(
    await neon.from('profiles')
      .select('id,auth_user_id,role,full_name,phone,whatsapp,email,email_verified,identity_status,status,status_reason,approved_by,approved_at,terms_version,terms_accepted_at,created_at')
      .eq('auth_user_id', user.id).maybeSingle(),
    'Konti yawe ntiyuzuye.'
  );
  const profile = first<Profile>(profileResult);
  if (!profile) throw new Error('Konti ya Isoko ntiyabonetse kuri iyi nimero.');
  const shopResult = dataOf<any>(
    await neon.from('shops').select('*').eq('owner_id', profile.id).maybeSingle(),
    'Ntibishobotse gufungura iduka ryawe.'
  );
  const shop = first<any>(shopResult);
  return { user, profile, shop: shop ? mapShop(shop) : null };
}

function storedSession(profile: Profile) {
  return {
    token: 'managed-neon-auth',
    userId: profile.id,
    role: profile.role,
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
  };
}

async function uploadThroughFunction(dataUrl: string, kind: string): Promise<{ key: string; url: string | null; bytes: number }> {
  const token = await getNeonJwt();
  const response = await fetch(new URL('api/upload', neonFunctionUrl), {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ dataUrl, kind }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Ifoto ntiyoherejwe. Ongera ugerageze.');
  if (!body.key) throw new Error('Ifoto ntiyabitswe neza.');
  return body as { key: string; url: string | null; bytes: number };
}

function storageKey(value: string): string {
  return objectKeyFromPublicUrl(value);
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const result = dataOf<any>(
    await neon.from('v_public_bootstrap').select('payload').limit(1).single(),
    'Ntibishobotse gufungura Isoko.'
  );
  const row = first<any>(result);
  const payload = row?.payload;
  if (!payload) throw new Error('Amakuru y’Isoko ntaraboneka.');
  return {
    categories: payload.categories ?? [], areas: payload.areas ?? [],
    synonyms: payload.synonyms ?? [], campaigns: (payload.campaigns ?? []).map(mapCampaign),
    settings: payload.settings ?? {}, shops: (payload.shops ?? []).map(mapShop),
    products: (payload.products ?? []).map(mapProduct),
  };
}

export async function trackCampaignEvent(campaignId: string, action: 'impression'|'click', sessionId: string): Promise<void> {
  try {
    await neon.rpc('track_campaign_v1',{p_campaign_id:campaignId,p_action:action,p_session_id:sessionId});
  } catch { /* Analytics must not block shopping. */ }
}

export async function fetchProductDetail(id: string): Promise<{
  product: Product; priceHistory: PriceHistoryEntry[]; similar: Product[]; buyTogether: Product[];
}> {
  const result = dataOf<any>(
    await neon.from('v_public_product_details').select('detail').eq('id',id).maybeSingle(),
    'Ntibishobotse gufungura iki gicuruzwa.'
  );
  const row = first<any>(result);
  if (!row?.detail?.product) {
    const err = new Error('Iki gicuruzwa ntikiboneka cyangwa cyakuwe ku Isoko.') as Error & { alternatives?: Product[] };
    err.alternatives = [];
    throw err;
  }
  const product = mapProduct(row.detail.product);
  if (product.shop?.id) {
    const shopIdentity = first<any>(dataOf<any>(
      await neon.from('v_public_shops').select('identity_status').eq('id', product.shop.id).maybeSingle(),
      'Ntibishobotse gusoma imiterere y’igenzura ry’iduka.'
    ));
    product.shop.identity_status = shopIdentity?.identity_status ?? 'unverified';
  }
  return {
    product,
    priceHistory: row.detail.priceHistory ?? [],
    similar: (row.detail.similar ?? []).map(mapProduct),
    buyTogether: (row.detail.buyTogether ?? []).map(mapProduct),
  };
}

export async function fetchShopDetail(slug: string): Promise<{shop:Shop;products:Product[]}> {
  const result = dataOf<any>(
    await neon.from('v_public_shop_details').select('detail').eq('slug',slug).maybeSingle(),
    'Ntibishobotse gufungura iduka.'
  );
  const row=first<any>(result);
  if(!row?.detail?.shop) throw new Error('Iduka ntiriboneka cyangwa ntiraremezwa.');
  return {shop:mapShop(row.detail.shop),products:(row.detail.products??[]).map(mapProduct)};
}

export async function validateCartItems(items:Array<{productId:string;size:string;priceSeen:number}>):Promise<{validated:Array<{
  productId:string;exists:boolean;status:Product['status'];currentPrice:number;priceChanged?:boolean;sizeInStock:boolean;
}>}> {
  const ids=[...new Set(items.map((item)=>item.productId))];
  if(!ids.length) return {validated:[]};
  const rows=dataOf<any>(
    await neon.from('v_public_products').select('id,status,price,variants').in('id',ids),
    'Ntibishobotse kugenzura igare.'
  )??[];
  const byId=new Map(rows.map((row:any)=>[row.id,row]));
  return {validated:items.map((item)=>{
    const product=byId.get(item.productId) as any;
    const variant=product?.variants?.find((v:any)=>v.size_label===item.size);
    return {
      productId:item.productId,exists:Boolean(product),status:product?.status??'expired',
      currentPrice:Number(product?.price??0),
      priceChanged:product?Number(product.price)!==item.priceSeen:false,
      sizeInStock:Boolean(product&&product.status==='active'&&variant?.in_stock&&(variant.qty==null||Number(variant.qty)>0)),
    };
  })};
}

export async function submitReport(payload:{targetType:'product'|'shop';targetId:string;type:string;details:string;reporterPhone?:string;sessionId:string;turnstileOk:boolean}):Promise<{report:Report}> {
  const data=dataOf<any>(await neon.rpc('create_public_report_v1',{
    p_target_type:payload.targetType,p_target_id:payload.targetId,p_type:payload.type,
    p_details:payload.details,p_reporter_phone:payload.reporterPhone??null,p_session_id:payload.sessionId,
  }),'Raporo ntiyoherejwe.');
  return {report:data as Report};
}

export async function subscribeUpdates(payload:{kind:'push'|'email'|'shop_follow';externalId:string;districtId?:number|null;topCategoryId?:number|null;shopId?:string|null;unsubscribe?:boolean}) {
  return dataOf<any>(await neon.rpc('subscribe_updates_v1',{
    p_kind:payload.kind,p_external_id:payload.externalId,p_district_id:payload.districtId??null,
    p_top_category_id:payload.topCategoryId??null,p_shop_id:payload.shopId??null,
    p_unsubscribe:payload.unsubscribe??false,p_consent_version:'1.0',
  }),'Ntibishobotse kubika amahitamo yawe.');
}

export async function loginAccount(identifier:string,password:string):Promise<{token:string;expiresAt:number;profile:Profile;shop:Shop|null}> {
  const rawIdentifier=String(identifier??'').trim();
  const email=rawIdentifier.includes('@')
    ? rawIdentifier.toLowerCase()
    : normalizePhone(rawIdentifier)+'@login.isoko.invalid';
  const result=await neon.auth.signIn.email({email,password}) as any;
  if(result?.error) fail(result.error,'Email cyangwa ijambo ry’ibanga si byo. Konti za Admin za kera ziracyinjira hakoreshejwe nimero.');
  const current=await currentAccount();
  return {...storedSession(current.profile),profile:current.profile,shop:current.shop};
}

export async function requestAccountPasswordReset(email:string,redirectTo:string):Promise<void> {
  const normalized=String(email??'').trim().toLowerCase();
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(normalized)) {
    throw new Error('Andika email nyayo wakoresheje ufungura konti yawe.');
  }
  const result=await (neon.auth as any).requestPasswordReset({
    email:normalized,
    redirectTo,
  });
  if(result?.error) fail(result.error,'Ntitwashoboye kohereza ubusabe. Ongera ugerageze.');
}

export async function resetAccountPassword(token:string,newPassword:string):Promise<void> {
  if(!token) throw new Error('Link yo guhindura ijambo ry’ibanga ntiyuzuye cyangwa yararengeje igihe.');
  if(newPassword.length<8) throw new Error('Ijambo ry’ibanga rishya rigomba kugira nibura inyuguti 8.');
  const result=await (neon.auth as any).resetPassword({token,newPassword});
  if(result?.error) fail(result.error,'Link yo guhindura password ntiyemewe. Saba indi nshya.');
}

export async function registerSellerAccount(payload:Record<string,any>):Promise<{token:string;expiresAt:number;profile:Profile;shop:Shop}> {
  const phone=normalizePhone(String(payload.phone??payload.whatsapp??''));
  const email=String(payload.email??'').trim().toLowerCase();
  const password=String(payload.password??'');
  const shopName=String(payload.shopName??'').trim();
  const fullName=String(payload.fullName??'').trim();

  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    throw new Error('Andika email nyayo, urugero: izina@gmail.com.');
  }
  if(!/^2507[0-9]{8}$/.test(phone)) {
    throw new Error('Nimero ya WhatsApp igomba kuba iya MTN cyangwa Airtel mu Rwanda (07XXXXXXXX).');
  }
  if(password.length<8) throw new Error('Ijambo ry’ibanga rigomba kugira nibura inyuguti 8.');
  if(shopName.length<2) throw new Error('Andika izina ry’iduka ryawe.');

  let user=await getNeonUser();
  if(user?.email&&String(user.email).toLowerCase()!==email) {
    throw new Error('Hari indi konti ifunguye. Sohoka mbere yo gufungura iduka rishya.');
  }
  if(!user) {
    const signup=await neon.auth.signUp.email({
      email,
      password,
      name:fullName||shopName,
    }) as any;
    if(signup?.error) {
      const retry=await neon.auth.signIn.email({email,password}) as any;
      if(retry?.error) fail(signup.error,'Kwiyandikisha byanze. Reba email n’ijambo ry’ibanga.');
    }
    user=await getNeonUser();
  }
  if(!user?.id) throw new Error('Konti ntiyafunguwe neza. Ongera winjire ukoresheje email yawe.');

  // The short-lived registration draft protects first-time seller profile creation.
  // No national ID, TIN, selfie or identity-document images are requested here.
  dataOf<any>(
    await neon.rpc('start_seller_registration_v1',{p_phone:phone}),
    'Ntibishobotse gutangiza iduka. Reba nimero ya WhatsApp wongere ugerageze.'
  );

  const result=dataOf<any>(await neon.rpc('register_basic_seller_v1',{
    p_shop_name:shopName,
    p_phone:phone,
    p_full_name:fullName||null,
    p_terms_accepted:Boolean(payload.termsAccepted),
    p_terms_version:'1.0',
  }),'Gufungura iduka byanze.');

  const profile=result.profile as Profile;
  return {...storedSession(profile),profile,shop:mapShop(result.shop)};
}
export async function fetchMe():Promise<{profile:Profile;shop:Shop|null}> {
  const current=await currentAccount();
  return {profile:current.profile,shop:current.shop};
}

export async function uploadImagePair(dataUrl:string,kind:'full'|'thumb'|'shop'):Promise<{url:string;bytes:number}> {
  const result=await uploadThroughFunction(dataUrl,kind);
  if(!result.url) throw new Error('Ifoto rusange ntiyabonetse.');
  return {url:result.url,bytes:result.bytes};
}

export async function fetchSellerOverview():Promise<{
  profile:Pick<Profile,'id'|'full_name'|'status'|'status_reason'|'identity_status'|'email'|'email_verified'>;shop:Shop;products:Product[];staleProducts:Product[];
  stats7d:{views:number;wa_clicks:number;call_clicks:number;cart_adds:number;shares:number};
  stats30d:{views:number;wa_clicks:number;call_clicks:number;cart_adds:number;shares:number};
  topViewed:Product[];topWa:Product|null;
}> {
  const current=await currentAccount();
  if(!current.shop) throw new Error('Iduka ryawe ntiriboneka.');
  const productRows=dataOf<any>(
    await neon.from('products').select('*,product_images(*),product_variants(*)')
      .eq('shop_id',current.shop.id).order('created_at',{ascending:false}),
    'Ntibishobotse gufungura ibicuruzwa byawe.'
  )??[];
  const products=productRows.map(mapProduct);
  const ids=products.map((p:Product)=>p.id);
  let stats:any[]=[];
  if(ids.length) {
    stats=dataOf<any>(
      await neon.from('product_daily_stats').select('*').in('product_id',ids)
        .gte('day',new Date(Date.now()-30*86400000).toISOString().slice(0,10)),
      'Ntibishobotse gusoma imibare y’iduka.'
    )??[];
  }
  const cutoff7=new Date(Date.now()-7*86400000).toISOString().slice(0,10);
  const sum=(rows:any[])=>rows.reduce((a,r)=>({
    views:a.views+Number(r.views??0),wa_clicks:a.wa_clicks+Number(r.wa_clicks??0),
    call_clicks:a.call_clicks+Number(r.call_clicks??0),cart_adds:a.cart_adds+Number(r.cart_adds??0),
    shares:a.shares+Number(r.shares??0),
  }),{views:0,wa_clicks:0,call_clicks:0,cart_adds:0,shares:0});
  const stale=Date.now()-30*86400000;
  const staleProducts=products.filter((p: Product)=>p.status==='active'&&new Date(p.last_confirmed_at).getTime()<=stale);
  return {
    profile:{id:current.profile.id,full_name:current.profile.full_name,status:current.profile.status,status_reason:current.profile.status_reason,identity_status:current.profile.identity_status,email:current.profile.email,email_verified:current.profile.email_verified},
    shop:current.shop,products,staleProducts,stats7d:sum(stats.filter((r)=>r.day>=cutoff7)),stats30d:sum(stats),
    topViewed:[...products].sort((a,b)=>(b.views_7d??0)-(a.views_7d??0)).slice(0,5),
    topWa:[...products].sort((a,b)=>(b.wa_clicks_7d??0)-(a.wa_clicks_7d??0))[0]??null,
  };
}

export async function createSellerProduct(payload:Record<string,any>):Promise<{product:Product}> {
  const images=(payload.images??[]).map((image:any,index:number)=>({
    position:index,path_full:storageKey(String(image.path_full??'')),
    path_thumb:storageKey(String(image.path_thumb??image.path_full??'')),
    width:Number(image.width??1),height:Number(image.height??1),bytes:Number(image.bytes??0),
  }));
  const result=dataOf<any>(await neon.rpc('create_seller_product_v1',{p_payload:{...payload,images}}),'Igicuruzwa nticyabitswe.');
  const productRows=dataOf<any>(
    await neon.from('products').select('*,product_images(*),product_variants(*)').eq('id',result.id).maybeSingle(),
    'Igicuruzwa cyabitswe ariko nticyagarutse.'
  );
  const product=first<any>(productRows);
  if(!product) throw new Error('Igicuruzwa cyabitswe ariko nticyagarutse muri list.');
  return {product:mapProduct(product)};
}

export async function updateSellerProduct(id:string,payload:Record<string,any>):Promise<{product:Product}> {
  let update={...payload};
  if(payload.action==='update_price') {
    const previous=first<any>(dataOf<any>(await neon.from('products').select('price').eq('id',id).maybeSingle(),'Ntibishobotse gusoma igiciro kiriho.'));
    update={price:Number(payload.price),old_price:payload.useOldPrice?Number(previous?.price??0):null};
  }
  if(Array.isArray(payload.images)) {
    update.images=payload.images.map((image:any,index:number)=>({
      position:index,path_full:storageKey(String(image.path_full??'')),
      path_thumb:storageKey(String(image.path_thumb??image.path_full??'')),
      width:Number(image.width??1),height:Number(image.height??1),bytes:Number(image.bytes??0),
    }));
  }
  if (payload.action === 'mark_sold' || payload.action === 'restore') {
    dataOf(
      await neon.rpc('set_seller_product_status_v1',{p_product_id:id,p_action:payload.action}),
      'Ntibishobotse guhindura uko igicuruzwa gihagaze.'
    );
  } else {
    dataOf(
      await neon.rpc('update_seller_product_v1',{p_product_id:id,p_payload:update}),
      'Ntibishobotse kuvugurura igicuruzwa.'
    );
  }
  const fresh=first<any>(dataOf<any>(
    await neon.from('products').select('*,product_images(*),product_variants(*)').eq('id',id).maybeSingle(),
    'Ntibishobotse gusoma igicuruzwa gishya.'
  ));
  if(!fresh) throw new Error('Igicuruzwa cyavuguruwe. Ongera ufungure urutonde.');
  return {product:mapProduct(fresh)};
}

export async function copySellerProduct(id:string):Promise<{product:Product}> {
  const result=dataOf<any>(await neon.rpc('copy_seller_product_v1',{p_product_id:id}),'Ntibishobotse gukoporora igicuruzwa.');
  const row=first<any>(dataOf<any>(
    await neon.from('products').select('*,product_images(*),product_variants(*)').eq('id',result.id).maybeSingle(),
    'Ntibishobotse gusoma copy nshya.'
  ));
  if(!row) throw new Error('Copy yabitswe ariko ntigarutse muri list.');
  return {product:mapProduct(row)};
}

export async function deleteSellerProduct(id:string):Promise<{ok:boolean}> {
  const result=dataOf<any>(await neon.rpc('delete_seller_product_v1',{p_product_id:id}),'Ntibishobotse gusiba igicuruzwa.');
  return {ok:Boolean(result?.ok)};
}

export async function setSellerProductVisibility(id:string,action:'hide'|'unhide'):Promise<{ok:boolean;status:Product['status']}> {
  const result=dataOf<any>(
    await neon.rpc('set_seller_product_visibility_v1',{p_product_id:id,p_action:action}),
    'Ntibishobotse guhindura uko igicuruzwa kigaragara.'
  );
  return {ok:Boolean(result?.ok),status:result.status as Product['status']};
}

export async function updateSellerShop(payload:Record<string,unknown>):Promise<{shop:Shop}> {
  const current=await currentAccount();
  const districtId=Number(payload.district_id);
  const district=first<any>(dataOf<any>(
    await neon.from('areas').select('id,district,province,sector,parent_id')
      .eq('id',districtId).is('sector',null).maybeSingle(),
    'Akarere wahisemo ntikabonetse.'
  ));
  if(!district) throw new Error('Hitamo akarere kari ku rutonde.');
  const sectorId=payload.sector_id==null?null:Number(payload.sector_id);
  let sector:any=null;
  if(sectorId!==null) {
    sector=first<any>(dataOf<any>(
      await neon.from('areas').select('id,sector,parent_id')
        .eq('id',sectorId).eq('parent_id',districtId).maybeSingle(),
      'Umurenge ntubonetse.'
    ));
    if(!sector) throw new Error('Umurenge wahisemo nturi muri aka karere.');
  }
  const row=first<any>(dataOf<any>(
    await neon.from('shops').update({
      name:String(payload.name??'').trim(),
      about:String(payload.about??''),
      logo_key:payload.logo_path ? storageKey(String(payload.logo_path)) : null,
      cover_key:payload.cover_path ? storageKey(String(payload.cover_path)) : null,
      social_links:payload.social_links && typeof payload.social_links === 'object' ? payload.social_links : {},
      whatsapp:normalizePhone(String(payload.whatsapp??'')),
      phone:normalizePhone(String(payload.phone??'')),
      district_id:districtId,
      sector_id:sectorId,
      district_name:district.district,
      sector_name:sector?.sector??null,
      landmark:String(payload.landmark??''),
      hours_text:String(payload.hours_text??''),
      delivery_text:String(payload.delivery_text??''),
    }).eq('owner_id',current.profile.id).select('*').maybeSingle(),
    'Ntibishobotse kuvugurura amakuru y’iduka.'
  ));
  if(!row) throw new Error('Iduka ntiriboneka.');
  return {shop:mapShop(row)};
}

export interface AdminControlCenterSnapshot {
  generatedAt: string;
  periodDays: number;
  sellers: { total: number; pending: number; approved: number; needs_changes: number; rejected: number; suspended: number };
  shops: { total: number; pending: number; approved: number; needs_changes: number; rejected: number; suspended: number };
  products: { total: number; active: number; draft: number; sold_out: number; hidden: number; expired: number };
  reports: { total: number; new: number; in_progress: number; resolved: number };
  reportsByType: Array<{ type: string; count: number }>;
  frequentReporters: Array<{ maskedPhone: string; totalReports: number; openReports: number }>;
  traffic: { views: number; waClicks: number; callClicks: number; cartAdds: number; shares: number };
  daily: Array<{ day: string; views: number; waClicks: number; cartAdds: number }>;
  topShops: Array<{ shopId: string; shopName: string; sellerName: string; district: string; status: string; views: number; waClicks: number; callClicks: number; cartAdds: number; shares: number; openReports: number; totalReports: number }>;
  riskShops: Array<{ shopId: string; shopName: string; sellerName: string; district: string; shopStatus: string; openReports: number; totalReports: number }>;
  topProducts: Array<{ productId: string; productName: string; shopName: string; district: string; status: string; views: number; waClicks: number; cartAdds: number }>;
  activityByAction: Array<{ action: string; count: number }>;
  campaigns: { total: number; active: number; impressions: number; clicks: number };
  coverage: { sellers: number; shops: number; products: number; reports: number; shop_stat_days: number; audit_entries: number };
}

export async function fetchAdminControlCenter(): Promise<AdminControlCenterSnapshot> {
  const current = await currentAccount();
  if (current.profile.role !== 'admin' || current.profile.status !== 'approved') {
    throw new Error('Admin mukuru gusa ni we ukoresha Ishakiro ry’Ubuyobozi.');
  }
  const result = await neon.rpc('admin_control_center_snapshot_v1', {});
  return dataOf<AdminControlCenterSnapshot>(result, 'Ntibishobotse gusoma imibare y’ubuyobozi.');
}

export interface AdminOverviewResponse {
  kpis:{pendingSellers:number;newReports:number;newProducts24h:number;totalActiveProducts:number;totalShops:number;views:number;wa_clicks:number;call_clicks:number;cart_adds:number;};
  sellers:Array<Profile&{shop:Shop|null;hasKyc:boolean;kycSubmittedAt:string|null}>;
  products:Product[];reports:Report[];synonyms:Synonym[];campaigns:PromoCampaign[];
  settings:MarketplaceSettings;categories:any[];auditLog:AuditLogEntry[];
}

export async function fetchAdminOverview():Promise<AdminOverviewResponse> {
  const current=await currentAccount();
  if(current.profile.role!=='admin'&&current.profile.role!=='moderator') throw new Error('Admin gusa ni we winjira hano.');
  const [profiles,shops,products,reports,kyc,synonyms,campaigns,settingsRows,categories,auditLog,stats]=await Promise.all([
    neon.from('profiles').select('id,role,full_name,phone,whatsapp,status,status_reason,approved_by,approved_at,terms_version,terms_accepted_at,created_at'),
    neon.from('shops').select('*'),
    neon.from('products').select('*,product_images(*),product_variants(*)').order('created_at',{ascending:false}).limit(200),
    neon.from('reports').select('*').order('created_at',{ascending:false}).limit(100),
    neon.from('seller_kyc').select('seller_id,submitted_at'),
    neon.from('synonyms').select('*').order('term'),
    neon.from('campaigns').select('*').order('sort_order'),
    neon.from('settings').select('*'),
    neon.from('categories').select('*').order('parent_id').order('sort'),
    neon.from('audit_log').select('*').order('created_at',{ascending:false}).limit(100),
    neon.from('shop_daily_stats').select('views,wa_clicks,call_clicks,cart_adds').gte('day',new Date(Date.now()-30*86400000).toISOString().slice(0,10)),
  ]);
  const profileRows=dataOf<any>(profiles,'Admin ntiyashoboye gusoma konti.')??[];
  const shopRows=dataOf<any>(shops,'Admin ntiyashoboye gusoma amaduka.')??[];
  const productRows=dataOf<any>(products,'Admin ntiyashoboye gusoma ibicuruzwa.')??[];
  const reportRows=dataOf<any>(reports,'Admin ntiyashoboye gusoma raporo.')??[];
  const kycRows=dataOf<any>(kyc,'Admin ntiyashoboye gusoma KYC metadata.')??[];
  const synonymRows=dataOf<any>(synonyms,'Admin ntiyashoboye gusoma synonyms.')??[];
  const campaignRows=dataOf<any>(campaigns,'Admin ntiyashoboye gusoma campaigns.')??[];
  const settingRows=dataOf<any>(settingsRows,'Admin ntiyashoboye gusoma settings.')??[];
  const categoryRows=dataOf<any>(categories,'Admin ntiyashoboye gusoma ibyiciro.')??[];
  const auditRows=dataOf<any>(auditLog,'Admin ntiyashoboye gusoma audit log.')??[];
  const statRows=dataOf<any>(stats,'Admin ntiyashoboye gusoma imibare.')??[];
  const shopByOwner=new Map(shopRows.map((row:any)=>[row.owner_id,mapShop(row)]));
  const kycBySeller=new Map<string, any>(kycRows.map((row:any)=>[String(row.seller_id),row]));
  const sellers=(profileRows as Profile[]).filter((p)=>p.role==='seller').map((p:any)=>({
    ...p,shop:shopByOwner.get(p.id)??null,hasKyc:kycBySeller.has(p.id),kycSubmittedAt:kycBySeller.get(p.id)?.submitted_at??null,
  }));
  const mappedProducts=productRows.map(mapProduct);
  const mappedCampaigns=campaignRows.map(mapCampaign);
  const settings=Object.fromEntries(settingRows.map((row:any)=>[row.key,row.value])) as MarketplaceSettings;
  const dayAgo=new Date(Date.now()-86400000).toISOString();
  return {
    kpis:{
      pendingSellers:sellers.filter((s:any)=>s.status==='pending').length,
      newReports:reportRows.filter((r:any)=>r.status==='new').length,
      newProducts24h:mappedProducts.filter((p:Product)=>p.created_at>=dayAgo).length,
      totalActiveProducts:mappedProducts.filter((p:Product)=>p.status==='active').length,
      totalShops:shopRows.length,
      views:statRows.reduce((n:number,r:any)=>n+Number(r.views??0),0),
      wa_clicks:statRows.reduce((n:number,r:any)=>n+Number(r.wa_clicks??0),0),
      call_clicks:statRows.reduce((n:number,r:any)=>n+Number(r.call_clicks??0),0),
      cart_adds:statRows.reduce((n:number,r:any)=>n+Number(r.cart_adds??0),0),
    },
    sellers,products:mappedProducts,reports:reportRows as Report[],synonyms:synonymRows,campaigns:mappedCampaigns,
    settings,categories:categoryRows,auditLog:auditRows as AuditLogEntry[],
  };
}

export async function fetchAdminKyc(sellerId:string):Promise<{kyc:{
  seller_id:string;full_name_on_id:string;business_type:string;idFrontUrl:string|null;
  idBackUrl:string|null;selfieUrl:string|null;shopPhotoUrl:string|null;submitted_at:string;
};signedUrlExpiresIn:number}> {
  const token=await getNeonJwt();
  const response=await fetch(new URL('api/admin/kyc/'+encodeURIComponent(sellerId),neonFunctionUrl),{
    headers:{authorization:'Bearer '+token},
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(body.error??'Ntibishobotse kureba KYC.');
  return body;
}

export async function reviewAdminSeller(sellerId:string,payload:{status:string;reason?:string;phoneVerified?:boolean;whatsappVerified?:boolean}) {
  return dataOf(await neon.rpc('admin_review_seller_v1',{
    p_seller_id:sellerId,p_status:payload.status,p_reason:payload.reason??null,
    p_phone_verified:payload.phoneVerified??false,p_whatsapp_verified:payload.whatsappVerified??false,
  }),'Ntibishobotse gufata icyemezo ku mucuruzi.');
}
export async function moderateAdminProduct(productId:string,action:'hide'|'restore',reason?:string) {
  return dataOf(await neon.rpc('admin_moderate_product_v1',{p_product_id:productId,p_action:action,p_reason:reason??null}),'Ntibishobotse kugenzura igicuruzwa.');
}
export async function resolveAdminReport(reportId:string,payload:{status:string;resolution:string;hideTarget?:boolean}) {
  return dataOf(await neon.rpc('admin_resolve_report_v1',{
    p_report_id:reportId,p_status:payload.status,p_resolution:payload.resolution,p_hide_target:payload.hideTarget??false,
  }),'Ntibishobotse gukemura raporo.');
}

export async function addAdminSynonym(term:string,canonical:string):Promise<{synonyms:Synonym[]}> {
  dataOf(await neon.from('synonyms').upsert({term:term.trim(),canonical:canonical.trim()},{onConflict:'term'}),'Ntibishobotse kubika synonym.');
  return {synonyms:dataOf<any>(await neon.from('synonyms').select('*').order('term'),'Ntibishobotse gusoma synonyms.')??[]};
}
export async function deleteAdminSynonym(term:string):Promise<{synonyms:Synonym[]}> {
  dataOf(await neon.from('synonyms').delete().eq('term',term),'Ntibishobotse gusiba synonym.');
  return {synonyms:dataOf<any>(await neon.from('synonyms').select('*').order('term'),'Ntibishobotse gusoma synonyms.')??[]};
}
export async function updateAdminSettings(payload:Partial<MarketplaceSettings>):Promise<{settings:MarketplaceSettings}> {
  const rows=Object.entries(payload).map(([key,value])=>({key,value}));
  dataOf(await neon.from('settings').upsert(rows,{onConflict:'key'}),'Ntibishobotse kubika settings.');
  const values=dataOf<any>(await neon.from('settings').select('*'),'Ntibishobotse gusoma settings.')??[];
  return {settings:Object.fromEntries(values.map((row:any)=>[row.key,row.value])) as MarketplaceSettings};
}
export async function createAdminCampaign(payload:{title:string;subtitle:string;kicker?:string;ctaLabel:string;targetPath:string;imageUrl:string;shopId?:string|null;}):Promise<{campaign:PromoCampaign;campaigns:PromoCampaign[]}> {
  const image=await uploadThroughFunction(payload.imageUrl,'campaign');
  const inserted=first<any>(dataOf<any>(await neon.from('campaigns').insert({
    id:'campaign-'+crypto.randomUUID().replace(/-/g,''),title:payload.title,subtitle:payload.subtitle,
    kicker:payload.kicker??'',cta_label:payload.ctaLabel,target_path:payload.targetPath,image_key:image.key,
    shop_id:payload.shopId??null,active:true,sort_order:0,
  }).select('*').maybeSingle(),'Ntibishobotse gushyiraho campaign.'));
  if(!inserted) throw new Error('Campaign ntiyabitswe.');
  const rows=dataOf<any>(await neon.from('campaigns').select('*').order('sort_order'),'Ntibishobotse gusoma campaigns.')??[];
  return {campaign:mapCampaign(inserted),campaigns:rows.map(mapCampaign)};
}
export async function updateAdminCampaign(id:string,payload:Partial<Pick<PromoCampaign,'active'|'sortOrder'|'title'|'subtitle'|'ctaLabel'|'targetPath'>>):Promise<{campaign:PromoCampaign;campaigns:PromoCampaign[]}> {
  const update:any={};
  if(payload.active!==undefined) update.active=payload.active;
  if(payload.sortOrder!==undefined) update.sort_order=payload.sortOrder;
  if(payload.title!==undefined) update.title=payload.title;
  if(payload.subtitle!==undefined) update.subtitle=payload.subtitle;
  if(payload.ctaLabel!==undefined) update.cta_label=payload.ctaLabel;
  if(payload.targetPath!==undefined) update.target_path=payload.targetPath;
  const row=first<any>(dataOf<any>(await neon.from('campaigns').update(update).eq('id',id).select('*').maybeSingle(),'Ntibishobotse kuvugurura campaign.'));
  if(!row) throw new Error('Campaign ntiboneka.');
  const rows=dataOf<any>(await neon.from('campaigns').select('*').order('sort_order'),'Ntibishobotse gusoma campaigns.')??[];
  return {campaign:mapCampaign(row),campaigns:rows.map(mapCampaign)};
}
export async function deleteAdminCampaign(id:string):Promise<{ok:boolean;campaigns:PromoCampaign[]}> {
  dataOf(await neon.from('campaigns').delete().eq('id',id),'Ntibishobotse gusiba campaign.');
  const rows=dataOf<any>(await neon.from('campaigns').select('*').order('sort_order'),'Ntibishobotse gusoma campaigns.')??[];
  return {ok:true,campaigns:rows.map(mapCampaign)};
}

export async function trackMarketplaceEvent(type:'view'|'wa_click'|'call_click'|'cart_add'|'share',productId?:string|null,shopId?:string|null,sessionId?:string):Promise<void> {
  try {
    await neon.rpc('track_marketplace_event_v1',{
      p_type:type,p_product_id:productId??null,p_shop_id:shopId??null,p_session_id:sessionId??'anonymous',
    });
  } catch { /* Analytics failure never interrupts buyer journeys. */ }
}
