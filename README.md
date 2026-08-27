# AWHI Digital Clinic

AWHI is a practitioner-focused digital hauora clinic designed to support culturally grounded Alcohol and Other Drug practice, clinical documentation, programme delivery and follow-up.

## Phase One: Secure Foundation

Phase One establishes the minimum safe platform before any real client information is used:

1. PWA application shell
2. Login/authentication design
3. Secure database architecture
4. Practitioner/client access model
5. Client record structure
6. Session note structure
7. Dashboard/navigation shell
8. Privacy and deployment safeguards

## Important security rule

This repository is currently public. **Do not commit client information, passwords, API secrets, Supabase service-role keys, private clinical documents or identifying data.** Use demo data only until the repository, backend and access controls have been reviewed and secured.

## Initial structure

- `index.html` — app shell
- `styles.css` — foundation styling
- `app.js` — navigation and shell logic
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — basic offline shell cache
- `docs/PHASE_1_FOUNDATION.md` — Phase One scope and completion criteria
- `supabase/schema.sql` — starter database schema
- `.gitignore` — prevents local secrets from being committed

## Phase One status

Foundation scaffold started 28 August 2026.
