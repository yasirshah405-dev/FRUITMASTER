-- Fruitmaster HR shared workspace setup for Supabase.
-- Run once in Supabase Dashboard > SQL Editor. Re-running is safe.

create table if not exists public.hrms_bootstrap (
  singleton boolean primary key default true check (singleton),
  setup_code text not null,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.hrms_bootstrap (singleton, setup_code)
values (true, replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''))
on conflict (singleton) do nothing;

create table if not exists public.hrms_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  photo_data text not null default '',
  role text not null default 'Employee' check (role in ('Administrator','HR','Manager','Employee')),
  created_at timestamptz not null default now()
);

create table if not exists public.hrms_workspace (
  id smallint primary key check (id = 1),
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hrms_bootstrap enable row level security;
alter table public.hrms_profiles enable row level security;
alter table public.hrms_workspace enable row level security;
revoke all on public.hrms_bootstrap from anon, authenticated;
revoke all on public.hrms_profiles from anon, authenticated;
revoke all on public.hrms_workspace from anon, authenticated;
alter table public.hrms_profiles add column if not exists photo_data text not null default '';
grant select, update (full_name, phone, photo_data) on public.hrms_profiles to authenticated;
grant select, insert, update on public.hrms_workspace to authenticated;

create or replace function public.hrms_is_admin()
returns boolean
language sql stable security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.hrms_profiles p
    where p.user_id = auth.uid() and p.role in ('Administrator','HR')
  );
$$;
revoke all on function public.hrms_is_admin() from public;
grant execute on function public.hrms_is_admin() to authenticated;

-- Private photo storage for geofenced employee attendance.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attendance-evidence', 'attendance-evidence', false, 2097152, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg'];
drop policy if exists "hrms attendance evidence upload own" on storage.objects;
create policy "hrms attendance evidence upload own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'attendance-evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "hrms attendance evidence read own or admins" on storage.objects;
create policy "hrms attendance evidence read own or admins" on storage.objects
  for select to authenticated using (
    bucket_id = 'attendance-evidence' and
    ((storage.foldername(name))[1] = auth.uid()::text or public.hrms_is_admin())
  );

drop policy if exists "profile self or admin read" on public.hrms_profiles;
create policy "profile self or admin read" on public.hrms_profiles
  for select to authenticated using (user_id = auth.uid() or public.hrms_is_admin());
drop policy if exists "profile self update" on public.hrms_profiles;
create policy "profile self update" on public.hrms_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "workspace admin read" on public.hrms_workspace;
create policy "workspace admin read" on public.hrms_workspace
  for select to authenticated using (public.hrms_is_admin());
drop policy if exists "workspace admin insert" on public.hrms_workspace;
create policy "workspace admin insert" on public.hrms_workspace
  for insert to authenticated with check (public.hrms_is_admin());
drop policy if exists "workspace admin update" on public.hrms_workspace;
create policy "workspace admin update" on public.hrms_workspace
  for update to authenticated using (public.hrms_is_admin()) with check (public.hrms_is_admin());

create or replace function public.hrms_setup_open()
returns boolean
language sql stable security definer
set search_path = pg_catalog, public
as $$ select exists (select 1 from public.hrms_bootstrap where singleton and not claimed); $$;
revoke all on function public.hrms_setup_open() from public;
grant execute on function public.hrms_setup_open() to anon, authenticated;

create or replace function public.hrms_setup_code_valid(p_code text)
returns boolean language sql stable security definer set search_path = pg_catalog, public
as $$ select exists (select 1 from public.hrms_bootstrap where singleton and not claimed and setup_code=p_code); $$;
revoke all on function public.hrms_setup_code_valid(text) from public;
grant execute on function public.hrms_setup_code_valid(text) to anon, authenticated;

create or replace function public.hrms_on_signup()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_role text := 'Employee';
  v_code text := coalesce(new.raw_user_meta_data->>'setup_code', '');
