-- Row Level Security & Analytics RPC (Section 7.3 & 7.4)
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table shops enable row level security;
alter table profiles enable row level security;
alter table seller_kyc enable row level security;
alter table reports enable row level security;
alter table subscribers enable row level security;
alter table product_daily_stats enable row level security;
alter table shop_daily_stats enable row level security;
alter table audit_log enable row level security;

create policy "public read products" on products for select
using (
  status in ('active','sold_out')
  and exists (
    select 1 from profiles p join shops s on s.owner_id = p.id
    where s.id = products.shop_id and p.status = 'approved'
  )
);

create policy "seller manages own products" on products for all
using (shop_id in (select id from shops where owner_id = auth.uid()))
with check (shop_id in (select id from shops where owner_id = auth.uid()));

create policy "public read approved shops" on shops for select
using (exists (select 1 from profiles p where p.id = shops.owner_id and p.status = 'approved'));

create policy "seller updates own shop" on shops for update
using (owner_id = auth.uid());

create policy "seller reads own kyc" on seller_kyc for select
using (seller_id = auth.uid());

create or replace function track_event(p_type text, p_product uuid, p_shop uuid)
returns void language plpgsql security definer as $$
begin
  if p_type not in ('view','wa_click','call_click','cart_add','share') then return; end if;

  if p_product is not null then
    insert into product_daily_stats(product_id, day, views, wa_clicks, call_clicks, cart_adds, shares)
    values (p_product, current_date,
      (p_type='view')::int, (p_type='wa_click')::int, (p_type='call_click')::int,
      (p_type='cart_add')::int, (p_type='share')::int)
    on conflict (product_id, day) do update set
      views = product_daily_stats.views + (p_type='view')::int,
      wa_clicks = product_daily_stats.wa_clicks + (p_type='wa_click')::int,
      call_clicks = product_daily_stats.call_clicks + (p_type='call_click')::int,
      cart_adds = product_daily_stats.cart_adds + (p_type='cart_add')::int,
      shares = product_daily_stats.shares + (p_type='share')::int;
  end if;

  if p_shop is not null then
    insert into shop_daily_stats(shop_id, day, views, wa_clicks, call_clicks, shares)
    values (p_shop, current_date,
      (p_type='view')::int, (p_type='wa_click')::int, (p_type='call_click')::int,
      (p_type='share')::int)
    on conflict (shop_id, day) do update set
      views = shop_daily_stats.views + (p_type='view')::int,
      wa_clicks = shop_daily_stats.wa_clicks + (p_type='wa_click')::int,
      call_clicks = shop_daily_stats.call_clicks + (p_type='call_click')::int,
      shares = shop_daily_stats.shares + (p_type='share')::int;
  end if;
end $$;
