# Email password recovery

The Supabase-backed site sends and verifies password recovery codes through Supabase Auth. Configure the Hostinger mailbox in Supabase's Authentication SMTP settings, then set the **Reset Password** email template to include `{{ .Token }}` so the email contains the code used by the app.

Follow the complete steps in SUPABASE_SETUP.md. The older Netlify auth-recovery function and its SMTP environment variables are not used by the Supabase sign-in flow.
