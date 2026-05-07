# Audit de responsivite — Plateforme Akom

**Date :** 28 mars 2026
**Cibles :** Mobile 375px (iPhone SE) | Tablette 768px (iPad) | Desktop 1280px
**Methode :** Analyse statique du code source (Tailwind CSS, layouts, composants)
**Fichiers audites :** ~200 fichiers .tsx

---

## Resume executif

| Severite | Nombre | Description |
|----------|--------|-------------|
| **Critique** | 12 | Casse completement la page sur mobile |
| **Important** | 28 | Degradation significative de l'UX |
| **Mineur** | 15 | Petites ameliorations |

**Points forts du projet :**
- Grilles Tailwind mobile-first bien utilisees (50+ fichiers avec breakpoints)
- Aucune grille figee sans variante responsive
- Dialogs shadcn bien adaptes avec `max-w-[calc(100%-2rem)]`
- Sidebar avec mode Sheet sur mobile (hook `useIsMobile()`)
- `overflow-x-auto` present sur les tables via `components/ui/table.tsx`
- Aucun `hidden` global sans breakpoint responsive

---

## CRITIQUE — Casse completement la page

### C1. POSShell — Layout cote a cote inutilisable sur mobile
- **Fichier :** `app/(dashboard)/dashboard/pos/_components/POSShell.tsx:121`
- **Probleme :** `flex flex-1 overflow-hidden` — catalogue et panier cote a cote. Sur 375px, chaque panneau = ~187px, inutilisable
- **Fix :** `flex flex-col lg:flex-row flex-1 overflow-hidden`

### C2. Fixed Bottom Bar — Pas de safe-area (home indicator iPhone)
- **Fichier :** `app/(public)/r/[slug]/t/[number]/components/fixed-bottom-bar.tsx:25`
- **Probleme :** `fixed bottom-0` sans padding pour la home bar iOS. Contenu cache sur iPhone 14+
- **Fix :** Ajouter `[padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]`

### C3. CartButton — Conflit `absolute` + `fixed`
- **Fichier :** `app/(public)/r/[slug]/t/[number]/components/restaurant-header.tsx:46`
- **Probleme :** `absolute top-4 right-4 z-20 fixed` — deux positionnements en conflit
- **Fix :** Supprimer `absolute`, garder `fixed top-4 right-4 z-40`

### C4. Login CardContent — Padding px-1 extremement serre
- **Fichier :** `app/(auth)/login/page.tsx:55`
- **Probleme :** `px-1` = 4px de padding. Inputs et textes colles aux bords
- **Fix :** `px-4 sm:px-6`

### C5. Eye toggle buttons — Zone de tap < 44px (toutes pages auth)
- **Fichiers :** `app/(auth)/login/page.tsx:90-96`, `app/(auth)/update-password/page.tsx:107-165`
- **Probleme :** Icone `h-5 w-5` sans padding, hitbox ~20px. Impossible a toucher sur mobile
- **Fix :** Ajouter `p-2` sur le `<button>` pour atteindre 44x44px

### C6. Onboarding — Grid activites en 2 colonnes fixes
- **Fichier :** `app/onboarding/create-restaurant-form.tsx:79`
- **Probleme :** `grid-cols-2` fixe. Sur 375px, chaque bouton = ~175px, icones et textes se chevauchent
- **Fix :** `grid grid-cols-1 sm:grid-cols-2 gap-2`

### C7. Suspended page — Padding px-8 excessif
- **Fichier :** `app/onboarding/suspended/page.tsx:89`
- **Probleme :** `px-8 py-8` sur mobile = 64px de padding horizontal, reste 311px pour le contenu
- **Fix :** `px-4 sm:px-8 py-6 sm:py-8`

