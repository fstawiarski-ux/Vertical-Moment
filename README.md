# Vertical Moment

Vertical Moment is one repository with **two products** and a shared climbing-data, media and spatial-production foundation.

## Choose the product before editing

| Product | Purpose | Current routes | Start here | Branch prefix |
|---|---|---|---|---|
| **Public website** | Photography portfolio, gallery, business/contact, social presence, public SEO and conversion | `/` and explicitly public photography/print pages | [`products/public-site/README.md`](products/public-site/README.md) | `site/` |
| **Climbers Lounge / Explore PWA** | One installable/offline climbing product: Explore Lab workspace, atlas, routes, panoramas, topo, field notes, contributor intake and 3D tools | `/explore-app`, `/explore`, `/climbers-lounge`, unlisted `/contribute` and protected climbing-experience routes | [`products/climbers-lounge-pwa/README.md`](products/climbers-lounge-pwa/README.md) | `pwa/` |

The Brave shortcuts named **Vertical Moment Explore Lab** and **Vertical Moment Climbers Lounge** are installed versions of the same PWA product. They are not separate products or source repositories.

Read [`AGENTS.md`](AGENTS.md) and [`docs/PRODUCT_MAP.md`](docs/PRODUCT_MAP.md) before any write. Work that changes shared data, packages, Cloudflare, OpenNext, Serwist, GitHub Actions or common media must be declared `shared` and approved as cross-product work.

## Repository model

- `main` is the single canonical integration branch.
- Product work uses short-lived `site/<task>` or `pwa/<task>` branches.
- Long-lived product branches are not product storage. Product separation is expressed through paths, ownership files, scoped documentation and CI.
- A branch, commit, installed PWA or local prototype is not automatically canonical. See [`docs/recovery/CANONICAL_STATE.md`](docs/recovery/CANONICAL_STATE.md).
- No agent may push, merge, deploy, delete remote branches or rewrite history without explicit approval.

The runtime is still transitional: both products currently share the Next.js package under `website/`. Moving runtime code into separate app packages is intentionally deferred until the live Public V5 and current PWA have approved visual and behavior baselines.

## Repository map

| Path | Role |
|---|---|
| `products/` | Product contracts and agent entry points |
| `website/` | Transitional combined Next.js/OpenNext runtime |
| `database/` | Canonical and staged route-data sources; verification status must be preserved |
| `areas/` | Area/sector context linked to stable route identities |
| `assets/brand/` | Canonical brand masters and approved exports |
| `media/`, `models/` | Media/3D manifests and reviewed source assets; heavy masters require LFS or external storage |
| `workbench/` | Provisional intake; never silently promote it to canonical data |
| `docs/` | Architecture, recovery, operations and product-boundary documentation |

## Development stack

The active web runtime is Next.js 16, React 18, TypeScript, OpenNext for Cloudflare, Wrangler, Serwist, Vitest, Zustand, Three.js/model-viewer, Drizzle, IndexedDB helpers and `fflate` for local contribution ZIPs. CI uses Node 22; the verified workstation snapshot on 2026-08-13 used Node 24 and npm 11.

The wider production stack includes GitHub/Git LFS, Cloudflare Workers and R2, Notion, Google Drive/Sheets, Canva, Affinity, Blender, RealityScan/RealityCapture source workflows, DaVinci Resolve, Adobe Acrobat, Google Earth Pro/Maps, Brave PWA testing, ShareX and Lovable. Availability and authority vary; consult the status table in [`docs/operations/SOFTWARE_STACK.md`](docs/operations/SOFTWARE_STACK.md).

### AI and model stack snapshot

Supervisor and worker surfaces observed in the Vertical Moment workflow include ChatGPT Work/Codex, Claude Code, GitHub Copilot CLI, Multica, OpenClaw, OpenCode, OpenWork/ModelStudio, LM Studio and Ollama. Cursor Agent and Antigravity are historical/optional until rediscovered on the current PATH.

The wider cloud-model map also records Claude Sonnet/Opus, Gemini, Perplexity and candidate DeepSeek, Qwen, MiniMax and Kimi families, plus Groq, Cerebras, Hugging Face and OpenRouter routing surfaces. These are not all installed or currently authorized; their exact model, provider, privacy and quota must be rediscovered for every task.

Locally observed models on 2026-08-13:

- LM Studio LLMs: Qwen2.5-Coder 7B, Gemma 4 E4B, GPT-OSS 20B, Qwen3 30B A3B Thinking, Qwen3-Coder 30B A3B.
- LM Studio embedding: Nomic Embed Text v1.5.
- Ollama: `qwen2.5-coder:7b`.
- Specialists under `D:\AI\models\specialists`: Florence-2-large, Phi-4-multimodal-instruct, Qwen3-VL-Embedding-2B, Qwen3-VL-Reranker-2B, Whisper-Large-V3-Turbo, SAM 2.1 Hiera Large and Depth Anything V2 Large.

Model availability, provider quotas and authentication are time-sensitive. Future agents must rediscover them rather than assuming this snapshot is current. Large models, source scans and Atlas JSON must never be dumped wholesale into model context.

## Quick start

```powershell
Set-Location "D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment"
git branch --show-current
git rev-parse HEAD
git status --short
Set-Location "D:\VERTICALMOMENT\GITHUB REPOS\Vertical-Moment\website"
npm install
npm run dev
```

- Public website: `http://localhost:3000/`
- Climbers Lounge / Explore PWA: `http://localhost:3000/explore-app`
- Atlas route currently protected as part of the PWA stream: `http://localhost:3000/explore`
- Unlisted local-first contributor beta: `http://localhost:3000/contribute`

Build and publication are separate approval gates. `npm run build` generates `website/public/sw.js`; never edit or include that generated file in a source patch.

## Current recovery anchors

- Current committed/deployed integration baseline recorded on 2026-08-13: `da6630cdcba8ed2d44015ed1cea9af47bdc99971`.
- Active PWA capability branch recorded at: `5fb71fe0249d51f8759273c5e2e903fe3c59cf72`.
- Public V5 redesign: shipped through PR #33 at `3640c12e0cafe6947440a4f603f998a49f4aa66a`; logo, background, fonts and photography refinements remain future public-site work.
- Contributor field beta: shipped through PR #34 at `da6630c`; `/contribute` is unlisted/noindex and keeps original evidence in device IndexedDB until ZIP export. It has no server upload, account gate or publication action yet.
- EXP-02: preserved as a focused Master ZIP and as an uncommitted four-file review change on the active PWA branch.

See [`docs/recovery/CANONICAL_STATE.md`](docs/recovery/CANONICAL_STATE.md) for exact status and [`docs/repository/CLEANUP_RUNBOOK.md`](docs/repository/CLEANUP_RUNBOOK.md) before removing files or branches.
