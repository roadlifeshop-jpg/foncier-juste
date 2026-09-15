"""
Foncier Juste — construction du jeu de données national (réel, public, DVF).

Télécharge les fichiers DVF officiels (data.gouv.fr / Etalab, export geo-dvf),
les filtre, et produit :

  - data/dvf_<departement>_<annee>.csv   : transactions brutes filtrées,
    conservées pour le moteur Python (rapport payant, précision maximale).
  - web/market_stats.json                : statistiques agrégées par commune,
    type de bien et tranche de surface (20 m²) — compact, envoyé au
    navigateur pour le pré-diagnostic gratuit. Pas de données personnelles :
    uniquement des agrégats (médiane, échantillon).
  - web/communes.json                    : liste des communes couvertes, pour
    l'auto-complétion du formulaire.

Relancer ce script avec une autre liste de départements = couverture élargie,
sans changer une ligne du moteur de diagnostic ni du site.
"""

from __future__ import annotations

import csv
import gzip
import io
import json
import statistics
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
WEB_DIR = ROOT / "web"

ANNEE = "2024"  # année la plus récente complète disponible au moment du script

# Départements couverts par cette extraction — grandes métropoles réparties
# sur le territoire, pour dépasser la bêta initiale limitée à Nantes.
#
# NB : le Bas-Rhin (67), le Haut-Rhin (68) et la Moselle (57) sont exclus
# volontairement : l'Alsace-Moselle utilise le Livre Foncier, un régime de
# publicité foncière local différent du reste de la France, et n'est donc
# pas couvert par les fichiers DVF standards (confirmé par un 404 systématique
# sur plusieurs années lors de la construction de ce jeu de données).
DEPARTEMENTS = {
    "44": "Loire-Atlantique (Nantes)",
    "75": "Paris",
    "69": "Rhône (Lyon)",
    "13": "Bouches-du-Rhône (Marseille)",
    "33": "Gironde (Bordeaux)",
    "31": "Haute-Garonne (Toulouse)",
    "59": "Nord (Lille)",
    "35": "Ille-et-Vilaine (Rennes)",
    "34": "Hérault (Montpellier)",
    "76": "Seine-Maritime (Rouen, Le Havre)",
    # Ajout : 10 villes supplémentaires de plus de 120 000 habitants (INSEE)
    "06": "Alpes-Maritimes (Nice)",
    "51": "Marne (Reims)",
    "42": "Loire (Saint-Étienne)",
    "83": "Var (Toulon)",
    "38": "Isère (Grenoble)",
    "21": "Côte-d'Or (Dijon)",
    "49": "Maine-et-Loire (Angers)",
    "30": "Gard (Nîmes)",
    "63": "Puy-de-Dôme (Clermont-Ferrand)",
    "72": "Sarthe (Le Mans)",
}

SURFACE_BUCKET_SIZE = 20  # m² — granularité des tranches de surface agrégées


def telecharger_departement(code_dept: str, annee: str) -> list[dict]:
    """Télécharge un département ; retombe sur l'année précédente si le
    fichier demandé n'existe pas encore (publication DVF parfois décalée
    selon les départements)."""
    for tentative_annee in (annee, str(int(annee) - 1)):
        url = f"https://files.data.gouv.fr/geo-dvf/latest/csv/{tentative_annee}/departements/{code_dept}.csv.gz"
        print(f"  téléchargement {url}")
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                raw = resp.read()
            break
        except urllib.error.HTTPError as e:
            print(f"  ⚠️  {e} pour {tentative_annee}, tentative année précédente" if tentative_annee == annee else f"  ⚠️  {e}, abandon pour ce département")
    else:
        return []
    text = gzip.decompress(raw).decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    rows = []
    for row in reader:
        if row["type_local"] not in ("Appartement", "Maison"):
            continue
        try:
            surface = float(row["surface_reelle_bati"] or 0)
            valeur = float(row["valeur_fonciere"] or 0)
        except ValueError:
            continue
        if surface <= 8 or surface > 400:
            continue
        if valeur <= 5000 or valeur > 3_000_000:
            continue
        rows.append({
            "commune": row["nom_commune"],
            "code_commune": row["code_commune"],
            "code_postal": row["code_postal"],
            "type_local": row["type_local"],
            "surface_m2": surface,
            "valeur_fonciere": valeur,
            "prix_m2": round(valeur / surface, 2),
            "date_mutation": row["date_mutation"],
        })
    return rows


