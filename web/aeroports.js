/* ==========================================================================
   AÉROPORTS — pour que personne n'ait à connaître une distance en kilomètres.
   --------------------------------------------------------------------------
   Le règlement (CE) n° 261/2004 fixe le montant par tranches de distance
   (article 7), mesurées « selon la méthode de la route orthodromique »
   (article 7, paragraphe 4), entre le point de départ du premier vol et la
   destination finale du contrat. Un passager ne connaît pas cette distance.
   Nous lui demandons donc deux aéroports, et nous calculons.

   CE QUE CETTE TABLE EST, ET N'EST PAS
   Les coordonnées sont des points de référence d'aéroport, arrondis au
   centième de degré — soit environ un kilomètre. Elles ne prétendent pas à la
   précision d'un référentiel aéronautique, et cette table n'est pas
   exhaustive : elle couvre les aéroports français, l'outre-mer et les
   destinations les plus courantes au départ de France.

   POURQUOI CETTE IMPRÉCISION EST SANS CONSÉQUENCE SUR LE MONTANT
   Les seuils du barème sont à 1 500 et 3 500 km. Quand la distance calculée
   tombe à moins de 100 km d'un seuil, nous n'annonçons AUCUN montant : nous
   disons que la distance est trop proche de la limite pour que nous
   tranchions, et nous donnons les deux montants possibles. Une erreur de
   coordonnées, qui se compte en kilomètres, ne peut donc pas produire un
   montant faux. Un aéroport absent de la table ne produit pas non plus de
   montant : il produit une orientation.

   LE DRAPEAU « ue » N'EST PAS UNE COMMODITÉ
   Il détermine si le vol est « intracommunautaire » au sens de l'article 7,
   paragraphe 1, b) — ce qui plafonne l'indemnisation à 400 € même au-delà de
   3 500 km. Deux conséquences contre-intuitives, toutes deux prises en compte :
     — la Guadeloupe, la Martinique, la Guyane, La Réunion et Mayotte sont des
       régions ultrapériphériques de l'Union : un vol Paris–La Réunion est
       intracommunautaire, et vaut 400 €, pas 600 €. La Cour de cassation l'a
       jugé le 12 octobre 2016 ;
     — la Nouvelle-Calédonie et la Polynésie française sont des pays et
       territoires d'outre-mer, PAS un territoire de l'Union : un vol
       Paris–Papeete n'est pas intracommunautaire, et relève du palier à 600 €.
   Le Royaume-Uni, la Suisse, la Norvège et l'Islande ne sont pas dans l'Union :
   ils entrent dans le CHAMP du règlement (article 3) sans rendre un vol
   intracommunautaire.

   Coordonnées relevées le 18 septembre 2026.
   ========================================================================== */

