# N8N: Strategia-notifikaation luominen

## Yleiskatsaus

Kun N8N workflow luo uuden strategian `content_strategy`-tauluun ja muuttaa käyttäjän statuksen `'Pending'`:ksi, sen **täytyy myös luoda notifikaatio** käyttäjälle.

## API Endpoint

**URL**: `https://rascal.fi/api/create-notification`  
**Metodi**: `POST`  
**Autentikointi**: `x-service-key` header (käytä `SUPABASE_SERVICE_ROLE_KEY`)

## Request Body

```json
{
  "user_id": "uuid-from-public-users-table",
  "type": "strategy",
  "title": "Uusi sisältöstrategia valmis",
  "message": "Olemme luoneet uuden sisältöstrategian sinulle. Tarkista ja vahvista strategia ennen sisällön generointia.",
  "data": {
    "strategy_id": "uuid-of-created-strategy",
    "month": "2025-10"
  }
}
```

## Parametrit

| Parametri | Tyyppi | Pakollinen | Kuvaus |
|-----------|--------|------------|---------|
| `user_id` | UUID | ✅ Kyllä | Käyttäjän ID `public.users.id` (EI `auth.users.id`) |
| `type` | String | ❌ Ei | Notifikaation tyyppi. Käytä `"strategy"` strategia-notifikaatioille |
| `title` | String | ✅ Kyllä | Notifikaation otsikko |
| `message` | String | ✅ Kyllä | Notifikaation viesti/sisältö |
| `data` | Object | ❌ Ei | Lisätiedot JSON-objektina |

## Headers

```http
Content-Type: application/json
x-service-key: YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Response

### Onnistunut (201 Created)

```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "strategy",
    "title": "Uusi sisältöstrategia valmis",
    "message": "...",
    "data": { ... },
    "is_read": false,
    "created_at": "2025-10-01T12:00:00Z"
  }
}
```

### Virhe (400/401/404/500)

```json
{
  "error": "Virheen kuvaus"
}
```

## N8N Workflow -integraatio

### 1. Luo strategia Supabaseen
- Tallenna uusi strategia `content_strategy`-tauluun
- Saat takaisin `strategy_id` ja muut tiedot

### 2. Päivitä käyttäjän status
- Päivitä `users`-taulussa käyttäjän `status = 'Pending'`
- Tämä triggeröi `StrategyConfirmationModal`:in näkymisen frontendissä

### 3. Lähetä notifikaatio
- Kutsu `/api/create-notification` endpointtia
- Käytä `type: "strategy"`
- Sisällytä `strategy_id` ja `month` `data`-kenttään

## Esimerkki N8N HTTP Request -nodessa

```json
{
  "method": "POST",
  "url": "https://rascal.fi/api/create-notification",
  "headers": {
    "Content-Type": "application/json",
    "x-service-key": "{{ $env.SUPABASE_SERVICE_ROLE_KEY }}"
  },
  "body": {
    "user_id": "{{ $json.user_id }}",
    "type": "strategy",
    "title": "Uusi sisältöstrategia valmis",
    "message": "Olemme luoneet uuden sisältöstrategian kuukaudelle {{ $json.month }}. Tarkista ja vahvista strategia ennen sisällön generointia.",
    "data": {
      "strategy_id": "{{ $json.strategy_id }}",
      "month": "{{ $json.month }}"
    }
  }
}
```

## Huomioitavaa

1. **`user_id` on `public.users.id`**, EI `auth.users.id`
2. **Service key** on pakollinen headerissa turvallisuussyistä
3. Notifikaatio näkyy käyttäjälle kellonkuvakkeessa (NotificationBell) heti kun se on luotu
4. **Modal** näkyy automaattisesti kun `status = 'Pending'`
5. Notifikaatiossa käytetään **Lightbulb-ikonia** (`type: "strategy"`)

## Testaus

Voit testata endpointtia cURLilla:

```bash
curl -X POST https://rascal.fi/api/create-notification \
  -H "Content-Type: application/json" \
  -H "x-service-key: YOUR_SERVICE_KEY" \
  -d '{
    "user_id": "test-user-uuid",
    "type": "strategy",
    "title": "Uusi sisältöstrategia valmis",
    "message": "Tarkista ja vahvista strategia.",
    "data": {
      "strategy_id": "test-strategy-uuid",
      "month": "2025-10"
    }
  }'
```

## Liittyvät tiedostot

- `/api/create-notification.js` - API endpoint
- `/src/components/NotificationPanel.jsx` - Notifikaatioiden näyttö
- `/src/contexts/StrategyStatusContext.jsx` - Modal-logiikka
- `/src/components/StrategyConfirmationModal.jsx` - Modal-komponentti


