// Translation layer for MaysterPRO. The Ukrainian (`uk`) strings come from the
// original prototype; en / fr / ka are translated from them.

export const LOCALES = ["ka", "en", "uk", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  ka: "ქართული",
  en: "English",
  uk: "Українська",
  fr: "Français",
};

export type Dict = {
  appName: string;
  tagline: string;
  hourlyRate: string;
  salaryTotal: string;
  balanceDue: string;
  hours: string;
  days: string;
  paid: string;
  workJournal: string;
  payments: string;
  noWork: string;
  noPay: string;
  exportCsv: string;
  addEntry: string;
  addWorkDay: string;
  addPayment: string;
  date: string;
  hoursLabel: string;
  hoursPlaceholder: string;
  address: string;
  addressPlaceholder: string;
  paymentDate: string;
  paymentAmount: string;
  cancel: string;
  save: string;
  deleteConfirm: string;
  errWork: string;
  errPay: string;
  payment: string;
  footer: string;
  // auth
  signIn: string;
  email: string;
  password: string;
  loginTitle: string;
  loginError: string;
  logout: string;
  // admin
  admin: string;
  worker: string;
  workers: string;
  dashboard: string;
  addWorker: string;
  name: string;
  rate: string;
  status: string;
  position: string;
  totalHours: string;
  outstanding: string;
  viewDetails: string;
  back: string;
  createWorker: string;
  statusActive: string;
  statusOnLeave: string;
  statusTerminated: string;
  language: string;
  overview: string;
  topHours: string;
  topBalance: string;
  savedAndSynced: string;
  analytics: string;
  costByMonth: string;
  hoursBySite: string;
  hoursByWorker: string;
  exportAll: string;
  profile: string;
  phone: string;
  birthDate: string;
  nationality: string;
  emergencyContact: string;
  notes: string;
  photoUrl: string;
  profileSaved: string;
  editProfile: string;
  annualReport: string;
  year: string;
  print: string;
  month: string;
  photo: string;
};

const uk: Dict = {
  appName: "МайстерPRO",
  tagline: "Облік робочих днів і зарплати",
  hourlyRate: "Погодинна ставка (€)",
  salaryTotal: "ЗАГАЛЬНА ЗАРПЛАТА",
  balanceDue: "БАЛАНС ДО ВИПЛАТИ",
  hours: "Години",
  days: "Дні",
  paid: "Виплачено",
  workJournal: "Робочий журнал",
  payments: "Виплати",
  noWork: "Ще немає робочих днів. Натисніть +, щоб додати.",
  noPay: "Ще немає виплат. Натисніть +, щоб додати.",
  exportCsv: "Експорт CSV",
  addEntry: "Додати запис",
  addWorkDay: "Додати робочий день",
  addPayment: "Додати виплату",
  date: "Дата",
  hoursLabel: "Години",
  hoursPlaceholder: "8 або 12.5",
  address: "Адреса",
  addressPlaceholder: "напр. Rambouillet",
  paymentDate: "Дата виплати",
  paymentAmount: "Сума виплати (€)",
  cancel: "Скасувати",
  save: "Зберегти",
  deleteConfirm: "Видалити цей запис?",
  errWork: "Введіть дату та години",
  errPay: "Введіть дату та суму",
  payment: "Виплата",
  footer: "Дані зберігаються надійно у вашому обліковому записі",
  signIn: "Увійти",
  email: "Ел. пошта",
  password: "Пароль",
  loginTitle: "Вхід до системи",
  loginError: "Невірна пошта або пароль",
  logout: "Вийти",
  admin: "Адміністратор",
  worker: "Працівник",
  workers: "Працівники",
  dashboard: "Панель",
  addWorker: "Додати працівника",
  name: "Ім'я",
  rate: "Ставка",
  status: "Статус",
  position: "Посада",
  totalHours: "Всього годин",
  outstanding: "До виплати",
  viewDetails: "Детальніше",
  back: "Назад",
  createWorker: "Створити працівника",
  statusActive: "Активний",
  statusOnLeave: "У відпустці",
  statusTerminated: "Звільнений",
  language: "Мова",
  overview: "Огляд",
  topHours: "Найбільше годин",
  topBalance: "Найбільший борг",
  savedAndSynced: "Збережено",
  analytics: "Аналітика",
  costByMonth: "Витрати за місяцями",
  hoursBySite: "Години за об'єктами",
  hoursByWorker: "Години за працівниками",
  exportAll: "Експорт усіх (CSV)",
  profile: "Профіль",
  phone: "Телефон",
  birthDate: "Дата народження",
  nationality: "Громадянство",
  emergencyContact: "Екстрений контакт",
  notes: "Нотатки (адмін)",
  photoUrl: "Фото (URL)",
  profileSaved: "Профіль збережено",
  editProfile: "Редагувати профіль",
  annualReport: "Річний звіт",
  year: "Рік",
  print: "Друк / PDF",
  month: "Місяць",
  photo: "Фото",
};