def ecrire_csv_brut(code_dept: str, annee: str, rows: list[dict]) -> Path:
    out = DATA_DIR / f"dvf_{code_dept}_{annee}.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys())
        w.writeheader()
        w.writerows(rows)
    return out


def bucket_surface(surface: float) -> int:
    return int(surface // SURFACE_BUCKET_SIZE) * SURFACE_BUCKET_SIZE


def construire_agregats(lignes_dept: list[dict], code_dept: str) -> tuple[list[dict], list[dict]]:
    """Agrège les transactions d'UN département. Retourne (stats, communes)."""
    groupes: dict[tuple, list[dict]] = defaultdict(list)
    communes_vues: dict[str, dict] = {}

    for r in lignes_dept:
        cle = (r["code_commune"], r["type_local"], bucket_surface(r["surface_m2"]))
        groupes[cle].append(r)
        communes_vues.setdefault(r["code_commune"], {
            "code_commune": r["code_commune"],
            "commune": r["commune"],
            "code_postal": r["code_postal"],
            "code_dept": code_dept,
        })

    stats = []
    for (code_commune, type_local, bucket), lignes in groupes.items():
        prix = sorted(l["prix_m2"] for l in lignes)
        n = len(prix)
        echantillon = [
            {"surface_m2": l["surface_m2"], "prix_m2": l["prix_m2"]}
            for l in sorted(lignes, key=lambda x: x["surface_m2"])[:12]
        ]
        stats.append({
            "code_commune": code_commune,
            "type_local": type_local,
            "surface_bucket_min": bucket,
            "surface_bucket_max": bucket + SURFACE_BUCKET_SIZE,
            "n": n,
            "prix_m2_median": round(statistics.median(prix), 2),
            "prix_m2_p10": round(prix[max(0, int(n * 0.1) - 1)], 2),
            "prix_m2_p90": round(prix[min(n - 1, int(n * 0.9))], 2),
            "echantillon": echantillon,
        })

    communes = sorted(communes_vues.values(), key=lambda c: (c["code_postal"], c["commune"]))
    return stats, communes


def main():
    DATA_DIR.mkdir(exist_ok=True)
    stats_dir = WEB_DIR / "market_stats"
    stats_dir.mkdir(exist_ok=True)

    toutes_les_communes = []
    total_transactions = 0
    total_groupes = 0

    for code_dept, label in DEPARTEMENTS.items():
        print(f"[{code_dept}] {label}")
        rows = telecharger_departement(code_dept, ANNEE)
        if not rows:
            print(f"  ⚠️  0 ligne exploitable pour {code_dept}, ignoré")
            continue
        path = ecrire_csv_brut(code_dept, ANNEE, rows)
        print(f"  {len(rows)} transactions réelles -> {path.relative_to(ROOT)}")
        total_transactions += len(rows)

        # Un fichier de stats agrégées PAR DÉPARTEMENT : le navigateur ne
        # télécharge que celui du département choisi par l'utilisateur, pas
        # la France entière à chaque visite.
        stats, communes = construire_agregats(rows, code_dept)
        dept_path = stats_dir / f"{code_dept}.json"
        with open(dept_path, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, separators=(",", ":"))
        size_kb = dept_path.stat().st_size / 1024
        print(f"  {len(stats)} groupes agrégés -> {dept_path.relative_to(ROOT)} ({size_kb:.0f} Ko)")

        toutes_les_communes.extend(communes)
        total_groupes += len(stats)

    with open(WEB_DIR / "communes.json", "w", encoding="utf-8") as f:
        json.dump(
            sorted(toutes_les_communes, key=lambda c: (c["code_postal"], c["commune"])),
            f, ensure_ascii=False, separators=(",", ":"),
        )
    communes_kb = (WEB_DIR / "communes.json").stat().st_size / 1024

    print(f"\nTotal : {total_transactions} transactions réelles, {total_groupes} groupes agrégés, "
          f"{len(toutes_les_communes)} communes (communes.json : {communes_kb:.0f} Ko)")


if __name__ == "__main__":
    main()
