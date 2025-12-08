# I18n Audit Report - Puuttuvat käännökset

Tämä raportti sisältää kaikki kovakoodatut tekstit React-sovelluksessa (`src/`-kansio), jotka eivät käytä `t()`-funktiota käännöksiin.

## Yhteenveto

- **Skannattuja tiedostoja:** ~120 .jsx ja .js tiedostoa
- **Löydettyjä puutteita:** Useita kymmeniä kovakoodattuja tekstejä
- **Kriittiset sivut:** AdminPage, AccountManagerPage, OrganizationMembersPage, AdminBlogPage, AdminTestimonialsPage, LeadMagnetPage, EmailMarketingPage, ReportsPage, MonthlyLimitWarning, InactivityWarningModal, OnboardingModal

---

## 1. AdminPage.jsx

**Tiedostopolku:** `src/pages/AdminPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 117 | "Virhe tietojen lataamisessa: " | `admin.errors.loadingData` | "Error loading data: " |
| 189 | "Virhe roolin päivittämisessä: " | `admin.errors.updatingRole` | "Error updating role: " |
| 217 | "Virhe kentän {field} päivittämisessä: " | `admin.errors.updatingField` | "Error updating field {field}: " |
| 300 | "Oletko varma, että haluat poistaa tämän käyttäjän?" | `admin.confirmDelete.user` | "Are you sure you want to delete this user?" |
| 311 | "Virhe käyttäjän poistamisessa: " | `admin.errors.deletingUser` | "Error deleting user: " |
| 316 | "Oletko varma, että haluat poistaa tämän sisällön?" | `admin.confirmDelete.content` | "Are you sure you want to delete this content?" |
| 327 | "Virhe sisällön poistamisessa: " | `admin.errors.deletingContent` | "Error deleting content: " |
| 451 | "Pääsy estetty" | `admin.accessDenied.title` | "Access denied" |
| 452 | "Sinulla ei ole oikeuksia admin-paneeliin." | `admin.accessDenied.message` | "You don't have permission to access the admin panel." |
| 461 | "Admin Hallinta" | `admin.header.title` | "Admin Management" |
| 462 | "Järjestelmän hallintapaneeli" | `admin.header.subtitle` | "System administration panel" |
| 477 | "Käyttäjät ({users.length})" | `admin.tabs.users` | "Users ({count})" |
| 483 | "Sisältö ({content.length})" | `admin.tabs.content` | "Content ({count})" |
| 489 | "Puhelut ({callLogs.length})" | `admin.tabs.calls` | "Calls ({count})" |
| 495 | "Viestit ({messageLogs.length})" | `admin.tabs.messages` | "Messages ({count})" |
| 501 | "Segmentit ({segments.length})" | `admin.tabs.segments` | "Segments ({count})" |
| 507 | "Järjestelmä" | `admin.tabs.system` | "System" |
| 513 | "Ladataan..." | `common.loading` | "Loading..." |
| 519 | "Käyttäjät ({filteredUsers.length})" | `admin.users.title` | "Users ({count})" |
| 525 | "Piilota ID:t" / "Näytä ID:t" | `admin.users.toggleIds` | "Hide IDs" / "Show IDs" |
| 530 | "Hae nimen, sähköpostin tai yrityksen perusteella..." | `admin.users.searchPlaceholder` | "Search by name, email, or company..." |
| 543-552 | Taulukon otsikot | `admin.users.tableHeaders.*` | Table headers |
| 558 | "Nimeä ei asetettu" | `admin.users.noName` | "Name not set" |
| 566-568 | Roolivalinnat | `admin.roles.*` | Role options |
| 571 | "Ei yritystä" | `admin.users.noCompany` | "No company" |
| 578-580 | Tilausvaihtoehdot | `admin.subscription.*` | Subscription options |
| 595 | "Kytketty" / "Ei kytketty" | `admin.crm.connected` / `.notConnected` | "Connected" / "Not connected" |
| 615 | "Näytä" | `admin.features.show` | "Show" |
| 620 | Feature-nimet | `admin.features.names.*` | Feature names |
| 650 | "Muokkaa teknisiä ID:tä" | `admin.users.editTechnicalIds` | "Edit technical IDs" |
| 652 | "Muokkaa" | `common.edit` | "Edit" |
| 657 | "Poista käyttäjä" | `admin.users.deleteUser` | "Delete user" |
| 659 | "Poista" | `common.delete` | "Delete" |
| 674 | Modal-otsikko | `admin.users.editModal.title` | "Edit {name} user information" |
| 677 | "Tallentamattomia muutoksia" | `admin.users.unsavedChanges` | "Unsaved changes" |
| 691-733 | Synthflow-kentät | `admin.users.synthflow.*` | Synthflow fields |
| 738-788 | Käyttäjätiedot-kentät | `admin.users.userInfo.*` | User info fields |
| 793-850 | Alustat-valinta | `admin.users.platforms.*` | Platforms selection |
| 871 | "Tallennetaan..." / "Tallenna" | `common.saving` / `.save` | "Saving..." / "Save" |
| 885 | "Sisältö" | `admin.content.title` | "Content" |
| 890-895 | Sisältötaulukon otsikot | `admin.content.tableHeaders.*` | Content table headers |
| 901-916 | Sisältörivit | `admin.content.*` | Content rows |
| 928 | "Puhelut" | `admin.calls.title` | "Calls" |
| 932-937 | Puhelutaulukon otsikot | `admin.calls.tableHeaders.*` | Call table headers |
| 958 | "Viestit / kuukausi" | `admin.messages.title` | "Messages / month" |
| 961 | "Ladataan viestejä..." | `admin.messages.loading` | "Loading messages..." |
| 964 | "Virhe viestien lataamisessa: {error}" | `admin.messages.error` | "Error loading messages: {error}" |
| 969 | "Yritä uudelleen" | `common.retry` | "Try again" |
| 974 | "Ei viestejä löytynyt." | `admin.messages.empty` | "No messages found." |
| 980-983 | Viestitaulukon otsikot | `admin.messages.tableHeaders.*` | Message table headers |
| 990-992 | Kuukausien nimet | `admin.months.*` | Month names |
| 1029 | "Virhe tietojen käsittelyssä" | `admin.messages.processingError` | "Error processing data" |
| 1044 | "Segmentit" | `admin.segments.title` | "Segments" |
| 1049-1054 | Segmenttitaulukon otsikot | `admin.segments.tableHeaders.*` | Segment table headers |
| 1078 | "Järjestelmän tiedot" | `admin.system.title` | "System information" |
| 1081-1103 | Järjestelmäkortit | `admin.system.cards.*` | System cards |

---

## 2. AccountManagerPage.jsx

**Tiedostopolku:** `src/pages/AccountManagerPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 44 | "Virhe käyttäjän tiedoissa" | `accountManager.errors.loadingUser` | "Error loading user information" |
| 102 | "Virhe tilien lataamisessa" | `accountManager.errors.loadingAccounts` | "Error loading accounts" |
| 121 | "Ladataan tilejä..." | `accountManager.loading` | "Loading accounts..." |
| 129 | "Salkun hallinta" | `accountManager.header.title` | "Portfolio Management" |
| 131-134 | Header-teksti | `accountManager.header.description.*` | Header description |
| 148 | "Etsi käyttäjän perusteella..." | `accountManager.searchPlaceholder` | "Search by user..." |
| 159 | "Yhteensä käyttäjiä" | `accountManager.stats.totalUsers` | "Total users" |
| 165 | "Yhteensä postauksia" | `accountManager.stats.totalPosts` | "Total posts" |
| 172 | "Ei löytynyt käyttäjiä hakuehtojen perusteella" | `accountManager.empty.noResults` | "No users found matching search criteria" |
| 173 | "Sinulle ei ole vielä määritetty käyttäjiä" | `accountManager.empty.noUsers` | "You haven't been assigned any users yet" |
| 180 | "Yrityksen nimi puuttuu" | `accountManager.card.noCompanyName` | "Company name missing" |
| 188-214 | Kortin kentät | `accountManager.card.*` | Card fields |
| 222 | "Näytä tiedot" | `accountManager.card.viewDetails` | "View details" |