const en: Dict = {
  appName: "MaysterPRO",
  tagline: "Work days & salary tracker",
  hourlyRate: "Hourly rate (€)",
  salaryTotal: "TOTAL SALARY",
  balanceDue: "BALANCE DUE",
  hours: "Hours",
  days: "Days",
  paid: "Paid",
  workJournal: "Work journal",
  payments: "Payments",
  noWork: "No work days yet. Tap + to add one.",
  noPay: "No payments yet. Tap + to add one.",
  exportCsv: "Export CSV",
  addEntry: "Add entry",
  addWorkDay: "Add work day",
  addPayment: "Add payment",
  date: "Date",
  hoursLabel: "Hours",
  hoursPlaceholder: "8 or 12.5",
  address: "Address",
  addressPlaceholder: "e.g. Rambouillet",
  paymentDate: "Payment date",
  paymentAmount: "Payment amount (€)",
  cancel: "Cancel",
  save: "Save",
  deleteConfirm: "Delete this entry?",
  errWork: "Enter a date and hours",
  errPay: "Enter a date and amount",
  payment: "Payment",
  footer: "Your data is stored securely in your account",
  signIn: "Sign in",
  email: "Email",
  password: "Password",
  loginTitle: "Sign in",
  loginError: "Invalid email or password",
  logout: "Log out",
  admin: "Admin",
  worker: "Worker",
  workers: "Workers",
  dashboard: "Dashboard",
  addWorker: "Add worker",
  name: "Name",
  rate: "Rate",
  status: "Status",
  position: "Position",
  totalHours: "Total hours",
  outstanding: "Outstanding",
  viewDetails: "View details",
  back: "Back",
  createWorker: "Create worker",
  statusActive: "Active",
  statusOnLeave: "On leave",
  statusTerminated: "Terminated",
  language: "Language",
  overview: "Overview",
  topHours: "Most hours",
  topBalance: "Highest balance",
  savedAndSynced: "Saved",
  analytics: "Analytics",
  costByMonth: "Cost by month",
  hoursBySite: "Hours by site",
  hoursByWorker: "Hours by worker",
  exportAll: "Export all (CSV)",
  profile: "Profile",
  phone: "Phone",
  birthDate: "Birth date",
  nationality: "Nationality",
  emergencyContact: "Emergency contact",
  notes: "Notes (admin)",
  photoUrl: "Photo (URL)",
  profileSaved: "Profile saved",
  editProfile: "Edit profile",
  annualReport: "Annual report",
  year: "Year",
  print: "Print / PDF",
  month: "Month",
  photo: "Photo",
};

const fr: Dict = {
  appName: "MaysterPRO",
  tagline: "Suivi des jours de travail et des salaires",
  hourlyRate: "Taux horaire (€)",
  salaryTotal: "SALAIRE TOTAL",
  balanceDue: "SOLDE À PAYER",
  hours: "Heures",
  days: "Jours",
  paid: "Payé",
  workJournal: "Journal de travail",
  payments: "Paiements",
  noWork: "Aucun jour de travail. Appuyez sur + pour ajouter.",
  noPay: "Aucun paiement. Appuyez sur + pour ajouter.",
  exportCsv: "Exporter CSV",
  addEntry: "Ajouter",
  addWorkDay: "Ajouter un jour de travail",
  addPayment: "Ajouter un paiement",
  date: "Date",
  hoursLabel: "Heures",
  hoursPlaceholder: "8 ou 12.5",
  address: "Adresse",
  addressPlaceholder: "ex. Rambouillet",
  paymentDate: "Date du paiement",
  paymentAmount: "Montant du paiement (€)",
  cancel: "Annuler",
  save: "Enregistrer",
  deleteConfirm: "Supprimer cette entrée ?",
  errWork: "Saisissez une date et des heures",
  errPay: "Saisissez une date et un montant",
  payment: "Paiement",
  footer: "Vos données sont stockées en toute sécurité dans votre compte",
  signIn: "Se connecter",
  email: "E-mail",
  password: "Mot de passe",
  loginTitle: "Connexion",
  loginError: "E-mail ou mot de passe invalide",
  logout: "Déconnexion",
  admin: "Administrateur",
  worker: "Ouvrier",
  workers: "Ouvriers",
  dashboard: "Tableau de bord",
  addWorker: "Ajouter un ouvrier",
  name: "Nom",
  rate: "Taux",
  status: "Statut",
  position: "Poste",
  totalHours: "Total des heures",
  outstanding: "À payer",
  viewDetails: "Détails",
  back: "Retour",
  createWorker: "Créer l'ouvrier",
  statusActive: "Actif",
  statusOnLeave: "En congé",
  statusTerminated: "Licencié",
  language: "Langue",
  overview: "Aperçu",
  topHours: "Plus d'heures",
  topBalance: "Solde le plus élevé",
  savedAndSynced: "Enregistré",
  analytics: "Analytique",
  costByMonth: "Coût par mois",
  hoursBySite: "Heures par chantier",
  hoursByWorker: "Heures par ouvrier",
  exportAll: "Exporter tout (CSV)",
  profile: "Profil",
  phone: "Téléphone",
  birthDate: "Date de naissance",
  nationality: "Nationalité",
  emergencyContact: "Contact d'urgence",
  notes: "Notes (admin)",
  photoUrl: "Photo (URL)",
  profileSaved: "Profil enregistré",
  editProfile: "Modifier le profil",
  annualReport: "Rapport annuel",
  year: "Année",
  print: "Imprimer / PDF",
  month: "Mois",
  photo: "Photo",
};

