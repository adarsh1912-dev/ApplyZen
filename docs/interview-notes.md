# ApplyZen — Interview Notes

## Resume line

> Built and deployed ApplyZen, a full-stack AI resume platform, with **53 backend integration tests** covering auth, concurrency, imports, and AI failure paths.

Optional second line:

> Engineered server-authoritative AI tailoring guardrails that reject dropped or invented experience entries instead of silently saving corrupted resumes.

## 2-minute “hardest problem” story

The hardest problem was making the AI tailoring feature safe enough to trust.

The feature rewrites the summary, bullets, and skill order for a specific job posting. My first version sent the resume and the posting to the model and saved whatever came back. The failure mode was not a crash — it was silent corruption. The model could drop a role, merge two jobs, or invent an employer, and the UI would still say “saved.”

So I started treating model output as untrusted data. I narrowed what the model was allowed to return: role, summary, experience entries with their IDs and bullets, skills, a changelog, and warnings. Then I validated that JSON with Zod. The key decision was that the server, not the model, owns the final document. I reassemble personal details, education, projects, certifications, visibility, and section order from the stored resume. For experience, the model must return the same number of entries. The server keeps the original role, company, dates, and ID, and only accepts the rewritten bullets. If the model drops or adds a role, the request fails with a 502 instead of writing. If it returns an empty bullet list, the stored bullets stay.

Then I built the review step: the user sees the changelog and a live preview, and can apply the result in place with a version snapshot or save it as a copy. I added integration tests for the failure paths: dropped entries, empty bullets, provider errors, no provider configured, and cross-user access.

Analysis falls back to the deterministic heuristic if the provider fails. Tailoring and import fail closed, because a corrupted resume is worse than no result.

The limitation is semantic: the model can still improve wording in ways a human should verify, so I don’t claim it is perfect. If I extended it, I’d add a source-span check or a second verification pass.

The lesson was that with AI features, the server has to be the authority, not the model.

## 30-second version

The AI could silently drop or invent a role, so I made the server authoritative. It validates the model’s JSON with Zod, reassembles everything the model must not change, keeps the original experience metadata, and rejects any change in the number of roles. Then I added a review diff and tests for dropped entries, empty bullets, provider errors, and cross-user access. Structural corruption fails closed; wording still gets human review.

## Delivery notes

- Pause after “silent corruption” — that is the hook.
- Emphasize “the server, not the model, owns the final document.”
- Say “fail closed,” not “the AI never hallucinates.”
- End with the limitation and the lesson; that is what makes the story credible.