---

## 3. EmailMarketingPage.jsx

**Tiedostopolku:** `src/pages/EmailMarketingPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 11 | "Sähköpostimarkkinointi" | `emailMarketing.title` | "Email Marketing" |

---

## 4. OrganizationMembersPage.jsx

**Tiedostopolku:** `src/pages/OrganizationMembersPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 38 | "Ei kirjautumistietoja" | `organization.errors.noAuth` | "No authentication credentials" |
| 54 | "Virhe jäsenten haussa" | `organization.errors.fetchingMembers` | "Error fetching members" |
| 97 | "Virhe käyttäjän kutsussa" | `organization.errors.invitingMember` | "Error inviting member" |
| 128 | "Virhe roolin päivityksessä" | `organization.errors.updatingRole` | "Error updating role" |
| 133 | "Haluatko varmasti poistaa tämän jäsenen organisaatiosta?" | `organization.confirmDelete.member` | "Are you sure you want to remove this member from the organization?" |
| 160 | "Virhe jäsenen poistamisessa" | `organization.errors.removingMember` | "Error removing member" |
| 169 | "Organisaation hallinta" | `organization.header.title` | "Organization Management" |
| 173 | "Ei oikeuksia" | `organization.accessDenied.title` | "No permissions" |
| 174 | "Sinulla ei ole oikeuksia tarkastella organisaation jäseniä." | `organization.accessDenied.message` | "You don't have permission to view organization members." |
| 206 | "Peruuta" / "Kutsu käyttäjä" | `common.cancel` / `organization.inviteUser` | "Cancel" / "Invite user" |
| 219 | "Kutsu uusi käyttäjä" | `organization.invite.title` | "Invite new user" |
| 222 | "Sähköposti" | `common.email` | "Email" |
| 229 | "kayttaja@example.com" | `organization.invite.emailPlaceholder` | "user@example.com" |
| 234 | "Rooli" | `organization.role.label` | "Role" |
| 241-244 | Roolivalinnat | `organization.roles.*` | Role options |
| 250 | "Kutsutaan..." / "Kutsu" | `organization.invite.inviting` / `.invite` | "Inviting..." / "Invite" |
| 261 | "Peruuta" | `common.cancel` | "Cancel" |
| 269 | "Jäsenet" | `organization.members.title` | "Members" |
| 271 | "Ladataan..." | `common.loading` | "Loading..." |
| 275 | "Ei jäseniä" | `organization.members.empty` | "No members" |
| 281-284 | Taulukon otsikot | `organization.members.tableHeaders.*` | Table headers |
| 321 | "Ei sähköpostia" | `organization.members.noEmail` | "No email" |
| 335-336 | Roolimerkinnät | `organization.roles.*` | Role badges |
| 348 | "Poista" | `common.delete` | "Delete" |
| 351 | "Sinä" | `organization.members.you` | "You" |

