# Informations légales — ce qui manque, et ce qui n'attend pas le SIRET

État au 17/09/2026. Tant que cette liste n'est pas soldée, le site reste en `noindex` et les
paiements en mode test. **Aucun champ n'est publié tant que sa valeur n'est pas définitive :**
les emplacements restent marqués comme à compléter, avec le bandeau d'avertissement en haut de
page. Un champ provisoire publié sans avertissement serait pire que pas de mention du tout — il
affirmerait quelque chose de faux.

---

## 1. Ce que tu peux renseigner dès maintenant — sans le SIRET

Quatre informations, qui apparaissent à sept endroits.

| # | Information | Où elle apparaît | Base |
|---|---|---|---|
| 1 | **Nom et prénoms** | `mentions-legales.html:37` | LCEN art. 1-1, I, 1° |
| 2 | **Adresse de domiciliation** | `mentions-legales.html:39` | LCEN art. 1-1, I, 1° |
| 3 | **Numéro de téléphone** | `mentions-legales.html` — champ à créer, absent aujourd'hui | LCEN art. 1-1, I, 1° |
| 4 | **Email de contact** | `mentions-legales.html:40`, `cgv.html:63` (réclamations), `confidentialite.html:101` (droits RGPD) | C. conso. art. L111-1 ; RGPD art. 13 |
| 5 | **Directeur de la publication** | `mentions-legales.html:41` — c'est toi, personne physique | LCEN art. 1-1, I, 3° |

**Ce dont j'ai besoin, exactement :**

1. Nom et prénoms tels qu'ils figureront à l'immatriculation.
2. Adresse complète de domiciliation (numéro, rue, code postal, commune).
3. Numéro de téléphone à publier.
4. Adresse email de contact.
5. Confirmation que le directeur de la publication est bien toi.

**Deux remarques, avant que tu répondes.**

*L'adresse sera publique.* La LCEN impose le domicile de la personne physique. Si tu publies ton
adresse personnelle, elle est lisible par tous, y compris par des destinataires de courriers de
réclamation mécontents. C'est l'argument principal en faveur d'une société de domiciliation, et il
vaut mieux le trancher avant l'immatriculation qu'après.

*Le téléphone aussi, et il manque aujourd'hui.* Je l'ai vérifié en préparant cette liste :
l'article 6, III de la LCEN — celui que citent encore la plupart des modèles en ligne — **n'existe
plus depuis le 23 mai 2024**. Les obligations d'identification sont passées à l'article 1-1,
introduit par la loi SREN du 21 mai 2024, qui exige explicitement « leur numéro de téléphone » pour
les personnes physiques comme morales. Nos mentions légales n'ont aucun champ téléphone : ce n'est
pas un oubli de remplissage, c'est une ligne à ajouter. Si tu ne veux pas publier ton numéro
personnel, il faut un second numéro — c'est un choix à faire maintenant, pas au moment de la mise
en ligne.

---

## 2. Ce qui doit réellement attendre l'immatriculation

| # | Information | Où | Pourquoi ça attend |
|---|---|---|---|
| 6 | **SIRET** | `mentions-legales.html:38` | n'existe qu'après immatriculation au guichet unique INPI |
| 7 | **Statut juridique** (auto-entrepreneur / société) | `mentions-legales.html:37` | ne devient vrai qu'à l'immatriculation ; l'écrire avant serait une affirmation fausse |
| 8 | **Régime de TVA** | `cgv.html:38` | découle du statut. En franchise en base, la mention exacte est « TVA non applicable, article 293 B du CGI » — à ne publier que si c'est effectivement ton régime |
| 9 | **Médiateur de la consommation** | `cgv.html` — section à créer, absente aujourd'hui | l'adhésion à un médiateur référencé suppose une entreprise immatriculée |

---

## 3. Ce qui ne dépend ni du SIRET ni de toi — c'est à moi de le régler