const AEROPORTS = {
  /* ---- France métropolitaine ---- */
  CDG: { nom: 'Paris Charles-de-Gaulle', ville: 'Paris',            lat: 49.01, lon:   2.55, ue: true },
  ORY: { nom: 'Paris-Orly',              ville: 'Paris',            lat: 48.72, lon:   2.38, ue: true },
  BVA: { nom: 'Paris-Beauvais',          ville: 'Beauvais',         lat: 49.45, lon:   2.11, ue: true },
  NCE: { nom: 'Nice Côte d’Azur',        ville: 'Nice',             lat: 43.66, lon:   7.21, ue: true },
  LYS: { nom: 'Lyon-Saint-Exupéry',      ville: 'Lyon',             lat: 45.73, lon:   5.08, ue: true },
  MRS: { nom: 'Marseille-Provence',      ville: 'Marseille',        lat: 43.44, lon:   5.22, ue: true },
  TLS: { nom: 'Toulouse-Blagnac',        ville: 'Toulouse',         lat: 43.63, lon:   1.37, ue: true },
  BOD: { nom: 'Bordeaux-Mérignac',       ville: 'Bordeaux',         lat: 44.83, lon:  -0.72, ue: true },
  NTE: { nom: 'Nantes Atlantique',       ville: 'Nantes',           lat: 47.16, lon:  -1.61, ue: true },
  LIL: { nom: 'Lille-Lesquin',           ville: 'Lille',            lat: 50.56, lon:   3.09, ue: true },
  MPL: { nom: 'Montpellier-Méditerranée',ville: 'Montpellier',      lat: 43.58, lon:   3.96, ue: true },
  SXB: { nom: 'Strasbourg-Entzheim',     ville: 'Strasbourg',       lat: 48.54, lon:   7.63, ue: true },
  BES: { nom: 'Brest-Bretagne',          ville: 'Brest',            lat: 48.45, lon:  -4.42, ue: true },
  RNS: { nom: 'Rennes-Saint-Jacques',    ville: 'Rennes',           lat: 48.07, lon:  -1.73, ue: true },
  BIQ: { nom: 'Biarritz-Pays basque',    ville: 'Biarritz',         lat: 43.47, lon:  -1.53, ue: true },
  CFE: { nom: 'Clermont-Ferrand-Auvergne',ville:'Clermont-Ferrand', lat: 45.79, lon:   3.16, ue: true },
  AJA: { nom: 'Ajaccio Napoléon-Bonaparte', ville: 'Ajaccio',       lat: 41.92, lon:   8.80, ue: true },
  BIA: { nom: 'Bastia-Poretta',          ville: 'Bastia',           lat: 42.55, lon:   9.48, ue: true },

  /* ---- Outre-mer : régions ultrapériphériques de l'Union (vol intracommunautaire) ---- */
  PTP: { nom: 'Pointe-à-Pitre Le Raizet',ville: 'Pointe-à-Pitre',   lat: 16.27, lon: -61.53, ue: true },
  FDF: { nom: 'Fort-de-France Aimé-Césaire', ville: 'Fort-de-France', lat: 14.59, lon: -61.00, ue: true },
  RUN: { nom: 'Saint-Denis Roland-Garros', ville: 'La Réunion',     lat: -20.89, lon: 55.51, ue: true },
  CAY: { nom: 'Cayenne-Félix Éboué',     ville: 'Cayenne',          lat:  4.82, lon: -52.36, ue: true },
  DZA: { nom: 'Dzaoudzi-Pamandzi',       ville: 'Mayotte',          lat: -12.80, lon: 45.28, ue: true },

  /* ---- Outre-mer : pays et territoires d'outre-mer, HORS Union ---- */
  NOU: { nom: 'Nouméa La Tontouta',      ville: 'Nouvelle-Calédonie', lat: -22.01, lon: 166.21, ue: false },
  PPT: { nom: 'Papeete Faa’a',           ville: 'Tahiti',           lat: -17.56, lon: -149.61, ue: false },

  /* ---- Union européenne ---- */
  MAD: { nom: 'Madrid-Barajas',          ville: 'Madrid',           lat: 40.47, lon:  -3.56, ue: true },
  BCN: { nom: 'Barcelone-El Prat',       ville: 'Barcelone',        lat: 41.30, lon:   2.08, ue: true },
  AGP: { nom: 'Malaga-Costa del Sol',    ville: 'Malaga',           lat: 36.68, lon:  -4.50, ue: true },
  PMI: { nom: 'Palma de Majorque',       ville: 'Palma',            lat: 39.55, lon:   2.74, ue: true },
  LIS: { nom: 'Lisbonne-Humberto Delgado', ville: 'Lisbonne',       lat: 38.77, lon:  -9.13, ue: true },
  OPO: { nom: 'Porto-Francisco Sá Carneiro', ville: 'Porto',        lat: 41.24, lon:  -8.68, ue: true },
  FCO: { nom: 'Rome-Fiumicino',          ville: 'Rome',             lat: 41.80, lon:  12.25, ue: true },
  MXP: { nom: 'Milan-Malpensa',          ville: 'Milan',            lat: 45.63, lon:   8.72, ue: true },
  VCE: { nom: 'Venise-Marco Polo',       ville: 'Venise',           lat: 45.51, lon:  12.35, ue: true },
  NAP: { nom: 'Naples-Capodichino',      ville: 'Naples',           lat: 40.88, lon:  14.29, ue: true },
  ATH: { nom: 'Athènes-Elefthérios-Venizélos', ville: 'Athènes',    lat: 37.94, lon:  23.95, ue: true },
  BER: { nom: 'Berlin-Brandebourg',      ville: 'Berlin',           lat: 52.36, lon:  13.51, ue: true },
  MUC: { nom: 'Munich-Franz-Josef-Strauss', ville: 'Munich',        lat: 48.35, lon:  11.79, ue: true },
  FRA: { nom: 'Francfort-sur-le-Main',   ville: 'Francfort',        lat: 50.03, lon:   8.56, ue: true },
  DUS: { nom: 'Düsseldorf',              ville: 'Düsseldorf',       lat: 51.29, lon:   6.77, ue: true },
  AMS: { nom: 'Amsterdam-Schiphol',      ville: 'Amsterdam',        lat: 52.31, lon:   4.76, ue: true },
  BRU: { nom: 'Bruxelles-National',      ville: 'Bruxelles',        lat: 50.90, lon:   4.48, ue: true },
  VIE: { nom: 'Vienne-Schwechat',        ville: 'Vienne',           lat: 48.11, lon:  16.57, ue: true },
  PRG: { nom: 'Prague-Václav-Havel',     ville: 'Prague',           lat: 50.10, lon:  14.26, ue: true },
  WAW: { nom: 'Varsovie-Chopin',         ville: 'Varsovie',         lat: 52.17, lon:  20.97, ue: true },
  BUD: { nom: 'Budapest-Ferenc-Liszt',   ville: 'Budapest',         lat: 47.44, lon:  19.26, ue: true },
  CPH: { nom: 'Copenhague-Kastrup',      ville: 'Copenhague',       lat: 55.62, lon:  12.65, ue: true },
  ARN: { nom: 'Stockholm-Arlanda',       ville: 'Stockholm',        lat: 59.65, lon:  17.92, ue: true },
  HEL: { nom: 'Helsinki-Vantaa',         ville: 'Helsinki',         lat: 60.32, lon:  24.96, ue: true },
  DUB: { nom: 'Dublin',                  ville: 'Dublin',           lat: 53.43, lon:  -6.27, ue: true },
  OTP: { nom: 'Bucarest-Henri-Coandă',   ville: 'Bucarest',         lat: 44.57, lon:  26.10, ue: true },
  SOF: { nom: 'Sofia',                   ville: 'Sofia',            lat: 42.70, lon:  23.41, ue: true },
  ZAG: { nom: 'Zagreb-Franjo-Tuđman',    ville: 'Zagreb',           lat: 45.74, lon:  16.07, ue: true },
  TLL: { nom: 'Tallinn-Lennart-Meri',    ville: 'Tallinn',          lat: 59.41, lon:  24.83, ue: true },

  /* ---- Dans le champ du règlement, mais hors Union ---- */
  LHR: { nom: 'Londres-Heathrow',        ville: 'Londres',          lat: 51.47, lon:  -0.45, ue: false },
  LGW: { nom: 'Londres-Gatwick',         ville: 'Londres',          lat: 51.15, lon:  -0.18, ue: false },
  ZRH: { nom: 'Zurich',                  ville: 'Zurich',           lat: 47.46, lon:   8.55, ue: false },
  GVA: { nom: 'Genève-Cointrin',         ville: 'Genève',           lat: 46.24, lon:   6.11, ue: false },
  OSL: { nom: 'Oslo-Gardermoen',         ville: 'Oslo',             lat: 60.19, lon:  11.10, ue: false },
  KEF: { nom: 'Reykjavik-Keflavík',      ville: 'Reykjavik',        lat: 63.99, lon: -22.61, ue: false },
  IST: { nom: 'Istanbul',                ville: 'Istanbul',         lat: 41.26, lon:  28.74, ue: false },

  /* ---- Afrique, Maghreb, océan Indien ---- */
  CMN: { nom: 'Casablanca-Mohammed-V',   ville: 'Casablanca',       lat: 33.37, lon:  -7.59, ue: false },
  RAK: { nom: 'Marrakech-Ménara',        ville: 'Marrakech',        lat: 31.61, lon:  -8.04, ue: false },
  TUN: { nom: 'Tunis-Carthage',          ville: 'Tunis',            lat: 36.85, lon:  10.23, ue: false },
  ALG: { nom: 'Alger-Houari-Boumédiène', ville: 'Alger',            lat: 36.69, lon:   3.22, ue: false },
  CAI: { nom: 'Le Caire',                ville: 'Le Caire',         lat: 30.11, lon:  31.41, ue: false },
  DSS: { nom: 'Dakar-Blaise-Diagne',     ville: 'Dakar',            lat: 14.67, lon: -17.07, ue: false },
  ABJ: { nom: 'Abidjan-Félix-Houphouët-Boigny', ville: 'Abidjan',   lat:  5.26, lon:  -3.93, ue: false },
  NBO: { nom: 'Nairobi-Jomo-Kenyatta',   ville: 'Nairobi',          lat: -1.32, lon:  36.93, ue: false },
  JNB: { nom: 'Johannesburg-O.-R.-Tambo',ville: 'Johannesburg',     lat: -26.13, lon: 28.24, ue: false },
  MRU: { nom: 'Maurice-Sir-Seewoosagur-Ramgoolam', ville: 'Maurice', lat: -20.43, lon: 57.68, ue: false },
  SEZ: { nom: 'Seychelles-Mahé',         ville: 'Seychelles',       lat: -4.67, lon:  55.52, ue: false },

  /* ---- Amériques ---- */
  JFK: { nom: 'New York-John-F.-Kennedy',ville: 'New York',         lat: 40.64, lon: -73.78, ue: false },
  EWR: { nom: 'Newark-Liberty',          ville: 'New York',         lat: 40.69, lon: -74.17, ue: false },
  BOS: { nom: 'Boston-Logan',            ville: 'Boston',           lat: 42.36, lon: -71.01, ue: false },
  ORD: { nom: 'Chicago-O’Hare',          ville: 'Chicago',          lat: 41.98, lon: -87.90, ue: false },
  MIA: { nom: 'Miami',                   ville: 'Miami',            lat: 25.79, lon: -80.29, ue: false },
  LAX: { nom: 'Los Angeles',             ville: 'Los Angeles',      lat: 33.94, lon: -118.41, ue: false },
  SFO: { nom: 'San Francisco',           ville: 'San Francisco',    lat: 37.62, lon: -122.38, ue: false },
  YUL: { nom: 'Montréal-Trudeau',        ville: 'Montréal',         lat: 45.47, lon: -73.74, ue: false },
  YYZ: { nom: 'Toronto-Pearson',         ville: 'Toronto',          lat: 43.68, lon: -79.63, ue: false },
  MEX: { nom: 'Mexico-Benito-Juárez',    ville: 'Mexico',           lat: 19.44, lon: -99.07, ue: false },
  CUN: { nom: 'Cancún',                  ville: 'Cancún',           lat: 21.04, lon: -86.87, ue: false },
  PTY: { nom: 'Panama-Tocumen',          ville: 'Panama',           lat:  9.07, lon: -79.38, ue: false },
  GRU: { nom: 'São Paulo-Guarulhos',     ville: 'São Paulo',        lat: -23.43, lon: -46.47, ue: false },
  EZE: { nom: 'Buenos Aires-Ezeiza',     ville: 'Buenos Aires',     lat: -34.82, lon: -58.54, ue: false },
  SCL: { nom: 'Santiago-Arturo-Merino-Benítez', ville: 'Santiago',  lat: -33.39, lon: -70.79, ue: false },
  LIM: { nom: 'Lima-Jorge-Chávez',       ville: 'Lima',             lat: -12.02, lon: -77.11, ue: false },

  /* ---- Moyen-Orient, Asie, Océanie ---- */
  DXB: { nom: 'Dubaï',                   ville: 'Dubaï',            lat: 25.25, lon:  55.36, ue: false },
  DOH: { nom: 'Doha-Hamad',              ville: 'Doha',             lat: 25.27, lon:  51.61, ue: false },
  AUH: { nom: 'Abou Dabi',               ville: 'Abou Dabi',        lat: 24.43, lon:  54.65, ue: false },
  TLV: { nom: 'Tel-Aviv-Ben-Gourion',    ville: 'Tel-Aviv',         lat: 32.01, lon:  34.89, ue: false },
  DEL: { nom: 'Delhi-Indira-Gandhi',     ville: 'Delhi',            lat: 28.56, lon:  77.10, ue: false },
  BOM: { nom: 'Mumbai',                  ville: 'Mumbai',           lat: 19.09, lon:  72.87, ue: false },
  BKK: { nom: 'Bangkok-Suvarnabhumi',    ville: 'Bangkok',          lat: 13.69, lon: 100.75, ue: false },
  SIN: { nom: 'Singapour-Changi',        ville: 'Singapour',        lat:  1.36, lon: 103.99, ue: false },
  HKG: { nom: 'Hong Kong',               ville: 'Hong Kong',        lat: 22.31, lon: 113.91, ue: false },
  PVG: { nom: 'Shanghai-Pudong',         ville: 'Shanghai',         lat: 31.14, lon: 121.81, ue: false },
  PEK: { nom: 'Pékin-Capitale',          ville: 'Pékin',            lat: 40.08, lon: 116.58, ue: false },
  ICN: { nom: 'Séoul-Incheon',           ville: 'Séoul',            lat: 37.46, lon: 126.44, ue: false },
  NRT: { nom: 'Tokyo-Narita',            ville: 'Tokyo',            lat: 35.77, lon: 140.39, ue: false },
  HND: { nom: 'Tokyo-Haneda',            ville: 'Tokyo',            lat: 35.55, lon: 139.78, ue: false },
  SYD: { nom: 'Sydney-Kingsford-Smith',  ville: 'Sydney',           lat: -33.94, lon: 151.18, ue: false },
  MEL: { nom: 'Melbourne',               ville: 'Melbourne',        lat: -37.67, lon: 144.84, ue: false },
  AKL: { nom: 'Auckland',                ville: 'Auckland',         lat: -37.01, lon: 174.79, ue: false },
};