---

## 5. ReportsPage.jsx

**Tiedostopolku:** `src/pages/ReportsPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 7 | "Puhelut" | `reports.title` | "Reports" |
| 9 | "Tämä on raporttisivu..." | `reports.placeholder` | "This is the reports page. Add reports functionality later." |

---

## 6. AdminTestimonialsPage.jsx

**Tiedostopolku:** `src/pages/AdminTestimonialsPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 56 | "Poistetaanko?" | `adminTestimonials.confirmDelete` | "Delete?" |
| 109 | "Muokkaa suositusta" / "Lisää uusi suositus" | `adminTestimonials.edit` / `.addNew` | "Edit testimonial" / "Add new testimonial" |
| 112-122 | Lomakekentät | `adminTestimonials.form.*` | Form fields |
| 138 | "Vain kuvatiedostot sallittu" | `adminTestimonials.errors.onlyImages` | "Only image files allowed" |
| 139 | "Kuva on liian suuri (max 5MB)" | `adminTestimonials.errors.imageTooLarge` | "Image is too large (max 5MB)" |
| 152 | "Ladataan esikatselua…" | `adminTestimonials.uploading.preview` | "Loading preview..." |
| 157 | "Kuvan esikatselu" | `adminTestimonials.imagePreview` | "Image preview" |
| 163 | "Poista kuva" | `adminTestimonials.removeImage` | "Remove image" |
| 171 | "Raahaa kuva tähän tai klikkaa valitaksesi" | `adminTestimonials.dragDrop.text` | "Drag image here or click to select" |
| 172 | "Tuetut formaatit: JPG, PNG, GIF (max 5MB)" | `adminTestimonials.dragDrop.formats` | "Supported formats: JPG, PNG, GIF (max 5MB)" |
| 196 | "Tai syötä kuvan URL manuaalisesti" | `adminTestimonials.manualUrl` | "Or enter image URL manually" |
| 207 | "Julkaistu" | `adminTestimonials.published` | "Published" |
| 273 | "Tallennus epäonnistui: " | `adminTestimonials.errors.saveFailed` | "Save failed: " |
| 277 | "Tallenna" / "Lähetä" | `common.save` / `.submit` | "Save" / "Submit" |
| 289 | "Lista" | `adminTestimonials.list.title` | "List" |
| 293 | "Ladataan…" | `common.loading` | "Loading..." |
| 310 | "Julkaistu" / "Piilotettu" | `adminTestimonials.status.published` / `.hidden` | "Published" / "Hidden" |
| 314 | "Muokkaa" | `common.edit` | "Edit" |
| 315 | "Poista" | `common.delete` | "Delete" |
| 336 | "Hallinta" | `adminTestimonials.header.title` | "Management" |
| 337 | "Testimonials" | `adminTestimonials.header.subtitle` | "Testimonials" |

