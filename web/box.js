/* Relevé manuel du 26/09/2026. Pas de collecte automatique ni de classement.
   Retirer active ou modifier fin pour désactiver. Les prix ne sont jamais
   qualifiés de vérifiés au présent. Frais inconnus : null, jamais zéro. */
const OFFRES_BOX = [
 {nom:'B&YOU Pure fibre',prix:2499,entree:null,sortie:null,tv:false,fixe:false,fin:'2026-09-26',date:'2026-09-26',active:true,url:'https://www.bouyguestelecom.fr/offres-internet',condition:'Fibre, sans engagement. Ni télévision ni appels fixes inclus. Conditions de souscription et frais à confirmer pour cette offre exacte.'},
 {nom:'Sosh La Boîte Fibre',prix:2499,entree:3900,sortie:6900,tv:true,fixe:true,optionTV:500,fin:'2026-10-07',date:'2026-09-26',active:true,url:'https://shop.sosh.fr/box-internet',condition:'Nouveaux clients ; migrations Orange, Open et Série Spéciale exclues. Sans engagement. Décodeur TV en option à 5 €/mois ; appels vers fixes inclus, mobiles en supplément.'},
 {nom:'Sosh Boost Fibre',prix:2899,entree:3900,sortie:6900,tv:false,fixe:false,fin:'2026-10-07',date:'2026-09-26',active:true,url:'https://shop.sosh.fr/box-internet',condition:'Nouveaux clients, éligibilité XGS-PON à confirmer. Sans engagement. Télévision non incluse, options décodeur Orange indisponibles ; appels facturés à l’usage.'}
];
function coutBox(offre,mois,tv){
 const recurrent=(offre.prix+(tv&&offre.optionTV||0))*mois;
 return {recurrent,total:offre.entree===null?null:recurrent+offre.entree};
}
function offresBoxPour(besoin,date){return OFFRES_BOX.filter(o=>o.active&&date<=o.fin&&!(besoin==='tv'&&!o.tv)&&!(besoin==='fixe'&&!o.fixe));}
