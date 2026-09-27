'use strict';
const bx=id=>document.getElementById(id);
let etapeBox=0;
function montrerBox(n){etapeBox=n;document.querySelectorAll('[data-etape]').forEach(s=>s.hidden=Number(s.dataset.etape)!==n);bx('box-form').hidden=false;bx('resultat-box').hidden=true;bx('titre').focus();}
try{const brut=JSON.parse(localStorage.getItem('dj_bilan_v1')||'[]');const box=boxDuBilan(brut);if(box){bx('prix').value=(mensuelCentimes(box.montant,box.periodicite)/100).toFixed(2).replace('.',',');bx('repris').textContent='Montant repris du bilan, modifiable ici sans modifier votre bilan.';}}catch(_){}
bx('suite').onclick=()=>{const c=enCentimes(bx('prix').value);if(bx('prix').value.trim()&&(c===null||c<=0)){bx('erreur').textContent='Indiquez un montant positif ou laissez vide si vous ne savez pas.';bx('prix').focus();return;}bx('erreur').textContent='';montrerBox(1);};
bx('retour').onclick=()=>montrerBox(0);bx('modifier').onclick=()=>montrerBox(0);
/* Les dates du relevé sont stockées en ISO pour être comparables ; elles ne
   doivent jamais s'afficher ainsi. Une date inattendue est rendue telle quelle
   plutôt que déformée. */
function dateFr(iso){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));return m?`${m[3]}/${m[2]}/${m[1]}`:String(iso||'');}
function paragraphe(parent,texte,classe){const p=document.createElement('p');p.textContent=texte;if(classe)p.className=classe;parent.append(p);}
bx('box-form').onsubmit=ev=>{
 ev.preventDefault();if(etapeBox===0){bx('suite').click();return;}
 const prix=enCentimes(bx('prix').value);const besoin=bx('besoin').value;
 bx('synthese').replaceChildren();bx('offres').replaceChildren();
 /* L'action passe en premier. Le résumé commençait par un rappel de ce que le
    visiteur venait de saisir, puis trois réserves : quatre paragraphes avant
    de savoir quoi faire. Essai du 27/09/2026 : « les résumés sont longs, ça
    manque d'un droit au but ». Même information, ordre inversé, moins de mots. */
 let action=bx('engagement').value==='non'?'Demandez à votre opérateur le montant exact des frais de fermeture.':'Demandez à votre opérateur votre date de fin d’engagement et votre coût de sortie.';
 if(bx('remise').value!=='non')action+=' Et le prix de votre mobile sans cette box : sa remise peut disparaître.';
 if(besoin==='inconnu')action+=' Décidez aussi s’il vous faut la TV ou les appels fixes.';
 paragraphe(bx('synthese'),'À faire : '+action,'reserve');
 paragraphe(bx('synthese'),prix===null?'Coût actuel inconnu.':`Vous payez ${euros(prix)} par mois, soit ${euros(prix*12)} sur douze mois à tarif inchangé.`);
 paragraphe(bx('synthese'),'Aucune économie n’est chiffrée ici : éligibilité, frais de sortie et remise mobile restent à vérifier.');
 const date=new Date().toLocaleDateString('sv-SE');const offres=offresBoxPour(besoin,date);
 if(!offres.length)paragraphe(bx('offres'),'Aucune offre de ce relevé ne peut être présentée actuellement pour ce besoin. Consultez les conditions officielles ou revenez après actualisation.');
 offres.forEach(o=>{
 const art=document.createElement('article');const h=document.createElement('h3');h.textContent=o.nom;art.append(h);
 const tv=besoin==='tv';const a=coutBox(o,12,tv),b=coutBox(o,24,tv);
 paragraphe(art,`${euros(o.prix+(tv&&o.optionTV||0))} / mois${tv?' avec option décodeur':''}. Aucun changement programmé de prix relevé.`);
 const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Frais, conditions et sources';details.append(summary);
 paragraphe(details,`Mensualités : ${euros(a.recurrent)} sur 12 mois · ${euros(b.recurrent)} sur 24 mois.`,'box-cout');
 paragraphe(art,a.total===null?'Coût total inconnu : frais de souscription non confirmés.':`Coût connu avec souscription : ${euros(a.total)} sur 12 mois · ${euros(b.total)} sur 24 mois, hors sortie actuelle et options supplémentaires.`);
 paragraphe(details,`Souscription : ${o.entree===null?'à confirmer':euros(o.entree)}. Résiliation future de cette nouvelle offre : ${o.sortie===null?'à confirmer':euros(o.sortie)}, non incluse dans ces projections.`);
 /* La condition tient en trois phrases dont une seule décide de l'accès. La
    première reste visible — c'est celle que l'auteur du relevé a placée en
    tête — et le reste rejoint le dépliant, qui s'intitule déjà « Frais,
    conditions et sources ». */
 const bouts=String(o.condition).split(/(?<=\.)\s+/);
 paragraphe(art,bouts[0]);
 if(bouts.length>1)paragraphe(details,bouts.slice(1).join(' '));

 const aLien=document.createElement('a');aLien.href=o.url;aLien.target='_blank';aLien.rel='noopener noreferrer';aLien.className='btn-secondary';aLien.textContent='Voir l’offre chez '+(o.nom.startsWith('Sosh')?'Sosh':'B&YOU')+' ↗';art.append(aLien);
 art.append(details);
 paragraphe(art,`Prix relevé le ${dateFr(o.date)}. À revérifier ; aucune disponibilité garantie.`);bx('offres').append(art);
 });
 bx('box-form').hidden=true;bx('resultat-box').hidden=false;bx('resultat-box').focus();
};
