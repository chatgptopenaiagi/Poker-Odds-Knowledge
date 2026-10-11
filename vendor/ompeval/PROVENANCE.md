# OMPEval source provenance

Source: https://github.com/zekyll/OMPEval

Pinned revision: `4aec210ff75b0851af0ee170b35a7899e1a4fe8f`, commit dated `2016-08-21T11:48:47+03:00`, “Merge pull request #4 from zekyll/unstable”. Inspected and retrieved 2026-09-30. A fixed checkout was copied selectively; no nested Git repository is shipped. The old upstream development date is disclosed; this is not a claim of current maintenance.

Retained upstream `omp/`, `libdivide/`, `README.md`, `LICENSE.txt`, and `LICENSE-libdivide.txt`. OMPEval is ISC, copyright 2016 Timo A. The bundled libdivide code carries its own three-condition notice, retained in both original locations. No solver, strategy database, or proprietary engine was imported.

Two small, marked portability changes were required by modern Clang/MSVC STL:

- `omp/Random.h`: make `XoroShiro128Plus::min()` and `max()` constexpr, as required by modern uniform-random-bit-generator concepts used by `std::shuffle`. Return values and randomness algorithm unchanged.
- `omp/EquityCalculator.h`: explicitly include `<functional>` rather than relying on transitive declarations of `std::function`.

No hand-ranking table, equity algorithm, range semantics, or RNG sequence was changed. The independently written adapter does not expose native Monte Carlo. `SOURCE_SHA256SUMS.txt` records the actual retained, patched tree.