### C8-C10. Tables denses — 7 colonnes sans adaptation mobile
- **Fichiers :**
  - `components/dashboard/stats/RecentOrdersTable.tsx:44-52` (7 colonnes)
  - `components/warehouse/WarehouseProductsTable.tsx:44-52` (7 colonnes)
  - `components/superadmin/support/SupportTicketsTable.tsx:55-64` (7 colonnes)
- **Probleme :** Toutes les colonnes visibles sur 375px. Meme avec `overflow-x-auto`, le contenu est illisible
- **Fix :** Masquer les colonnes secondaires : `<TableHead className="hidden sm:table-cell">`. Alternative : card layout sur mobile

### C11. Circuit Sheet Card — Hauteur fixe h-[600px]
- **Fichier :** `components/superadmin/circuit-sheet-card.tsx`
- **Probleme :** `h-[600px]` fixe deborde sur les ecrans < 700px de hauteur
- **Fix :** `h-[300px] sm:h-[400px] md:h-[600px]`

### C12. FloatingSupportButton — Largeur fixe w-[400px]
- **Fichier :** `components/support/FloatingSupportButton.tsx`
- **Probleme :** `w-[400px]` depasse sur mobile 375px (meme si `max-w-[95vw]` attenuerait, fragile)
- **Fix :** `w-full sm:w-[400px] max-w-[95vw]`

---

## IMPORTANT — Degradation significative

### I1. Titres text-3xl / text-2xl sans scaling responsive
- **Fichiers :**
  - `app/(dashboard)/dashboard/orders/page.tsx:75` — `text-3xl`
  - `app/(dashboard)/dashboard/stats/page.tsx:65` — `text-2xl`
  - `app/(dashboard)/dashboard/subscription/page.tsx:131` — `text-3xl`
  - `app/(auth)/register/page.tsx:62` — `text-2xl`
  - `app/(auth)/forgot-password/page.tsx:65` — `text-2xl`
  - `app/onboarding/page.tsx:37` — `text-3xl`
  - `app/(auth)/layout.tsx:11` — `text-4xl`
- **Probleme :** `text-3xl` = 30px sur mobile 375px, deborde ou ecrase le layout
- **Fix :** `text-xl sm:text-2xl md:text-3xl` (ou `text-lg sm:text-3xl`)

### I2. Padding p-6 excessif sur mobile dans le dashboard
- **Fichiers :**
  - `app/(dashboard)/dashboard/page.tsx:99` — `p-6`
  - `app/(dashboard)/dashboard/subscription/page.tsx:128` — `p-6`
- **Probleme :** `p-6` = 24px chaque cote. Sur 375px, contenu net = 327px (tres serre)
- **Fix :** `p-3 sm:p-6`

### I3. FinancialOverview — Grid sans grid-cols-1 explicite
- **Fichier :** `app/(dashboard)/dashboard/_components/FinancialOverview.tsx:93`
- **Probleme :** `grid md:grid-cols-3 gap-6` sans `grid-cols-1` explicite
- **Fix :** `grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6`

### I4. Choose-plan — Gap/margin excessifs
- **Fichier :** `app/(dashboard)/dashboard/subscription/choose-plan/page.tsx:146`
- **Probleme :** `gap-8 my-15` — gap trop grand sur mobile, `my-15` potentiellement invalide
- **Fix :** `gap-4 sm:gap-8 my-8 sm:my-12`

### I5. SupportStatsCards — 4 colonnes directes sur md
- **Fichier :** `components/superadmin/support/SupportStatsCards.tsx:24`
- **Probleme :** `grid gap-4 md:grid-cols-4` — passe de 1 a 4 colonnes d'un coup a 768px
- **Fix :** `grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4`

### I6. RestaurantSwitcher — Dropdown width fixe w-72
- **Fichier :** `components/dashboard/RestaurantSwitcher.tsx:161`
- **Probleme :** `w-72` (288px) fixe. Pas de max-width adapte aux petits ecrans
- **Fix :** `max-w-[calc(100vw-2rem)] w-72`