---

## 7. AdminBlogPage.jsx

**Tiedostopolku:** `src/pages/AdminBlogPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 46 | "Virhe artikkeleiden haussa: " | `adminBlog.errors.fetchingArticles` | "Error fetching articles: " |
| 54 | "Artikkeleita ei voitu ladata..." | `adminBlog.errors.loadingArticles` | "Articles could not be loaded..." |
| 88 | "Kuva on pakollinen!..." | `adminBlog.errors.imageRequired` | "Image is required!..." |
| 125 | "Artikkelia ei voitu päivittää" | `adminBlog.errors.updatingArticle` | "Could not update article" |
| 131 | "Artikkeli päivitetty!" | `adminBlog.success.articleUpdated` | "Article updated!" |
| 138 | "Kuva on pakollinen uuden artikkelin lisäämisessä!" | `adminBlog.errors.imageRequiredNew` | "Image is required for new articles!" |
| 168 | "Artikkelia ei voitu tallentaa" | `adminBlog.errors.savingArticle` | "Could not save article" |
| 174 | "Artikkeli lisätty!" | `adminBlog.success.articleAdded` | "Article added!" |
| 187 | "Virhe artikkelin tallennuksessa:" | `adminBlog.errors.savingArticleGeneral` | "Error saving article:" |
| 216 | "Oletko varma, että haluat poistaa tämän artikkelin?" | `adminBlog.confirmDelete.article` | "Are you sure you want to delete this article?" |
| 227 | "Virhe artikkelin poistossa: " | `adminBlog.errors.deletingArticle` | "Error deleting article: " |
| 232 | "Artikkeli poistettu!" | `adminBlog.success.articleDeleted` | "Article deleted!" |
| 235 | "Virhe artikkelin poistossa:" | `adminBlog.errors.deletingArticleGeneral` | "Error deleting article:" |
| 328 | "Vain kuvatiedostot ovat sallittuja" | `adminBlog.errors.onlyImages` | "Only image files allowed" |
| 335 | "Kuva on liian suuri. Maksimikoko on 5MB." | `adminBlog.errors.imageTooLarge` | "Image is too large. Max size is 5MB." |
| 360 | "Kuva valittu!..." | `adminBlog.success.imageSelected` | "Image selected!..." |
| 362 | "Virhe kuvan käsittelyssä: " | `adminBlog.errors.processingImage` | "Error processing image: " |
| 371 | "Virhe kuvan käsittelyssä: " | `adminBlog.errors.processingImageGeneral` | "Error processing image: " |
| 378 | "Hallinta - RascalAI.fi" | `adminBlog.meta.title` | "Management - RascalAI.fi" |
| 378 | "Hallitse artikkeleita ja testimoniaaleja" | `adminBlog.meta.description` | "Manage articles and testimonials" |
| 385 | "Hallinta" | `adminBlog.header.title` | "Management" |
| 386 | "Artikkelit ja Testimonials" | `adminBlog.header.subtitle` | "Articles and Testimonials" |
| 389 | "+ Lisää uusi artikkeli" | `adminBlog.addNewArticle` | "+ Add new article" |
| 394 | "Artikkelit" / "Testimonials" | `adminBlog.tabs.articles` / `.testimonials` | "Articles" / "Testimonials" |
| 403 | "Muokkaa artikkelia" / "Lisää uusi artikkeli" | `adminBlog.modal.editTitle` / `.addTitle` | "Edit article" / "Add new article" |
| 412-461 | Lomakekentät | `adminBlog.form.*` | Form fields |
| 468-472 | Artikkelin esikatselu | `adminBlog.preview.*` | Article preview |
| 477-509 | Julkaisustatus | `adminBlog.publishStatus.*` | Publish status |
| 514-580 | Kuvan lataus | `adminBlog.imageUpload.*` | Image upload |
| 583-622 | Muut lomakekentät | `adminBlog.form.*` | Other form fields |
| 632 | "Ladataan artikkeleita..." | `adminBlog.loading.articles` | "Loading articles..." |
| 637 | "Artikkelit ({articles.length})" | `adminBlog.articles.title` | "Articles ({count})" |
| 640 | "Ei artikkeleita vielä..." | `adminBlog.articles.empty` | "No articles yet..." |
| 645-649 | Taulukon otsikot | `adminBlog.table.headers.*` | Table headers |
| 655-667 | Taulukon rivit | `adminBlog.table.*` | Table rows |

---

## 8. LeadMagnetPage.jsx

**Tiedostopolku:** `src/pages/LeadMagnetPage.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 23 | "Lead magnet not found" | `leadMagnet.errors.notFound` | "Lead magnet not found" |
| 31 | "Videota ei löytynyt..." | `leadMagnet.errors.videoNotFound` | "Video not found or not ready yet." |
| 47 | "Ladataan videota..." | `leadMagnet.loading.video` | "Loading video..." |
| 59 | "Videota ei löytynyt" | `leadMagnet.notFound.title` | "Video not found" |
| 60 | "Tarkista linkki sähköpostistasi." | `leadMagnet.notFound.message` | "Check the link from your email." |
| 73 | "Videosi käsitellään" | `leadMagnet.processing.title` | "Your video is being processed" |
| 74 | "Videosi on parhaillaan työn alla..." | `leadMagnet.processing.message` | "Your video is currently being worked on and will be ready soon!" |
| 75 | "Lähetämme uuden linkin osoitteeseen..." | `leadMagnet.processing.emailInfo` | "We'll send a new link to {email} when the video is ready." |
| 77 | "Päivitä sivu" | `leadMagnet.refreshPage` | "Refresh page" |
| 92 | "Videosi on valmis" | `leadMagnet.ready.title` | "Your video is ready" |
| 93 | "Katso henkilökohtainen videosi alta" | `leadMagnet.ready.subtitle` | "Watch your personalized video below" |
| 109 | "Selaimesi ei tue videoita." | `leadMagnet.video.notSupported` | "Your browser doesn't support videos." |
| 121-134 | Info-kortit | `leadMagnet.info.*` | Info cards |

