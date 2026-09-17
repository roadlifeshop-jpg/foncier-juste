/* ==========================================================================
   OUTIL « ACHAT DÉFECTUEUX, GARANTIES, RÉPARATION » — orientation.
   --------------------------------------------------------------------------
   Ce fichier ne décide rien. Il calcule des FAITS à partir des dates saisies
   (« vous êtes à 14 mois de la délivrance »), puis liste des VOIES POSSIBLES
   à vérifier, chacune rattachée à une règle du registre `REGLES`.

   Trois interdits, tenus dans tout le fichier :
     — ne jamais écrire qu'une démarche aboutira ;
     — ne jamais présenter la directive européenne « droit à la réparation »
       comme applicable : elle n'est pas transposée en France au 17/09/2026 ;
     — ne jamais trancher un cas qui dépend d'une exception que nous ne
       connaissons pas (état du bien, contenu du contrat, cause réelle de la
       panne). Dans ce cas, l'outil dit ce qu'il faut regarder.
   ========================================================================== */

const VENDEURS = {
  pro:        "Un professionnel (magasin, site marchand, artisan)",
  particulier:"Un particulier (annonce, brocante, de la main à la main)",
  inconnu:    "Je ne sais pas / autre",
};

const CANAUX = {
  distance:  "À distance (site, application, téléphone)",
  magasin:   "En magasin",
  domicile:  "À domicile ou dans un salon (démarchage)",
};

const ETATS = { neuf: "Neuf", occasion: "D'occasion ou reconditionné" };

const PROBLEMES = {
  panne_apres:   "Il a fonctionné, puis il est tombé en panne",
  defaut_reception:"Il était déjà défectueux à la réception",
  non_conforme:  "Il ne correspond pas à la description ou à l'usage annoncé",
  usure:         "Il s'use anormalement vite",
  casse:         "Je l'ai fait tomber, mouillé, ou mal utilisé",
  regret:        "Il fonctionne, mais je ne le veux plus",
};

const CATEGORIES_BIEN = {
  electro_grand: "Gros électroménager (lave-linge, réfrigérateur…)",
  electro_petit: "Petit électroménager",
  informatique:  "Informatique, téléphone, tablette",
  image_son:     "Image et son",
  meuble:        "Meuble, literie",
  bricolage:     "Outillage, jardin",
  mobilite:      "Vélo, trottinette, véhicule non motorisé",
  vetement:      "Vêtement, chaussure, accessoire",
  autre:         "Autre",
};

function versDateG(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [a, m, j] = iso.split('-').map(Number);
  const d = new Date(a, m - 1, j);
  if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== j) return null;
  return d;
}

/** Nombre de mois révolus entre deux dates, en tenant compte du jour. */
function moisRevolus(debut, fin) {
  let m = (fin.getFullYear() - debut.getFullYear()) * 12 + (fin.getMonth() - debut.getMonth());
  if (fin.getDate() < debut.getDate()) m -= 1;
  return m;
}

function joursRevolus(debut, fin) {
  return Math.round((fin - debut) / 86400000);
}

function dateFrG(d) { return d.toLocaleDateString('fr-FR'); }

/* --------------------------------------------------------------------------
   Orientation.
   `r` : { categorie, etat, vendeur, canal, probleme, dateAchat (ISO),
           dateDecouverte (ISO, optionnelle) }
   -------------------------------------------------------------------------- */
