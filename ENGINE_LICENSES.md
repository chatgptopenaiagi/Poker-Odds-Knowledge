# Engine licenses and distribution boundaries

Checked 2026-09-30 against the pinned source files below. This is a provenance and packaging record, not a new public license for POK. The owner's product licensing decision is unchanged. Merely researching a repository does not make its license or implementation part of POK.

| Component and exact version | Verified license | Used / distributed scope | Retained notice |
| --- | --- | --- | --- |
| PH Evaluator `10be452e4c1ee40a6a56f06457f46bff27ca495a`, CMake 0.6.1 | Apache-2.0 | Reviewed C five/six/seven-card source subset; compiled browser WASM | `vendor/ph-evaluator/LICENSE`, original copyright headers, `UPSTREAM.json`; public `engines/PH-EVALUATOR-LICENSE.txt` |
| OMPEval `4aec210ff75b0851af0ee170b35a7899e1a4fe8f` | ISC | Reviewed native source and optional local binary, outside public web assets | `vendor/ompeval/LICENSE.txt`, `PROVENANCE.md`, marked changes and source hashes |
| OMPEval's bundled libdivide, same source pin | Separate permissive three-condition zlib-style notice | Included in native implementation | `vendor/ompeval/LICENSE-libdivide.txt` plus original header notices |
| nlohmann/json **3.12.0**, header SHA-256 `aaf127c04cb31c406e5b04a63f1ae89369fccde6d8fa7cdda1ed4f32dfc5de63` | MIT | Native adapter JSON parsing | Original `native/vendor/nlohmann/json.hpp` notice and `LICENSE.MIT`; native distribution must retain them |
| PokerKit **0.7.6** installed oracle | MIT | Existing isolated development environment only; not a browser runtime or app backend dependency | Installed distribution's MIT notice; source attribution in research and oracle report |
| PokerStove `ae377e23cfd0cf2a5e2cdc11891a93307a30a65d` | BSD-3-Clause | Research only; no copied evaluator, binding or binary | [Pinned LICENSE.txt](https://github.com/andrewprock/pokerstove/blob/ae377e23cfd0cf2a5e2cdc11891a93307a30a65d/LICENSE.txt) inspected |
| RLCard `d7d0a957baf4cc7225a50522adb0164bf130a9d0` / 1.2.0 | MIT | Research only; no code/model dependency | [Pinned LICENSE.md](https://github.com/datamllab/rlcard/blob/d7d0a957baf4cc7225a50522adb0164bf130a9d0/LICENSE.md) inspected |
| Desktop Postflop `0c15f97f204e5533b09cd83fda5939c110a98e75` / 0.2.7 | AGPL-3.0-or-later | Reference only; excluded from POK source/runtime/build dependencies | [Pinned manifest](https://github.com/b-inary/desktop-postflop/blob/0c15f97f204e5533b09cd83fda5939c110a98e75/package.json) and LICENSE inspected |
| postflop-solver `9d1509fe5077d019825f833eed04b16d342dfda1` / 0.1.0 | AGPL-3.0-or-later | Reference only; excluded | [Pinned Cargo.toml](https://github.com/b-inary/postflop-solver/blob/9d1509fe5077d019825f833eed04b16d342dfda1/Cargo.toml) and LICENSE inspected |
| WASM Postflop `97360db7644329b1c23a7adf06e9aa59406e4d4b` / 0.2.7 | AGPL-3.0-or-later | Reference only; excluded | [Pinned manifest](https://github.com/b-inary/wasm-postflop/blob/97360db7644329b1c23a7adf06e9aa59406e4d4b/package.json) and LICENSE inspected |

PokerKit's newly reviewed upstream development revision `b2fcc75c05ac43b210dd7e5ea71c0bd2f82ac3d6` also has an [MIT license](https://github.com/uoftcprg/pokerkit/blob/b2fcc75c05ac43b210dd7e5ea71c0bd2f82ac3d6/LICENSE); it was not installed in place of the actual 0.7.6 oracle. GitHub labels b-inary repositories `AGPL-3.0`; their inspected manifests and README wording explicitly include the **or-later** option, which this report preserves.

## Changes and notices

PH's upstream subset is unchanged. POK's separately authored freestanding stdio/memset shims and TypeScript adapter are identified in [PH_BUILD](docs/PH_BUILD.md). The upstream license and all source copyright headers remain intact. The checked-in source hash manifest identifies exactly which files were reviewed; no upstream NOTICE file was supplied in this selected repository root. Preserve any required notices if the subset or upstream pin changes.

OMPEval's two portability edits are marked in source and [PROVENANCE](vendor/ompeval/PROVENANCE.md): constexpr RNG bound accessors and an explicit `<functional>` include. They do not alter ranking tables; native simulation is not exposed. Retain the original library license, libdivide notice and JSON header notice with optional native distributions. No proprietary ranking/strategy database, paid lesson material, competitor branding or copied commercial UI was imported.

## Package boundaries

- The offline public bundle may contain the local PH WASM, its build identity and Apache-2.0 notice. It contains no native executable, compiler, Python environment, database, source snapshot or shell endpoint.
- An optional native development package must carry all native source/binary dependency notices, build hashes and bounds. The executable stays outside Apache's public directory.
- Full research clones and downloaded reference files remain ignored development artifacts. AGPL code is not copied into the app, vendored tree, Node dependencies or release assets. URLs, hashes and concise independent summaries are the research record.
- No community JS/TypeScript evaluator port was selected; an upstream license would not establish such a port's own terms. The C/WASM build avoids that provenance ambiguity.
- A future solver import requires its own explicit license review and packaging decision, including the actual source/library/transitive-dependency versions. Browser/WASM compilation does not remove source-license obligations.

The engine extension does not grant permission to publish the frozen site or any private research artifact. Current user instructions pause remote publication. Build/asset audits remain a separate release gate.
