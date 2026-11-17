import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setActiveLanguage } from "./format";
import { useProfile } from "./data";

export type Lang = "en" | "fr" | "es";

/** Every user-facing string in the app, keyed by dotted path. */
const en = {
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.add": "Add",
  "common.all": "All",
  "common.none": "None",
  "common.of": "of",
  "common.saved": "Saved",
  "common.couldNotSave": "Could not save",
  "common.somethingWrong": "Something went wrong",
  "common.comingSoon": "Coming soon",
  "common.connect": "Connect",
  "common.goBack": "Go back",
  "common.uncategorised": "Uncategorised",
  "common.transaction": "Transaction",
  "common.seeAll": "See all",
  "common.viewAll": "View all",
  "common.continue": "Continue",

  "nav.home": "Home",
  "nav.records": "Records",
  "nav.goals": "Goals",
  "nav.budget": "Budget",
  "nav.profile": "Profile",
  "nav.searchTransactions": "Search transactions",
  "nav.detectedTransactions": "Detected transactions",

  "landing.tagline1": "Every franc,",
  "landing.tagline2": "accounted for.",
  "landing.intro":
    "One calm place for your expenses, income, monthly budgets and savings goals — instead of scattered notes and five banking apps.",
  "landing.f1.title": "Track everything",
  "landing.f1.text": "Expenses and income across all your accounts.",
  "landing.f2.title": "Stay on budget",
  "landing.f2.text": "Monthly limits per category with clear alerts.",
  "landing.f3.title": "Reach your goals",
  "landing.f3.text": "Savings goals with progress and contributions.",
  "landing.cta": "Get started",

  "auth.welcomeBack": "Welcome back",
  "auth.createAccount": "Create account",
  "auth.subtitleLogin": "Sign in to pick up where you left off.",
  "auth.subtitleSignup": "A minute to set up, a lifetime of clarity.",
  "auth.fullName": "Full name",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.newHere": "New here?",
  "auth.createOne": "Create an account",
  "auth.haveAccount": "Already have an account?",
  "auth.checkEmail": "Check your email to confirm your account.",

  "onboarding.step": "Step {n} of 2",
  "onboarding.pickCurrency": "Pick your currency",
  "onboarding.firstGoal": "Your first savings goal",
  "onboarding.currencyHint": "All amounts across MyBudget will be shown in this currency.",
  "onboarding.goalHint": "Optional — you can always add goals later.",
  "onboarding.goalNamePlaceholder": "Goal name — e.g. Dream vacation",
  "onboarding.targetAmount": "Target amount",
  "onboarding.createFinish": "Create goal & finish",
  "onboarding.skip": "Skip for now",

  "home.title": "Dashboard",
  "home.totalBalance": "Total balance",
  "home.thisMonth": "this month",
  "home.balance": "Balance",
  "home.spentThisMonth": "Spent this month",
  "home.savedThisMonth": "Saved this month",
  "home.savingsGoals": "Savings goals",
  "home.noGoals": "No goals yet",
  "home.noGoalsDesc": "Set your first savings goal and watch it grow.",
  "home.createGoal": "Create a goal",
  "home.recentActivity": "Recent activity",
  "home.nothingYet": "Nothing recorded yet",
  "home.nothingYetDesc": "Add your first transaction to get started.",
  "home.addTransaction": "Add transaction",

  "tx.title": "Transactions",
  "tx.searchPlaceholder": "Search notes and categories",
  "tx.monthNet": "This month net",
  "tx.none": "No transactions yet",
  "tx.noneDesc": "Add your first expense or income to start tracking.",
  "tx.add": "Add transaction",
  "tx.confirmTitle": "Confirm transaction",
  "tx.prefilledHint":
    "Pre-filled from a quick-add link. Review the details, pick a category, then save.",
  "tx.edit": "Edit transaction",
  "tx.notFound": "Transaction not found",
  "tx.expense": "Expense",
  "tx.income": "Income",
  "tx.category": "Category",
  "tx.date": "Date",
  "tx.account": "Account",
  "tx.paymentMethod": "Payment method",
  "tx.notePlaceholder": "Add a note…",
  "tx.receipt": "Receipt",
  "tx.receiptAttached": "Receipt attached",
  "tx.update": "Update transaction",
  "tx.saveBtn": "Save transaction",
  "tx.delete": "Delete transaction",
  "tx.enterAmount": "Enter an amount greater than zero",
  "tx.updated": "Transaction updated",
  "tx.savedOk": "Transaction saved",

  "goals.title": "Goals",
  "goals.namePlaceholder": "Goal name",
  "goals.targetAmount": "Target amount",
  "goals.targetDate": "Target date",
  "goals.create": "Create goal",
  "goals.none": "No savings goals yet",
  "goals.noneDesc": "Create a goal and track every contribution towards it.",
  "goals.createOne": "Create a goal",
  "goals.newGoal": "New goal",
  "goals.completed": "Completed 🎉",
  "goals.daysLeft": "{n} days left",
  "goals.noDeadline": "No deadline",
  "goals.created": "Goal created",
  "goals.needNameTarget": "Add a name and a target amount",
  "goals.detail": "Goal",
  "goals.notFound": "Goal not found",
  "goals.reached": "Goal reached!",
  "goals.youSaved": "You saved {amount}.",
  "goals.addFunds": "Add funds",
  "goals.history": "Contribution history",
  "goals.noContributions": "No contributions yet.",
  "goals.deleteGoal": "Delete goal",
  "goals.contributionAdded": "Contribution added",
  "goals.enterAmount": "Enter an amount",

  "budget.title": "Budget",
  "budget.prevMonth": "Previous month",
  "budget.nextMonth": "Next month",
  "budget.headsUp": "Heads up.",
  "budget.atLimitOne": "is at or over the limit this month.",
  "budget.atLimitMany": "are at or over the limit this month.",
  "budget.byCategory": "Spending by category",
  "budget.noExpenses": "No expenses recorded this month.",
  "budget.spent": "Spent",
  "budget.noCategories": "No expense categories yet",
  "budget.setLimit": "Set limit",
  "budget.noLimit": "spent · no limit set",

  "accounts.title": "Accounts",
  "accounts.namePlaceholder": "Account name",
  "accounts.startingBalance": "Starting balance",
  "accounts.add": "Add account",
  "accounts.needName": "Give the account a name",
  "accounts.autoSync": "Automatic sync",
  "accounts.autoSyncText":
    "Bank, mobile banking and mobile money sync (Nita, Amana) is coming in a future phase. For now, add and update your accounts manually.",
  "accounts.type.bank": "Bank",
  "accounts.type.cash": "Cash",
  "accounts.type.mobile_money": "Mobile money",
  "accounts.type.savings": "Savings",

  "method.card": "Card",
  "method.cash": "Cash",
  "method.transfer": "Transfer",
  "method.mobile_money": "Mobile money",

  "profile.title": "Profile",
  "profile.yourName": "Your name",
  "profile.displayName": "Display name",
  "profile.preferences": "Preferences",
  "profile.currency": "Currency",
  "profile.language": "Language",
  "profile.notifications": "Notifications",
  "profile.pinLock": "PIN / biometric lock",
  "profile.darkTheme": "Dark theme",
  "profile.alwaysOn": "Always on",
  "profile.accounts": "Accounts",
  "profile.connectData": "Connect data",
  "profile.connectHint": "Automatic synchronisation is coming soon.",
  "profile.autoDetection": "Automatic detection",
  "profile.iphoneSetup": "iPhone setup",
  "profile.bankAccount": "Bank account",
  "profile.mobileBanking": "Mobile banking",
  "profile.comingSoonDesc": "{label} sync isn't available yet.",
  "profile.exportData": "Export my data",
  "profile.logOut": "Log out",

  "detections.title": "Detected transactions",
  "detections.empty": "No new detections",
  "detections.emptyDesc":
    "Deposits and withdrawals spotted in your bank and mobile money notifications will land here for review.",
  "detections.confirm": "Confirm",
  "detections.ignore": "Ignore",
  "detections.alwaysIgnore": "Always ignore",
  "detections.uncategorized": "Uncategorized",
  "detections.muted": "Similar detections muted",
  "detections.ignored": "Detection ignored",
  "detections.couldNotUpdate": "Could not update",

  "detection.title": "Automatic detection",
  "detection.intro":
    "MyBudget can automatically detect deposits and withdrawals from your bank and mobile money apps. A small automation on your phone forwards the notification text to your private MyBudget address; MyBudget extracts the amount, the direction and the merchant, then keeps only those details plus a short excerpt of the message.",
  "detection.enable": "Enable automatic detection",
  "detection.granted": "Notification access granted.",
  "detection.waiting": "Waiting for notification access.",
  "detection.off": "Turned off on this device.",
  "detection.grantTitle": "Grant notification access",
  "detection.step1": "1. Open Android Settings › Notifications.",
  "detection.step2": "2. Tap “Notification access” (or “Device & app notifications”).",
  "detection.step3": "3. Find MyBudget and turn it on, then confirm.",
  "detection.openSettings": "Open system settings",
  "detection.granted.btn": "I've granted it",
  "detection.openingAndroid": "Opening Android settings…",
  "detection.openingDesc": "Enable MyBudget in the notification access list.",
  "detection.grantToast": "Grant notification access",
  "detection.grantToastDesc":
    "Open Android Settings › Notifications › Notification access and allow MyBudget.",
  "detection.openHint": "Open Android Settings › Notification access",
  "detection.supportedApps": "Supported apps",
  "detection.iphoneLink": "Set up automatic detection on iPhone",
  "detection.status.active": "Active",
  "detection.status.waiting": "Waiting for permission",
  "detection.status.off": "Off",
  "detection.source.bank": "Bank app",
  "detection.source.mobile_banking": "Mobile Banking",
  "detection.source.nita": "Nita",
  "detection.source.amana": "Amana",

  "iphone.title": "iPhone setup",
  "iphone.intro":
    "iOS doesn't let apps read notifications. Instead, you can create a personal Shortcuts automation that sends the detected amount straight into MyBudget. Nothing leaves your iPhone until you confirm the transaction.",
  "iphone.s1.title": "Open the Shortcuts app",
  "iphone.s1.body": "On your iPhone, open Shortcuts and go to the Automation tab.",
  "iphone.s2.title": "Create a personal automation",
  "iphone.s2.body":
    "Tap “+”, choose “App” or “Message/Notification” and select your bank or mobile money app.",
  "iphone.s3.title": "Add the “Get Text from Input” action",
  "iphone.s3.body": "This grabs the notification text so the amount can be extracted from it.",
  "iphone.s4.title": "Add “Match Text” to find the amount",
  "iphone.s4.body":
    "Use a pattern such as [0-9]+([.,][0-9]{2})? to capture the amount in the message.",
  "iphone.s5.title": "Add “Open URL”",
  "iphone.s5.body":
    "Point it at myapp://quick-add?amount=[matched amount]&type=expense and add &note= with the app name if you like.",
  "iphone.s6.title": "Turn off “Ask Before Running”",
  "iphone.s6.body":
    "MyBudget still asks you to confirm the transaction, so the automation can run silently.",
  "iphone.s7.title": "Confirm in MyBudget",
  "iphone.s7.body":
    "Each detection opens the add-transaction screen pre-filled — pick a category and save in one tap.",
  "iphone.copyLink": "Copy Shortcut link",
  "iphone.copied": "Shortcut link copied",
  "iphone.copyFailed": "Could not copy the link",
  "iphone.testLink": "Test the quick-add link",
  "iphone.placeholderNote": "The Shortcut link is a placeholder until the gallery shortcut is published.",
  "detection.forward.title": "Notification forwarding",
  "detection.forward.intro":
    "Phones don't let a website read notifications directly. Instead, a small automation on your phone (MacroDroid or Tasker on Android, Shortcuts on iPhone) forwards the notification text to your private MyBudget address. MyBudget reads the amount, the direction and the merchant, then saves a real detection.",
  "detection.forward.endpoint": "Forwarding address",
  "detection.forward.token": "Your private key",
  "detection.forward.copyEndpoint": "Copy address",
  "detection.forward.copyToken": "Copy key",
  "detection.forward.copyBody": "Copy JSON body",
  "detection.forward.copied": "Copied to clipboard",
  "detection.forward.reveal": "Show",
  "detection.forward.hide": "Hide",
  "detection.forward.regenerate": "Generate a new key",
  "detection.forward.regenerated": "New key generated — update your phone automation",
  "detection.forward.keyWarning": "Anyone with this key can add detections to your account. Keep it private.",
  "detection.forward.lastSeen": "Last message received {when}",
  "detection.forward.never": "No message received yet.",
  "detection.forward.test": "Send a test message",
  "detection.forward.testSent": "Test message accepted: {status}",
  "detection.forward.testFailed": "Test failed",
  "detection.forward.howto": "How to set it up on Android",
  "detection.forward.a1": "1. Install MacroDroid (or Tasker) from the Play Store.",
  "detection.forward.a2": "2. New macro › Trigger: “Notification received” › pick your bank / mobile money app.",
  "detection.forward.a3": "3. Action: “HTTP Request” › POST to the forwarding address above.",
  "detection.forward.a4": "4. Content type application/json, body: the JSON above (keep [notification] as the text variable).",
  "detection.forward.a5": "5. Save the macro — new notifications now appear in Detected transactions.",
  "detection.autoSave.title": "Save detections automatically",
  "detection.autoSave.desc": "Skip the review inbox and record matching notifications as real transactions.",
  "detection.defaultAccount": "Account for detected transactions",
  "detection.rules.title": "Category rules",
  "detection.rules.desc": "When a notification contains a keyword, the detection gets this category.",
  "detection.rules.keyword": "Keyword (e.g. UBER, PHARMACIE)",
  "detection.rules.add": "Add rule",
  "detection.rules.autoConfirm": "Save automatically",
  "detection.rules.none": "No rules yet.",
  "detection.rules.needKeyword": "Enter a keyword",
  "detections.autoSaved": "Saved automatically",
  "detections.paste.title": "Import from my SMS",
  "detections.paste.desc":
    "Paste one or more SMS from your bank, Nita, Amana, Airtel, Moov, Orange Money, Wave… MyBudget finds the amount, direction, fees and date. Leave a blank line between two messages.",
  "detections.paste.placeholder": "e.g. NITA: Vous avez recu 25 000 FCFA de MOUSSA ALI. Nouveau solde: 87 500 FCFA.",
  "detections.paste.clipboard": "Paste",
  "detections.paste.analyse": "Analyse",
  "detections.paste.added": "{n} detection(s) added for review",
  "detections.paste.duplicates": "{n} already imported, skipped",
  "detections.paste.nothing": "No transaction found in this text",
  "detections.openInbox": "Detected transactions",
  "iphone2.intro":
    "iPhone apps can't read your SMS, but the Shortcuts app can react when an SMS arrives and send it to MyBudget in the background. MyBudget then reads the amount, direction, fees, balance and date, and puts the transaction in your review inbox (or saves it directly if automatic saving is on).",
  "iphone2.yourValues": "Your personal values",
  "iphone2.url": "Web address (URL)",
  "iphone2.token": "Secret key (tap to show)",
  "iphone2.noToken": "Turn on automatic detection in the previous screen to get your secret key.",
  "iphone2.copy": "Copy",
  "iphone2.copied": "Copied",
  "iphone2.s1.title": "Create a message automation",
  "iphone2.s1.body":
    "Open Shortcuts › Automation tab › + › Message. Under “Sender”, choose ECOBANK. Select “Run Immediately” and turn off “Notify When Run”, then Next › New Blank Automation.",
  "iphone2.s2.title": "Add “Get Contents of URL”",
  "iphone2.s2.body":
    "Search for the action “Get Contents of URL”. Paste your URL. Tap the arrow › Method: POST › Request Body: JSON.",
  "iphone2.s3.title": "Fill in the 3 fields",
  "iphone2.s3.body":
    "Add 3 Text fields:\n• token → paste your secret key\n• text → insert the variable “Shortcut Input” › Content (the SMS text)\n• sender → type ECOBANK",
  "iphone2.s4.title": "Repeat for each sender",
  "iphone2.s4.body":
    "Create the same automation for MoovMoney and Mixx Togo (only change the sender field). Tip: once the first one works, duplicate it.",
  "iphone2.s5.title": "Test with a real SMS",
  "iphone2.s5.body":
    "Use the test button below to check your key, then wait for your next SMS (or forward an old one to yourself). The transaction appears in Detected transactions within a few seconds.",
  "iphone2.s6.title": "Choose the account for each operator",
  "iphone2.s6.body":
    "Name your accounts after the operator (e.g. “Ecobank”, “Moov Money”, “Mixx”): each SMS goes to the account with the matching name. Otherwise the default account of the previous screen is used.",
  "iphone2.ai.title": "Optional: Apple Intelligence",
  "iphone2.ai.body":
    "MyBudget already reads Ecobank, Moov Money and Mixx messages on its own. If an operator changes its format, you can add a safety net: before “Get Contents of URL”, add the action “Use Model” (On-Device) with the prompt below followed by the SMS content, then add the fields ai_amount, ai_type and ai_merchant from its answer. MyBudget only uses them if it can't read the SMS itself, and only if the amount really appears in the message.",
  "iphone2.ai.prompt": "Prompt for “Use Model”",
  "iphone2.test": "Test my key (nothing is saved)",
  "iphone2.testOk": "Key OK — sample SMS read as {type}{amount} {provider}",
  "iphone2.testDisabled": "Automatic detection is off: turn it on in the previous screen",
  "iphone2.testNote": "The test sends a sample Moov Money SMS in “dry run” mode: nothing is added to your accounts.",
};