begin
  if v_code <> '' then
    update public.hrms_bootstrap
       set claimed = true
     where singleton and not claimed and setup_code = v_code;
    if found then v_role := 'Administrator'; end if;
  end if;
  insert into public.hrms_profiles(user_id, email, full_name, phone, role)
  values (new.id, lower(coalesce(new.email,'')), coalesce(new.raw_user_meta_data->>'full_name',''),
          coalesce(new.raw_user_meta_data->>'phone',''), v_role)
  on conflict (user_id) do update set email = excluded.email;
  if v_role = 'Administrator' then
    update auth.users
       set raw_user_meta_data = coalesce(raw_user_meta_data,'{}'::jsonb) - 'setup_code'
     where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.hrms_on_signup() from public;
drop trigger if exists hrms_auth_user_created on auth.users;
create trigger hrms_auth_user_created after insert on auth.users
  for each row execute function public.hrms_on_signup();

create or replace function public.hrms_on_auth_email_change()
returns trigger language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
begin
  if new.email is distinct from old.email then
    update public.hrms_profiles set email=lower(coalesce(new.email,'')) where user_id=new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.hrms_on_auth_email_change() from public;
drop trigger if exists hrms_auth_email_changed on auth.users;
create trigger hrms_auth_email_changed after update of email on auth.users
  for each row execute function public.hrms_on_auth_email_change();

create or replace function public.hrms_admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not public.hrms_is_admin() then raise exception 'Administrator access required'; end if;
  if p_role not in ('Administrator','HR','Manager','Employee') then raise exception 'Invalid role'; end if;
  update public.hrms_profiles set role = p_role where user_id = p_user_id;
  if not found then raise exception 'User account not found'; end if;
end;
$$;
revoke all on function public.hrms_admin_set_role(uuid,text) from public;
grant execute on function public.hrms_admin_set_role(uuid,text) to authenticated;

create or replace function public.hrms_employee_snapshot()
returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_email text;
  v_state jsonb;
  v_employee jsonb;
  v_employee_id text;
  v_result jsonb;
  v_employees jsonb;
  v_attendance jsonb;