/* Marge de sécurité autour des seuils du barème (1 500 et 3 500 km).
   Dans cette bande, aucun montant n'est annoncé. Voir l'en-tête. */
const MARGE_SEUIL_KM = 100;

/* Route orthodromique — la méthode que l'article 7, paragraphe 4 impose. */
function distanceOrthodromique(a, b) {
  if (!a || !b) return null;
  const R = 6371;                        // rayon moyen de la Terre, en km
  const rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
          + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))));
}

/* Retrouve un aéroport à partir de ce que la personne a tapé : code IATA,
   nom d'aéroport ou nom de ville. Aucune correspondance approximative : on
   préfère ne rien trouver plutôt que de proposer le mauvais aéroport. */
function sansAccentA(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ').replace(/[-–]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function trouverAeroport(saisie) {
  const q = sansAccentA(saisie);
  if (!q) return null;
  const codeDirect = q.toUpperCase().trim();
  if (AEROPORTS[codeDirect]) return { code: codeDirect, ...AEROPORTS[codeDirect] };
  // Format proposé par la liste : « Paris Charles-de-Gaulle (CDG) »
  const entreParentheses = /\(([a-z]{3})\)\s*$/.exec(q);
  if (entreParentheses) {
    const c = entreParentheses[1].toUpperCase();
    if (AEROPORTS[c]) return { code: c, ...AEROPORTS[c] };
  }
  for (const [code, a] of Object.entries(AEROPORTS)) {
    if (sansAccentA(a.nom) === q || sansAccentA(a.ville) === q) return { code, ...a };
  }
  return null;
}

