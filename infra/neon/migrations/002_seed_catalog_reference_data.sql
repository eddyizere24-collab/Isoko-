-- Public catalog reference data only. Never add demo people, seller accounts or product listings here.
INSERT INTO categories (id,parent_id,slug,name_rw,name_en,sort,size_set,active,phase) VALUES
(1,NULL,'inkweto','Inkweto','Shoes',1,'shoes_all',true,'P1'),
(2,NULL,'imyenda','Imyenda','Clothing',2,'clothes_all',true,'P1'),
(3,NULL,'amasogisi','Amasogisi n''imyenda y''imbere','Socks & Underwear',3,'socks',true,'P1'),
(4,NULL,'ibindi','Ibindi byo kwambara','Accessories',4,'accessories',true,'P1'),
(5,NULL,'amatelefoni','Ibikoresho by''amatelefoni','Phone Accessories',5,'phone_models',false,'P3'),
(101,'1','inkweto-abagabo','Z''abagabo','Men Shoes',1,'shoes_adult',true,'P1'),
(102,'1','inkweto-abagore','Z''abagore','Women Shoes',2,'shoes_adult',true,'P1'),
(103,'1','inkweto-abana','Z''abana','Kids Shoes',3,'shoes_kids',true,'P1'),
(104,'1','inkweto-siporo','Siporo (sneakers)','Sneakers',4,'shoes_adult',true,'P1'),
(105,'1','sandali','Sandali n''inkweto zoroheje','Sandals',5,'shoes_adult',true,'P1'),
(106,'1','inkweto-bwiza','Inkweto zo mu bwiza (zo gusohokana)','Dress Shoes',6,'shoes_adult',true,'P1'),
(107,'1','bote','Bote','Boots',7,'shoes_adult',true,'P1'),
(201,'2','imyenda-abagabo','Abagabo','Men Clothing',1,'clothes_all',true,'P1'),
(202,'2','imyenda-abagore','Abagore','Women Clothing',2,'clothes_letters',true,'P1'),
(203,'2','imyenda-abana','Abana','Kids Clothing',3,'clothes_kids',true,'P1'),
(204,'2','imyenda-siporo','Imyenda ya siporo','Sportswear',4,'clothes_letters',true,'P1'),
(205,'2','ankara','Ankara n''imyenda gakondo','Ankara & Traditional',5,'clothes_letters',true,'P1'),
(206,'2','ibikoti-amajire','Ibikoti n''amajire (jackets, hoodies)','Jackets & Hoodies',6,'clothes_letters',true,'P1'),
(301,'3','amasogisi-abagabo','Amasogisi y''abagabo','Men Socks',1,'socks',true,'P1'),
(302,'3','amasogisi-abagore','Y''abagore','Women Socks',2,'socks',true,'P1'),
(303,'3','amasogisi-abana','Y''abana','Kids Socks',3,'socks',true,'P1'),
(304,'3','imyenda-imbere','Imyenda y''imbere','Underwear',4,'clothes_letters',true,'P1'),
(305,'3','ibikoresho-rugo','Imitako n''ibikoresho byo mu rugo','Home Textiles',5,'accessories',true,'P1'),
(401,'4','amasakoshi','Amasakoshi','Bags',1,'accessories',true,'P1'),
(402,'4','imikandara','Imikandara','Belts',2,'accessories',true,'P1'),
(403,'4','ingofero','Ingofero','Hats',3,'accessories',true,'P1'),
(404,'4','amasaha','Amasaha','Watches',4,'accessories',true,'P1'),
(405,'4','indorerwamo','Indorerwamo','Sunglasses',5,'accessories',true,'P1'),
(406,'4','imitako','Imitako','Jewelry',6,'accessories',true,'P1'),
(407,'4','ibitambaro','Ibitambaro n''ibisa','Scarves',7,'accessories',true,'P1'),
(501,'5','cases','Ibifata (cases)','Cases',1,'phone_models',true,'P3'),
(502,'5','screen-protectors','Ibirinda ecran','Screen Protectors',2,'phone_models',true,'P3'),
(503,'5','chargers','Chargers','Chargers',3,'phone_models',true,'P3'),
(504,'5','earphones','Earphones','Earphones',4,'phone_models',true,'P3'),
(505,'5','power-banks','Power banks','Power Banks',5,'phone_models',true,'P3')
ON CONFLICT (id) DO NOTHING;

-- Safe defaults: no ads and no phone-accessories rollout until explicitly enabled.
-- Support WhatsApp is intentionally blank: the seed code's phone number is a demo value and is not treated as a real support contact.
INSERT INTO settings(key,value) VALUES
('ADS_ENABLED', 'false'::jsonb),
('PHONE_ACCESSORIES_ENABLED', 'false'::jsonb),
('DEFAULT_PRODUCT_LIMIT', '150'::jsonb),
('MAX_PHOTOS_PER_PRODUCT', '5'::jsonb),
('TERMS_VERSION', '"1.0"'::jsonb),
('SUPPORT_WHATSAPP', to_jsonb(''::text)),
('SUPPORT_HOURS', to_jsonb('Buri munsi · 08:00 – 20:00 (CAT)'::text))
ON CONFLICT (key) DO NOTHING;

INSERT INTO schema_migrations(version) VALUES ('002_seed_catalog_reference_data')
ON CONFLICT (version) DO NOTHING;
