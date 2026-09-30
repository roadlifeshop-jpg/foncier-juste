/* Maquette isolée, état en mémoire uniquement. Ne lit ni n'écrit les dépenses réelles. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = { mobile:'Mobile', box:'Box internet', energie:'Énergie', assurance:'Assurances', abonnements:'Abonnements', logement:'Logement', transport:'Transport', courses:'Courses du quotidien', autre:'Autre' };
  const symbols = {mobile:'m',box:'⌁',energie:'↯',assurance:'◇',abonnements:'↻',logement:'⌂',transport:'→',courses:'◒',autre:'+'};
  const reasons = {unknown:'Cause à vérifier',usage:'Usage modifié, indiqué par vous',tariff:'Tarif modifié, indiqué par vous',oneoff:'Dépense ponctuelle, indiquée par vous',correction:'Correction de saisie'};
  const euro = n => (n / 100).toLocaleString('fr-FR', {style:'currency',currency:'EUR'});
  const yearly = row => row.amount * (row.frequency === 'annuelle' ? 1 : 12);
  const monthly = row => Math.round(yearly(row) / 12);
  const parse = value => /^\d{1,7}([.,]\d{1,2})?$/.test(value.trim()) ? Math.round(Number(value.trim().replace(',','.')) * 100) : null;
  let months, month, nextId, editing, dismissed, view, reviewQueue = null, reviewIndex = 0;
  function seed() {
    nextId = 8; month = 0; view = 'depenses'; dismissed = new Set();
    months = [[['mobile',3000],['box',3500],['energie',9000],['assurance',24000,'annuelle'],['abonnements',1500],['logement',70000],['transport',6000]].map((r,i) => ({id:i+1,category:r[0],amount:r[1],frequency:r[2]||'mensuelle',confirmed:true,reason:'unknown'})), null];
  }
  function rows() { return months[month]; }
  function changeMonth(value) {
    month = value;
    if (!months[month]) months[month] = months[0].map(r => ({...r, confirmed:false,reason:'unknown'}));
    $('month').value = String(month); render();
    $('status').textContent = month ? 'Octobre : les montants repris sont à confirmer.' : 'Septembre : vos montants précédents.';
  }
  function node(tag, text, className) {
    const el = document.createElement(tag); if (text !== undefined) el.textContent = text;
    if (className) el.className = className; return el;
  }
  function button(text, className, fn) { const b = node('button',text,className); b.type='button'; b.addEventListener('click',fn); return b; }
  function setView(target, focus) {
    view = target;
    ['depenses','changements','pistes'].forEach(id => { $(id).hidden = target !== id; });
    document.querySelectorAll('[data-view]').forEach(b => { if(b.dataset.view===target)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current'); });
    if (focus) {const h = $(target).querySelector('h2');h.tabIndex=-1;h.focus();}
  }
  function announce(message) { $('status').textContent = message; }
  function render() {
    const confirmed = rows().filter(r=>r.confirmed), awaiting = rows().filter(r=>!r.confirmed);
    const annual = confirmed.reduce((s,r)=>s+yearly(r),0), pending = awaiting.length;
    const pendingAnnual = awaiting.reduce((s,r)=>s+yearly(r),0);
    $('total-label').textContent = pending ? 'VOTRE MOIS RESTE À CONFIRMER' : 'TOTAL DES DÉPENSES RENSEIGNÉES';
    $('pending-title').hidden = !pending;
    $('pending-title').textContent = pending+' dépense'+(pending>1?'s':'')+' à confirmer';
    $('confirmed-total').hidden = pending>0 && !confirmed.length;
    $('annual').hidden = pending>0 && !confirmed.length;
    $('confirmed-total').classList.toggle('partial',!!pending);
    $('confirmed-total').querySelector('span').textContent = pending ? '/ mois confirmés · total partiel' : '/ mois en moyenne';
    $('pending-amount').hidden = !pending;
    $('pending-amount').textContent = 'Encore à confirmer : '+euro(Math.round(pendingAnnual/12))+' / mois en moyenne, repris de septembre.';
    $('review').hidden = !pending;
    $('add').className = pending ? 'text-action' : 'primary';
    $('total').textContent = euro(Math.round(annual/12));
    $('annual').textContent = euro(annual) + (pending ? ' / an pour les seuls montants confirmés' : ' / an si ces montants se maintiennent');
    $('confirmation').textContent = pending ? pending+' montant'+(pending>1?'s':'')+' à confirmer · projection' : rows().length+' montant'+(rows().length>1?'s':'')+' confirmé'+(rows().length>1?'s':'')+' dans l’exemple';
    $('count').textContent = rows().length+' poste'+(rows().length>1?'s':'');
    $('empty').hidden = !!rows().length;
    $('next-month').textContent = month ? 'Revoir septembre ←' : 'Essayer octobre →';
    $('next-title').textContent = pending ? 'Qu’est-ce qui a changé ?' : 'Une piste pour avancer.';
    $('next-text').textContent = pending ? 'Gardez la main : confirmez ou corrigez un montant avant de vous y fier.' : 'Choisissez une démarche adaptée aux dépenses de cet exemple.';
    $('next-action').textContent = pending ? 'Confirmer un montant →' : 'Voir mes pistes →';
    $('intro').textContent = month ? 'Le mois suivant, sans tout recommencer.' : 'Une vue d’ensemble. Une prochaine action.';
    $('expenses').replaceChildren();
    rows().forEach(r => {
      const line = node('article',undefined,'expense');line.dataset.id=r.id;
      const symbol=node('span',symbols[r.category],'expense-symbol');symbol.setAttribute('aria-hidden','true');
      const copy=node('div');copy.append(node('h3',labels[r.category]),node('p',r.confirmed?'Confirmé dans l’exemple':'Repris · à confirmer'));
      const value=button('', 'value',()=>openEditor(r.id));value.append(node('span',euro(r.amount)),node('small',(r.frequency==='annuelle'?'par an':'par mois')+' · modifier'));value.setAttribute('aria-label','Modifier '+labels[r.category]+' : '+euro(r.amount));
      const del=button('', 'icon',()=>{
        months[month]=rows().filter(x=>x.id!==r.id);render();
        $('add').focus();announce(labels[r.category]+' supprimé de '+(month?'octobre':'septembre')+'.');
      });
      del.setAttribute('aria-label','Supprimer '+labels[r.category]);
      del.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/></svg>';
      line.append(symbol,copy,value,del);$('expenses').append(line);
    });
    renderChanges();renderIdeas();setView(view,false);
  }
  function startReview() {
    reviewQueue = rows().filter(r=>!r.confirmed).map(r=>r.id); reviewIndex=0;
    if(reviewQueue.length)openEditor(reviewQueue[0],true);
  }
  function advanceReview() {
    reviewIndex++;
    if(reviewIndex<reviewQueue.length)openEditor(reviewQueue[reviewIndex],true);
    else {reviewQueue=null;$('editor').close();render();setView('depenses',false);$('contenu').focus();announce('Parcours terminé. Les dépenses passées restent à confirmer.');}
  }
  function openEditor(id, guided=false) {
    if(!guided)reviewQueue=null;
    $('review-progress').hidden=!guided;
    $('review-progress').textContent=guided?'Dépense '+(reviewIndex+1)+' sur '+reviewQueue.length:'';
    $('skip-expense').hidden=!guided;
    editing = id;
    const r = rows().find(x=>x.id===id);
    $('expense-form').reset();$('error').textContent='';
    $('edit-title').textContent=r?(guided?labels[r.category]:'Confirmer ou modifier'):'Ajouter une dépense';
    $('save').textContent=r?'Confirmer ce montant':'Ajouter à mon exemple';
    $('category').disabled=!!r;
    $('category').hidden=guided;
    document.querySelector('label[for=category]').hidden=guided;
    $('category').value=r?r.category:'mobile';
    $('amount').value=r?String(r.amount/100).replace('.',','):'';
    $('frequency').value=r?r.frequency:'mensuelle';
    $('reason-wrap').hidden=!(r&&month===1);
    $('reason').value=r?r.reason:'unknown';
    preview();if(!$('editor').open)$('editor').showModal();if(guided)$('save').focus();else $('amount').focus();
  }
  function preview() {
    const v=parse($('amount').value);
    const original=rows().find(r=>r.id===editing);
    $('reason-wrap').hidden=!(original&&month===1&&(v!==original.amount||$('frequency').value!==original.frequency));
    $('preview').textContent=v===null?'Le coût s’affiche dès la saisie.':euro(Math.round(v*($('frequency').value==='annuelle'?1:12)/12))+' / mois en moyenne';
  }
  function renderChanges() {
    const area=$('changes');area.replaceChildren();
    if(!month){area.append(node('p','Essayez octobre pour comparer vos montants avec septembre.','card'),button('Passer à octobre →','primary',()=>changeMonth(1)));return;}
    const pending=rows().filter(r=>!r.confirmed);
    if(pending.length) {
      const c=node('article',undefined,'card');c.append(node('span','À CONFIRMER','chip'),node('h3',pending.length+' montant'+(pending.length>1?'s repris':' repris')),node('p','Ces montants viennent de septembre. Ils ne sont pas encore confirmés pour octobre.'),button('Vérifier le prochain montant →','text-action',()=>openEditor(pending[0].id)));area.append(c);
    }
    let changes=0;
    rows().filter(r=>r.confirmed).forEach(r=>{
      const old=months[0].find(x=>x.id===r.id);
      if(old&&old.amount===r.amount&&old.frequency===r.frequency)return;
      changes++;
      const card=node('article',undefined,'card');card.append(node('span',old?'MONTANT MODIFIÉ':'POSTE AJOUTÉ','chip'),node('h3',labels[r.category]));
      if(old){const diff=monthly(r)-monthly(old);card.append(node('p',euro(monthly(old))+' → '+euro(monthly(r))+' / mois en moyenne ('+(diff>0?'+':'')+euro(diff)+').'),node('p',reasons[r.reason]+'. Aucune économie ni hausse de tarif déduite de cet écart.'));}
      else card.append(node('p','Nouveau montant : '+euro(monthly(r))+' / mois en moyenne. Ce n’est pas une hausse d’un contrat existant.'));
      card.append(button('Revoir ce montant','text-action',()=>openEditor(r.id)));area.append(card);
    });
    months[0].filter(old=>!rows().some(r=>r.id===old.id)).forEach(old=>{changes++;const c=node('article',undefined,'card');c.append(node('h3',labels[old.category]+' retiré de la liste'),node('p','Ce retrait ne confirme ni une résiliation ni une économie.'));area.append(c);});
    if(!changes)area.append(node('p',pending.length?'Aucun changement confirmé pour le moment.':'Aucun écart sur les montants confirmés.','card'));
  }
  const guidance = {
    energie:{title:'Comprendre votre facture d’énergie',text:'Retrouvez votre consommation en kWh avant de comparer.',steps:['Sur la facture, cherchez la période de consommation et le total en kWh, pas seulement l’échéancier en euros.','Pour l’électricité, relevez aussi la puissance et l’option tarifaire. Pour le gaz, relevez l’usage et la consommation annuelle.','Une régularisation ou un hiver plus froid peuvent modifier une facture sans changement du tarif.'],link:'https://comparateur-offres.energie-info.fr/compte/profil?profil=particulier',action:'Comparer sur Énergie-Info ↗',external:true},
    assurance:{title:'Comparer ce qui vous protège',text:'Rassemblez garanties et franchises avant de regarder le prix.',steps:['Retrouvez les garanties, franchises et exclusions de votre assurance.','Notez ce qui compte pour vous et les protections déjà incluses ailleurs.','La maquette ne compare pas de contrats d’assurance et ne conclut pas qu’une garantie est inutile.']},
    abonnements:{title:'Faire le tri dans vos abonnements',text:'Commencez par celui que vous utilisez le moins.',steps:['Repérez votre dernier usage, la formule actuelle et son coût.','Vérifiez ce qu’une formule différente retire et les conditions pour changer.','Aucune résiliation n’est lancée ici.']},
    logement:{title:'Voir le coût du logement en entier',text:'Rassemblez loyer, charges et trajets avant d’envisager un changement.',steps:['Distinguez le loyer ou le crédit des charges et de l’énergie déjà renseignée.','Si vous comparez des logements, regardez aussi les trajets et les frais de déménagement.','Aucun quartier moins cher n’est identifié par cette maquette.']},
    transport:{title:'Partir de vos trajets habituels',text:'Listez vos trajets avant de choisir une autre solution.',steps:['Notez les distances et le nombre de trajets dans une semaine type.','Pour la voiture, comptez aussi stationnement, assurance et entretien sans les compter deux fois.','Comparez ensuite les options disponibles sur ces trajets : transports publics, vélo ou covoiturage. Aucun tarif n’est vérifié ici.']},
    courses:{title:'Comprendre vos achats courants',text:'Séparez les achats habituels des dépenses exceptionnelles.',steps:['Comparez des périodes de même durée.','Repérez les achats récurrents et les achats ponctuels.','Un panier moins élevé peut venir de quantités différentes : ce n’est pas forcément une baisse des prix.']},
    autre:{title:'Préciser cette dépense',text:'Identifiez ce qu’elle couvre pour savoir quoi vérifier.',steps:['Retrouvez le libellé et la période concernés.','Distinguez une dépense ponctuelle d’une dépense récurrente.','Une dépense n’est pas nécessairement un contrat résiliable.']}
  };
  function renderIdeas() {
    const area=$('ideas');area.replaceChildren();
    const categories=[...new Set(rows().map(r=>r.category))];
    const order=month?['energie','mobile','box','assurance','abonnements','logement','transport','courses','autre']:['mobile','energie','box','assurance','abonnements','logement','transport','courses','autre'];
    const selected=order.filter(c=>categories.includes(c)&&!dismissed.has(c)).slice(0,2);
    selected.forEach(c=>{
      const card=node('article',undefined,'card');card.append(node('span',labels[c]+' · suggestion à partir de l’exemple','chip'));
      const title=c==='mobile'?'Votre forfait correspond-il à votre usage ?':c==='box'?'Examiner le coût de votre box':guidance[c].title;
      const text=c==='mobile'?'Comparez les données nécessaires et les conditions, avant le prix.':c==='box'?'Éligibilité, frais et éventuelle remise mobile restent à vérifier.':guidance[c].text;
      card.append(node('h3',title),node('p',text));
      const actions=node('div',undefined,'actions');
      actions.append(button(c==='mobile'||c==='box'?'Préparer ma comparaison →':'Voir comment faire →','primary',()=>openGuide(c)),button('Pas maintenant','text-action',()=>{dismissed.add(c);renderIdeas();$('ideas-title').focus();announce('Piste mise de côté pour cette démonstration.');}));card.append(actions);area.append(card);
    });
    if(!selected.length)area.append(node('p',categories.length?'Vous avez mis ces pistes de côté. Aucune relance.':'Ajoutez une dépense pour découvrir une démarche adaptée.','card'));
    $('restore').hidden=!dismissed.size;
  }
  function openGuide(category) {
    let info=guidance[category];
    if(category==='mobile')info={title:'Avant de comparer votre mobile',steps:['Dans votre espace client, relevez les données que vous utilisez et votre situation d’engagement.','Si vous avez une remise liée à une box, vérifiez ce qu’elle devient en cas de changement.','Le comparateur existant s’ouvre sans les montants fictifs de cette maquette. Les frais de sortie et la couverture restent à vérifier.'],link:'comparer-mobile.html',action:'Ouvrir le comparateur mobile ↗'};
    if(category==='box')info={title:'Avant de comparer votre box',steps:['Préparez le prix hors options, la fin de promotion et la situation d’engagement.','Vérifiez la remise éventuelle sur votre mobile et l’éligibilité à votre adresse.','Le comparateur existant s’ouvre sans les montants fictifs. Les offres doivent être vérifiées à la date de votre recherche.'],link:'comparer-box.html',action:'Ouvrir le comparateur box ↗'};
    $('guide-title').textContent=info.title;const content=$('guide-content');content.replaceChildren();
    const list=node('ol');info.steps.forEach(s=>list.append(node('li',s)));content.append(list);
    if(info.link){const a=node('a',info.action,'text-action');a.href=info.link;a.target='_blank';a.rel='noopener';content.append(a,node('p',info.external?'Site du médiateur national de l’énergie · nouvel onglet. Préparez votre consommation : aucun montant de la maquette n’est transmis.':'Nouvel onglet · le comparateur est distinct de cette démonstration.','small'));}
    $('guide').showModal();
  }
  $('expense-form').addEventListener('submit',e=>{
    e.preventDefault();const amount=parse($('amount').value);
    if(amount===null){$('error').textContent='Saisissez un montant positif ou nul, avec deux décimales maximum.';return;}
    const category=$('category').value;if(!Object.prototype.hasOwnProperty.call(labels,category))return;
    const old=rows().find(r=>r.id===editing);
    const r={id:old?old.id:nextId++,category,amount,frequency:$('frequency').value,confirmed:true,reason:$('reason').value};
    if(old)months[month]=rows().map(x=>x.id===editing?r:x);else rows().push(r);
    if(reviewQueue){render();advanceReview();return;}
    $('editor').close();render();$('add').focus();announce('Montant confirmé dans l’exemple. Total mis à jour.');
  });
  $('review').addEventListener('click',startReview);
  $('skip-expense').addEventListener('click',advanceReview);
  $('add').addEventListener('click',()=>openEditor(null));
  $('close').addEventListener('click',()=>$('editor').close());
  $('guide-close').addEventListener('click',()=>$('guide').close());$('guide-done').addEventListener('click',()=>$('guide').close());
  $('amount').addEventListener('input',preview);$('frequency').addEventListener('change',preview);
  $('month').addEventListener('change',()=>changeMonth(Number($('month').value)));
  $('next-month').addEventListener('click',()=>{changeMonth(month?0:1);$('contenu').focus();});
  $('next-action').addEventListener('click',()=>{const pending=rows().find(r=>!r.confirmed);if(pending)startReview();else setView('pistes',true);});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view,true)));
  $('restore').addEventListener('click',()=>{dismissed.clear();renderIdeas();$('ideas-title').focus();});
  $('reset').addEventListener('click',()=>{seed();$('month').value='0';render();$('contenu').focus();announce('Exemple réinitialisé.');});
  seed();render();
})();