begin
  if auth.uid() is null or public.hrms_is_admin() then raise exception 'Employee access required'; end if;
  select email into v_email from public.hrms_profiles where user_id = auth.uid();
  select state into v_state from public.hrms_workspace where id = 1;
  if v_state is null then raise exception 'The HR workspace has not been initialized'; end if;
  select e, e->>'id' into v_employee, v_employee_id
    from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e)
   where lower(coalesce(e->>'email','')) = lower(coalesce(v_email,''))
     and coalesce((e->>'active')::boolean,true)
   limit 1;
  if v_employee_id is null then raise exception 'Your account email is not linked to an active employee profile'; end if;
  select coalesce(jsonb_agg(case when e->>'id' = v_employee_id then e else
      jsonb_build_object('id',e->>'id','name',e->>'name','dept',e->>'dept','active',coalesce(e->'active','true'::jsonb)) end), '[]'::jsonb)
    into v_employees from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e)
   where coalesce((e->>'active')::boolean,true);
  select coalesce(jsonb_agg(case when a->>'employee'=v_employee_id then a else
      jsonb_build_object('id',a->>'id','employee',a->>'employee','date',a->>'date','status',a->>'status','in',a->>'in','out',a->>'out') end), '[]'::jsonb) into v_attendance
    from jsonb_array_elements(coalesce(v_state->'attendance','[]'::jsonb)) as attendance(a)
   where a->>'employee' = v_employee_id
      or a->>'date' = to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD');
  v_result := jsonb_build_object(
    'employees',v_employees,
    'attendance',v_attendance,
    'leaves',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(coalesce(v_state->'leaves','[]'::jsonb)) as leaves(x) where x->>'employee'=v_employee_id),
    'payroll',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(coalesce(v_state->'payroll','[]'::jsonb)) as payroll_rows(x) where x->>'employee'=v_employee_id),
    'holidays',coalesce(v_state->'holidays','[]'::jsonb),
    'attendanceRequests',(select coalesce(jsonb_agg(x),'[]'::jsonb) from jsonb_array_elements(coalesce(v_state->'attendanceRequests','[]'::jsonb)) as requests(x) where x->>'employee'=v_employee_id),
    'payrollSettings',coalesce(v_state->'payrollSettings','{}'::jsonb),
    'settings',jsonb_build_object('company',v_state#>>'{settings,company}','logoData',v_state#>>'{settings,logoData}',
      'payslipTheme',coalesce(v_state#>'{settings,payslipTheme}','"blue"'::jsonb),
      'payslipDesign',coalesce(v_state#>'{settings,payslipDesign}','"modern"'::jsonb),
      'payslipLogoScale',coalesce(v_state#>'{settings,payslipLogoScale}','100'::jsonb),
      'companyCity',v_state#>>'{settings,companyCity}','companyCountry',v_state#>>'{settings,companyCountry}',
      'officeLatitude',v_state#>>'{settings,officeLatitude}','officeLongitude',v_state#>>'{settings,officeLongitude}',
      'officeRadiusMeters',coalesce(v_state#>'{settings,officeRadiusMeters}','150'::jsonb),
      'annualLeave',coalesce(v_state#>'{settings,annualLeave}','18'::jsonb),
      'sickLeave',coalesce(v_state#>'{settings,sickLeave}','10'::jsonb),
      'workWeek',coalesce(v_state#>'{settings,workWeek}','"Monday–Friday"'::jsonb))
  );
  return v_result;
end;
$$;
revoke all on function public.hrms_employee_snapshot() from public;
grant execute on function public.hrms_employee_snapshot() to authenticated;

create or replace function public.hrms_employee_leave(p_type text, p_from date, p_to date, p_reason text)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare v_email text; v_state jsonb; v_employee_id text;
begin
  select email into v_email from public.hrms_profiles where user_id=auth.uid();
  select state into v_state from public.hrms_workspace where id=1 for update;
  select e->>'id' into v_employee_id from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e) where lower(e->>'email')=lower(v_email) and coalesce((e->>'active')::boolean,true) limit 1;
  if v_employee_id is null then raise exception 'Employee profile is not linked'; end if;
  if p_to < p_from or p_from < (now() at time zone 'Asia/Kolkata')::date then raise exception 'Check the leave dates'; end if;
  update public.hrms_workspace set state=jsonb_set(state,'{leaves}',coalesce(state->'leaves','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id','l'||replace(gen_random_uuid()::text,'-',''),'employee',v_employee_id,'type',p_type,'from',p_from::text,'to',p_to::text,'reason',p_reason,'status','Pending')),true),updated_at=now() where id=1;
end;
$$;

create or replace function public.hrms_employee_attendance_request(p_date date, p_status text, p_in text, p_out text, p_reason text)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare v_email text; v_state jsonb; v_employee_id text;
begin
  select email into v_email from public.hrms_profiles where user_id=auth.uid();
  select state into v_state from public.hrms_workspace where id=1 for update;
  select e->>'id' into v_employee_id from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e) where lower(e->>'email')=lower(v_email) and coalesce((e->>'active')::boolean,true) limit 1;
  if v_employee_id is null then raise exception 'Employee profile is not linked'; end if;
  if p_date > (now() at time zone 'Asia/Kolkata')::date then raise exception 'Correction date cannot be in the future'; end if;
  if p_status not in ('Present','Remote','On leave','Absent') then raise exception 'Invalid attendance status'; end if;
  update public.hrms_workspace set state=jsonb_set(state,'{attendanceRequests}',coalesce(state->'attendanceRequests','[]'::jsonb)||jsonb_build_array(jsonb_build_object('id','ar'||replace(gen_random_uuid()::text,'-',''),'employee',v_employee_id,'date',p_date::text,'requestedStatus',p_status,'in',coalesce(p_in,''),'out',coalesce(p_out,''),'reason',p_reason,'status','Pending','submittedAt',now())),true),updated_at=now() where id=1;
end;
$$;

drop function if exists public.hrms_employee_punch(text, text);
create or replace function public.hrms_employee_punch(p_action text, p_latitude double precision, p_longitude double precision, p_accuracy double precision, p_photo_path text)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare
  v_email text; v_state jsonb; v_employee_id text; v_day text; v_time text;
  v_existing jsonb; v_new jsonb; v_rows jsonb; v_evidence jsonb;
  v_office_lat double precision; v_office_lon double precision; v_radius double precision;
  v_distance double precision; v_a double precision; v_uid text := auth.uid()::text;
begin
  if auth.uid() is null or public.hrms_is_admin() then raise exception 'Employee access required'; end if;
  if p_action not in ('in','out') then raise exception 'Invalid attendance action'; end if;
  if p_latitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude is null or p_longitude < -180 or p_longitude > 180 then raise exception 'Valid GPS coordinates are required'; end if;
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 200 then raise exception 'GPS accuracy is too low. Enable precise location and try again'; end if;
  select email into v_email from public.hrms_profiles where user_id=auth.uid();
  select state into v_state from public.hrms_workspace where id=1 for update;
  if v_state is null then raise exception 'The HR workspace has not been initialized'; end if;
  v_office_lat:=nullif(v_state#>>'{settings,officeLatitude}','')::double precision;
  v_office_lon:=nullif(v_state#>>'{settings,officeLongitude}','')::double precision;
  v_radius:=coalesce(nullif(v_state#>>'{settings,officeRadiusMeters}','')::double precision,150);
  if v_office_lat is null or v_office_lon is null then raise exception 'Office GPS coordinates are not configured. Ask HR to update Company profile'; end if;
  if v_office_lat < -90 or v_office_lat > 90 or v_office_lon < -180 or v_office_lon > 180 or v_radius < 25 or v_radius > 1000 then raise exception 'The office attendance location settings are invalid. Ask HR to review them'; end if;
  if p_photo_path is null or p_photo_path !~ ('^' || v_uid || '/' || to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD') || '/' || p_action || '-[0-9]+[.]jpg$') then raise exception 'Take a new camera photo before punching attendance'; end if;
  if not exists (select 1 from storage.objects where bucket_id='attendance-evidence' and name=p_photo_path) then raise exception 'The attendance photo is missing. Take another photo and retry'; end if;
  select e->>'id' into v_employee_id from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e) where lower(e->>'email')=lower(v_email) and coalesce((e->>'active')::boolean,true) limit 1;
  if v_employee_id is null then raise exception 'Employee profile is not linked'; end if;
  v_day:=to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD');
  v_time:=to_char(now() at time zone 'Asia/Kolkata','HH24:MI');
  v_a:=power(sin(radians(p_latitude-v_office_lat)/2),2)+cos(radians(v_office_lat))*cos(radians(p_latitude))*power(sin(radians(p_longitude-v_office_lon)/2),2);
  v_distance:=6371000*2*asin(sqrt(least(1,greatest(0,v_a))));
  if v_distance > v_radius then raise exception 'You are about % m from the office. Attendance is accepted within % m',round(v_distance),round(v_radius); end if;
  v_evidence:=jsonb_build_object('path',p_photo_path,'latitude',p_latitude,'longitude',p_longitude,'accuracy',round(p_accuracy),'distanceMeters',round(v_distance),'capturedAt',now());
  select a into v_existing from jsonb_array_elements(coalesce(v_state->'attendance','[]'::jsonb)) as attendance(a) where a->>'employee'=v_employee_id and a->>'date'=v_day limit 1;
  if v_existing is null then
    if p_action='out' then raise exception 'Check in before checking out'; end if;
    v_new:=jsonb_build_object('id','a'||replace(gen_random_uuid()::text,'-',''),'employee',v_employee_id,'date',v_day,'status','Present','in',v_time,'out','','checkInEvidence',v_evidence);
    v_rows:=coalesce(v_state->'attendance','[]'::jsonb)||jsonb_build_array(v_new);
  else
    if v_existing->>'status' in ('Absent','On leave') then raise exception 'Ask HR to correct this attendance record'; end if;
    if p_action='in' then
      if coalesce(v_existing->>'in','')<>'' then raise exception 'Check in is already recorded'; end if;
      v_new:=v_existing||jsonb_build_object('in',v_time,'status','Present','checkInEvidence',v_evidence);
    else
      if coalesce(v_existing->>'in','')='' then raise exception 'Check in before checking out'; end if;
      if coalesce(v_existing->>'out','')<>'' then raise exception 'Check out is already recorded'; end if;
      v_new:=v_existing||jsonb_build_object('out',v_time,'checkOutEvidence',v_evidence);
    end if;
    select coalesce(jsonb_agg(case when a->>'id'=v_existing->>'id' then v_new else a end order by ord),'[]'::jsonb)
      into v_rows from jsonb_array_elements(coalesce(v_state->'attendance','[]'::jsonb)) with ordinality q(a,ord);
  end if;
  update public.hrms_workspace set state=jsonb_set(state,'{attendance}',v_rows,true),updated_at=now() where id=1;
end;
$$;

create or replace function public.hrms_employee_auto_checkout(p_date date, p_latitude double precision, p_longitude double precision, p_accuracy double precision)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare
  v_email text; v_state jsonb; v_employee_id text; v_day text; v_time text;
  v_existing jsonb; v_new jsonb; v_rows jsonb; v_evidence jsonb;
  v_office_lat double precision; v_office_lon double precision; v_radius double precision;
  v_distance double precision; v_a double precision;
begin
  if auth.uid() is null or public.hrms_is_admin() then raise exception 'Employee access required'; end if;
  if p_date is null or p_date < (now() at time zone 'Asia/Kolkata')::date - 1 or p_date > (now() at time zone 'Asia/Kolkata')::date then raise exception 'The attendance date is no longer eligible for automatic check-out'; end if;
  if p_latitude is null or p_latitude < -90 or p_latitude > 90 or p_longitude is null or p_longitude < -180 or p_longitude > 180 then raise exception 'Valid GPS coordinates are required'; end if;
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then raise exception 'GPS accuracy is too low to confirm that you left the office'; end if;
  select email into v_email from public.hrms_profiles where user_id=auth.uid();
  select state into v_state from public.hrms_workspace where id=1 for update;
  if v_state is null then raise exception 'The HR workspace has not been initialized'; end if;
  v_office_lat:=nullif(v_state#>>'{settings,officeLatitude}','')::double precision;
  v_office_lon:=nullif(v_state#>>'{settings,officeLongitude}','')::double precision;
  v_radius:=coalesce(nullif(v_state#>>'{settings,officeRadiusMeters}','')::double precision,150);
  if v_office_lat is null or v_office_lon is null then raise exception 'Office GPS coordinates are not configured'; end if;
  if v_office_lat < -90 or v_office_lat > 90 or v_office_lon < -180 or v_office_lon > 180 or v_radius < 25 or v_radius > 1000 then raise exception 'The office attendance location settings are invalid'; end if;
  select e->>'id' into v_employee_id from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e) where lower(e->>'email')=lower(v_email) and coalesce((e->>'active')::boolean,true) limit 1;
  if v_employee_id is null then raise exception 'Employee profile is not linked'; end if;
  v_day:=p_date::text;
  v_time:=to_char(now() at time zone 'Asia/Kolkata','HH24:MI');
  v_a:=power(sin(radians(p_latitude-v_office_lat)/2),2)+cos(radians(v_office_lat))*cos(radians(p_latitude))*power(sin(radians(p_longitude-v_office_lon)/2),2);
  v_distance:=6371000*2*asin(sqrt(least(1,greatest(0,v_a))));
  if v_distance-p_accuracy <= v_radius then raise exception 'Your GPS reading does not reliably confirm that you are outside the office radius'; end if;
  select a into v_existing from jsonb_array_elements(coalesce(v_state->'attendance','[]'::jsonb)) as attendance(a) where a->>'employee'=v_employee_id and a->>'date'=v_day limit 1;
  if v_existing is null or coalesce(v_existing->>'in','')='' then raise exception 'No open check-in was found for automatic check-out'; end if;
  if v_existing->>'status' in ('Absent','On leave') then raise exception 'Ask HR to correct this attendance record'; end if;
  if coalesce(v_existing->>'out','')<>'' then raise exception 'Check-out is already recorded'; end if;
  v_evidence:=jsonb_build_object('path',null,'latitude',p_latitude,'longitude',p_longitude,'accuracy',round(p_accuracy),'distanceMeters',round(v_distance),'capturedAt',now(),'automatic',true,'method','geofence-exit','reason','Automatic check-out after two accurate GPS readings outside the office radius');
  v_new:=v_existing||jsonb_build_object('out',v_time,'checkOutEvidence',v_evidence,'checkOutAutomatic',true);
  select coalesce(jsonb_agg(case when a->>'id'=v_existing->>'id' then v_new else a end order by ord),'[]'::jsonb)
    into v_rows from jsonb_array_elements(coalesce(v_state->'attendance','[]'::jsonb)) with ordinality q(a,ord);
  update public.hrms_workspace set state=jsonb_set(state,'{attendance}',v_rows,true),updated_at=now() where id=1;
end;
$$;

create or replace function public.hrms_employee_cancel_leave(p_leave_id text)
returns void language plpgsql security definer set search_path = pg_catalog, public, auth
as $$
declare v_email text; v_state jsonb; v_employee_id text;
begin
  select email into v_email from public.hrms_profiles where user_id=auth.uid();
  select state into v_state from public.hrms_workspace where id=1 for update;
  select e->>'id' into v_employee_id from jsonb_array_elements(coalesce(v_state->'employees','[]'::jsonb)) as employees(e) where lower(e->>'email')=lower(v_email) and coalesce((e->>'active')::boolean,true) limit 1;
  update public.hrms_workspace set state=jsonb_set(state,'{leaves}',coalesce((select jsonb_agg(l) from jsonb_array_elements(coalesce(state->'leaves','[]'::jsonb)) as leaves(l) where not (l->>'id'=p_leave_id and l->>'employee'=v_employee_id and l->>'status'='Pending')),'[]'::jsonb),true),updated_at=now() where id=1;
end;
$$;

revoke all on function public.hrms_employee_leave(text,date,date,text) from public;
revoke all on function public.hrms_employee_attendance_request(date,text,text,text,text) from public;
revoke all on function public.hrms_employee_punch(text,double precision,double precision,double precision,text) from public;
revoke all on function public.hrms_employee_auto_checkout(date,double precision,double precision,double precision) from public;
revoke all on function public.hrms_employee_cancel_leave(text) from public;
grant execute on function public.hrms_employee_leave(text,date,date,text) to authenticated;
grant execute on function public.hrms_employee_attendance_request(date,text,text,text,text) to authenticated;
grant execute on function public.hrms_employee_punch(text,double precision,double precision,double precision,text) to authenticated;
grant execute on function public.hrms_employee_auto_checkout(date,double precision,double precision,double precision) to authenticated;
grant execute on function public.hrms_employee_cancel_leave(text) to authenticated;

-- Copy the one-time code from this result and use it for the first administrator sign-up.
select setup_code as first_admin_setup_code from public.hrms_bootstrap where singleton and not claimed;
