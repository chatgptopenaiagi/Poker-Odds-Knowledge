# Optional Coach compatibility

Existing server/coach.ts defines a cancellation-aware CoachTransport with mock/openai variants, moderate/respond methods and token counts. Existing code controls consent, selected educational context, moderation and budgets. No provider call was executed for this repair; tests use synthetic mocks.

CAE has no supplied verified transport contract in this task. Its files, processes and credentials were not inspected or modified. Do not advertise a working CAE adapter. A future integration needs a reviewed local endpoint/identity mechanism, schema for input/output and token usage, cancellation and timeout semantics, and proof it cannot bypass current consent/moderation/budget checks. Keep it disabled until those contracts are tested.
