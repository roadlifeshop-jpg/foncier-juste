/* ==========================================================================
   RENDU COMMUN DU RÉSULTAT — les quatre mêmes cases pour les trois outils.
   --------------------------------------------------------------------------
   Un seul fichier de rendu, pour une raison précise : c'est ce qui garantit
   que la case « somme » ne puisse pas se présenter différemment d'un outil à
   l'autre. Le degré de certitude n'est pas un ornement, c'est la seule chose
   qui sépare « 400 € prévus par un règlement » de « 358 € si vous arrêtez cet
   abonnement » et de « non chiffrable ». Le vocabulaire est donc fixé ici, et
   nulle part ailleurs.

   Forme attendue :
     { constat:      [{ titre, texte }],
       somme:        { montant, texte, certitude, pourquoi },
       verification: [{ titre, texte, regle? }],
       action:       [{ titre, texte, gratuit?, regle? }],
       limites:      [ "…" ] }
   ========================================================================== */

const CERTITUDES = {
  'barème':         { classe: 'bareme',         libelle: 'Montant fixé par un texte' },
  'fait':           { classe: 'fait',           libelle: 'Calculé sur vos réponses' },
  'hypothese':      { classe: 'hypothese',      libelle: 'Hypothèse, pas un acquis' },
  'indeterminee':   { classe: 'hypothese',      libelle: 'Fourchette — une réponse manque' },
  'non-chiffrable': { classe: 'non-chiffrable', libelle: 'Non chiffrable' },
  'exclu':          { classe: 'exclu',          libelle: 'Rien à ce titre' },
};

function ech4(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
}

function bloc4(rang, intitule, corps, classes, id){
  return `<div class="r4-bloc ${classes || ''}"${id ? ` id="${id}"` : ''}>
    <h2><span class="rang">${rang}</span>${ech4(intitule)}</h2>
    ${corps}
  </div>`;
}

function items4(liste){
  if (!liste || !liste.length) return '<p>Rien à signaler sur ce point.</p>';
  return liste.map(x => `<div class="r4-item">
    <h3>${ech4(x.titre)}${x.gratuit ? '<span class="gratuit">Gratuit</span>' : ''}</h3>
    <p>${ech4(x.texte)}</p>
    ${x.regle && typeof citer === 'function'
      ? `<details><summary>Voir le texte applicable et sa source</summary>${citer(x.regle)}</details>` : ''}
  </div>`).join('');
}

function rendreResultat4(r){
  const c = CERTITUDES[r.somme && r.somme.certitude] || CERTITUDES['non-chiffrable'];
  const chiffre = r.somme && r.somme.montant != null;

  return [
    bloc4('1', 'Le constat', items4(r.constat), 'plein'),

    /* Une seule somme par résultat, volontairement.
       La version précédente en affichait deux dans cette case pour les
       abonnements : « économiser à l'avenir » et « réclamer un remboursement ».
       Les deux ont été retirées — la première parce qu'un coût annuel n'est pas
       une économie sans scénario de résiliation ni offre de remplacement, la
       seconde parce qu'un remboursement au titre de l'article L215-1 dépend de
       cinq faits qu'un formulaire de trois champs n'établit pas. Cette case ne
       porte plus qu'un chiffre, et son étiquette dit ce qu'il vaut. */
    bloc4('2', r.somme && r.somme.certitude === 'fait' ? 'Coût actuel' : 'Somme éventuelle', `
      <div class="chiffre${chiffre ? '' : ' sans'}">${ech4(r.somme ? r.somme.texte : 'Non chiffrable')}</div>
      <span class="certitude ${c.classe}">${ech4(c.libelle)}</span>
      <p>${ech4(r.somme ? r.somme.pourquoi : '')}</p>
      ${r.action && r.action.length
        ? `<p class="vers-action"><a href="#r4-action">Voir la démarche gratuite&nbsp;→</a></p>` : ''}`, 'r4-somme'),

    /* L'action vient AVANT la vérification, et ce n'est pas un détail d'ordre.
       Entre le montant et la démarche gratuite, la version précédente
       intercalait les développements juridiques : preuves à réunir, exceptions,
       textes cités. Quelqu'un qui vient de lire « 600 € » veut savoir quoi
       faire, pas lire un article du règlement. Les textes ne disparaissent
       pas — ils restent en dessous, et chacun garde son dépliant de source. */
    bloc4('3', 'Prochaine action, gratuite', items4(r.action), 'r4-action', 'r4-action'),

    bloc4('4', 'Ce qu\'il reste à vérifier', items4(r.verification)),

    r.limites && r.limites.length
      ? bloc4('—', 'Ce que nous ne garantissons pas',
          `<ul style="margin-top:10px">${r.limites.map(l => `<li style="font-size:.9rem;color:var(--ink-muted)">${ech4(l)}</li>`).join('')}</ul>`,
          'plein')
      : '',
  ].join('');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CERTITUDES, rendreResultat4 };
}
