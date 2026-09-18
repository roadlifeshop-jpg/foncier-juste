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
       remboursement:{ … } | null,   // second montant, affiché séparément
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

function bloc4(rang, intitule, corps, classes){
  return `<div class="r4-bloc ${classes || ''}">
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

    bloc4('2', r.remboursement ? 'Deux sommes, à ne pas confondre' : 'Somme éventuelle', `
      ${r.remboursement ? '<div class="sous-titre-somme">Économiser à l\'avenir</div>' : ''}
      <div class="chiffre${chiffre ? '' : ' sans'}">${ech4(r.somme ? r.somme.texte : 'Non chiffrable')}</div>
      <span class="certitude ${c.classe}">${ech4(c.libelle)}</span>
      <p>${ech4(r.somme ? r.somme.pourquoi : '')}</p>
      ${r.remboursement ? (() => {
        const c2 = CERTITUDES[r.remboursement.certitude] || CERTITUDES['hypothese'];
        return `<div class="seconde-somme">
          <div class="sous-titre-somme">Réclamer un remboursement</div>
          <div class="chiffre">${ech4(r.remboursement.texte)}</div>
          <span class="certitude ${c2.classe}">${ech4(c2.libelle)}</span>
          <p>${ech4(r.remboursement.pourquoi)}</p>
        </div>`;
      })() : ''}`, 'r4-somme'),

    bloc4('3', 'Ce qu\'il reste à vérifier', items4(r.verification)),

    bloc4('4', 'Prochaine action', items4(r.action), 'r4-action'),

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
