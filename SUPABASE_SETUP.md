# Supabase setup for Fruitmaster HR

The site uses Supabase Auth for sign-in and a shared database for the HR workspace. The publishable key is in site/supabase-config.js; it is intended for browser use. The database policies in supabase/setup.sql restrict the full workspace to administrators and return a filtered snapshot to each employee.

## 1. Create the database tables and access rules

1. Sign in at [Supabase Dashboard](https://supabase.com/dashboard) and open the Fruitmaster HR project.
2. In the left sidebar, open **SQL Editor**.
3. Click **New query**.
4. Open supabase/setup.sql from this project, copy all of its contents, and paste them into the SQL Editor.
5. Click **Run**.
6. In the results area, copy the value shown under first_admin_setup_code. Keep it private; it is a one-time code for the first administrator account.

The SQL creates the database tables, enables row-level security, and adds employee-only functions for attendance punches, leave requests, and correction requests. It is safe to run again if you need to recover from a partial setup.

## 2. Configure email authentication

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to https://hr-fruitmaster.netlify.app.
3. Add https://hr-fruitmaster.netlify.app/** under **Redirect URLs** and save.
4. Open **Authentication → Providers → Email** and make sure email sign-up is enabled.
5. Open **Authentication → SMTP Settings** (or the SMTP section under Authentication settings) and enable custom SMTP.
6. Enter your Hostinger mailbox's SMTP details. Use the SMTP host and port shown in Hostinger's **Emails → Manage → Connect Apps & Devices** page. For Hostinger Email these are commonly smtp.hostinger.com, port 465 with SSL, and the full mailbox address as the username.
7. Keep the mailbox password only in the Supabase SMTP password field. Do not add it to the website code or send it in chat.
8. Open **Authentication → Email Templates → Reset Password**. Set the template to include {{ .Token }} so it sends a code the site can verify. For example:

    <h2>Fruitmaster HR password reset</h2>
    <p>Enter this code in the app:</p>
    <p><strong>{{ .Token }}</strong></p>
    <p>If you did not request this, you can ignore this email.</p>

Supabase's reset-password email can contain either a link or an OTP; the app's recovery screen verifies the OTP with the recovery token type.

## 3. Create the first administrator

1. Open https://hr-fruitmaster.netlify.app.
2. On the sign-in screen, click **First-time administrator setup**.
3. Enter your name, phone, email, and password.
4. Paste the first_admin_setup_code you copied from the SQL Editor.
5. Submit the form. If Supabase asks you to confirm your email, open the confirmation email, return to the site, and sign in.

The setup code can be claimed once. After that, the first-administrator setup option is closed.

## 4. Add employees and give them access

1. Sign in as the administrator and open **People**.
2. Create each employee profile using their work email address.
3. Have the employee open the site and choose **Create employee account**.
4. They must use the same email address entered on their employee profile. After email confirmation, they sign in and the site opens the Employee App.
5. In **Settings → User accounts**, administrators can assign account roles.

Employee accounts can see their own payroll, attendance, and leave records. The admin workspace row is protected by row-level security; employees use database functions that return only their permitted data.

## 5. Enable GPS and photo attendance

For this update, run the updated `supabase/setup.sql` again in **Supabase → SQL Editor → New query** before deploying. It refreshes the employee snapshot so the shared payslip theme and layout reach employee accounts, and keeps the private attendance-photo and GPS functions up to date. The script is safe to rerun. If the first administrator code was already claimed, its final result query may show no row; do not reset or recreate that code.

After deploying the update:

1. Sign in as an Administrator and open **Settings → Company profile**.
2. While physically at the office, click **Use this device’s GPS for office location** and allow location access. Or enter the office latitude and longitude yourself.
3. Set the attendance radius in metres. It starts at 150 metres and can be set from 25 to 1,000 metres.
4. Click **Save company profile**. Employees cannot punch in until the office coordinates are saved.
5. Employees open the site over HTTPS on a phone, allow camera and precise-location access, then tap **Office check-in · photo + GPS**. Keep the Employee App page open during the shift. After two accurate GPS readings confirm the employee has left the office radius, the app records an automatic check-out with GPS evidence. Employees can still use **Office check-out · photo + GPS** to check out manually.
6. Administrators can review the distance and GPS accuracy in **Attendance**, see whether a check-out was automatic, and open any private check-in or manual check-out photo from the row.

Automatic location monitoring runs only while the signed-in Employee App is open and the browser/phone continues providing GPS updates. Phones may suspend location updates when the browser is closed or backgrounded, the device is offline, or location permission is removed. In those cases automatic check-out may be delayed or unavailable; employees should keep the app open and active. If they have left the office and the automatic punch failed, they can submit an attendance correction for HR to review. The automatic exit check-out stores GPS evidence and an automatic reason, not a photo, because browsers require a user action before taking a camera photo.

Employees can download their own PDF from the **My pay** card or the **My payslips** table in the Employee App after the administrator marks payroll **Paid**. HR administrators can download a PDF for an employee from that employee’s **Payslip PDF** action in **Payroll**, including a preview before payment is marked paid.

## Shared payslip logo and design

In **Settings**, choose or remove the company logo, then select a payslip color theme and layout under **Shared payslip appearance**. Click **Apply to all payslips**. These settings are shared by employer and employee PDF downloads, so changing them updates both views. The theme and layout are stored in the shared workspace; employees receive those values through the restricted employee snapshot function when the updated setup SQL is applied.

Attendance photos are private; employees can upload and read their own evidence, while HR administrators can review attendance evidence.

## 6. Deploy the site manually

After applying the SQL and email settings, deploy the updated project using your usual Netlify CLI steps. From the project folder in PowerShell, run:

    netlify.cmd deploy --prod

The employee page can be installed from its **Add to home screen** button on supported phones. The project must be served over HTTPS for camera and location access.

## Payroll salary policy

Payroll uses the full monthly salary components regardless of attendance. Attendance remains recorded for HR, but missing or absent days do not prorate salary or prevent payroll from being marked paid. PF, ESI, loan, and TDS deductions continue to follow the employee's payroll profile and configured rules.

For an unpaid month, select the month in **Payroll** and click **Calculate full monthly payroll**. This also recalculates older unpaid entries under the full-month policy. Already-paid payroll entries and payslips are kept as historical records and are not changed automatically. Employees can download a PDF from **Employee App → My pay / My payslips** after payroll is marked **Paid**.

## Key handling

The sb_publishable_... key in site/supabase-config.js is a browser key. It does not grant access around the database policies. Never put a Supabase Secret key, service_role key, database password, or Hostinger mailbox password in this file.
