-- Seed Categories & Synonyms (Section 6.4 & 9.1)
insert into categories (id, parent_id, slug, name_rw, name_en, sort, size_set, active, phase) values
(1, null, 'inkweto', 'Inkweto', 'Shoes', 1, 'shoes_all', true, 'P1'),
(2, null, 'imyenda', 'Imyenda', 'Clothing', 2, 'clothes_all', true, 'P1'),
(3, null, 'amasogisi', 'Amasogisi n''imyenda y''imbere', 'Socks & Underwear', 3, 'socks', true, 'P1'),
(4, null, 'ibindi', 'Ibindi byo kwambara', 'Accessories', 4, 'accessories', true, 'P1'),
(5, null, 'amatelefoni', 'Ibikoresho by''amatelefoni', 'Phone Accessories', 5, 'phone_models', false, 'P3')
on conflict (id) do nothing;

insert into synonyms (term, canonical) values
('nayiki', 'nike'),
('naiki', 'nike'),
('adida', 'adidas'),
('adidasi', 'adidas'),
('isogisi', 'amasogisi'),
('isogise', 'amasogisi'),
('basket', 'inkweto za siporo'),
('sneakers', 'inkweto za siporo'),
('shati', 'ishati'),
('chemise', 'ishati'),
('jean', 'ipantalo ya jean'),
('jeans', 'ipantalo ya jean'),
('ijini', 'ipantalo ya jean'),
('tshirt', 'tishati'),
('t-shirt', 'tishati')
on conflict (term) do nothing;