---

## 9. MonthlyLimitWarning.jsx

**Tiedostopolku:** `src/components/MonthlyLimitWarning.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 13 | "⚠️ Kuukausiraja täynnä" | `monthlyLimit.title` | "⚠️ Monthly limit reached" |
| 26 | "Kuukausiraja ylitetty" | `monthlyLimit.exceeded.title` | "Monthly limit exceeded" |
| 28 | "Olet luonut {count} generoitua sisältöä..." | `monthlyLimit.exceeded.message` | "You have created {count} generated content this month..." |
| 32 | "Voit luoda uutta sisältöä vasta ensi kuussa." | `monthlyLimit.exceeded.nextMonth` | "You can create new content next month." |
| 37 | "Tämän kuun sisältöä:" | `monthlyLimit.stats.thisMonth` | "This month's content:" |
| 42 | "Kuukausiraja:" | `monthlyLimit.stats.limit` | "Monthly limit:" |
| 52 | "Sulje" | `common.close` | "Close" |
| 60 | "Luo silti (ei käytettävissä)" | `monthlyLimit.createAnyway.disabled` | "Create anyway (not available)" |

---

## 10. InactivityWarningModal.jsx

**Tiedostopolku:** `src/components/InactivityWarningModal.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 55 | "Sessio päättyy pian" | `inactivity.title` | "Session ending soon" |
| 60 | "Olet ollut inaktiivinen..." | `inactivity.message` | "You have been inactive and your session will end automatically for security reasons." |
| 64 | "Aikaa jäljellä:" | `inactivity.timeRemaining` | "Time remaining:" |
| 75 | "Jatka sessiota" | `inactivity.continue` | "Continue session" |
| 82 | "Kirjaudu ulos nyt" | `inactivity.logoutNow` | "Log out now" |
| 89 | "Tämä varoitus näkyy automaattisesti..." | `inactivity.warningInfo` | "This warning appears automatically 5 minutes before session ends." |