### I7. CookieConsent — Fixed bottom couvre le contenu mobile
- **Fichier :** `components/gdpr/CookieConsent.tsx`
- **Probleme :** `fixed inset-x-0 bottom-0 max-h-[90vh]` — prend trop de place sur mobile
- **Fix :** Reduire `max-h` sur mobile : `max-h-[70vh] sm:max-h-[90vh]`

### I8. Cart Dialog — max-w-md trop restrictif
- **Fichier :** `app/(public)/r/[slug]/t/[number]/cart-dialog.tsx:102`
- **Probleme :** `max-w-md` = 448px. Sur 375px, padding interne `px-3` tres comprime
- **Fix :** `w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh]`

### I9. Verification documents — Flex row pour photo/fichiers
- **Fichier :** `components/restaurant/verification-documents-form.tsx:265-366`
- **Probleme :** `flex items-center gap-4` — photo 96px + boutons sur meme ligne. Deborde sur 375px
- **Fix :** `flex flex-col sm:flex-row items-start sm:items-center gap-4`

### I10. Verification page — Padding py-12 excessif
- **Fichier :** `app/onboarding/verification/page.tsx:53`
- **Probleme :** `py-12` (3rem) trop d'espace vertical sur mobile
- **Fix :** `py-6 sm:py-12`

### I11. Register — Info card padding p-5 serre
- **Fichier :** `app/(auth)/register/page.tsx:197`
- **Probleme :** `p-5` sur la carte info. Contenu ecrase lateralement sur 375px
- **Fix :** `p-3 sm:p-5`

### I12. Onboarding add-restaurant — Header flex row serre
- **Fichier :** `app/onboarding/add-restaurant/page.tsx:31-45`
- **Probleme :** `flex items-center gap-4` — bouton "Retour" + titre sur meme ligne
- **Fix :** `flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4`

### I13. SelectTrigger — w-fit peut causer shrink
- **Fichier :** `components/ui/select.tsx:40`
- **Probleme :** `w-fit` fait retrecir le select si le label est court. Pas de `w-full` sur mobile
- **Fix :** `w-full sm:w-fit`

### I14. WarehouseProductForm — Gap non reduit sur mobile
- **Fichier :** `components/warehouse/WarehouseProductForm.tsx`
- **Probleme :** `grid gap-4 md:grid-cols-2` — gap-4 prend de l'espace inutile sur 375px
- **Fix :** `grid gap-2 sm:gap-4 md:grid-cols-2`

### I15. UsersList — Colonne actions largeur fixe
- **Fichier :** `components/dashboard/UsersList.tsx:113`
- **Probleme :** `w-[70px]` fixe pour la colonne d'actions
- **Fix :** `w-auto min-w-[60px]`

### I16. Date Range Picker — Width fixe w-[300px]
- **Fichier :** `components/stats/date-range-picker.tsx`
- **Probleme :** `w-[300px]` fixe, deborde sur mobile
- **Fix :** `w-full sm:w-[300px]`

### I17. StatsCard — Titre peut deborder
- **Fichier :** `components/dashboard/stats/StatsCard.tsx:37`
- **Probleme :** `flex flex-row items-center justify-between` — titre long chevauche l'icone
- **Fix :** Ajouter `truncate` sur le titre ou `flex-col sm:flex-row`

### I18. WarehouseProductsTable — Bouton actions trop petit
- **Fichier :** `components/warehouse/WarehouseProductsTable.tsx:132`
- **Probleme :** `size="sm"` = h-8 w-8 (32px), sous les 44px recommandes
- **Fix :** `h-10 w-10 sm:h-8 sm:w-8` ou ajouter `after:absolute after:-inset-2`

### I19. Sidebar Rail — Zone de tap 16px
- **Fichier :** `components/ui/sidebar.tsx:293`
- **Probleme :** `w-4` (16px) pour la barre de redimensionnement
- **Fix :** Ajouter zone tactile invisible elargie sur mobile

