# n8n workflows

The workflow exports behind the builds on my portfolio site. Each folder has the workflow JSON you can import into n8n, a screenshot of the canvas, and a short write-up.

| Workflow | What it does | Nodes |
|---|---|---|
| [AI Email Triage & Auto-Reply](ai-email-triage-auto-reply/) | Reads every customer email to a courier company, sorts it, replies to what it can and flags the rest for a person | 46 |
| [CRM Lead Intake Cleaner](crm-lead-intake-cleaner/) | Cleans and validates leads, catches duplicates across two sheets, and moves records when qualification changes | 28 |
| [Meeting Transcript to Project Tracker](meeting-transcript-to-project-tracker/) | Turns a finished meeting into a summary, tasks and deadlines in Sheets, Docs and Telegram | 10 |
| [Wholesale Lead Intake](wholesale-lead-intake/) | Sorts wholesale applications into tiers, assigns an owner and replies to the applicant | 20 |
| [Video Analyzer to Engaging Comments](video-analyzer-to-engaging-comments/) | Takes raw video through analysis, a rendered reel, approved copy, posting, and comment replies | 74 |

## Before you import

Everything private has been taken out: credentials, API keys, sheet and folder IDs, webhook IDs, email addresses and client names. Wherever you see `YOUR_...` or `@example.com`, put in your own value, then connect your own credentials on each node that asks for one.
