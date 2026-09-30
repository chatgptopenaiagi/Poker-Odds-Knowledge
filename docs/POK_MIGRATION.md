# HIL notebook continuity

Data schema 2 changes the supported locale catalog; it does not change poker hand version 1 or `hil-nlhe-1.0.0` rules. The original database name, object store, key, atomic revision check and pending-hand transaction remain unchanged.

`validateData` accepts schema 1 and 2 and returns canonical schema 2 without mutating its input. All imported hands are replayed by the original reducer, all known drill attempts are regraded by their stable lesson ID/version, and range scenarios retain card/compatibility validation. Unsupported future schema versions are rejected. Migration fixtures exercise pending and completed hands, decks, settings, revisions and lesson attempts.

No migration reads or clears another browser profile. Opening the app does not commit a migration. The next requested save atomically writes the migrated notebook. Import requires the existing replace confirmation and offers an export first. Appearance reset changes only display preferences. Progress reset remains a separate confirmed operation.

Account switching never uploads the guest notebook. Synchronization requires selected categories and explicit upload; server revisions detect concurrent changes. A downloaded account copy is reviewed and explicitly imported, using the same validator and confirmation. Account deletion affects server records, not the offline browser notebook. Back up each edition separately because their origins have separate storage.
