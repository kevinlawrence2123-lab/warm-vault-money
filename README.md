# MyBudget: Your Financial Compass

Build a mobile-first personal finance management web app called "MyBudget".

## App overview

MyBudget helps users track all their expenses and income, organize them by 

category, set savings goals, and follow monthly budgets. The goal is a 

single, centralized, easy-to-use tool to replace scattered notes and bank 

apps for personal budgeting.

## Design system

- Dark theme, near-black background (#0E0D0C)

- Warm cream/off-white (#F5EFE3) for primary text and light card surfaces

- Bold yellow accent (#F4C10F) used sparingly for CTAs, active states, key 

  numbers, and progress indicators

- Avoid neon/oversaturated colors — soft, refined contrast, premium feel, 

  inspired by the clean minimal style of the OKX crypto app

- Rounded cards (20-28px radius), some with a subtle wavy/organic bottom edge

- Floating pill-shaped top bar (search, notifications, profile avatar)

- Circular dark "glass" icon buttons

- Bold oversized sans-serif typography for monetary amounts

- Generous spacing, soft shadows instead of hard borders

- Mobile-first responsive layout, bottom tab navigation (Home, Transactions, 

  Goals, Budget, Profile)

## Authentication

- Email/password sign up and login

- Optional biometric/PIN lock setting (store preference, no need to 

  implement real biometrics in web)

- User profile: name, email, avatar, preferred currency, language, theme

## Core data model

- **users**: id, name, email, currency, language, created_at

- **accounts**: id, user_id, name, type (bank, cash, mobile_money, savings), 

  balance

- **categories**: id, user_id (nullable for default categories), name, icon, 

  type (expense/income), color

- **transactions**: id, user_id, account_id, category_id, amount, type 

  (expense/income), date, note, receipt_url (optional), payment_method

- **savings_goals**: id, user_id, name, icon, target_amount, current_amount, 

  target_date, status (in_progress/completed)

- **goal_contributions**: id, goal_id, amount, date

- **budgets**: id, user_id, category_id, month, limit_amount

## Screens & features to build

### 1. Onboarding / Auth

Simple sign up / login screens matching the design system. After first 

login, a short onboarding asking for currency and (optionally) creating a 

first savings goal.

### 2. Home Dashboard

- Total balance in large bold text, with a period-over-period change badge

- Line/area chart of balance evolution (toggle: 1D/1W/1M/3M/1Y)

- Two stat cards: "Spent this month" and "Saved this month"

- Horizontally scrollable savings goals preview (icon, name, progress bar)

- Recent transactions list (last 5-10)

- Floating "+" button to add a transaction

### 3. Add/Edit Transaction

- Large numeric amount input

- Expense/Income toggle

- Category picker (horizontal scrollable icons, default categories: Food, 

  Transport, Housing, Leisure, Health, Subscriptions, Other — user can add 

  custom categories)

- Date picker, payment method selector, optional note and photo receipt 

  upload

- Save button

### 4. Transactions History

- Search and filter (by category, date range, account)

- Transactions grouped by date with sticky date headers

- Each row: category icon, label, subcategory, amount (colored by type)

- Monthly total summary

- Export data as CSV button

### 5. Savings Goals

- List of all goals with progress bars

- Create goal flow: name, icon, target amount, target date

- Goal detail view: circular progress ring, current vs target amount, days 

  remaining, contribution history chart, "Add funds" action

- Celebration state when a goal is completed

### 6. Budget

- Month selector

- Donut chart of spending by category

- List of budget categories with progress bars (yellow = on track, 

  red-orange = near/over limit)

- Ability to set/edit a monthly limit per category

- Alert banner when a category is close to or over its limit

### 7. Accounts

- List of accounts (bank, cash, mobile money, savings) with individual 

  balances

- Add/edit/delete account manually

- Note in the UI (as a disabled/"coming soon" state): automatic bank, mobile 

  banking, and mobile money (Nita, Amana) synchronization will be added in a 

  future phase — do not attempt to build real bank/mobile money API 

  integrations, this MVP only needs manual account management

### 8. Profile & Settings

- Profile info edit

- "Connect Data" section (visually present, but connections are 

  manual/placeholder for now — bank, mobile banking, Nita, Amana shown as 

  "Connect" buttons that open a "Coming soon" state)

- Notification preferences

- Currency & language

- Security (PIN/biometric toggle — UI only)

- Export my data

- Dark/light mode is fixed dark theme for now (toggle can be a placeholder)

- Log out

## Technical requirements

- Use Supabase for authentication and database (tables as described above), 

  row-level security so each user only sees their own data

- Responsive layout that works well on mobile screen sizes first, then 

  scales up

- Use charts (line, donut/pie, bar) for the dashboard and budget screens

- All monetary values formatted according to the user's selected currency

- Clean, reusable component structure (cards, list items, progress bars, 

  category icons) following the design system above consistently across all 

  screens

## Out of scope for this first version

- Real bank/mobile banking/Nita/Amana API integrations (UI placeholders only)

- AI-based auto-categorization

- Shared/family budgets

- Push notifications (in-app notification UI only)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://warm-vault-money.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/686b4481-a6d7-4e74-9a29-4932de7bd985).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