---

## 11. OnboardingModal.jsx

**Tiedostopolku:** `src/components/OnboardingModal.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 260 | "Virhe: Agent ID puuttuu..." | `onboarding.errors.agentIdMissing` | "Error: Agent ID missing from configuration" |
| 289 | "Virhe aloittaessa keskustelua: " | `onboarding.errors.startingConversation` | "Error starting conversation: " |
| 422 | "ICP-haastattelu" | `onboarding.minimized.title` | "ICP interview" |
| 424 | "Palauta" | `onboarding.restore` | "Restore" |
| 440 | "Tervetuloa!" | `onboarding.welcome.title` | "Welcome!" |
| 441 | "Aloitetaan luomalla yrityksellesi..." | `onboarding.welcome.subtitle` | "Let's start by creating your company's perfect ICP (Ideal Customer Profile)" |
| 453 | "Aloita ICP-haastattelu" | `onboarding.start.title` | "Start ICP interview" |
| 454 | "Keskustele AI-assistentin kanssa..." | `onboarding.start.description` | "Chat with AI assistant and create your ICP in a few minutes." |
| 460 | "Aloita haastattelu" | `onboarding.start.button` | "Start interview" |
| 471 | "Lopeta keskustelu" | `onboarding.end.button` | "End conversation" |
| 482 | "Ohita toistaiseksi" | `onboarding.skip` | "Skip for now" |

---

## 12. Sidebar.jsx

**Tiedostopolku:** `src/components/Sidebar.jsx`

### Puuttuvat käännökset:

| Rivi | Suomenkielinen teksti | Ehdotettu avain | Englanninkielinen käännös |
|------|---------------------|-----------------|---------------------------|
| 16-186 | Menu-kohdat | `sidebar.labels.*` | Menu items |
| 380 | "Liidit" | `sidebar.labels.leads` | "Leads" |
| 446 | "Organisaation hallinta" | `sidebar.labels.organizationManagement` | "Organization Management" |

**Huom:** Suurin osa Sidebar-teksteistä on jo käännösten piirissä, mutta muutama puuttuu.

---

## 13. Yleiset puutteet

### Yleisimmät tekstit, jotka tarvitsevat käännökset:

1. **Virheviestit:**
   - "Virhe..." -alkuiset viestit kaikissa komponenteissa
   - Ehdotettu avain: `errors.*` jokaiselle komponentille

2. **Vahvistusdialogit:**
   - "Oletko varma, että haluat poistaa..." -tyyppiset viestit
   - Ehdotettu avain: `confirmDelete.*`

3. **Latausviestit:**
   - "Ladataan..." -tekstit
   - Ehdotettu avain: `common.loading`

4. **Yleisiä nappitekstejä:**
   - "Tallenna", "Peruuta", "Muokkaa", "Poista", "Sulje"
   - Ehdotettu avain: `common.*`

5. **Lomakekentät:**
   - Label-tekstit ja placeholderit
   - Ehdotettu avain: Jokaiselle sivulle oma namespace

---

## Suositukset

### 1. Prioriteetti 1: Kriittiset sivut (Admin-paneeli, Organisaatiohallinta)
- AdminPage.jsx
- OrganizationMembersPage.jsx
- AccountManagerPage.jsx

### 2. Prioriteetti 2: Käyttäjänäkymät (Modaalit, varoitukset)
- MonthlyLimitWarning.jsx
- InactivityWarningModal.jsx
- OnboardingModal.jsx

### 3. Prioriteetti 3: Sisällönhallinta
- AdminBlogPage.jsx
- AdminTestimonialsPage.jsx
- LeadMagnetPage.jsx

### 4. Prioriteetti 4: Muut sivut
- EmailMarketingPage.jsx
- ReportsPage.jsx

### Käännösavainrakenne

Suosittelen seuraavaa rakennetta `common.json`-tiedostoihin:

```json
{
  "common": {
    "loading": "Ladataan...",
    "saving": "Tallennetaan...",
    "save": "Tallenna",
    "cancel": "Peruuta",
    "edit": "Muokkaa",
    "delete": "Poista",
    "close": "Sulje",
    "retry": "Yritä uudelleen",
    "email": "Sähköposti"
  },
  "errors": {
    "general": "Virhe",
    "loadingData": "Virhe tietojen lataamisessa",
    "savingData": "Virhe tietojen tallentamisessa",
    "deletingData": "Virhe tietojen poistamisessa"
  },
  "confirmDelete": {
    "title": "Vahvista poisto",
    "message": "Oletko varma, että haluat poistaa?"
  },
  "admin": { ... },
  "organization": { ... },
  "accountManager": { ... },
  // jne.
}
```

---

## Yhteenveto puutteista

Yhteensä n. **200-300 kovakoodattua tekstiä** löytyi React-sovelluksesta. Suurin osa on admin-paneelissa, organisaatiohallinnassa ja eri modaaleissa.

**Seuraavat askeleet:**
1. Lisää puuttuvat avaimet `common.json`-tiedostoihin (fi + en)
2. Korvaa kovakoodatut tekstit `t()`-kutsuilla
3. Testaa käännökset molemmilla kielillä
4. Tarkista että kaikki dynaamiset arvot (esim. `{count}`, `{name}`) toimivat oikein

---

**Raportti luotu:** ${new Date().toLocaleDateString('fi-FI')}
**Auditointilaajuus:** React src-kansio (~120 tiedostoa)