const ka: Dict = {
  appName: "MaysterPRO",
  tagline: "სამუშაო დღეებისა და ხელფასის აღრიცხვა",
  hourlyRate: "საათობრივი განაკვეთი (€)",
  salaryTotal: "ჯამური ხელფასი",
  balanceDue: "გადასახდელი ბალანსი",
  hours: "საათები",
  days: "დღეები",
  paid: "გადახდილი",
  workJournal: "სამუშაო ჟურნალი",
  payments: "გადახდები",
  noWork: "სამუშაო დღეები ჯერ არ არის. დასამატებლად დააჭირეთ +.",
  noPay: "გადახდები ჯერ არ არის. დასამატებლად დააჭირეთ +.",
  exportCsv: "CSV ექსპორტი",
  addEntry: "ჩანაწერის დამატება",
  addWorkDay: "სამუშაო დღის დამატება",
  addPayment: "გადახდის დამატება",
  date: "თარიღი",
  hoursLabel: "საათები",
  hoursPlaceholder: "8 ან 12.5",
  address: "მისამართი",
  addressPlaceholder: "მაგ. Rambouillet",
  paymentDate: "გადახდის თარიღი",
  paymentAmount: "გადახდის თანხა (€)",
  cancel: "გაუქმება",
  save: "შენახვა",
  deleteConfirm: "წავშალო ეს ჩანაწერი?",
  errWork: "შეიყვანეთ თარიღი და საათები",
  errPay: "შეიყვანეთ თარიღი და თანხა",
  payment: "გადახდა",
  footer: "თქვენი მონაცემები უსაფრთხოდ ინახება თქვენს ანგარიშში",
  signIn: "შესვლა",
  email: "ელ. ფოსტა",
  password: "პაროლი",
  loginTitle: "სისტემაში შესვლა",
  loginError: "არასწორი ელ. ფოსტა ან პაროლი",
  logout: "გასვლა",
  admin: "ადმინისტრატორი",
  worker: "თანამშრომელი",
  workers: "თანამშრომლები",
  dashboard: "პანელი",
  addWorker: "თანამშრომლის დამატება",
  name: "სახელი",
  rate: "განაკვეთი",
  status: "სტატუსი",
  position: "პოზიცია",
  totalHours: "სულ საათები",
  outstanding: "გადასახდელი",
  viewDetails: "დეტალები",
  back: "უკან",
  createWorker: "თანამშრომლის შექმნა",
  statusActive: "აქტიური",
  statusOnLeave: "შვებულებაში",
  statusTerminated: "გათავისუფლებული",
  language: "ენა",
  overview: "მიმოხილვა",
  topHours: "ყველაზე მეტი საათი",
  topBalance: "ყველაზე დიდი ბალანსი",
  savedAndSynced: "შენახულია",
  analytics: "ანალიტიკა",
  costByMonth: "ხარჯი თვეების მიხედვით",
  hoursBySite: "საათები ობიექტების მიხედვით",
  hoursByWorker: "საათები თანამშრომლების მიხედვით",
  exportAll: "ყველას ექსპორტი (CSV)",
  profile: "პროფილი",
  phone: "ტელეფონი",
  birthDate: "დაბადების თარიღი",
  nationality: "მოქალაქეობა",
  emergencyContact: "საგანგებო კონტაქტი",
  notes: "შენიშვნები (ადმინი)",
  photoUrl: "ფოტო (URL)",
  profileSaved: "პროფილი შენახულია",
  editProfile: "პროფილის რედაქტირება",
  annualReport: "წლიური ანგარიში",
  year: "წელი",
  print: "ბეჭდვა / PDF",
  month: "თვე",
  photo: "ფოტო",
};

export const dictionaries: Record<Locale, Dict> = { ka, en, uk, fr };

export function getDict(locale: string): Dict {
  return dictionaries[(locale as Locale)] ?? dictionaries[DEFAULT_LOCALE];
}