export type TKey = keyof typeof en;

const fr: Partial<Record<TKey, string>> = {
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.add": "Ajouter",
  "common.all": "Tout",
  "common.none": "Aucun",
  "common.of": "sur",
  "common.saved": "Enregistré",
  "common.couldNotSave": "Enregistrement impossible",
  "common.somethingWrong": "Une erreur est survenue",
  "common.comingSoon": "Bientôt disponible",
  "common.connect": "Connecter",
  "common.goBack": "Retour",
  "common.uncategorised": "Sans catégorie",
  "common.transaction": "Transaction",
  "common.seeAll": "Tout voir",
  "common.viewAll": "Tout voir",
  "common.continue": "Continuer",

  "nav.home": "Accueil",
  "nav.records": "Opérations",
  "nav.goals": "Objectifs",
  "nav.budget": "Budget",
  "nav.profile": "Profil",
  "nav.searchTransactions": "Rechercher des transactions",
  "nav.detectedTransactions": "Transactions détectées",

  "landing.tagline1": "Chaque franc,",
  "landing.tagline2": "bien compté.",
  "landing.intro":
    "Un seul endroit serein pour vos dépenses, revenus, budgets mensuels et objectifs d'épargne — au lieu de notes éparpillées et de cinq applis bancaires.",
  "landing.f1.title": "Tout suivre",
  "landing.f1.text": "Dépenses et revenus sur tous vos comptes.",
  "landing.f2.title": "Respecter son budget",
  "landing.f2.text": "Des limites mensuelles par catégorie avec des alertes claires.",
  "landing.f3.title": "Atteindre vos objectifs",
  "landing.f3.text": "Des objectifs d'épargne avec progression et versements.",
  "landing.cta": "Commencer",

  "auth.welcomeBack": "Bon retour",
  "auth.createAccount": "Créer un compte",
  "auth.subtitleLogin": "Connectez-vous pour reprendre où vous en étiez.",
  "auth.subtitleSignup": "Une minute pour s'installer, une vie de clarté.",
  "auth.fullName": "Nom complet",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.signIn": "Se connecter",
  "auth.newHere": "Nouveau ici ?",
  "auth.createOne": "Créer un compte",
  "auth.haveAccount": "Vous avez déjà un compte ?",
  "auth.checkEmail": "Vérifiez vos e-mails pour confirmer votre compte.",

  "onboarding.step": "Étape {n} sur 2",
  "onboarding.pickCurrency": "Choisissez votre devise",
  "onboarding.firstGoal": "Votre premier objectif d'épargne",
  "onboarding.currencyHint": "Tous les montants de MyBudget seront affichés dans cette devise.",
  "onboarding.goalHint": "Facultatif — vous pourrez toujours ajouter des objectifs plus tard.",
  "onboarding.goalNamePlaceholder": "Nom de l'objectif — ex. Vacances de rêve",
  "onboarding.targetAmount": "Montant cible",
  "onboarding.createFinish": "Créer l'objectif et terminer",
  "onboarding.skip": "Passer pour l'instant",

  "home.title": "Tableau de bord",
  "home.totalBalance": "Solde total",
  "home.thisMonth": "ce mois-ci",
  "home.balance": "Solde",
  "home.spentThisMonth": "Dépensé ce mois-ci",
  "home.savedThisMonth": "Épargné ce mois-ci",
  "home.savingsGoals": "Objectifs d'épargne",
  "home.noGoals": "Aucun objectif",
  "home.noGoalsDesc": "Créez votre premier objectif d'épargne et regardez-le grandir.",
  "home.createGoal": "Créer un objectif",
  "home.recentActivity": "Activité récente",
  "home.nothingYet": "Rien d'enregistré",
  "home.nothingYetDesc": "Ajoutez votre première transaction pour commencer.",
  "home.addTransaction": "Ajouter une transaction",

  "tx.title": "Transactions",
  "tx.searchPlaceholder": "Rechercher dans les notes et catégories",
  "tx.monthNet": "Net du mois",
  "tx.none": "Aucune transaction",
  "tx.noneDesc": "Ajoutez votre première dépense ou revenu pour commencer le suivi.",
  "tx.add": "Ajouter une transaction",
  "tx.confirmTitle": "Confirmer la transaction",
  "tx.prefilledHint":
    "Pré-rempli depuis un lien d'ajout rapide. Vérifiez les détails, choisissez une catégorie, puis enregistrez.",
  "tx.edit": "Modifier la transaction",
  "tx.notFound": "Transaction introuvable",
  "tx.expense": "Dépense",
  "tx.income": "Revenu",
  "tx.category": "Catégorie",
  "tx.date": "Date",
  "tx.account": "Compte",
  "tx.paymentMethod": "Moyen de paiement",
  "tx.notePlaceholder": "Ajouter une note…",
  "tx.receipt": "Reçu",
  "tx.receiptAttached": "Reçu joint",
  "tx.update": "Mettre à jour",
  "tx.saveBtn": "Enregistrer la transaction",
  "tx.delete": "Supprimer la transaction",
  "tx.enterAmount": "Saisissez un montant supérieur à zéro",
  "tx.updated": "Transaction mise à jour",
  "tx.savedOk": "Transaction enregistrée",

  "goals.title": "Objectifs",
  "goals.namePlaceholder": "Nom de l'objectif",
  "goals.targetAmount": "Montant cible",
  "goals.targetDate": "Date cible",
  "goals.create": "Créer l'objectif",
  "goals.none": "Aucun objectif d'épargne",
  "goals.noneDesc": "Créez un objectif et suivez chaque versement.",
  "goals.createOne": "Créer un objectif",
  "goals.newGoal": "Nouvel objectif",
  "goals.completed": "Atteint 🎉",
  "goals.daysLeft": "{n} jours restants",
  "goals.noDeadline": "Sans échéance",
  "goals.created": "Objectif créé",
  "goals.needNameTarget": "Ajoutez un nom et un montant cible",
  "goals.detail": "Objectif",
  "goals.notFound": "Objectif introuvable",
  "goals.reached": "Objectif atteint !",
  "goals.youSaved": "Vous avez épargné {amount}.",
  "goals.addFunds": "Ajouter des fonds",
  "goals.history": "Historique des versements",
  "goals.noContributions": "Aucun versement pour l'instant.",
  "goals.deleteGoal": "Supprimer l'objectif",
  "goals.contributionAdded": "Versement ajouté",
  "goals.enterAmount": "Saisissez un montant",

  "budget.title": "Budget",
  "budget.prevMonth": "Mois précédent",
  "budget.nextMonth": "Mois suivant",
  "budget.headsUp": "Attention.",
  "budget.atLimitOne": "atteint ou dépasse la limite ce mois-ci.",
  "budget.atLimitMany": "atteignent ou dépassent la limite ce mois-ci.",
  "budget.byCategory": "Dépenses par catégorie",
  "budget.noExpenses": "Aucune dépense enregistrée ce mois-ci.",
  "budget.spent": "Dépensé",
  "budget.noCategories": "Aucune catégorie de dépense",
  "budget.setLimit": "Limite",
  "budget.noLimit": "dépensé · aucune limite définie",

  "accounts.title": "Comptes",
  "accounts.namePlaceholder": "Nom du compte",
  "accounts.startingBalance": "Solde initial",
  "accounts.add": "Ajouter un compte",
  "accounts.needName": "Donnez un nom au compte",
  "accounts.autoSync": "Synchronisation automatique",
  "accounts.autoSyncText":
    "La synchronisation avec les banques, la banque mobile et le mobile money (Nita, Amana) arrivera dans une prochaine phase. Pour l'instant, ajoutez et mettez à jour vos comptes manuellement.",
  "accounts.type.bank": "Banque",
  "accounts.type.cash": "Espèces",
  "accounts.type.mobile_money": "Mobile money",
  "accounts.type.savings": "Épargne",

  "method.card": "Carte",
  "method.cash": "Espèces",
  "method.transfer": "Virement",
  "method.mobile_money": "Mobile money",

  "profile.title": "Profil",
  "profile.yourName": "Votre nom",
  "profile.displayName": "Nom affiché",
  "profile.preferences": "Préférences",
  "profile.currency": "Devise",
  "profile.language": "Langue",
  "profile.notifications": "Notifications",
  "profile.pinLock": "Code PIN / biométrie",
  "profile.darkTheme": "Thème sombre",
  "profile.alwaysOn": "Toujours actif",
  "profile.accounts": "Comptes",
  "profile.connectData": "Connecter mes données",
  "profile.connectHint": "La synchronisation automatique arrive bientôt.",
  "profile.autoDetection": "Détection automatique",
  "profile.iphoneSetup": "Configuration iPhone",
  "profile.bankAccount": "Compte bancaire",
  "profile.mobileBanking": "Banque mobile",
  "profile.comingSoonDesc": "La synchronisation {label} n'est pas encore disponible.",
  "profile.exportData": "Exporter mes données",
  "profile.logOut": "Se déconnecter",

  "detections.title": "Transactions détectées",
  "detections.empty": "Aucune nouvelle détection",
  "detections.emptyDesc":
    "Les dépôts et retraits repérés dans les notifications de votre banque et de votre mobile money apparaîtront ici.",
  "detections.confirm": "Confirmer",
  "detections.ignore": "Ignorer",
  "detections.alwaysIgnore": "Toujours ignorer",
  "detections.uncategorized": "Sans catégorie",
  "detections.muted": "Détections similaires masquées",
  "detections.ignored": "Détection ignorée",
  "detections.couldNotUpdate": "Mise à jour impossible",

  "detection.title": "Détection automatique",
  "detection.intro":
    "MyBudget peut détecter automatiquement les dépôts et retraits de vos applis bancaires et mobile money. Une petite automatisation sur votre téléphone transmet le texte de la notification à votre adresse MyBudget privée ; MyBudget en extrait le montant, le sens et le commerçant, puis ne conserve que ces informations et un court extrait du message.",
  "detection.enable": "Activer la détection automatique",
  "detection.granted": "Accès aux notifications accordé.",
  "detection.waiting": "En attente de l'accès aux notifications.",
  "detection.off": "Désactivé sur cet appareil.",
  "detection.grantTitle": "Autoriser l'accès aux notifications",
  "detection.step1": "1. Ouvrez Paramètres Android › Notifications.",
  "detection.step2": "2. Touchez « Accès aux notifications » (ou « Notifications des applis »).",
  "detection.step3": "3. Trouvez MyBudget, activez-le puis confirmez.",
  "detection.openSettings": "Ouvrir les paramètres",
  "detection.granted.btn": "C'est autorisé",
  "detection.openingAndroid": "Ouverture des paramètres Android…",
  "detection.openingDesc": "Activez MyBudget dans la liste d'accès aux notifications.",
  "detection.grantToast": "Autorisez l'accès aux notifications",
  "detection.grantToastDesc":
    "Ouvrez Paramètres Android › Notifications › Accès aux notifications et autorisez MyBudget.",
  "detection.openHint": "Ouvrez Paramètres Android › Accès aux notifications",
  "detection.supportedApps": "Applications prises en charge",
  "detection.iphoneLink": "Configurer la détection automatique sur iPhone",
  "detection.status.active": "Actif",
  "detection.status.waiting": "En attente d'autorisation",
  "detection.status.off": "Désactivé",
  "detection.source.bank": "Appli bancaire",
  "detection.source.mobile_banking": "Banque mobile",
  "detection.source.nita": "Nita",
  "detection.source.amana": "Amana",

  "iphone.title": "Configuration iPhone",
  "iphone.intro":
    "iOS ne permet pas aux applis de lire les notifications. Vous pouvez créer une automatisation personnelle Raccourcis qui envoie le montant détecté directement dans MyBudget. Rien ne quitte votre iPhone tant que vous n'avez pas confirmé la transaction.",
  "iphone.s1.title": "Ouvrez l'app Raccourcis",
  "iphone.s1.body": "Sur votre iPhone, ouvrez Raccourcis et allez dans l'onglet Automatisation.",
  "iphone.s2.title": "Créez une automatisation personnelle",
  "iphone.s2.body":
    "Touchez « + », choisissez « App » ou « Message/Notification » et sélectionnez votre appli bancaire ou mobile money.",
  "iphone.s3.title": "Ajoutez l'action « Obtenir le texte de l'entrée »",
  "iphone.s3.body": "Cela récupère le texte de la notification pour en extraire le montant.",
  "iphone.s4.title": "Ajoutez « Faire correspondre le texte » pour trouver le montant",
  "iphone.s4.body":
    "Utilisez un motif comme [0-9]+([.,][0-9]{2})? pour capturer le montant du message.",
  "iphone.s5.title": "Ajoutez « Ouvrir l'URL »",
  "iphone.s5.body":
    "Pointez-la vers myapp://quick-add?amount=[montant]&type=expense et ajoutez &note= avec le nom de l'appli si vous le souhaitez.",
  "iphone.s6.title": "Désactivez « Demander avant d'exécuter »",
  "iphone.s6.body":
    "MyBudget vous demande toujours de confirmer la transaction, l'automatisation peut donc s'exécuter en silence.",
  "iphone.s7.title": "Confirmez dans MyBudget",
  "iphone.s7.body":
    "Chaque détection ouvre l'écran d'ajout pré-rempli — choisissez une catégorie et enregistrez en un geste.",
  "iphone.copyLink": "Copier le lien du raccourci",
  "iphone.copied": "Lien du raccourci copié",
  "iphone.copyFailed": "Impossible de copier le lien",
  "iphone.testLink": "Tester le lien d'ajout rapide",
  "iphone.placeholderNote":
    "Le lien du raccourci est provisoire jusqu'à la publication du raccourci officiel.",
  "detection.forward.title": "Transfert des notifications",
  "detection.forward.intro":
    "Un site web ne peut pas lire les notifications du téléphone. À la place, une petite automatisation sur votre téléphone (MacroDroid ou Tasker sur Android, Raccourcis sur iPhone) envoie le texte de la notification à votre adresse MyBudget privée. MyBudget en extrait le montant, le sens et le commerçant, puis enregistre une détection réelle.",
  "detection.forward.endpoint": "Adresse de transfert",
  "detection.forward.token": "Votre clé privée",
  "detection.forward.copyEndpoint": "Copier l'adresse",
  "detection.forward.copyToken": "Copier la clé",
  "detection.forward.copyBody": "Copier le corps JSON",
  "detection.forward.copied": "Copié dans le presse-papiers",
  "detection.forward.reveal": "Afficher",
  "detection.forward.hide": "Masquer",
  "detection.forward.regenerate": "Générer une nouvelle clé",
  "detection.forward.regenerated": "Nouvelle clé générée — mettez à jour votre automatisation",
  "detection.forward.keyWarning": "Toute personne disposant de cette clé peut ajouter des détections à votre compte. Gardez-la privée.",
  "detection.forward.lastSeen": "Dernier message reçu {when}",
  "detection.forward.never": "Aucun message reçu pour le moment.",
  "detection.forward.test": "Envoyer un message test",
  "detection.forward.testSent": "Message test accepté : {status}",
  "detection.forward.testFailed": "Échec du test",
  "detection.forward.howto": "Configuration sur Android",
  "detection.forward.a1": "1. Installez MacroDroid (ou Tasker) depuis le Play Store.",
  "detection.forward.a2": "2. Nouvelle macro › Déclencheur : « Notification reçue » › choisissez votre appli bancaire / mobile money.",
  "detection.forward.a3": "3. Action : « Requête HTTP » › POST vers l'adresse de transfert ci-dessus.",
  "detection.forward.a4": "4. Type de contenu application/json, corps : le JSON ci-dessus (gardez [notification] comme variable de texte).",
  "detection.forward.a5": "5. Enregistrez la macro — les nouvelles notifications apparaissent dans Transactions détectées.",
  "detection.autoSave.title": "Enregistrer automatiquement",
  "detection.autoSave.desc": "Sauter la boîte de révision et enregistrer directement les notifications détectées.",
  "detection.defaultAccount": "Compte des transactions détectées",
  "detection.rules.title": "Règles de catégorie",
  "detection.rules.desc": "Quand une notification contient un mot-clé, la détection reçoit cette catégorie.",
  "detection.rules.keyword": "Mot-clé (ex. UBER, PHARMACIE)",
  "detection.rules.add": "Ajouter la règle",
  "detection.rules.autoConfirm": "Enregistrer automatiquement",
  "detection.rules.none": "Aucune règle pour l'instant.",
  "detection.rules.needKeyword": "Saisissez un mot-clé",
  "detections.autoSaved": "Enregistré automatiquement",
  "detections.paste.title": "Importer depuis mes SMS",
  "detections.paste.desc":
    "Collez un ou plusieurs SMS de votre banque, Nita, Amana, Airtel, Moov, Orange Money, Wave… MyBudget repère le montant, le sens, les frais et la date. Laissez une ligne vide entre deux messages.",
  "detections.paste.placeholder": "Ex. NITA: Vous avez recu 25 000 FCFA de MOUSSA ALI. Nouveau solde: 87 500 FCFA.",
  "detections.paste.clipboard": "Coller",
  "detections.paste.analyse": "Analyser",
  "detections.paste.added": "{n} opération(s) détectée(s) à valider",
  "detections.paste.duplicates": "{n} déjà importée(s), ignorée(s)",
  "detections.paste.nothing": "Aucune opération trouvée dans ce texte",
  "detections.openInbox": "Opérations détectées",
  "iphone2.intro":
    "Une app iPhone ne peut pas lire vos SMS, mais l'app Raccourcis peut réagir à l'arrivée d'un SMS et l'envoyer à MyBudget en arrière-plan. MyBudget lit alors le montant, le sens, les frais, le solde et la date, et place l'opération dans vos détections à valider (ou l'enregistre directement si l'enregistrement automatique est activé).",
  "iphone2.yourValues": "Vos valeurs personnelles",
  "iphone2.url": "Adresse web (URL)",
  "iphone2.token": "Clé secrète (touchez pour afficher)",
  "iphone2.noToken": "Activez la détection automatique sur l'écran précédent pour obtenir votre clé secrète.",
  "iphone2.copy": "Copier",
  "iphone2.copied": "Copié",
  "iphone2.s1.title": "Créez une automatisation « Message »",
  "iphone2.s1.body":
    "Ouvrez Raccourcis › onglet Automatisation › + › Message. Dans « Expéditeur », choisissez ECOBANK. Cochez « Exécuter immédiatement » et désactivez « M'avertir lors de l'exécution », puis Suivant › Nouvelle automatisation vide.",
  "iphone2.s2.title": "Ajoutez « Obtenir le contenu de l'URL »",
  "iphone2.s2.body":
    "Cherchez l'action « Obtenir le contenu de l'URL ». Collez votre URL. Touchez la flèche › Méthode : POST › Corps de la requête : JSON.",
  "iphone2.s3.title": "Remplissez les 3 champs",
  "iphone2.s3.body":
    "Ajoutez 3 champs de type Texte :\n• token → collez votre clé secrète\n• text → insérez la variable « Entrée du raccourci » › Contenu (le texte du SMS)\n• sender → tapez ECOBANK",
  "iphone2.s4.title": "Répétez pour chaque expéditeur",
  "iphone2.s4.body":
    "Créez la même automatisation pour MoovMoney et Mixx Togo (changez seulement le champ sender). Astuce : une fois la première validée, dupliquez-la.",
  "iphone2.s5.title": "Testez avec un vrai SMS",
  "iphone2.s5.body":
    "Utilisez le bouton de test ci-dessous pour vérifier votre clé, puis attendez votre prochain SMS (ou transférez-vous un ancien). L'opération apparaît dans « Opérations détectées » en quelques secondes.",
  "iphone2.s6.title": "Choisissez le compte de chaque opérateur",
  "iphone2.s6.body":
    "Nommez vos comptes comme l'opérateur (ex. « Ecobank », « Moov Money », « Mixx ») : chaque SMS va dans le compte au nom correspondant. Sinon, c'est le compte par défaut de l'écran précédent qui est utilisé.",
  "iphone2.ai.title": "En option : Apple Intelligence",
  "iphone2.ai.body":
    "MyBudget lit déjà seul les SMS Ecobank, Moov Money et Mixx. Si un opérateur change son format, vous pouvez ajouter un filet de sécurité : avant « Obtenir le contenu de l'URL », ajoutez l'action « Utiliser un modèle » (Sur l'appareil) avec la consigne ci-dessous suivie du contenu du SMS, puis ajoutez les champs ai_amount, ai_type et ai_merchant à partir de sa réponse. MyBudget ne s'en sert que s'il n'arrive pas à lire le SMS lui-même, et seulement si le montant figure vraiment dans le message.",
  "iphone2.ai.prompt": "Consigne pour « Utiliser un modèle »",
  "iphone2.test": "Tester ma clé (rien n'est enregistré)",
  "iphone2.testOk": "Clé valide — SMS d'exemple lu : {type}{amount} {provider}",
  "iphone2.testDisabled": "La détection automatique est désactivée : activez-la sur l'écran précédent",
  "iphone2.testNote": "Le test envoie un SMS Moov Money d'exemple en mode « essai » : rien n'est ajouté à vos comptes.",
};

/**
 * Spanish is not translated yet — every key falls back to English.
 * Add entries here to start translating; anything missing stays English.
 */
const es: Partial<Record<TKey, string>> = {};

const DICTS: Record<Lang, Partial<Record<TKey, string>>> = { en, fr, es };

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>) {
  const template = DICTS[lang]?.[key] ?? en[key] ?? String(key);
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, k: string) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (key, vars) => translate("en", key, vars),
});

const STORAGE_KEY = "mybudget.lang";

function normalise(value: string | null | undefined): Lang {
  return value === "fr" || value === "es" ? value : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { data: profile } = useProfile();
  const [lang, setLangState] = useState<Lang>("en");

  // Keep formatters in sync during render so amounts/dates never lag a frame.
  setActiveLanguage(lang);

  // Restore last choice before the profile loads (avoids a flash of English).
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setLangState(normalise(stored));
  }, []);

  useEffect(() => {
    if (profile?.language) setLangState(normalise(profile.language));
  }, [profile?.language]);

  useEffect(() => {
    setActiveLanguage(lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setActiveLanguage(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  return useI18n().t;
}
