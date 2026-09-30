# Local environment and reuse decision

Verified 2026-09-30. Original working directory and Git root were the CLA repository; no implementation was written there. New source directory and initialized Git root: `C:\xampp\CLA-HOLDEM-LAB`.

Running Apache process executable: `C:\xampp\apache\bin\httpd.exe`, service command `-k runservice`, child `-d C:/xampp/apache`. Read-only `httpd -t -D DUMP_RUN_CFG` and `httpd -S` identified main/localhost DocumentRoot `C:/xampp/htdocs`, localhost port 80, and the existing virtual-host/alias configuration. Port 80 listener belongs to the running Apache parent. HTTP and HTTPS configuration were inspected. Source is outside all configured web roots/aliases; neither source-parent nor web-root paths were reparse points. No htdocs reparse-point exposure was found.

Deployment target is a newly owned `C:\xampp\htdocs\holdem-lab`; canonical origin `http://localhost/holdem-lab/`. No existing site index or Apache configuration is changed. Apache already has AllowOverride All and rewrite/headers modules. Existing global Location rules may override directory authorization, so the application uses a REMOTE_ADDR rewrite guard in its own .htaccess in addition to Require local. Verification includes a request sourced through the machine's non-loopback interface. Existing Apache warnings about an unrelated missing CS16 DocumentRoot are preserved; no repair/restart is attempted.

Verified tools: Node v26.8.1, npm 12.1.0, Python 3.14.7, Git CLI present; Edge and Chrome executables present. Project-local dependencies are pinned by package-lock.json. Python oracle dependencies stay in .venv; no Anaconda base modification.

Bounded reuse inspection: DRAGONHYDRA root pyproject.toml identifies version 0.1.0, sports evidence/computation, no runtime dependencies; no poker API declared. BLENDER-CODEX-BRIDGE root requirements.txt describes MCP/YAML/schema/file-lock dependencies, no poker evaluator. The hinted MATH-CODEX-BRIDGE directory was not found at its named path. No unrelated document content or whole-drive crawl was performed. None of these projects was executed, modified, or reused in HIL. An original TypeScript evaluator and game engine are tested independently; PokerKit is test-only. Maxima is used only for development formula checks.

CLA evidence is recorded separately in CLA_ACCEPTANCE.md. No GPU computation, model benchmarks, model/service startup, CUDA installation, global configuration edits, elevated session, or recursive Codex launch occurred.
