# Facultas (iOS)

App iOS mínimo com [xtool](https://xtool.sh/documentation/xtool/installation-linux/) — só a área **Hub** (Avisos, Materiais, Membros, Sobre), espelhando o web.

## Modos de teste

| Modo | O que faz | Como testar |
|------|-----------|-------------|
| **mock** (padrão) | Dados de exemplo, sem rede | `xtool dev` — badge **MOCK** no canto |
| **live** | Lê a comunidade real no Supabase | Edite `Resources/hub-config.json` ou use variáveis de ambiente |

### 1. Validar estrutura (Windows)

No PowerShell, na pasta do app:

```powershell
cd fflow-hub-ios
.\scripts\test-check.ps1
```

### 2. Testar Supabase antes do iPhone (Windows)

Copie o example, preencha com os mesmos valores do `.env.local` do web:

```powershell
Copy-Item hub-config.example.json hub-config.json
# edite hub-config.json: mode live + url + anon key + communityId
.\scripts\test-live.ps1
```

Se retornar avisos/materiais, o app live vai funcionar.

### 3. Rodar no iPhone (WSL)

Siga a [instalação Linux/Windows do xtool](https://xtool.sh/documentation/xtool/installation-linux/):

1. Swift 6.3 no WSL  
2. `usbmuxd` + USB passthrough do iPhone  
3. `xtool setup` (login Apple + caminho do `Xcode.xip`)  
4. Na pasta `fflow-hub-ios`:

```bash
xtool dev
```

Com simulador (só macOS):

```bash
xtool dev --simulator
```

### 4. Live via variáveis (WSL)

```bash
export FFLOW_SUPABASE_URL="https://SEU_PROJECT.supabase.co"
export FFLOW_SUPABASE_ANON_KEY="sua_anon_key"
export FFLOW_COMMUNITY_ID="uuid-ou-public_id"
xtool dev
```

## Comparar com o web

1. Abra a mesma comunidade no navegador (`/communities/{id}`) logado como membro.  
2. Rode o app em **live** com o mesmo `communityId`.  
3. Confira se Avisos, Materiais e Membros batem.

## Arquivos

- `Sources/FFlowHub/HubView.swift` — UI das abas  
- `Sources/FFlowHub/SupabaseHubClient.swift` — REST Supabase (sem SDK extra)  
- `Sources/FFlowHub/MockHubData.swift` — dados de demo  
- `Resources/hub-config.json` — config embutida no app (`mode: mock` por padrão)

## Limitações

- Somente leitura (avisos/materiais/membros). Publicar fica no web por enquanto.  
- xtool ainda não suporta todos os entitlements; app simples, sem login nativo.  
- Comunidade **privada** precisa de RLS que permita leitura com anon key (públicas já funcionam com migration 012).