function orienter(r, aujourdhui) {
  const faits = [];
  const voies = [];
  const pieces = new Set();
  const limites = [];

  const achat = versDateG(r.dateAchat);
  if (!achat) {
    return { invalide: "La date d'achat est nécessaire : tous les délais en dépendent.", faits, voies, pieces: [], limites };
  }
  if (achat > aujourdhui) {
    return { invalide: "La date d'achat est dans le futur. Vérifiez-la : les délais se comptent depuis la délivrance.", faits, voies, pieces: [], limites };
  }

  const mois = moisRevolus(achat, aujourdhui);
  const jours = joursRevolus(achat, aujourdhui);
  const neuf = r.etat === 'neuf';
  const pro = r.vendeur === 'pro';
  const presomptionMois = neuf ? 24 : 12;

  // ---- Faits : ce qui découle des dates, sans interprétation -------------
  faits.push({
    titre: `Achat il y a ${mois} mois`,
    texte: `Date saisie : ${dateFrG(achat)}, soit ${jours} jour${jours > 1 ? 's' : ''}. Les délais ci-dessous sont comptés depuis cette date. La loi les compte depuis la délivrance du bien : si vous l'avez reçu plus tard, décalez d'autant.`,
  });

  if (pro) {
    const dansDeuxAns = mois < 24;
    const dansPresomption = mois < presomptionMois;
    faits.push({
      titre: dansDeuxAns
        ? `Dans le délai de deux ans de la garantie légale de conformité`
        : `Au-delà des deux ans de la garantie légale de conformité`,
      texte: dansDeuxAns
        ? `Il reste environ ${24 - mois} mois. ${dansPresomption
            ? `Vous êtes aussi dans la fenêtre de présomption (${presomptionMois} mois pour un bien ${neuf ? 'neuf' : "d'occasion"}) : c'est au vendeur de prouver que le défaut ne venait pas de la délivrance.`
            : `La fenêtre de présomption (${presomptionMois} mois) est en revanche dépassée : il vous faudra établir que le défaut existait déjà à la délivrance.`}`
        : `Cette voie paraît fermée d'après la date saisie. Deux autres restent à regarder : une garantie commerciale éventuelle, et le vice caché, dont le délai se compte à partir de la découverte et non de l'achat.`,
    });
  }

  // ---- Voies possibles ---------------------------------------------------

  // Rétractation : seule voie franchement mécanique, et seulement à distance.
  if (r.canal === 'distance' || r.canal === 'domicile') {
    if (jours <= 14) {
      voies.push({
        priorite: 1, regle: 'retractation-14-jours',
        titre: "Rétractation — la voie la plus simple, si elle est ouverte",
        texte: `D'après votre date, vous êtes à ${jours} jour${jours > 1 ? 's' : ''} de l'achat. Le délai légal est de quatorze jours et ne demande aucun motif. Attention : il court depuis la réception du bien, pas depuis la commande — si vous avez reçu le colis plus tard, vous avez plus de temps que ce décompte. Vérifiez aussi que votre achat n'entre pas dans les exclusions.`,
      });
      pieces.add("La confirmation de commande et la preuve de la date de réception");
    } else {
      faits.push({
        titre: "Délai de rétractation probablement expiré",
        texte: `Quatorze jours après l'achat, il est en principe passé — sauf si la réception est bien plus tardive, ou si le vendeur offre mieux que la loi. Cela ne change rien aux garanties, qui sont indépendantes.`,
      });
    }
  }

  if (r.probleme === 'regret') {
    limites.push("Un bien qui fonctionne et dont on ne veut plus ne relève d'aucune garantie : seule la rétractation, ou un geste commercial, peut jouer.");
  }

  if (r.probleme === 'casse') {
    limites.push("Un dommage causé par une chute, un liquide ou un usage contraire à la notice n'est pas un défaut de conformité. Restent à regarder : une assurance, une garantie commerciale « accidents », ou un devis de réparation.");
  }

  const problemeGarantie = ['panne_apres', 'defaut_reception', 'non_conforme', 'usure'].includes(r.probleme);

  if (pro && problemeGarantie && mois < 24) {
    const dansPresomption = mois < presomptionMois;
    voies.push({
      priorite: 2, regle: 'conformite-duree',
      titre: "Garantie légale de conformité — à faire jouer auprès du vendeur",
      texte: `Elle s'exerce auprès du VENDEUR, pas du fabricant, et elle est gratuite. Vous choisissez entre la réparation et le remplacement ; le vendeur peut imposer l'autre solution si votre choix lui coûte manifestement plus cher. ${dansPresomption
        ? "Dans la fenêtre de présomption, vous n'avez pas à démontrer que le défaut est antérieur."
        : "Hors fenêtre de présomption, préparez de quoi montrer que le défaut existait déjà à la délivrance : photos datées, constat d'un réparateur, nature de la panne."}`,
    });
    if (dansPresomption) voies.push({ priorite: 3, regle: 'conformite-presomption', titre: null, texte: null });
    voies.push({ priorite: 6, regle: 'conformite-extension-reparation',
      titre: "Si le vendeur répare, notez l'extension de six mois",
      texte: "Une réparation obtenue au titre de la garantie légale prolonge cette garantie de six mois. Faites écrire noir sur blanc que l'intervention a lieu dans ce cadre : sans cette mention, vous ne pourrez pas l'invoquer." });
    pieces.add("La facture ou le ticket de caisse, avec la date");
    pieces.add("Une description écrite de la panne, et des photos ou une vidéo datées");
    pieces.add("Vos échanges avec le vendeur, par écrit de préférence");
  }

  if (r.vendeur === 'particulier' && problemeGarantie) {
    limites.push("Entre particuliers, la garantie légale de conformité ne s'applique pas : elle ne pèse que sur un vendeur professionnel.");
    voies.push({
      priorite: 4, regle: 'vices-caches',
      titre: "Vice caché — la voie qui reste face à un particulier",
      texte: "Elle suppose un défaut antérieur à la vente, invisible à l'achat, et assez grave pour rendre le bien inutilisable ou en réduire fortement l'usage. Le délai est de deux ans à compter de la découverte, ce qui peut rouvrir un dossier ancien. La preuve vous incombe, et passe le plus souvent par une expertise — dont le coût mérite d'être comparé à la valeur du bien.",
    });
    pieces.add("L'annonce, le contrat de vente ou les messages échangés avant l'achat");
    pieces.add("Tout élément datant le défaut : expertise, constat d'un professionnel");
  }

  if (pro && problemeGarantie && mois >= 24) {
    voies.push({
      priorite: 4, regle: 'vices-caches',
      titre: "Vice caché — indépendant du délai de deux ans",
      texte: "Son délai se compte depuis la découverte du défaut, pas depuis l'achat : un bien acheté il y a quatre ans peut encore être concerné. En contrepartie, la preuve vous incombe, et la gravité exigée est plus forte qu'un simple défaut de conformité.",
    });
    pieces.add("La facture, même ancienne");
    pieces.add("Un constat ou devis de réparateur décrivant l'origine de la panne");
  }

  if (problemeGarantie) {
    voies.push({
      priorite: 5, regle: null,
      titre: "Garantie commerciale : vérifiez ce que vous avez déjà payé",
      texte: "Extension de garantie, garantie constructeur, garantie incluse par une carte bancaire : elles s'ajoutent aux garanties légales et ne peuvent pas les remplacer. Relisez la facture et les conditions du fabricant avant d'engager quoi que ce soit — vous avez peut-être une voie plus rapide.",
    });
    pieces.add("Les conditions de la garantie commerciale, si vous en avez une");
  }

  // ---- Limites, toujours affichées --------------------------------------
  limites.push("Ce site n'a accès à aucun dossier : tout ce qui précède découle uniquement de ce que vous venez de saisir.");
  limites.push("Nous ne pouvons pas dire si votre demande aboutira. La cause réelle d'une panne, le contenu exact de votre contrat et l'état du bien ne sont pas connus de nous.");
  if (r.etat === 'occasion' && pro) {
    limites.push("Pour un bien d'occasion vendu par un professionnel, la présomption ne dure que douze mois. Le délai de deux ans, lui, reste ouvert.");
  }

  voies.sort((a, b) => a.priorite - b.priorite);
  return { invalide: null, faits, voies, pieces: [...pieces], limites, mois, jours };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VENDEURS, CANAUX, ETATS, PROBLEMES, CATEGORIES_BIEN,
                     versDateG, moisRevolus, joursRevolus, orienter };
}
