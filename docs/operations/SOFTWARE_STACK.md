# Vertical Moment software and model stack

**Snapshot:** 2026-08-13

**Purpose:** Give future agents a complete operating map without implying that every tool is connected, authenticated or appropriate for every task.

Statuses:

- **Required:** repository/build dependency.
- **Confirmed:** observed on the workstation during this audit.
- **Project service:** used by the Vertical Moment workflow; connection/authority must be checked per task.
- **Historical/optional:** previously observed or planned; rediscover before use.

Never place credentials, API keys, private links or auth exports in this file.

## Web, repository and deployment

| Tool | Status | Snapshot / role |
|---|---|---|
| Git | Confirmed | 2.55.0.windows.3; source control |
| GitHub | Project service | `fstawiarski-ux/Vertical-Moment`, PR review and release history |
| GitHub CLI | Confirmed | 2.96.0 |
| Git LFS | Required | Large approved binary patterns in `.gitattributes` |
| Node.js | Confirmed | 24.18.0 locally; CI targets Node 22 |
| npm | Confirmed | 11.16.0 |
| Next.js | Required | 16.x App Router runtime |
| React | Required | 18.3.x |
| TypeScript | Required | Strict project type checking |
| OpenNext for Cloudflare | Required | Packages the Next app for Cloudflare |
| Cloudflare Workers | Project service | Current web deployment target |
| Cloudflare R2 | Project service | Intended delivery for optimized heavy media/models |
| Wrangler | Required | Cloudflare build/preview/upload/deploy CLI |
| Serwist | Required for PWA | Service worker generation and cache policy |
| Vitest | Required | Unit tests |
| Zustand | Required for PWA | Workspace/layout state |
| Three.js / model-viewer | Required for spatial modules | Browser 3D |
| idb-keyval | Required for PWA | IndexedDB helpers |
| fflate | Required for contributor beta | Builds local ZIP review packages in the browser |
| Drizzle ORM | Repository dependency | Data layer dependency; verify task usage before changing |

## AI supervision and agent tools

| Tool/surface | Status | Snapshot / role |
|---|---|---|
| ChatGPT Work / Codex | Project service | Human-visible control room and supervisor/implementation agent |
| Codex CLI | Confirmed | 0.147.0 |
| Claude Code | Confirmed | 2.1.227 |
| GitHub Copilot CLI | Confirmed | 1.0.79 |
| Multica | Confirmed | 0.4.22; bounded runtime/task dispatch |
| OpenClaw | Confirmed | 2026.7.1-2; provider routing/fallback, not autonomous collaboration |
| OpenCode | Confirmed | 1.18.16; local/provider coding worker |
| OpenWork / ModelStudio | Confirmed | OpenWork 0.18.12; interactive model/tool surface |
| LM Studio | Confirmed | 0.4.20+1; local model server/library |
| Ollama | Confirmed | 0.32.9; local model runtime |
| Cursor Agent | Historical/optional | Previously observed; command not found on PATH in this audit |
| Antigravity CLI | Historical/optional | Previously observed; command not found on PATH in this audit |

### Model routing policy

- Tier 0: local models for bounded inventory, classification, reshaping and log summaries.
- Tier 1: dynamically discovered online free/low-quota workers for independent review.
- Tier 2: subscription CLIs such as Codex, Claude Code and Copilot for supervision/escalation.
- Tier 3: paid APIs only with explicit approval.

One writer at a time. Worker outputs must state exact provider/model, files read, assumptions, unknowns and confidence. Provider catalogs and free quotas must be rediscovered each time.

### Cloud and subscription model families

This list records model families and research surfaces used or discussed in the Vertical Moment operating workflow. It is an orientation map, not proof of current access. Exact model names, subscriptions, quotas, privacy settings and authentication must be checked at the start of each task.

| Provider / model family | Status | Intended role or boundary |
|---|---|---|
| OpenAI ChatGPT / Codex | Project service | Primary supervision, implementation and review; record the exact runtime model when it matters |
| Anthropic Claude Sonnet / Claude Opus | Historical/project routing | Claude Pro and Claude Code planning, review and long-context work; recheck the available model before use |
| Google Gemini | Historical/optional | Independent multimodal/research review; recheck account and model availability |
| Perplexity | Historical/optional | Source-backed web research; conclusions still require primary-source verification |
| DeepSeek model family | Provider candidate | A DeepSeek V4 label was reported in an OpenWork surface, but the provider, model identity and access were not independently verified in this audit |
| Qwen, MiniMax and Kimi model families | Provider candidates | Possible bounded workers discovered through routing catalogs; never assume a specific endpoint or free quota |
| Groq and Cerebras hosted inference | Provider candidates | Fast hosted inference surfaces; rediscover supported models and data policy per task |
| Hugging Face and OpenRouter catalogs | Provider aggregators | Discovery/routing surfaces, not a guarantee about the underlying model, privacy or cost |

