# AWHI Phase One — Secure Foundation

## Goal
Create a stable, understandable and security-first base for AWHI before adding advanced clinical automation.

## Phase One scope

### 1. Application shell
- AWHI home screen
- Responsive navigation
- Installable PWA foundation
- Clear placeholders for clinical modules

### 2. Authentication
- Supabase Auth planned as the identity provider
- No anonymous access to clinical data
- Practitioner profile linked to authenticated user ID
- Sign-out and session handling required before real-world use

### 3. Core database
Initial tables:
- practitioners
- clients
- practitioner_client_access
- case_notes

Later tables such as CEP assessments, risk plans, reports, documents, reminders and programme modules will be added after the core model is proven.

### 4. Clinical workflow
Phase One target workflow:
1. Practitioner signs in
2. Practitioner sees dashboard
3. Practitioner searches or creates an authorised client
4. Practitioner opens client profile
5. Practitioner creates a DARP or SOAP session note
6. Note is saved securely
7. Practitioner can reopen the saved note

### 5. Security requirements
- Row Level Security enabled on every clinical table
- No clinical table available anonymously
- Practitioner can access only clients explicitly assigned to them
- No service-role key in browser code
- No client data committed to GitHub
- Demo/test data only until security testing is complete
- Audit logging is required before wider multi-practitioner production use

## Not in Phase One
These are deliberately deferred so the foundation stays manageable:
- Manaaki AI
- Voice transcription
- CEP automation
- PDF scanning
- Automated court/probation letters
- Sober & Drive participant portal
- Wāhine Manaaki portal
- Advanced analytics

## Definition of done
Phase One is complete only when:
- app opens reliably on desktop and mobile browser
- login/logout works
- unauthenticated users cannot access clinical screens/data
- authorised practitioner can create/search/open a demo client
- DARP/SOAP demo note can be saved and reopened
- RLS tests confirm unauthorised records cannot be read or changed
- no secrets or identifiable client data exist in the repository
- PWA can be installed and reopened

## Safety gate
Do not use AWHI for real clinical records merely because the interface works. Production use requires privacy/security review, tested access controls, backup/recovery planning, and organisational approval appropriate to the service environment.
