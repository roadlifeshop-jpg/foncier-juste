'use strict';
const bx=id=>document.getElementById(id);
let etapeBox=0;
function montrerBox(n){etapeBox=n;document.querySelectorAll('[data-etape]').forEach(s=>s.hidden=Number(s.dataset.etape)!==n);bx('box-form').hidden=false;bx('resultat-box').hidden=true;bx('titre').focus();}
try{const brut=JSON.parse(localStorage.getItem('dj_bilan_v1')||'[]');const box=boxDuBilan(brut);if(box){bx('prix').value=(mensuelCentimes(box.montant,box.periodicite)/100).toFixed(2);bx('repris').textContent='Montant repris du bilan, modifiable ici sans modifier votre bilan.';}}catch(_){}
bx('suite').onclick=()=>{const c=enCentimes(bx('prix').value);if(bx('prix').value.trim()&&(c===null||c<=0)){bx('erreur').textContent='Indiquez un montant positif ou laissez vide si vous ne savez pas.';bx('prix').focus();return;}bx('erreur').textContent='';montrerBox(1);};
bx('retour').onclick=()=>montrerBox(0);bx('modifier').onclick=()=>montrerBox(0);
function paragraphe(parent,texte,classe){const p=document.createElement('p');p.textContent=texte;if(classe)p.className=classe;parent.append(p);}
bx('box-form').onsubmit=ev=>{
 ev.preventDefault();if(etapeBox===0){bx('suite').click();return;}
 const prix=enCentimes(bx('prix').value);const besoin=bx('besoin').value;
 bx('synthese').replaceChildren();bx('offres').replaceChildren();
 paragraphe(bx('synthese'),prix===null?'Coût actuel inconnu.':`Votre box : ${euros(prix)} par mois, soit ${euros(prix*12)} sur 12 mois à tarif inchangé.`);
 let action=bx('engagement').value==='non'?'Demandez le montant exact des frais de fermeture de votre box actuelle.':'Retrouvez la date de fin d’engagement et demandez votre coût de sortie à l’opérateur.';
 if(bx('remise').value!=='non')action+=' Vérifiez aussi le prix de votre mobile si vous quittez cette box : sa remise peut disparaître.';
 paragraphe(bx('synthese'),'Votre prochaine action : '+action,'reserve');
 if(besoin==='inconnu')paragraphe(bx('synthese'),'Précisez si vous utilisez un décodeur TV ou les appels fixes avant de choisir. Les pistes ci-dessous ne sont pas déclarées équivalentes à votre contrat.');
 const date=new Date().toLocaleDateString('sv-SE');const offres=offresBoxPour(besoin,date);
 if(!offres.length)paragraphe(bx('offres'),'Aucune offre de ce relevé ne peut être présentée actuellement pour ce besoin. Consultez les conditions officielles ou revenez après actualisation.');
 offres.forEach(o=>{
 const art=document.createElement('article');const h=document.createElement('h3');h.textContent=o.nom;art.append(h);
 const tv=besoin==='tv';const a=coutBox(o,12,tv),b=coutBox(o,24,tv);
 paragraphe(art,`${euros(o.prix+(tv&&o.optionTV||0))} / mois${tv?' avec option décodeur':''}. Aucun changement programmé de prix relevé.`);
 paragraphe(art,`Mensualités : ${euros(a.recurrent)} sur 12 mois · ${euros(b.recurrent)} sur 24 mois.`,'box-cout');
 paragraphe(art,a.total===null?'Coût total inconnu : frais de souscription non confirmés.':`Coût connu avec souscription : ${euros(a.total)} sur 12 mois · ${euros(b.total)} sur 24 mois, hors sortie actuelle et options supplémentaires.`);
 paragraphe(art,`Souscription : ${o.entree===null?'à confirmer':euros(o.entree)}. Résiliation future de cette nouvelle offre : ${o.sortie===null?'à confirmer':euros(o.sortie)}, non incluse dans ces projections.`);
 paragraphe(art,o.condition);
 paragraphe(art,'Économie à confirmer : éligibilité à votre adresse, accès à l’offre, frais de sortie actuels et éventuelle perte de remise mobile non établis.');
 const aLien=document.createElement('a');aLien.href=o.url;aLien.target='_blank';aLien.rel='noopener noreferrer';aLien.textContent='Vérifier le prix et mon éligibilité — site de l’opérateur';art.append(aLien);
 paragraphe(art,`Prix relevé le ${o.date}. À revérifier ; aucune disponibilité garantie.`);bx('offres').append(art);
 });
 bx('box-form').hidden=true;bx('resultat-box').hidden=false;bx('resultat-box').focus();
};