| # | Information | Où | Ce que je dois faire |
|---|---|---|---|
| 10 | **Durée de conservation des données** | `confidentialite.html:90` | Écrire ce que le site fait réellement, pas une durée « usuelle ». Foncier·Juste ne tient aucune base de données : les seules données persistantes sont chez Stripe (transaction et réponses jointes) et dans les journaux Vercel. Je dois vérifier la rétention réellement appliquée par ces deux prestataires sur ton plan avant d'écrire quoi que ce soit. S'y ajoutera, dès la première vente, la conservation des pièces comptables pendant dix ans (C. com. art. L123-22). |
| 11 | **Téléphone de l'hébergeur** | `mentions-legales.html:45` | L'article 1-1, I, 4° exige le nom, l'adresse **et le numéro de téléphone** du fournisseur d'hébergement. Nous n'indiquons que le nom et l'adresse de Vercel. Je ne vais pas inventer un numéro : je dois trouver celui que Vercel publie, ou documenter qu'il n'en publie pas. |

---

## 4. Deux manques trouvés en vérifiant — ni l'un ni l'autre n'était dans la liste initiale

**Le médiateur de la consommation est obligatoire, et il n'y a rien dans les CGV.**
Tout professionnel qui vend à des consommateurs doit adhérer à un dispositif de médiation et en
communiquer les coordonnées (nom, adresse postale, site et email) sur son site et dans ses CGV —
article L616-1 du code de la consommation, en vigueur depuis le 1er juillet 2016, sans exemption
liée à la taille de l'entreprise. Le manquement est puni d'une amende administrative pouvant
atteindre 3 000 € pour une personne physique. Le médiateur doit être référencé par la CECMC ; la
liste officielle est publiée sur economie.gouv.fr. L'adhésion est payante et annuelle : c'est un
coût à intégrer avant la première vente, pas après.

**En revanche, ne mets pas de lien vers la plateforme européenne de litiges en ligne.**
Beaucoup de modèles de CGV l'exigent encore. La plateforme RLL/ODR a **définitivement fermé le
20 juillet 2025**, le règlement (UE) n° 524/2013 ayant été abrogé par le règlement (UE) 2024/3228.
Le code de la consommation français y fait toujours référence à son article L616-2, qui n'a pas
été nettoyé — mais publier un lien vers une plateforme qui n'existe plus n'aiderait aucun client et
signalerait des CGV recopiées. Nos CGV n'en parlent pas : c'est volontaire, et ça le reste.

---

## 5. Ordre de mise en œuvre

1. Tu me donnes les cinq informations de la section 1 → je les publie et je retire le bandeau
   « brouillon » de ces champs-là uniquement.
2. Je règle les points 10 et 11 (vérifications de rétention et téléphone de l'hébergeur).
3. À l'immatriculation : SIRET, statut, TVA, adhésion au médiateur.
4. Seulement alors : retrait du `noindex`, puis remplacement de la clé Stripe de test par la clé
   réelle. **Jamais l'un sans l'autre** — un site indexé dont les mentions légales sont incomplètes
   est plus exposé qu'un site fermé.

Le passage aux paiements réels reste par ailleurs conditionné au verdict de T1 (voir
`T1-protocole.md`) : ces deux conditions s'ajoutent, elles ne se remplacent pas.

---

## Sources

- [LCEN, article 1-1 (Légifrance)](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000049568614)
- [Code de la consommation, médiation — articles L611-1 à L616-3 (Légifrance)](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032223335/)
- [Médiateurs référencés par la CECMC (economie.gouv.fr)](https://www.economie.gouv.fr/mediation-conso/vous-etes-un-professionnel/choisir-un-mediateur-de-la-consommation/mediateurs-references)
- [Règlement (UE) 2024/3228 abrogeant le règlement RLL (EUR-Lex)](https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:32024R3228)
- [Institut national de la consommation — fermeture de la plateforme RLL](https://www.inc-conso.fr/content/reglement-en-ligne-des-litiges-de-consommation-leurope-ferme-sa-plateforme-mais-des)