function etiquetteAeroport(code) {
  const a = AEROPORTS[code];
  return a ? `${a.nom} (${code})` : '';
}

/* Ce que le barème peut conclure d'un couple d'aéroports.
   Retourne toujours un objet : `tranche` peut valoir null, et c'est alors à
   l'appelant de ne montrer aucun montant. */
function resoudreTrajet(saisieDepart, saisieArrivee) {
  const a = trouverAeroport(saisieDepart);
  const b = trouverAeroport(saisieArrivee);
  if (!a || !b) {
    return { reconnu: false, depart: a, arrivee: b, km: null, tranche: null, intraUE: null, limite: null };
  }
  const km = distanceOrthodromique(a, b);
  const intraUE = a.ue === true && b.ue === true;
  // Trop près d'un seuil : on ne tranche pas.
  const seuil = [1500, 3500].find(s => Math.abs(km - s) < MARGE_SEUIL_KM);
  if (seuil) {
    return { reconnu: true, depart: a, arrivee: b, km, tranche: null, intraUE, limite: seuil };
  }
  const tranche = km <= 1500 ? 'courte' : (km <= 3500 ? 'moyenne' : 'longue');
  return { reconnu: true, depart: a, arrivee: b, km, tranche, intraUE, limite: null };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AEROPORTS, MARGE_SEUIL_KM, distanceOrthodromique,
                     trouverAeroport, etiquetteAeroport, resoudreTrajet, sansAccentA };
}