The historical six-surface routing plan named Claude, Codex, Gemini, Perplexity and ChatGPT roles. It should be treated as a workflow reference, not a permanent model assignment.

## Local model inventory

LM Studio reported five local LLMs plus one embedding model (66.93 GB total):

| Model | Family/size | Role note |
|---|---|---|
| Qwen2.5-Coder 7B Instruct | Qwen2, 7B | Lightweight coding worker |
| Gemma 4 E4B | Gemma 4, 7.5B | Independent local reviewer |
| GPT-OSS 20B | GPT-OSS, 20B | General local reasoning |
| Qwen3 30B A3B Thinking 2507 | Qwen3 MoE | Local reasoning |
| Qwen3-Coder 30B A3B | Qwen3 MoE | Coding worker; loaded during audit |
| Nomic Embed Text v1.5 | embedding | Local text embeddings |

Ollama reported:

- `qwen2.5-coder:7b`

Specialist model directories confirmed under `D:\AI\models\specialists`:

- Florence-2-large
- Phi-4-multimodal-instruct
- Qwen3-VL-Embedding-2B
- Qwen3-VL-Reranker-2B
- Whisper-Large-V3-Turbo
- SAM2.1-Hiera-Large
- Depth-Anything-V2-Large

`D:\AI` is the preferred home for models, caches, environments, downloads and large AI tooling. Do not copy these assets into the repository or back to the space-constrained C: drive.

## Creative, spatial and media production

| Tool | Status | Snapshot / role |
|---|---|---|
| Blender | Confirmed installed | 5.1.2; 3D cleanup, optimization, cameras, overlays and GLB preparation |
| RealityScan / RealityCapture | Project workflow | Photogrammetry source projects; installation must be rechecked before automation |
| Affinity | Project workflow | Brand/vector/photo masters; preserve editable sources and masks |
| Canva | Confirmed installed / project service | Desktop 1.123.1; presentations, visual planning and approved template work |
| DaVinci Resolve | Confirmed installed | 20.0.10006; video editing |
| Adobe Acrobat | Confirmed installed | 26.001.21789; PDF inspection/output |
| ShareX | Confirmed installed | 21.0.0; captures and review evidence |
| Brave | Confirmed installed | 151.1.93.136; browser and installed-PWA QA |
| Google Earth Pro | Project workflow | KML/KMZ travel and camera review; recheck installation before use |
| Google Maps / Directions | Project service | Verified parking/directions links; not a source for invented forest approaches |
| Upscayl | Historical/optional | Local executable observed historically; recheck current installation and task need |

## Content, planning and business systems

| System | Status | Role / authority rule |
|---|---|---|
| Notion | Confirmed installed / project service | Operating system and linked databases; no writes without task approval |
| Google Drive | Project service | Raw/source delivery and catalog links; reconcile by immutable file ID and approve moves/overwrites |
| Google Sheets / Excel workbooks | Project workflow | Route review and progress tracking; distinguish canonical from extracted/provisional data |
| GitHub | Project service | Canonical code/review history; no direct `main` changes |
| Canva | Project service | Visual layer, not canonical route/file data |
| Lovable | Project service | Prototype/website pilot surface; verify commits after timeouts before claiming completion |
| Figma | Optional/project-dependent | Use only when a task identifies a Figma source/design |

## Workstation utilities

- Python 3.14.6 was on PATH; project-specific bundled Python may be required when the system Python has dependency/encoding issues.
- `uv` 0.11.31 manages Python tools/environments.
- komorebi 0.1.41 and whkd support window/workspace control.
- Microsoft OneDrive is installed, but it is not a substitute for the project's Google Drive authority model.

## Context and asset safety

- Never send complete `atlas-data.json`, multi-GB models, raw photo sets or private source archives to an AI model.
- Use paths, manifests, checksums, bounded queries, thumbnails and optimized derivatives.
- Do not treat model output as route, access, safety, legal or field-verified truth.
- Recheck installed versions and authentication before relying on any external tool.
