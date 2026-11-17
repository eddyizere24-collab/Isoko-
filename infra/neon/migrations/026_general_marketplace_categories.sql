-- ISOKO migration 026: Isoko is a general marketplace, not only clothes and shoes.
-- Adds top-level categories (vehicles, home & furniture, farming, phones & electronics,
-- building & tools, other goods) with a few sub categories each. Goods without sizes use
-- size_set 'one_size' (a single "Ubunini bumwe" variant; the seller flow hides the size picker).
-- Additive and idempotent: existing categories, products and variants are untouched.

INSERT INTO public.categories (id,parent_id,slug,name_rw,name_en,sort,size_set,active,phase) VALUES
  (6,null,'imodoka','Imodoka n''ibinyabiziga','Vehicles',6,'one_size',true,'P1'),
  (7,null,'ibikoresho-byo-mu-nzu','Ibikoresho byo mu nzu','Home & Furniture',7,'one_size',true,'P1'),
  (8,null,'ubuhinzi','Ubuhinzi n''ubworozi','Farming & Livestock',8,'one_size',true,'P1'),
  (9,null,'ikoranabuhanga','Telefoni n''ikoranabuhanga','Phones & Electronics',9,'one_size',true,'P1'),
  (10,null,'ubwubatsi','Ubwubatsi n''ibikoresho','Building & Tools',10,'one_size',true,'P1'),
  (11,null,'ibindi-bicuruzwa','Ibindi bicuruzwa','Other goods',11,'one_size',true,'P1'),
  (601,6,'imodoka-zigendera','Imodoka','Cars',1,'one_size',true,'P1'),
  (602,6,'moto-amagare','Moto n’amagare','Motorbikes & Bicycles',2,'one_size',true,'P1'),
  (603,6,'ibyuma-by-imodoka','Ibyuma n’ibikoresho by’imodoka','Vehicle Parts',3,'one_size',true,'P1'),
  (701,7,'intebe-ameza','Intebe n’ameza','Chairs & Tables',1,'one_size',true,'P1'),
  (702,7,'ibitanda-matela','Ibitanda na matela','Beds & Mattresses',2,'one_size',true,'P1'),
  (703,7,'igikoni','Ibikoresho byo mu gikoni','Kitchenware',3,'one_size',true,'P1'),
  (801,8,'ibikoresho-by-ubuhinzi','Ibikoresho by’ubuhinzi','Farm Tools & Machines',1,'one_size',true,'P1'),
  (802,8,'imbuto-ifumbire','Imbuto n’ifumbire','Seeds & Fertilizer',2,'one_size',true,'P1'),
  (803,8,'amatungo','Amatungo n’ibiryo byayo','Livestock & Feed',3,'one_size',true,'P1'),
  (901,9,'telefoni','Telefoni','Phones',1,'one_size',true,'P1'),
  (902,9,'mudasobwa-televiziyo','Mudasobwa na televiziyo','Computers & TVs',2,'one_size',true,'P1'),
  (903,9,'ibikoresho-by-amashanyarazi','Ibikoresho by’amashanyarazi','Electrical Goods',3,'one_size',true,'P1'),
  (1001,10,'ibikoresho-byo-kubaka','Ibikoresho byo kubaka','Building Materials',1,'one_size',true,'P1'),
  (1002,10,'ibikoresho-by-intoki','Ibikoresho by’intoki n’imashini','Tools & Machines',2,'one_size',true,'P1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.schema_migrations(version)
VALUES ('026_general_marketplace_categories')
ON CONFLICT (version) DO NOTHING;
