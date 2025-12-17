#!/bin/bash

# Skripti joka korvaa suorat Supabase users-taulun kutsut getCurrentUser()-funktiolla

# Värit
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Aloitetaan users-taulun kutsujen refaktorointi...${NC}"

# Tiedostot joita käsitellään
FILES=(
  "src/pages/AccountDetailsPage.jsx"
  "src/pages/AccountManagerPage.jsx"
  "src/pages/AdminPage.jsx"
  "src/pages/BlogNewsletterPage.jsx"
  "src/pages/ContentStrategyPage.jsx"
  "src/pages/DashboardPage.jsx"
  "src/pages/DevChatPage.jsx"
  "src/pages/LeadScrapingPage.jsx"
  "src/pages/ManagePostsPageOptimized.jsx"
  "src/pages/SettingsPage.jsx"
  "src/pages/VastaajaPage.jsx"
  "src/components/AccountDetailsModal.jsx"
  "src/components/AikataulutettuModal.jsx"
  "src/components/MobileNavigation.jsx"
  "src/components/OnboardingModal.jsx"
  "src/components/ProtectedRoute.jsx"
  "src/components/SettingsIntegrationsTab.jsx"
  "src/components/Sidebar.jsx"
  "src/components/SocialMediaAnalytics.jsx"
  "src/components/AccountDetailsTabs/SocialMediaTab.jsx"
  "src/components/AccountDetailsTabs/FeaturesTab.jsx"
  "src/hooks/useNextMonthQuota.js"
  "src/hooks/useMonthlyLimit.js"
  "src/lib/getUserOrgId.js"
)

count=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Tarkista onko tiedostossa users-taulun kutsuja
    if grep -q "from('users')" "$file"; then
      echo -e "${YELLOW}Käsitellään: $file${NC}"
      
      # Lisää import jos ei ole jo olemassa
      if ! grep -q "getCurrentUser" "$file"; then
        # Etsi ensimmäinen import-rivi ja lisää sen jälkeen
        sed -i.bak "/^import.*from/a\\
import { getCurrentUser } from '../utils/userApi'
" "$file" 2>/dev/null || sed -i '' "/^import.*from/a\\
import { getCurrentUser } from '../utils/userApi'\\
" "$file"
      fi
      
      ((count++))
    fi
  fi
done

echo -e "${GREEN}Valmis! Käsitelty $count tiedostoa.${NC}"
echo -e "${YELLOW}HUOM: Tiedostojen .bak-varmuuskopiot luotu. Tarkista muutokset ja poista ne jos kaikki ok.${NC}"
echo -e "${YELLOW}Sinun täytyy vielä manuaalisesti korvata Supabase-kutsut getCurrentUser()-kutsuilla.${NC}"
