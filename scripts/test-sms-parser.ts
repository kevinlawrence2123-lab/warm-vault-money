/**
 * Tests du lecteur de SMS sur de vrais messages (Togo : Ecobank, Moov Money, Mixx/T-Money)
 * et sur des formats d'autres opérateurs.
 *
 *   npx tsx scripts/test-sms-parser.ts
 *
 * Ajoutez ici tout nouveau SMS mal lu : c'est la meilleure façon d'améliorer le lecteur
 * sans casser ce qui marche déjà.
 */
import { parseNotification } from "../src/lib/detection-parse";

type Want = null | {
  type: "expense" | "income";
  amount: number;
  fee?: number;
  balance?: number | null;
  date?: string | null;
  provider?: string | null;
  merchant?: string | null;
};

const CASES: { sender?: string; text: string; want: Want }[] = [
  // ---------- Ecobank Togo (expéditeur « ECOBANK ») ----------
  {
    sender: "ECOBANK",
    text: "XOF 2,000.00 Débit du ac XX106001 REF:M69CAVO263200OES RETRAIT ATM-ATM - Agence Nukafu Nukafu TG on 15-NOV-26. Votre solde disponible est XOF 9.00. Gardez votre mot de passe et votre code PIN confidentiels.",
    want: { type: "expense", amount: 2000, balance: 9, date: "2026-11-15", provider: "Ecobank" },
  },
  {
    sender: "ECOBANK",
    text: "XOF 20,000.00 Crédit au ac XX106001 REF:M63jacr263200003 REF:TG1561976266 B/O KOUAWO ACHILLE C A Allocation et r??vision de la moto on 16-NOV-26. Votre solde disponible est XOF 20,009.00. Gardez votre mot de passe et votre code PIN confidentiels.",
    want: { type: "income", amount: 20000, balance: 20009, date: "2026-11-16", provider: "Ecobank" },
  },
  {
    sender: "ECOBANK",
    text: "XOF 15,000.00 Dbit du ac XX106001 REFM61CAVO2632003HG RETRAIT ATM-TOTAL GALERIE TOUNTO Lome TG on 16-NOV-26. Votre solde disponible est XOF 5,009.00. Gardez votre mot de passe et votre code PIN confidentiels.",
    want: { type: "expense", amount: 15000, balance: 5009, date: "2026-11-16", provider: "Ecobank" },
  },
  // ---------- Moov Money Togo (expéditeur « MoovMoney ») ----------
  {
    sender: "MoovMoney",
    text: "Transfert recu.\nMontant: 5 000,00 FCFA\nExpéditeur: 22897653865\nDate: 21/09/2026 19:58:44.\nNouveau solde Moov Money: 5 096,87 FCFA.\nTxn ID: 040886159476\n\nMoov Money évolue ! Nouvelle appli dispo sur IOS et Android via le lien https://onelink.to/ekyjcw",
    want: { type: "income", amount: 5000, balance: 5096.87, date: "2026-09-21", provider: "Moov Money", merchant: "22897653865" },
  },
  {
    sender: "MoovMoney",
    text: "Votre transaction est en cours de traitement. Merci de patienter quelques instants.\nDate: 2026-09-21 20:13:29\nTxn id: 040886202983",
    want: null,
  },
  {
    sender: "MoovMoney",
    text: "Transfert vers  reussi.\nMontant: 4 800,00 FCFA\nNumero du destinataire: \n\nFrais: 0,00 FCFA\nDate: 21/09/2026 20:13:29\nNouveau solde Moov Money: 279,96 FCFA\nTxn ID: 040886202983",
    want: { type: "expense", amount: 4800, fee: 0, balance: 279.96, date: "2026-09-21", provider: "Moov Money" },
  },
  {
    sender: "MoovMoney",
    text: "Félicitations! Vous avez gagné 20 points de fidélité grâce à votre opération. Vous avez au total 20 points, gagnez en plus sur tous vos opérations Moov Money.",
    want: null,
  },
  {
    sender: "MoovMoney",
    text: "BIG CHILL c est aujourd hui! Les tickets sont toujours en prevente a 4000 jusqu a 17h! prends vite le tien via l application MoovMoney.SoyiMavo.Stop*801#.",
    want: null,
  },
  // ---------- Mixx (ex T-Money) Togo (expéditeur « Mixx Togo ») ----------
  {
    sender: "Mixx Togo",
    text: "Dépôt de 4 000 FCFA chez l'agent 38855(ETS ASSIKOUYO), le 14-11-26 13:34. Frais: 0 FCFA. Nouveau solde Mixx : 4 002 FCFA . Ref: 20615235084. Tente de gagner une voiture en cumulant un max de points sur l'app Mixx : http://bit.ly/mixxapp",
    want: { type: "income", amount: 4000, balance: 4002, date: "2026-11-14", provider: "Mixx", merchant: "ETS ASSIKOUYO" },
  },
  {
    sender: "Mixx Togo",
    text: "Envoi de 2 000 FCFA au 91424009(KOSSIWA), 14-11-26 14:10. Frais: 0 FCFA. Nouveau solde Mixx: 2 002 FCFA. Ref: 20615845330. Tente de gagner une voiture en cumulant un max de points sur l'app Mixx : http://bit.ly/mixxapp",
    want: { type: "expense", amount: 2000, balance: 2002, date: "2026-11-14", provider: "Mixx", merchant: "KOSSIWA" },
  },
  {
    sender: "Mixx Togo",
    text: "Vous avez retire 1 900 FCFA auprès de l'agent 31995(PSDTT ETS GROUPE LAUGANE), le 14-11-26 14:17. Fees: 100 FCFA. Frais remboursés: 0 FCFA. Nouveau solde: 2 FCFA . Ref: 20615977437. Tente de gagner une voiture en cumulant un max de points sur l'app Mixx : http://bit.ly/mixxapp",
    want: { type: "expense", amount: 1900, fee: 100, balance: 2, date: "2026-11-14", provider: "Mixx", merchant: "PSDTT ETS GROUPE LAUGANE" },
  },
  // ---------- Autres opérateurs ----------
  {
    text: "NITA: Vous avez recu 25 000 FCFA de MOUSSA ALI le 12/11/2026. Frais: 0F. Nouveau solde: 87 500 FCFA.",
    want: { type: "income", amount: 25000, balance: 87500, date: "2026-11-12", provider: "Nita", merchant: "MOUSSA ALI" },
  },
  {
    text: "AMANA Transfert de 10.000F vers 90123456 reussi. Frais 150F. Solde 42.350F. Ref 7781",
    want: { type: "expense", amount: 10000, fee: 150, balance: 42350, provider: "Amana" },
  },
  {
    text: "Ecobank: Votre compte 0123 a ete debite de 125 000 XOF le 03/11/2026. Libelle: LOYER NOVEMBRE. Solde disponible: 310 000 XOF",
    want: { type: "expense", amount: 125000, balance: 310000, date: "2026-11-03", merchant: "LOYER NOVEMBRE" },
  },
  { text: "Votre code de verification est 482913.", want: null },
  {
    text: "Airtel Money: Paiement de 3 500 F a NIGELEC reussi. Nouveau solde 8 200 F",
    want: { type: "expense", amount: 3500, balance: 8200, merchant: "NIGELEC" },
  },
  {
    text: "Wave: AMINA vous a envoye 5.000F. Nouveau solde: 9.000F",
    want: { type: "income", amount: 5000, balance: 9000, merchant: "AMINA" },
  },
  {
    text: "Moov Money: Vous avez envoye 2 000 FCFA a 96555444. Frais 50 FCFA.",
    want: { type: "expense", amount: 2000, fee: 50, merchant: "96555444" },
  },
];

let failures = 0;
for (const [i, c] of CASES.entries()) {
  const got = parseNotification(c.text, c.sender);
  const problems: string[] = [];
  if (c.want === null) {
    if (got) problems.push(`devrait être ignoré, lu comme ${got.type} ${got.amount}`);
  } else if (!got) {
    problems.push("non reconnu");
  } else {
    for (const [k, v] of Object.entries(c.want) as [keyof typeof got, unknown][]) {
      if (got[k] !== v) problems.push(`${String(k)}: attendu ${JSON.stringify(v)}, obtenu ${JSON.stringify(got[k])}`);
    }
  }
  const label = `${String(i + 1).padStart(2)} ${c.sender ?? ""} ${c.text.slice(0, 50).replace(/\n/g, " ")}…`;
  if (problems.length) {
    failures++;
    console.log(`✗ ${label}\n    ${problems.join("\n    ")}`);
  } else {
    console.log(`✓ ${label}`);
  }
}
console.log(`\n${CASES.length - failures}/${CASES.length} SMS lus correctement`);
if (failures) process.exit(1);
