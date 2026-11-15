import type { LangCode } from './index';

export interface StaticPageCopy {
  about: {
    title: string;
    intro: string;
    buyerTitle: string;
    buyerBody: string;
    platformTitle: string;
    platformBody: string;
  };
  help: {
    title: string;
    whatsappTitle: string;
    hoursPrefix: string;
    whatsappMessage: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  terms: {
    title: string;
    version: string;
    sourceNote: string;
    points: Array<{ heading: string; body: string }>;
  };
  privacy: {
    title: string;
    sourceNote: string;
    sections: Array<{ heading: string; body: string }>;
    contactHeading: string;
    contactBody: string;
  };
  sellerRules: {
    title: string;
    prohibitedTitle: string;
    prohibitedItems: string[];
    signup: string;
  };
  notFound: {
    title: string;
    body: string;
    home: string;
  };
}

export const STATIC_PAGE_COPY: Record<LangCode, StaticPageCopy> = {
  rw: {
    about: {
      title: 'Ibyerekeye Isoko',
      intro: 'Isoko ni urubuga rw’ubucuruzi rwo mu Rwanda ruhuza abacuruzi b’imyenda, inkweto, amasogisi n’ibindi byo kwambara n’abaguzi mu turere twose 30 tw’igihugu.',
      buyerTitle: 'Uko ikora ku muguzi',
      buyerBody: 'Shakisha igicuruzwa ukoresheje izina, size cyangwa akarere, ugishyire mu gare, maze wohereze urutonde rwawe kuri WhatsApp y’umucuruzi cyangwa umuhamagare. Ntibisaba gufungura konti.',
      platformTitle: 'Icyo urubuga rudakora',
      platformBody: 'Urubuga ntirwakira amafaranga (nta MoMo cyangwa ikarita iri ku rubuga) kandi ntirutanga serivisi yo kugeza ibicuruzwa ku muguzi. Kwishyura no gutanga bikorwa hagati y’umuguzi n’umucuruzi.',
    },
    help: {
      title: 'Ubufasha & Ibibazo bikunze kubazwa',
      whatsappTitle: 'Vugana natwe kuri WhatsApp',
      hoursPrefix: 'Amasaha y’ubufasha buri munsi:',
      whatsappMessage: 'Muraho Ubufasha bwa Isoko, mfite ikibazo nashakaga kubaza.',
      faqs: [
        { question: 'Nshobora kwishyurira kuri uru rubuga?', answer: 'Oya. Uwishyura n’umucuruzi bumvikana uko bishyura (Mobile Money cyangwa amafaranga mu ntoki) bamaze kuvugana kuri WhatsApp cyangwa kuri telefoni.' },
        { question: 'Mbese mbere yo kwishyura nshobora kubanza kureba igicuruzwa?', answer: 'Yego, turabigira inama cyane cyane i Kigali. Banza urebe igicuruzwa cyangwa uhure n’umucuruzi ahantu hazwi mbere yo kohereza amafaranga.' },
        { question: 'Nabona nte iduka ryemewe?', answer: 'Amaduka agaragara ku rubuga agomba kubanza kugenzurwa na Admin hakurikijwe amabwiriza ya Isoko, mbere yo guhabwa ikimenyetso cy’uko yagenzuwe.' },
      ],
    },
    terms: {
      title: 'Amategeko y’Urubuga (Terms of Service)',
      version: 'Verisiyo: v1 · Urubuga rw’ubucuruzi rwa Isoko (Rwanda)',
      sourceNote: 'Iyi ni inyandiko y’ibanze y’Ikinyarwanda.',
      points: [
        { heading: 'Uruhare rw’Urubuga', body: 'Isoko ni urubuga ruhuza abacuruzi bemejwe n’abaguzi. Urubuga ntirugurisha ibicuruzwa byarwo, ntirwakira ubwishyu, kandi ntirutanga serivisi yo gutwara ibicuruzwa.' },
        { heading: 'Inshingano z’Umucuruzi', body: 'Umucuruzi agomba gutanga amakuru y’ukuri, igiciro nyacyo mu mafaranga y’u Rwanda (RWF), n’amafoto y’igicuruzwa afite koko.' },
        { heading: 'Guhagarika konti', body: 'Uburiganya, kugurisha impimbano nka Original, cyangwa gukoresha ibicuruzwa bibujijwe bishobora kuvamo guhagarikwa kwa konti no gushyikirizwa inzego zibishinzwe bibaye ngombwa.' },
      ],
    },
    privacy: {
      title: 'Politiki y’Ibanga (Privacy Policy — Itegeko N° 058/2021)',
      sourceNote: 'Iyi ni inyandiko y’ibanze y’Ikinyarwanda.',
      sections: [
        { heading: 'Abaguzi (ntibakenera konti)', body: 'Amakuru y’igare ryawe, ibicuruzwa waherukaga kureba, size yawe n’aho uherereye bibikwa muri localStorage ya telefoni cyangwa mudasobwa yawe gusa. Ntibibikwa ku mazina yawe.' },
        { heading: 'Ibyangombwa by’Abacuruzi (KYC)', body: 'Indangamuntu n’amafoto yo kugenzura abacuruzi bibikwa ahantu harinzwe, bikarebwa n’Ubuyobozi (Admin) gusa kandi buri gihe bikandikwa muri Audit Log. Amafoto akurwaho amakuru ya GPS (EXIF) mbere yo kubikwa.' },
        { heading: 'Uburenganzira bwawe (Itegeko N° 058/2021)', body: 'Ufite uburenganzira bwo kubona, gukosora cyangwa gusaba ko amakuru yawe asibwa. Mu gihe habaho ikibazo ku mutekano w’amakuru, ubuyobozi bumenyesha inzego zibishinzwe n’abo bireba hakurikijwe amategeko akurikizwa.' },
      ],
      contactHeading: 'DPO / Ubufasha ku mabanga',
      contactBody: 'Twandikire kuri WhatsApp y’ubufasha cyangwa imeri ya privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Amabwiriza y’Abacuruzi & Ibicuruzwa Bibujijwe',
      prohibitedTitle: 'Ibicuruzwa bibujijwe burundu (§10.5):',
      prohibitedItems: [
        'Impimbano zigurishwa nka “Original” cyangwa “Authentic”.',
        'Imiti n’ibindi bikoresho byo kwa muganga bisaba uruhushya rwa Rwanda FDA.',
        'Intwaro, ibiyobyabwenge, amafaranga y’amiganano cyangwa ibikoresho byibwe.',
        'Ibikoresho by’urukozasoni cyangwa ibinyuranyije n’amategeko y’u Rwanda.',
        'Amafoto afite nimero ya telefoni yanditseho cyangwa amafoto yakuwe ahandi atari ayawe.',
      ],
      signup: 'Iyandikishe nk’umucuruzi',
    },
    notFound: {
      title: 'Uru rupapuro ntirubonetse (404)',
      body: 'Aho wagiye ntihabaho cyangwa hahinduwe. Subira ku isoko urebe ibicuruzwa biboneka.',
      home: 'Subira ahabanza',
    },
  },
  en: {
    about: {
      title: 'About Isoko',
      intro: 'Isoko is a Rwandan marketplace connecting clothing, shoe, sock and other apparel sellers with buyers in all 30 districts of the country.',
      buyerTitle: 'How it works for buyers',
      buyerBody: 'Search for an item by name, size or district, add it to your cart, then send your list to the seller on WhatsApp or call them. You do not need an account.',
      platformTitle: 'What the platform does not do',
      platformBody: 'The platform does not collect payments (there is no MoMo or card checkout) and does not deliver goods. Payment and delivery are arranged directly between the buyer and seller.',
    },
    help: {
      title: 'Help & Frequently Asked Questions',
      whatsappTitle: 'Contact us on WhatsApp',
      hoursPrefix: 'Daily support hours:',
      whatsappMessage: 'Hello Isoko Support, I have a question.',
      faqs: [
        { question: 'Can I pay on this website?', answer: 'No. The buyer and seller agree on how to pay (Mobile Money or cash) after speaking on WhatsApp or by phone.' },
        { question: 'Can I inspect an item before paying?', answer: 'Yes. We strongly recommend it, especially in Kigali. Inspect the item or meet the seller in a known public place before sending money.' },
        { question: 'How do I know whether a shop is verified?', answer: 'Shops shown on the platform must first be checked by an Isoko administrator under the platform rules before they receive a verification mark.' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      version: 'Version: v1 · Isoko marketplace (Rwanda)',
      sourceNote: 'This is a translation; the original text is in Kinyarwanda.',
      points: [
        { heading: 'Role of the platform', body: 'Isoko is a platform connecting approved sellers with buyers. Isoko does not sell its own goods, collect payments or provide delivery services.' },
        { heading: 'Seller responsibilities', body: 'Sellers must provide accurate information, the actual price in Rwandan francs (RWF), and photographs of the actual item they own or are authorised to sell.' },
        { heading: 'Account suspension', body: 'Fraud, selling counterfeits as original goods, or listing prohibited products may result in account suspension and, where appropriate, referral to the relevant authorities.' },
      ],
    },
    privacy: {
      title: 'Privacy Policy (Law No. 058/2021)',
      sourceNote: 'This is a translation; the original text is in Kinyarwanda.',
      sections: [
        { heading: 'Buyers (no account required)', body: 'Your cart, recently viewed items, size preferences and location are stored in your device browser storage. They are not stored under your name as a buyer account.' },
        { heading: 'Seller verification information (KYC)', body: 'Seller identity documents and verification photos are stored in protected systems. Access is restricted to authorised administrators and access is recorded in an audit log. Photo GPS metadata (EXIF) is removed before storage.' },
        { heading: 'Your rights (Law No. 058/2021)', body: 'You may request access to, correction of or deletion of your personal information. Isoko will notify the relevant authorities and affected people about a personal-data security incident as required by applicable law.' },
      ],
      contactHeading: 'Data protection contact',
      contactBody: 'Contact Isoko support on WhatsApp or email privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Seller Guidelines & Prohibited Products',
      prohibitedTitle: 'Products that are strictly prohibited (§10.5):',
      prohibitedItems: [
        'Counterfeit goods advertised as “Original” or “Authentic”.',
        'Medicines and medical products that require Rwanda FDA authorisation.',
        'Weapons, illegal drugs, counterfeit currency or stolen property.',
        'Pornographic material or goods prohibited by Rwandan law.',
        'Photos with phone numbers written over them, or photos taken from someone else instead of your own.',
      ],
      signup: 'Register as a seller',
    },
    notFound: {
      title: 'Page not found (404)',
      body: 'The page may not exist or its address may have changed. Return to Isoko to browse available items.',
      home: 'Back to home',
    },
  },
  fr: {
    about: {
      title: 'À propos d’Isoko',
      intro: 'Isoko est une place de marché rwandaise qui met en relation les vendeurs de vêtements, chaussures, chaussettes et autres articles avec les acheteurs des 30 districts du pays.',
      buyerTitle: 'Comment cela fonctionne pour les acheteurs',
      buyerBody: 'Recherchez un article par nom, taille ou district, ajoutez-le au panier, puis envoyez votre liste au vendeur sur WhatsApp ou appelez-le. Aucun compte n’est nécessaire.',
      platformTitle: 'Ce que la plateforme ne fait pas',
      platformBody: 'La plateforme ne collecte pas les paiements (aucun paiement MoMo ou par carte n’est proposé) et ne livre pas les marchandises. Le paiement et la livraison sont convenus directement entre l’acheteur et le vendeur.',
    },
    help: {
      title: 'Aide et questions fréquentes',
      whatsappTitle: 'Contactez-nous sur WhatsApp',
      hoursPrefix: 'Heures d’assistance quotidiennes :',
      whatsappMessage: 'Bonjour, service d’assistance Isoko, j’ai une question.',
      faqs: [
        { question: 'Puis-je payer sur ce site ?', answer: 'Non. L’acheteur et le vendeur conviennent du mode de paiement (Mobile Money ou espèces) après avoir échangé sur WhatsApp ou par téléphone.' },
        { question: 'Puis-je inspecter un article avant de payer ?', answer: 'Oui, nous le recommandons vivement, surtout à Kigali. Examinez l’article ou rencontrez le vendeur dans un lieu public connu avant d’envoyer de l’argent.' },
        { question: 'Comment savoir si une boutique est vérifiée ?', answer: 'Les boutiques doivent être contrôlées par un administrateur Isoko conformément aux règles de la plateforme avant de recevoir le badge de vérification.' },
      ],
    },
    terms: {
      title: 'Conditions d’utilisation',
      version: 'Version : v1 · Place de marché Isoko (Rwanda)',
      sourceNote: 'Ceci est une traduction ; le texte original est en kinyarwanda.',
      points: [
        { heading: 'Rôle de la plateforme', body: 'Isoko met en relation les vendeurs approuvés et les acheteurs. Isoko ne vend pas ses propres produits, ne collecte pas les paiements et ne fournit pas de service de livraison.' },
        { heading: 'Responsabilités du vendeur', body: 'Les vendeurs doivent fournir des informations exactes, le prix réel en francs rwandais (RWF) et des photos de l’article réel qu’ils possèdent ou sont autorisés à vendre.' },
        { heading: 'Suspension du compte', body: 'La fraude, la vente de contrefaçons présentées comme originales ou la publication de produits interdits peuvent entraîner la suspension du compte et, si nécessaire, un signalement aux autorités compétentes.' },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité (Loi n° 058/2021)',
      sourceNote: 'Ceci est une traduction ; le texte original est en kinyarwanda.',
      sections: [
        { heading: 'Acheteurs (aucun compte requis)', body: 'Votre panier, les articles récemment consultés, vos préférences de taille et votre emplacement sont enregistrés dans le stockage du navigateur de votre appareil. Ils ne sont pas enregistrés sous votre nom dans un compte acheteur.' },
        { heading: 'Informations de vérification des vendeurs (KYC)', body: 'Les pièces d’identité et photos de vérification des vendeurs sont conservées dans des systèmes protégés. Seuls les administrateurs autorisés y ont accès et cet accès est inscrit dans un journal d’audit. Les métadonnées GPS (EXIF) des photos sont supprimées avant leur stockage.' },
        { heading: 'Vos droits (Loi n° 058/2021)', body: 'Vous pouvez demander l’accès à vos données personnelles, leur rectification ou leur suppression. Isoko informera les autorités compétentes et les personnes concernées d’un incident de sécurité conformément à la loi applicable.' },
      ],
      contactHeading: 'Contact pour la protection des données',
      contactBody: 'Contactez l’assistance Isoko sur WhatsApp ou par e-mail à privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Règles des vendeurs et produits interdits',
      prohibitedTitle: 'Produits strictement interdits (§10.5) :',
      prohibitedItems: [
        'Produits contrefaits présentés comme « Original » ou « Authentic ».',
        'Médicaments et produits médicaux nécessitant une autorisation de la Rwanda FDA.',
        'Armes, drogues illégales, fausse monnaie ou biens volés.',
        'Matériel pornographique ou produits interdits par la loi rwandaise.',
        'Photos comportant un numéro de téléphone superposé ou photos appartenant à une autre personne.',
      ],
      signup: 'S’inscrire comme vendeur',
    },
    notFound: {
      title: 'Page introuvable (404)',
      body: 'Cette page n’existe peut-être pas ou son adresse a changé. Retournez sur Isoko pour consulter les articles disponibles.',
      home: 'Retour à l’accueil',
    },
  },
  sw: {
    about: {
      title: 'Kuhusu Isoko',
      intro: 'Isoko ni soko la Rwanda linalowaunganisha wauzaji wa nguo, viatu, soksi na bidhaa nyingine za kuvaa na wanunuzi katika wilaya zote 30 za nchi.',
      buyerTitle: 'Jinsi linavyofanya kazi kwa wanunuzi',
      buyerBody: 'Tafuta bidhaa kwa jina, saizi au wilaya, iweke kwenye kikapu, kisha tuma orodha yako kwa muuzaji kupitia WhatsApp au mpigie simu. Huhitaji kufungua akaunti.',
      platformTitle: 'Huduma ambazo jukwaa halitoi',
      platformBody: 'Jukwaa halipokei malipo (hakuna malipo ya MoMo au kadi ndani ya tovuti) wala halisafirishi bidhaa. Malipo na uwasilishaji hupangwa moja kwa moja kati ya mnunuzi na muuzaji.',
    },
    help: {
      title: 'Msaada na Maswali Yanayoulizwa Mara kwa Mara',
      whatsappTitle: 'Wasiliana nasi kupitia WhatsApp',
      hoursPrefix: 'Saa za msaada kila siku:',
      whatsappMessage: 'Habari Huduma kwa Wateja wa Isoko, nina swali.',
      faqs: [
        { question: 'Je, ninaweza kulipa kwenye tovuti hii?', answer: 'Hapana. Mnunuzi na muuzaji hukubaliana njia ya malipo (Mobile Money au pesa taslimu) baada ya kuwasiliana kupitia WhatsApp au simu.' },
        { question: 'Je, ninaweza kukagua bidhaa kabla ya kulipa?', answer: 'Ndiyo, tunashauri sana, hasa Kigali. Kagua bidhaa au kutana na muuzaji sehemu ya umma inayojulikana kabla ya kutuma pesa.' },
        { question: 'Nitajua vipi kama duka limethibitishwa?', answer: 'Maduka hukaguliwa kwanza na msimamizi wa Isoko kulingana na kanuni za jukwaa kabla ya kupewa alama ya uthibitisho.' },
      ],
    },
    terms: {
      title: 'Masharti ya Matumizi',
      version: 'Toleo: v1 · Soko la Isoko (Rwanda)',
      sourceNote: 'Huu ni utafsiri; maandishi ya asili yako kwa Kinyarwanda.',
      points: [
        { heading: 'Jukumu la jukwaa', body: 'Isoko ni jukwaa linalowaunganisha wauzaji walioidhinishwa na wanunuzi. Isoko haiuzi bidhaa zake, haipokei malipo na haitoi huduma ya kusafirisha bidhaa.' },
        { heading: 'Wajibu wa muuzaji', body: 'Muuzaji lazima atoe taarifa sahihi, bei halisi kwa faranga za Rwanda (RWF), na picha za bidhaa halisi anazomiliki au anaruhusiwa kuuza.' },
        { heading: 'Kusimamishwa kwa akaunti', body: 'Udanganyifu, kuuza bidhaa bandia kama halisi, au kuweka bidhaa zilizopigwa marufuku kunaweza kusababisha kusimamishwa kwa akaunti na, inapohitajika, taarifa kutumwa kwa mamlaka husika.' },
      ],
    },
    privacy: {
      title: 'Sera ya Faragha (Sheria Na. 058/2021)',
      sourceNote: 'Huu ni utafsiri; maandishi ya asili yako kwa Kinyarwanda.',
      sections: [
        { heading: 'Wanunuzi (akaunti haihitajiki)', body: 'Kikapu chako, bidhaa ulizotazama hivi karibuni, mapendeleo ya saizi na eneo lako huhifadhiwa kwenye hifadhi ya kivinjari cha kifaa chako. Havihifadhiwi chini ya jina lako kama akaunti ya mnunuzi.' },
        { heading: 'Taarifa za uthibitishaji wa wauzaji (KYC)', body: 'Vitambulisho na picha za uthibitishaji wa wauzaji huhifadhiwa kwenye mifumo iliyolindwa. Wasimamizi walioidhinishwa pekee ndio wanaoweza kuziona, na ufikiaji huandikwa kwenye kumbukumbu ya ukaguzi. Metadata ya GPS (EXIF) ya picha huondolewa kabla ya kuhifadhi.' },
        { heading: 'Haki zako (Sheria Na. 058/2021)', body: 'Unaweza kuomba kuona, kusahihisha au kufuta taarifa zako binafsi. Isoko itaarifu mamlaka husika na watu walioathiriwa kuhusu tukio la usalama wa data kama sheria inayotumika inavyotaka.' },
      ],
      contactHeading: 'Mawasiliano ya ulinzi wa data',
      contactBody: 'Wasiliana na msaada wa Isoko kupitia WhatsApp au barua pepe privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Kanuni za Wauzaji na Bidhaa Zilizopigwa Marufuku',
      prohibitedTitle: 'Bidhaa zilizopigwa marufuku kabisa (§10.5):',
      prohibitedItems: [
        'Bidhaa bandia zinazotangazwa kuwa “Original” au “Authentic”.',
        'Dawa na bidhaa za matibabu zinazohitaji idhini ya Rwanda FDA.',
        'Silaha, dawa haramu, fedha bandia au mali zilizoibwa.',
        'Vitu vya ponografia au bidhaa zinazokatazwa na sheria za Rwanda.',
        'Picha zilizoandikwa namba ya simu juu yake au picha za watu wengine badala ya picha zako mwenyewe.',
      ],
      signup: 'Jisajili kama muuzaji',
    },
    notFound: {
      title: 'Ukurasa haujapatikana (404)',
      body: 'Ukurasa huu haupo au anwani yake imebadilika. Rudi Isoko kutazama bidhaa zinazopatikana.',
      home: 'Rudi mwanzo',
    },
  },
  rn: {
    about: {
      title: 'Ibikwerekeye Isoko',
      intro: 'Isoko ni urubuga rw’ubudandaji rwo mu Rwanda ruhuza abadandaza impuzu, ibirato, amasogisi n’ibindi bikoresho n’abaguzi bo mu turere 30 tw’igihugu.',
      buyerTitle: 'Uko bikora ku muguzi',
      buyerBody: 'Rondera ikidandazwa ukoresheje izina, sayizi canke akarere, ugishire mu gikapo, hanyuma urungike urutonde rwawe kuri WhatsApp y’umudandaza canke umuhamagare. Ntukeneye gufungura konte.',
      platformTitle: 'Ivyo urubuga rudakora',
      platformBody: 'Urubuga ntirwakira amahera (nta MoMo canke ikarata yo kuri uru rubuga) kandi ntirutwara ibidandazwa. Kwishura no gushikiriza ibidandazwa biba hagati y’umuguzi n’umudandaza.',
    },
    help: {
      title: 'Ubufasha n’Ibibazo Bikunze Kubazwa',
      whatsappTitle: 'Tuvugishe kuri WhatsApp',
      hoursPrefix: 'Amasaha y’ubufasha buri musi:',
      whatsappMessage: 'Mwaramutse Ubufasha bwa Isoko, mfise ikibazo.',
      faqs: [
        { question: 'Noshobora kuriha kuri uru rubuga?', answer: 'Oya. Umuguzi n’umudandaza bumvikana uburyo bwo kuriha (Mobile Money canke amahera mu ntoki) bamaze kuvugana kuri WhatsApp canke kuri telefone.' },
        { question: 'Noshobora kubanza kuraba ikidandazwa imbere yo kuriha?', answer: 'Ego, turabihanura cane cane i Kigali. Banza usuzume ikidandazwa canke uhure n’umudandaza ahantu hazwi imbere yo kurungika amahera.' },
        { question: 'Nomenya gute ko iduka ryagenzuwe?', answer: 'Amaduka abanza kugenzurwa n’umuyobozi wa Isoko hakurikijwe amategeko y’urubuga imbere yo guhabwa ikimenyetso c’uko yagenzuwe.' },
      ],
    },
    terms: {
      title: 'Amategeko yo Gukoresha Urubuga',
      version: 'Verisiyo: v1 · Isoko (Rwanda)',
      sourceNote: 'Iyi ni insiguro; inyandiko y’intango iri mu Kinyarwanda.',
      points: [
        { heading: 'Uruhara rw’urubuga', body: 'Isoko ni urubuga ruhuza abadandaza bemerewe n’abaguzi. Isoko ntigurisha ibidandazwa vyaryo, ntirakira amahera kandi ntiritanga ibikorwa vyo gutwara ibidandazwa.' },
        { heading: 'Inshingano z’umudandaza', body: 'Umudandaza ategerezwa gutanga amakuru y’ukuri, igiciro nyaco mu mafaranga y’u Rwanda (RWF), n’amafoto y’ikidandazwa nyaco afise canke yemerewe kudandaza.' },
        { heading: 'Guhagarika konte', body: 'Uburiganya, kudandaza ibihimbano nk’ivy’ukuri, canke gushira ku rubuga ibidandazwa bibujijwe bishobora gutuma konte ihagarikwa kandi, bibaye ngombwa, amakuru agashikirizwa inzego zibijejwe.' },
      ],
    },
    privacy: {
      title: 'Politiki y’Ibanga (Itegeko N° 058/2021)',
      sourceNote: 'Iyi ni insiguro; inyandiko y’intango iri mu Kinyarwanda.',
      sections: [
        { heading: 'Abaguzi (ntibakeneye konte)', body: 'Ibisokozo vyawe, ibidandazwa uheruka kuraba, sayizi ukunda n’aho uri bibikwa muri browser ya telefone canke mudasobwa yawe. Ntibibikwa mw’izina ryawe muri konte y’umuguzi.' },
        { heading: 'Amakuru yo kugenzura abadandaza (KYC)', body: 'Indangamuntu n’amafoto yo kugenzura abadandaza bibikwa mu buryo burinzwe. Abayobozi babifitiye uburenganzira gusa ni bo babibona, kandi ukubona ayo makuru kwandikwa muri Audit Log. Amakuru y’aho ifoto yafatiwe (GPS/EXIF) akurwamwo imbere yo kuyibika.' },
        { heading: 'Uburenganzira bwawe (Itegeko N° 058/2021)', body: 'Urashobora gusaba kubona, gukosora canke gusiba amakuru yawe bwite. Isoko imenyesha inzego zibijejwe n’abantu bireba igihe habaye ikibazo c’umutekano w’amakuru, nk’uko amategeko abitegekanya.' },
      ],
      contactHeading: 'Ubufasha ku bijanye n’amakuru bwite',
      contactBody: 'Vugana n’ubufasha bwa Isoko kuri WhatsApp canke wandikire privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Amategeko y’Abadandaza n’Ibidandazwa Bibujijwe',
      prohibitedTitle: 'Ibidandazwa bibujijwe rwose (§10.5):',
      prohibitedItems: [
        'Ibihimbano bigurishwa nk’“Original” canke “Authentic”.',
        'Imiti n’ibikoresho vy’ubuvuzi bisaba uruhusha rwa Rwanda FDA.',
        'Ibirwanisho, ibiyayuramutwe, amahera y’igihimbano canke ibintu vyibwe.',
        'Ibintu vy’amashusho y’urukozasoni canke ibibujijwe n’amategeko y’u Rwanda.',
        'Amafoto yanditsweko inomero ya telefone canke amafoto y’abandi atari ayawe.',
      ],
      signup: 'Iyandikishe nk’umudandaza',
    },
    notFound: {
      title: 'Urupapuro ntirwab founditswe (404)',
      body: 'Urupapuro warondera ntiruriho canke aderesi yarahindutse. Subira kuri Isoko urabe ibidandazwa biriho.',
      home: 'Subira ku ntango',
    },
  },
  ln: {
    about: {
      title: 'Mpo na Isoko',
      intro: 'Isoko ezali zando ya Rwanda oyo ekangisaka bateki ya bilamba, sapato, masokisi mpe biloko mosusu na basombi na ba-district 30 ya ekolo.',
      buyerTitle: 'Ndenge esalaka mpo na mosombi',
      buyerBody: 'Luka eloko na nkombo, taille to district, tia yango na kitunga, sima tinda liste na yo na WhatsApp ya moteki to benga ye. Esengeli te kofungola konti.',
      platformTitle: 'Makambo oyo plateforme esalaka te',
      platformBody: 'Plateforme eyambaka mbongo te (mbongo ya MoMo to carte efutamaka na site te) mpe ememaka biloko te. Mosombi na moteki nde bayokanaka mpo na kofuta mpe kopesa biloko.',
    },
    help: {
      title: 'Lisungi mpe Mituna oyo Etunamaka Mbala Mingi',
      whatsappTitle: 'Solola na biso na WhatsApp',
      hoursPrefix: 'Bangonga ya lisungi mokolo na mokolo:',
      whatsappMessage: 'Mbote Lisungi ya Isoko, nazali na motuna.',
      faqs: [
        { question: 'Nakoki kofuta na site oyo?', answer: 'Te. Mosombi mpe moteki bayokanaka ndenge ya kofuta (Mobile Money to mbongo na loboko) nsima ya kosolola na WhatsApp to na telefone.' },
        { question: 'Nakoki kotala eloko liboso ya kofuta?', answer: 'Ɛɛ, tozali kopesa toli yango, mingi mingi na Kigali. Tala eloko to kutana na moteki na esika ya bato nyonso oyo eyebani liboso ya kotinda mbongo.' },
        { question: 'Ndenge nini nakoyeba ete boutique endimami?', answer: 'Boutique esengeli naino kotalama na mokambi ya Isoko kolanda mibeko ya plateforme liboso ya kozwa elembo ya kondimama.' },
      ],
    },
    terms: {
      title: 'Mibeko ya Kosalela Plateforme',
      version: 'Version: v1 · Zando ya Isoko (Rwanda)',
      sourceNote: 'Oyo ezali libongoli; mokanda ya ebandeli ezali na Kinyarwanda.',
      points: [
        { heading: 'Mosala ya plateforme', body: 'Isoko ezali plateforme oyo ekangisaka bateki bandimami na basombi. Isoko etekaka biloko na yango moko te, eyambaka kofutama te mpe epesaka transport ya biloko te.' },
        { heading: 'Mikumba ya moteki', body: 'Moteki asengeli kopesa sango ya solo, ntalo ya solo na ba-francs ya Rwanda (RWF), mpe bafoto ya eloko ya solo oyo azali na yango to apesami ndingisa ya koteka.' },
        { heading: 'Kokanga konti', body: 'Kokosa, koteka biloko ya lokuta lokola ya solo, to kotia biloko oyo epekisami ekoki kosala ete konti ekangama mpe, soki esengeli, sango epesama na bakonzi oyo basalaka likambo yango.' },
      ],
    },
    privacy: {
      title: 'Politiki ya Kobatela Sekele (Mobeko N° 058/2021)',
      sourceNote: 'Oyo ezali libongoli; mokanda ya ebandeli ezali na Kinyarwanda.',
      sections: [
        { heading: 'Basombi (konti esengeli te)', body: 'Kitunga na yo, biloko otalaki kala mingi te, taille olingaka mpe esika ozali ebombamaka na navigateur ya telefone to ordinatɛrɛ na yo. Ebombamaka te na nkombo na yo lokola konti ya mosombi.' },
        { heading: 'Sango ya botali bateki (KYC)', body: 'Mikanda ya bomoto mpe bafoto ya botali bateki ebombamaka na ba-système oyo ebatelami. Bakambi oyo bazali na ndingisa kaka nde bakoki komona yango, mpe kokɔta na yango ekomamaka na Audit Log. Sango ya GPS (EXIF) ya foto elongolamaka liboso ya kobomba yango.' },
        { heading: 'Makoki na yo (Mobeko N° 058/2021)', body: 'Okoki kosenga komona, kobongisa to kolongola sango na yo moko. Isoko ekoyebisa bakonzi oyo etali yango mpe bato oyo bazwami na likama ntango likambo ya bokengi ya sango esalemi, ndenge mibeko esengi.' },
      ],
      contactHeading: 'Mokili ya kobatela sango',
      contactBody: 'Solola na lisungi ya Isoko na WhatsApp to koma na privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Mibeko ya Bateki mpe Biloko oyo Epekisami',
      prohibitedTitle: 'Biloko oyo epekisami mpenza (§10.5):',
      prohibitedItems: [
        'Biloko ya lokuta oyo etekamaka lokola “Original” to “Authentic”.',
        'Bankisi mpe biloko ya monganga oyo esengaka ndingisa ya Rwanda FDA.',
        'Minduki, bangi oyo epekisami, mbongo ya lokuta to biloko oyo bayibi.',
        'Biloko ya pornographie to oyo epekisami na mibeko ya Rwanda.',
        'Bafoto oyo batye namba ya telefone likolo na yango to bafoto ya bato mosusu na esika ya oyo ya yo.',
      ],
      signup: 'Komisa nkombo lokola moteki',
    },
    notFound: {
      title: 'Lokasa ezwami te (404)',
      body: 'Lokasa oyo ezali te to adresse na yango ebongwani. Zonga na Isoko mpo na kotala biloko oyo ezali.',
      home: 'Zonga na ebandeli',
    },
  },
  lg: {
    about: {
      title: 'Ebifa ku Isoko',
      intro: 'Isoko katale ka Rwanda ekigatta abatunzi b’engoye, engatto, amasokisi n’ebintu ebirala n’abaguzi mu disitulikiti zonna 30 ez’eggwanga.',
      buyerTitle: 'Engeri gye kikolamu eri abaguzi',
      buyerBody: 'Noonya ekintu ng’okozesa erinnya, sayizi oba disitulikiti, kiteeke mu kisero kyo, oluvannyuma oweereze olukalala lwo eri omutunzi ku WhatsApp oba omukubire essimu. Tokwetaaga akaawunti.',
      platformTitle: 'Ebintu omukutu bye gukora',
      platformBody: 'Omukutu tegusolooza ssente (tewali kusasula na MoMo oba kaadi ku mukutu) era tegutuusa bintu. Okusasula n’okutuusa ebintu bitegekebwa butereevu wakati w’omuguzi n’omutunzi.',
    },
    help: {
      title: 'Obuyambi n’Ebibuuzo Ebibuuzibwa Ennyo',
      whatsappTitle: 'Tuukirira ku WhatsApp',
      hoursPrefix: 'Essaawa z’obuyambi buli lunaku:',
      whatsappMessage: 'Gyebale ko, Obuyambi bwa Isoko, nnina ekibuuzo.',
      faqs: [
        { question: 'Nnyinza okusasulira ku mukutu guno?', answer: 'Nedda. Omuguzi n’omutunzi be basalawo engeri y’okusasulamu (Mobile Money oba ssente enkalu) nga bamaze okwogera ku WhatsApp oba ku ssimu.' },
        { question: 'Nnyinza okusooka okukebera ekintu nga sinnasasula?', answer: 'Weewaawo, tukikubiriza nnyo naddala mu Kigali. Kebera ekintu oba osisinkane omutunzi mu kifo ky’olukale ekimanyiddwa nga tonnatuma ssente.' },
        { question: 'Ntegeera ntya nti edduuka likakasiddwa?', answer: 'Amaduuka gateekwa okusooka okwekebejjebwa omuddukanya wa Isoko okusinziira ku mateeka g’omukutu nga tegannafuna kabonero kakakasa.' },
      ],
    },
    terms: {
      title: 'Amateeka g’Okukozesa Omukutu',
      version: 'Enkyusa: v1 · Katale ka Isoko (Rwanda)',
      sourceNote: 'Buno buvvuunula; ekiwandiiko ekisookerwako kiri mu Kinyarwanda.',
      points: [
        { heading: 'Omulimu gw’omukutu', body: 'Isoko mukutu ogugatta abatunzi abakkiriziddwa n’abaguzi. Isoko teguza bintu byagwo, tegukuŋŋaanya kusasula era teguwa buweereza bwa kutambuza bintu.' },
        { heading: 'Obuvunaanyizibwa bw’omutunzi', body: 'Omutunzi alina okuwa amawulire amatuufu, omuwendo omutuufu mu mafaranga ga Rwanda (RWF), n’ebifaananyi by’ekintu ekituufu ky’alina oba ky’akkiriziddwa okutunda.' },
        { heading: 'Okuyimiriza akaawunti', body: 'Obulimba, okutunda ebintu ebicupuli ng’eby’amazima, oba okuteeka ebintu ebikugiddwa ku mukutu biyinza okuvaako akaawunti okuyimirizibwa era, bwe kiba kyetaagisa, amawulire negaweebwa ebitongole ebikwatibwako.' },
      ],
    },
    privacy: {
      title: 'Enkola y’Ebyama (Etteeka N° 058/2021)',
      sourceNote: 'Buno buvvuunula; ekiwandiiko ekisookerwako kiri mu Kinyarwanda.',
      sections: [
        { heading: 'Abaguzi (tebeetaaga akaawunti)', body: 'Ekisero kyo, ebintu bye walaba gye buvuddeko, sayizi z’oyagala n’ekifo ky’obeeramu biterekebwa mu browser ya ssimu oba kompyuta yo. Tebiterebwa ku linnya lyo nga akaawunti y’omuguzi.' },
        { heading: 'Amawulire g’okukakasa abatunzi (KYC)', body: 'Ebiwandiiko ebiraga obumanyirivu n’ebifaananyi by’okukakasa abatunzi biterekebwa mu nkola ezikuumibwa. Abaddukanya abalina olukusa bokka be babiraba, era okubifuna kuwandiikibwa mu Audit Log. Amawulire ga GPS (EXIF) mu bifaananyi gaggyibwamu nga tebinnaterekebwa.' },
        { heading: 'Eddembe lyo (Etteeka N° 058/2021)', body: 'Osobola okusaba okulaba, okutereeza oba okusangula amawulire go ag’obuntu. Isoko ejja kutegeeza ebitongole ebikwatibwako n’abantu abakoseddwa singa wabaawo ekizibu ky’obukuumi bw’amawulire, nga etteeka erikola bwe liragira.' },
      ],
      contactHeading: 'Okutuukirira ku kukuuma amawulire',
      contactBody: 'Tuukirira obuyambi bwa Isoko ku WhatsApp oba ku email privacy@isoko.rw.',
    },
    sellerRules: {
      title: 'Amateeka g’Abatunzi n’Ebintu Ebikugiddwa',
      prohibitedTitle: 'Ebintu ebikugiddwa ddala (§10.5):',
      prohibitedItems: [
        'Ebintu ebicupuli ebisuubulibwa nga “Original” oba “Authentic”.',
        'Ddagala n’ebintu eby’obujjanjabi ebyetaaga olukusa lwa Rwanda FDA.',
        'Emundu, ebiragalalagala ebikugiddwa, ssente ezicupuli oba ebintu ebibiddwa.',
        'Ebintu eby’obuseegu oba ebikugiddwa amateeka ga Rwanda.',
        'Ebifaananyi ebiriko ennamba ya ssimu ewandiikiddwa ku byo oba ebifaananyi by’abantu abalala mu kifo ky’ebibyo.',
      ],
      signup: 'Wewandiise ng’omutunzi',
    },
    notFound: {
      title: 'Omuko tegusangiddwa (404)',
      body: 'Omuko ogunoonya teguliwo oba endagiriro yagwo ekyuse. Ddayo ku Isoko olabe ebintu ebiriwo.',
      home: 'Ddayo ku ntandikwa',
    },
  },
};

export const STATIC_PAGE_TRANSLATIONS_REVIEWED: Record<LangCode, boolean> = {
  rw: true,
  en: false,
  fr: false,
  sw: false,
  rn: false,
  ln: false,
  lg: false,
};