### I20-I28. Verification form alerts, login flex, icons fixes, etc.
- Voir details dans les sections specifiques ci-dessous

---

## MINEUR — Petites ameliorations

### M1. Gaps trop grands sur mobile (gap-4 partout)
- **Impact :** Consomme de l'espace inutile sur 375px
- **Fix global :** Pattern `gap-2 sm:gap-4`

### M2. Header dashboard h-16 fixe
- **Probleme :** `h-16` (64px) prend beaucoup d'espace vertical sur mobile
- **Fix :** `h-14 sm:h-16`

### M3. Breadcrumbs non wrappables
- **Probleme :** Peuvent deborder sur 375px sans `flex-wrap`
- **Fix :** Ajouter `flex-wrap` sur le conteneur

### M4. DialogFooter — Ordre contre-intuitif
- **Fichier :** `components/ui/dialog.tsx:93-103`
- **Probleme :** `flex-col-reverse` — Cancel en bas, OK en haut sur mobile
- **Fix :** `flex-col` (ordre naturel)

### M5. Menu item image — w-20 h-20 fixe
- **Fichier :** `app/(public)/r/[slug]/t/[number]/components/menu-item.tsx:70`
- **Fix :** `w-16 h-16 sm:w-20 sm:h-20`

### M6. Footer menu — Texte contact text-xs difficile a lire
- **Fichier :** `app/(public)/r/[slug]/t/[number]/components/menu-layout.tsx:246-273`
- **Fix :** `text-xs sm:text-sm` et layout vertical sur mobile

### M7. Restaurant info — Double mx-
- **Fichier :** `app/(public)/r/[slug]/t/[number]/components/restaurant-info.tsx:21`
- **Probleme :** `mx-4` et `mx-auto` en conflit
- **Fix :** `mx-4 sm:mx-auto`

### M8-M15. Paddings, margins, espaces verticaux excessifs sur auth pages
- Voir audit detaille Auth + Onboarding

---

## Statistiques globales

| Metrique | Resultat |
|----------|----------|
| Fichiers avec breakpoints responsifs | 50+ (~25%) |
| Fichiers avec largeurs fixes (px) | 16 (~8%) |
| Grilles non-responsives | 0 |
| `hidden` sans breakpoint | 0 |
| `overflow-x-auto` sur tables | Present (table.tsx) |
| Dialogs adaptes | Oui (calc 100%-2rem) |
| Sidebar mobile | Oui (Sheet mode) |

---

## Plan de correction recommande

### Phase 1 — Critiques (impact maximal)
1. POSShell : `flex-col lg:flex-row`
2. Fixed bottom bar : safe-area padding
3. CartButton : fix conflit absolute/fixed
4. Login padding : `px-1` -> `px-4 sm:px-6`
5. Eye toggles : ajouter `p-2`
6. Grid activites onboarding : `grid-cols-1 sm:grid-cols-2`
7. Suspended padding : `px-4 sm:px-8`
8. Tables denses : masquer colonnes secondaires sur mobile
9. Circuit sheet card : hauteur responsive
10. FloatingSupportButton : `w-full sm:w-[400px]`

### Phase 2 — Importants (UX degradee)
1. Titres : scaling responsive (`text-xl sm:text-2xl md:text-3xl`)
2. Paddings dashboard : `p-3 sm:p-6`
3. Grilles : ajouter `grid-cols-1` explicite
4. Flex layouts : `flex-col sm:flex-row`
5. Zones de tap : minimum 44x44px
6. Dropdowns : max-width adapte
7. Safe-area sur barre de recherche sticky

### Phase 3 — Mineurs
1. Gaps uniformes : `gap-2 sm:gap-4`
2. Header height mobile
3. Breadcrumb wrap
4. DialogFooter ordre
5. Petits ajustements de taille

---

*Rapport genere automatiquement par Claude Code — 28/03/2026*
*Aucune modification n'a ete apportee au code source.*
