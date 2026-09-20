/* ==========================================================================
   CHOIX DU THÈME — clair par défaut, sombre disponible.
   --------------------------------------------------------------------------
   POURQUOI CE FICHIER EXISTE PLUTÔT QU'UN SCRIPT INTÉGRÉ.

   La politique de sécurité de contenu déclarée dans `vercel.json` autorise
   `script-src 'self' 'unsafe-inline'` : un script intégré passerait. Mais la
   politique RÉELLEMENT SERVIE n'est pas vérifiable de l'extérieur — toutes
   les URL du projet, y compris les fichiers statiques, répondent 302 vers le
   SSO Vercel avant que les en-têtes de l'application ne soient appliqués.

   Face à cette incertitude, `'unsafe-inline'` est précisément la directive
   qu'on retire en premier quand on durcit une CSP, et le jour où elle
   disparaîtra, un thème intégré cesserait de s'appliquer SANS ERREUR VISIBLE :
   les quinze pages basculeraient au gré du système. Un fichier servi depuis
   la même origine passe sous `'self'`, présent dans toute politique plausible.

   Cela ne rend pas le site conforme à une CSP sans `'unsafe-inline'` : les
   outils portent encore plusieurs centaines de lignes de script intégré.
   C'est un chantier distinct.

   --------------------------------------------------------------------------
   CE FICHIER DOIT ÊTRE CHARGÉ DANS `<head>`, SANS `defer` NI `async`, et
   avant la feuille de style : il pose l'attribut `data-theme` avant le
   premier rendu, ce qui évite qu'une page claire clignote en sombre.

   Trois valeurs, écrites dans `localStorage` sous `dj_theme` :
     'light' — le défaut. L'attribut est RETIRÉ : la feuille commune décide.
     'dark'  — thème sombre explicite.
     'auto'  — suit `prefers-color-scheme` du système.
   Le stockage peut être refusé (navigation privée, données bloquées) : tous
   les accès sont sous `try`, et le thème clair reste alors en place.
   ========================================================================== */
(function () {
  var CLE = 'dj_theme';
  var VALEURS = ['light', 'dark', 'auto'];

  function lire() {
    try {
      var v = localStorage.getItem(CLE);
      return VALEURS.indexOf(v) >= 0 ? v : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function appliquer(v) {
    var racine = document.documentElement;
    if (v === 'light') racine.removeAttribute('data-theme');
    else racine.setAttribute('data-theme', v);
  }

  /* Appliqué tout de suite, avant le premier rendu. */
  appliquer(lire());

  /* Le sélecteur, s'il existe sur cette page. Le DOM n'est pas encore construit
     quand ce fichier s'exécute : on attend, sans bloquer l'application du
     thème, qui vient d'avoir lieu. */
  function brancher() {
    var boutons = document.querySelectorAll('.theme-choix button[data-theme-val]');
    if (!boutons.length) return;
    function marquer(v) {
      for (var i = 0; i < boutons.length; i++) {
        boutons[i].setAttribute('aria-pressed', String(boutons[i].getAttribute('data-theme-val') === v));
      }
    }
    for (var i = 0; i < boutons.length; i++) {
      boutons[i].addEventListener('click', function () {
        var v = this.getAttribute('data-theme-val');
        if (VALEURS.indexOf(v) < 0) return;
        try { localStorage.setItem(CLE, v); } catch (e) {}
        appliquer(v);
        marquer(v);
      });
    }
    marquer(lire());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', brancher);
  } else {
    brancher();
  }
})();
