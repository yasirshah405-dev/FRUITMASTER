/* PeopleOS HR workspace with Supabase authentication and shared storage. */
(function () {
  "use strict";
  var STORAGE = "peopleos-hrms-demo-v2";
  var BRANDING_STORAGE = "peopleos-hrms-branding-v1";
  function dateOffset(daysFromToday) {
    var d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+(daysFromToday||0));
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  var TODAY = dateOffset(0);
  function initialData() {
    return {
      employees: [
        { id:"e1", name:"Sarah Khan", email:"sarah.khan@northstarlabs.com", dept:"Product", salary:145000, start:"2023-04-10", active:true },
        { id:"e2", name:"Rahul Verma", email:"rahul.verma@northstarlabs.com", dept:"Engineering", salary:182000, start:"2022-11-14", active:true },
        { id:"e3", name:"Meera Thomas", email:"meera.thomas@northstarlabs.com", dept:"People", salary:128000, start:"2024-02-05", active:true },
        { id:"e4", name:"Aditya Patel", email:"aditya.patel@northstarlabs.com", dept:"Finance", salary:156000, start:"2021-08-23", active:true }
      ],
      attendance: [
        { id:"a1", employee:"e1", date:TODAY, status:"Present", in:"09:02", out:"" },
        { id:"a2", employee:"e2", date:TODAY, status:"Remote", in:"08:47", out:"" },
        { id:"a3", employee:"e3", date:TODAY, status:"On leave", in:"", out:"" },
        { id:"a4", employee:"e4", date:TODAY, status:"Present", in:"09:16", out:"" }
      ],
      leaves: [
        { id:"l1", employee:"e1", type:"Annual leave", from:dateOffset(6), to:dateOffset(8), reason:"Family trip", status:"Pending" },
        { id:"l2", employee:"e2", type:"Sick leave", from:dateOffset(1), to:dateOffset(1), reason:"Medical appointment", status:"Pending" },
        { id:"l3", employee:"e3", type:"Annual leave", from:dateOffset(13), to:dateOffset(14), reason:"Personal", status:"Pending" }
      ],
      attendanceRequests: [], holidays: [],
      jobs: [
        { id:"j1", title:"Senior Product Designer", dept:"Product", location:"Bengaluru", status:"Open" },
        { id:"j2", title:"Backend Engineer", dept:"Engineering", location:"Remote", status:"Open" }
      ],
      candidates: [
        { id:"c1", name:"Nisha Rao", email:"nisha.rao@example.com", role:"Senior Product Designer", stage:"Screening" },
        { id:"c2", name:"Kabir Shah", email:"kabir.shah@example.com", role:"Backend Engineer", stage:"Interview" }
      ],
      tasks: [
        { id:"t1", employee:"e3", text:"Collect signed offer letter", due:dateOffset(2), done:false },
        { id:"t2", employee:"e3", text:"Set up laptop and accounts", due:dateOffset(3), done:false }
      ],
      goals: [
        { id:"g1", employee:"e1", text:"Launch customer research program", due:dateOffset(70), status:"In progress" },
        { id:"g2", employee:"e2", text:"Improve API response time by 20%", due:dateOffset(56), status:"In progress" }
      ],
      reviews: [
        { id:"r1", employee:"e4", rating:4, comment:"Strong ownership this quarter.", date:dateOffset(-4) }
      ],
      payroll: [],
      payrollSettings: { pfEmployeeRate:12, pfEmployerRate:12, pfWageCeiling:25000, esiEmployeeRate:0.75, esiEmployerRate:3.25, esiWageCeiling:21000, newStandardDeduction:75000, oldStandardDeduction:50000, newRebateLimit:1200000, newRebateAmount:60000, oldRebateLimit:500000, oldRebateAmount:12500, cessRate:4 },
      users: [],
      departments: [
        { id:"d1", name:"Engineering" }, { id:"d2", name:"Product" },
        { id:"d3", name:"People" }, { id:"d4", name:"Finance" },
        { id:"d5", name:"Sales" }, { id:"d6", name:"Marketing" }
      ],
      rules: [
        { id:"rule1", name:"Annual leave allowance", category:"Leave", value:"18 days", details:"Annual allowance per employee." },
        { id:"rule2", name:"Sick leave allowance", category:"Leave", value:"10 days", details:"Annual sick leave allowance." },
        { id:"rule3", name:"Core office hours", category:"Attendance", value:"09:00–18:00", details:"Standard workday schedule." },
        { id:"rule4", name:"Payroll statutory defaults", category:"Payroll", value:"Configurable", details:"PF, ESI, and TDS defaults are managed in Payroll settings." }
      ],
      settings: { company:"Fruitmaster HR", legalName:"", companyEmail:"", companyPhone:"", companyWebsite:"", companyAddress:"", companyCity:"", companyCountry:"India", officeLatitude:"", officeLongitude:"", officeRadiusMeters:150, annualLeave:18, sickLeave:10, workWeek:"Monday–Friday", logoData:"", payslipTheme:"blue", payslipDesign:"modern", payslipLogoScale:100 }
    };
  }
  var data;
  try { data = JSON.parse(localStorage.getItem(STORAGE)) || initialData(); } catch (_) { data = initialData(); }
  data.settings = Object.assign({ company:"Fruitmaster HR", legalName:"", companyEmail:"", companyPhone:"", companyWebsite:"", companyAddress:"", companyCity:"", companyCountry:"India", officeLatitude:"", officeLongitude:"", officeRadiusMeters:150, annualLeave:18, sickLeave:10, workWeek:"Monday–Friday", logoData:"", payslipTheme:"blue", payslipDesign:"modern", payslipLogoScale:100 }, data.settings || {});
  if (typeof data.settings.logoData !== "string") data.settings.logoData = "";
  if (!data.settings.company) data.settings.company = "Fruitmaster HR";
  try{var cachedBranding=JSON.parse(localStorage.getItem(BRANDING_STORAGE)||"null");if(cachedBranding){if(cachedBranding.company)data.settings.company=cachedBranding.company;if(typeof cachedBranding.logoData==="string")data.settings.logoData=cachedBranding.logoData;}}catch(_){}
  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.attendanceRequests)) data.attendanceRequests = [];
  if (!Array.isArray(data.holidays)) data.holidays = [];
  if (!Array.isArray(data.departments)) data.departments = Array.from(new Set(data.employees.map(function(e){return e.dept;}))).map(function(name,i){return{id:"d"+(i+1),name:name};});
  if (!Array.isArray(data.rules)) data.rules = initialData().rules;
  data.payrollSettings = Object.assign({}, initialData().payrollSettings, data.payrollSettings || {});
  if (Array.isArray(data.rules)) data.rules.forEach(function(r){if(r.id==="rule4"&&r.value==="15%") {r.value="Configurable";r.details="PF, ESI, and TDS defaults are managed in Payroll settings.";r.name="Payroll statutory defaults";}});
  var currentUser = null;
  var supabaseClient = window.supabase && window.HRMS_SUPABASE_CONFIG
    ? window.supabase.createClient(window.HRMS_SUPABASE_CONFIG.url, window.HRMS_SUPABASE_CONFIG.publishableKey)
    : null;
  var cloudSaveTimer = 0, cloudLoading = false, deferredInstallPrompt = null, cloudUpdatedAt = "";
  window.addEventListener("beforeinstallprompt",function(event){event.preventDefault();deferredInstallPrompt=event;});
  if("serviceWorker" in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener("load",function(){navigator.serviceWorker.register("/service-worker.js").catch(function(error){console.warn("App shell could not be installed for offline use.",error);});});}
  function cloudAdmin(){return !!(currentUser&&["Administrator","HR"].indexOf(currentUser.role)>=0);}
  function normalizeData(incoming){
    var base=initialData(),next=incoming&&typeof incoming==="object"?incoming:{};
    Object.keys(base).forEach(function(key){if(next[key]==null)next[key]=base[key];});
    next.settings=Object.assign({},base.settings,next.settings||{});next.payrollSettings=Object.assign({},base.payrollSettings,next.payrollSettings||{});
    ["employees","attendance","leaves","attendanceRequests","holidays","jobs","candidates","tasks","goals","reviews","payroll","users","departments","rules"].forEach(function(key){if(!Array.isArray(next[key]))next[key]=[];});
    return next;
  }
  function cloudState(){var copy=JSON.parse(JSON.stringify(data));copy.users=[];return copy;}
  async function syncWorkspaceNow(){
    if(!supabaseClient||!cloudAdmin()||cloudLoading)return;
    var result=await supabaseClient.from("hrms_workspace").upsert({id:1,state:cloudState(),updated_at:new Date().toISOString()},{onConflict:"id"}).select("updated_at").single();
    if(!result.error&&result.data)cloudUpdatedAt=result.data.updated_at||cloudUpdatedAt;
    if(result.error){console.error("Supabase workspace save failed",result.error);toastMsg("Cloud save failed: "+result.error.message);}
  }
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(data)); } catch (_) {}
    if(supabaseClient&&cloudAdmin()&&!cloudLoading){clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(function(){cloudSaveTimer=0;syncWorkspaceNow();},450);}
  }
  function clearCloudSessionData(){
    stopOfficeLocationWatch();clearTimeout(cloudSaveTimer);cloudSaveTimer=0;cloudUpdatedAt="";currentUser=null;
    try{localStorage.removeItem(STORAGE);sessionStorage.removeItem("peopleos-demo-session");}catch(_){}
    data=normalizeData(initialData());data.employees=[];data.attendance=[];data.leaves=[];data.attendanceRequests=[];data.holidays=[];data.jobs=[];data.candidates=[];data.tasks=[];data.goals=[];data.reviews=[];data.payroll=[];data.departments=[];data.users=[];data.settings.company="Fruitmaster HR";
    try{var branding=JSON.parse(localStorage.getItem(BRANDING_STORAGE)||"null");if(branding){if(branding.company)data.settings.company=branding.company;if(typeof branding.logoData==="string")data.settings.logoData=branding.logoData;}}catch(_){}
  }
  async function loadCloudWorkspace(profile){
    if(!supabaseClient)return;
    cloudLoading=true;
    try{
      if(profile.role==="Administrator"||profile.role==="HR"){
        var workspace=await supabaseClient.from("hrms_workspace").select("state,updated_at").eq("id",1).maybeSingle();
        if(workspace.error)throw workspace.error;
        cloudUpdatedAt=workspace.data&&workspace.data.updated_at||"";
        if(workspace.data&&workspace.data.state)data=normalizeData(workspace.data.state);
        else{
          var hasExistingLocalAccounts=Array.isArray(data.users)&&data.users.length>0;
          if(hasExistingLocalAccounts)data=normalizeData(data);
          else{
            data=normalizeData(initialData());data.employees=[];data.attendance=[];data.leaves=[];data.attendanceRequests=[];data.holidays=[];data.jobs=[];data.candidates=[];data.tasks=[];data.goals=[];data.reviews=[];data.payroll=[];data.departments=[];data.users=[];data.settings.company="Fruitmaster HR";
          }
          data.users=[];
          var seeded=await supabaseClient.from("hrms_workspace").upsert({id:1,state:cloudState()},{onConflict:"id"}).select("updated_at").single();if(seeded.error)throw seeded.error;cloudUpdatedAt=seeded.data&&seeded.data.updated_at||"";
        }
        var profiles=await supabaseClient.from("hrms_profiles").select("user_id,email,full_name,phone,photo_data,role,created_at").order("created_at");
        if(profiles.error)throw profiles.error;
        data.users=(profiles.data||[]).map(function(p){return{id:p.user_id,name:p.full_name,email:p.email,phone:p.phone,photoData:p.photo_data||"",role:p.role};});
      }else{
        var snapshot=await supabaseClient.rpc("hrms_employee_snapshot");
        if(snapshot.error)throw snapshot.error;
        data=normalizeData(snapshot.data);data.users=[];
      }
      applyBranding();
    }finally{cloudLoading=false;}
  }
  async function refreshEmployeeWorkspace(){
    if(!supabaseClient||!currentUser||cloudAdmin())return;
    var result=await supabaseClient.rpc("hrms_employee_snapshot");if(result.error)throw result.error;
    data=normalizeData(result.data);data.users=[];applyBranding();
  }
  async function refreshCloudUpdates(){
    if(!supabaseClient||!currentUser||cloudLoading||cloudSaveTimer)return;
    try{
      var authUser=await supabaseClient.auth.getUser();if(authUser.error||!authUser.data.user){await supabaseClient.auth.signOut();clearCloudSessionData();authGate();return;}
      var profileCheck=await supabaseClient.from("hrms_profiles").select("email,full_name,phone,photo_data,role").eq("user_id",currentUser.id).single();
      if(profileCheck.error)return;
      if(profileCheck.data.role!==currentUser.role){
        await supabaseClient.auth.signOut();clearCloudSessionData();showCloudAuth("login","Your access changed. Sign in again to continue.");return;
      }
      var priorHeader=currentUser.name+"|"+currentUser.email+"|"+currentUser.photoData;
      currentUser.name=profileCheck.data.full_name||currentUser.name;currentUser.email=profileCheck.data.email||currentUser.email;currentUser.phone=profileCheck.data.phone||currentUser.phone;currentUser.photoData=profileCheck.data.photo_data||"";
      if(priorHeader!==currentUser.name+"|"+currentUser.email+"|"+currentUser.photoData)syncAccountHeader();
      if(cloudAdmin()){
        var remote=await supabaseClient.from("hrms_workspace").select("state,updated_at").eq("id",1).maybeSingle();
        if(remote.error||!remote.data||remote.data.updated_at===cloudUpdatedAt)return;
        if(document.activeElement&&document.activeElement.closest("#moduleBody form"))return;
        await loadCloudWorkspace({role:currentUser.role});
        try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(_){}
        syncAccountHeader();renderPage(window.currentHrPage||"Overview");
      }else{
        var before=JSON.stringify(data),snapshot=await supabaseClient.rpc("hrms_employee_snapshot");
        if(snapshot.error)return;
        var nextSnapshot=normalizeData(snapshot.data);nextSnapshot.users=[];
        if(JSON.stringify(nextSnapshot)!==before){data=nextSnapshot;applyBranding();try{localStorage.setItem(STORAGE,JSON.stringify(data));}catch(_){}if(!document.activeElement||!document.activeElement.closest("#moduleBody form"))renderPage("Employee App");}
      }
    }catch(error){console.warn("Background HR workspace refresh failed.",error);}
  }
  function invalidateUnpaidPayroll(period){if(!period)return;data.payroll=data.payroll.filter(function(p){return p.period!==period||p.status==="Paid";});}
  function invalidateAllUnpaidPayroll(){data.payroll=data.payroll.filter(function(p){return p.status==="Paid";});}
  function invalidateLeavePayroll(leave){if(!leave||!leave.from||!leave.to)return;var from=periodParts(leave.from.slice(0,7)),to=periodParts(leave.to.slice(0,7));for(var cursor=from.yearMonth;cursor<=to.yearMonth;cursor++){var year=Math.floor((cursor-1)/12),month=(cursor-1)%12+1;invalidateUnpaidPayroll(year+"-"+String(month).padStart(2,"0"));}}
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c];
    });
  }
  function newId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,5); }
  function bytesToBase64(bytes) {
    var binary="";for(var i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary);
  }
  function base64ToBytes(value) {
    var raw=atob(value),out=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;
  }
  async function passwordHash(password,saltText) {
    if(!window.crypto||!window.crypto.subtle)throw new Error("Secure sign-in needs the HTTPS site URL.");
    var salt=saltText?base64ToBytes(saltText):window.crypto.getRandomValues(new Uint8Array(16));
    var material=await window.crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
    var bits=await window.crypto.subtle.deriveBits({name:"PBKDF2",salt:salt,iterations:120000,hash:"SHA-256"},material,256);
    return {salt:bytesToBase64(salt),hash:bytesToBase64(new Uint8Array(bits))};
  }
  function cleanPhone(value){return String(value||"").trim().replace(/[\s()-]/g,"");}
  function validPhone(value){var phone=cleanPhone(value);return /^\+[1-9][0-9]{7,14}$/.test(phone);}
  async function createLocalUser(name,email,password,role,phone) {
    var normalized=email.toLowerCase();
    if(data.users.some(function(u){return u.email.toLowerCase()===normalized;}))throw new Error("An account already uses that email.");
    if(password.length<8)throw new Error("Password must be at least 8 characters.");
    var normalizedPhone=cleanPhone(phone);
    if(!validPhone(normalizedPhone))throw new Error("Enter a valid phone number with country code.");
    if(data.users.some(function(u){return u.phone&&cleanPhone(u.phone)===normalizedPhone;}))throw new Error("An account already uses that phone number.");
    var digest=await passwordHash(password);
    data.users.push({id:newId("u"),name:name,email:normalized,phone:normalizedPhone,photoData:"",role:role||"Employee",salt:digest.salt,passwordHash:digest.hash});
  }
  function person(id) { return data.employees.find(function (e) { return e.id === id; }); }
  function personName(id) { var e = person(id); return e ? e.name : "Former employee"; }
  function linkedEmployee(){if(!currentUser)return null;var email=String(currentUser.email||"").trim().toLowerCase();return data.employees.find(function(e){return e.active&&String(e.email||"").trim().toLowerCase()===email;})||null;}
  function applyBranding() {
    var company = data.settings.company || "PeopleOS";
    try{localStorage.setItem(BRANDING_STORAGE,JSON.stringify({company:company,logoData:data.settings.logoData||""}));}catch(_){}
    var nameNode = document.getElementById("brandName"), orgNode = document.getElementById("orgName"), orgLocation = document.getElementById("orgLocation"), orgIcon = document.getElementById("orgIcon");
    var mark = document.getElementById("brandmark");
    if (nameNode) nameNode.textContent = company;
    if (orgNode) orgNode.textContent = company;
    if (orgLocation) orgLocation.textContent = [data.settings.companyCity, data.settings.companyCountry].filter(Boolean).join(" · ") || "Company profile";
    if (mark) {
      if (data.settings.logoData) mark.innerHTML = '<img alt="' + esc(company) + ' logo" src="' + esc(data.settings.logoData) + '">';
      else mark.textContent = (company.trim().charAt(0) || "P").toUpperCase();
    }
    if (orgIcon) {
      if (data.settings.logoData) orgIcon.innerHTML = '<img alt="" src="' + esc(data.settings.logoData) + '">';
      else orgIcon.textContent = (company.trim().charAt(0) || "P").toUpperCase();
    }
    var preview = document.getElementById("settingLogoPreview");
    if (preview) preview.innerHTML = data.settings.logoData
      ? '<img alt="' + esc(company) + ' logo preview" src="' + esc(data.settings.logoData) + '">'
      : '<span>' + esc((company.trim().charAt(0) || "P").toUpperCase()) + '</span>';
  }
  function payslipThemeDetails(theme){
    var themes={blue:{name:"Blue",primary:"#25375a",accent:"#4867df",light:"#edf2ff"},green:{name:"Green",primary:"#145b4a",accent:"#219879",light:"#e8f6f1"},burgundy:{name:"Burgundy",primary:"#642b3d",accent:"#a83d5d",light:"#fbecf1"},purple:{name:"Purple",primary:"#472d70",accent:"#7655bd",light:"#f2edfb"},charcoal:{name:"Charcoal",primary:"#313a46",accent:"#566474",light:"#eef1f4"}};
    return themes[theme]||themes.blue;
  }
  function money(n) { return new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(Number(n) || 0); }
  var payrollEditorEmployee = "", attendanceEditorId = "";
  function payrollProfile(e) {
    var p=e.pay||{},gross=Math.max(0,Number(e.salary)||0),basic=Number(p.basic),da=Number(p.da),hra=Number(p.hra),special=Number(p.specialAllowance),other=Number(p.otherEarnings);
    if(!e.pay){basic=Math.round(gross*.5);da=0;hra=Math.round(basic*.4);special=Math.max(0,gross-basic-da-hra);other=0;}
    else {basic=isFinite(basic)?basic:Math.round(gross*.5);da=isFinite(da)?da:0;hra=isFinite(hra)?hra:Math.round(basic*.4);special=isFinite(special)?special:Math.max(0,gross-basic-da-hra);other=isFinite(other)?other:0;}
    var otherExcluded=Math.max(0,Number(p.otherExcluded)||0);
    return {basic:basic,da:da,hra:hra,specialAllowance:special,otherEarnings:other,otherExcluded:otherExcluded,loan:Math.max(0,Number(p.loan)||0),pfEnabled:p.pfEnabled!==false,esiEnabled:typeof p.esiEnabled==="boolean"?p.esiEnabled:payrollWageBase({hra:hra,otherExcluded:otherExcluded},gross)<=data.payrollSettings.esiWageCeiling,taxRegime:p.taxRegime==="old"?"old":"new",resident:p.resident!==false,otherIncome:Math.max(0,Number(p.otherIncome)||0),oldDeductions:Math.max(0,Number(p.oldDeductions)||0),pastSalary:Math.max(0,Number(p.pastSalary)||0),priorTds:Math.max(0,Number(p.priorTds)||0),ageGroup:p.ageGroup||"under60"};
  }
  function profileGross(p){return Math.max(0,Number(p.basic)||0)+Math.max(0,Number(p.da)||0)+Math.max(0,Number(p.hra)||0)+Math.max(0,Number(p.specialAllowance)||0)+Math.max(0,Number(p.otherEarnings)||0);}
  function payrollWageBase(p,gross){var exclusions=Math.max(0,Number(p.hra)||0)+Math.max(0,Number(p.otherExcluded)||0);return Math.max(0,gross-Math.min(exclusions,Math.max(0,gross)*.5));}
  function resizePayrollProfile(e,nextGross){
    if(!e.pay)return;var p=payrollProfile(e),oldGross=profileGross(p),factor=oldGross?Math.max(0,nextGross)/oldGross:0;
    p.basic=Math.round(p.basic*factor);p.da=Math.round(p.da*factor);p.hra=Math.round(p.hra*factor);p.specialAllowance=Math.round(p.specialAllowance*factor);p.otherEarnings=Math.max(0,Math.round(nextGross)-p.basic-p.da-p.hra-p.specialAllowance);p.otherExcluded=Math.round(p.otherExcluded*factor);
    if(p.otherEarnings<0){p.otherEarnings=0;p.specialAllowance=Math.max(0,Math.round(nextGross)-p.basic-p.da-p.hra);}
    e.pay=p;
  }
  function slabTax(income,regime,ageGroup){
    var n=Math.max(0,Number(income)||0),slabs;
    if(regime==="old"){
      var zero=ageGroup==="80plus"?500000:ageGroup==="60to79"?300000:250000;
      slabs=[[zero,0],[500000,.05],[1000000,.20],[Infinity,.30]];
    }else slabs=[[400000,0],[800000,.05],[1200000,.10],[1600000,.15],[2000000,.20],[2400000,.25],[Infinity,.30]];
    var tax=0,lower=0;slabs.forEach(function(s){var upper=s[0],rate=s[1],portion=Math.max(0,Math.min(n,upper)-lower);tax+=portion*rate;lower=upper;});
    return tax;
  }
  function annualTax(income,salaryIncome,p,settings){
    var isOld=p.taxRegime==="old",deduction=isOld?settings.oldStandardDeduction:settings.newStandardDeduction;
    var taxable=Math.max(0,Number(income)||0)-Math.min(Math.max(0,Number(salaryIncome)||0),deduction);
    if(isOld)taxable=Math.max(0,taxable-(Number(p.oldDeductions)||0));
    var age=p.resident?p.ageGroup:"under60",raw=slabTax(taxable,p.taxRegime,age),rebateLimit=isOld?settings.oldRebateLimit:settings.newRebateLimit,rebate=isOld?settings.oldRebateAmount:settings.newRebateAmount,tax=raw;
    if(p.resident&&taxable<=rebateLimit)tax=Math.max(0,raw-rebate);
    else if(!isOld&&p.resident&&taxable>rebateLimit)tax=Math.min(raw,Math.max(0,taxable-rebateLimit));
    var surcharge=0;if(taxable>5000000)surcharge=taxable>20000000?(isOld&&taxable>50000000?37:25):taxable>10000000?15:10;
    var withSurcharge=tax*(1+surcharge/100),thresholds=isOld?[5000000,10000000,20000000,50000000]:[5000000,10000000,20000000];
    thresholds.forEach(function(threshold){if(taxable<=threshold)return;var beforeRate=threshold<=5000000?0:threshold<=10000000?10:threshold<=20000000?15:25,limit=slabTax(threshold,p.taxRegime,age)*(1+beforeRate/100)+(taxable-threshold);withSurcharge=Math.min(withSurcharge,limit);});
    return {taxable:taxable,tax:Math.ceil(withSurcharge*(1+settings.cessRate/100))};
  }
  function periodParts(period){var bits=String(period||TODAY.slice(0,7)).split("-").map(Number),year=bits[0]||new Date().getFullYear(),month=bits[1]||1;return {year:year,month:month,taxYear:month>=4?year:year-1,yearMonth:year*12+month};}
  function isScheduledWorkday(date){var weekday=new Date(date+"T12:00:00").getDay(),week=data.settings.workWeek||"Monday–Friday";if(week==="Sunday–Thursday")return weekday<=4;if(week==="Monday–Saturday")return weekday>=1;return weekday>=1&&weekday<=5;}
  function approvedLeaveForDay(employeeId,date){return data.leaves.find(function(l){return l.employee===employeeId&&l.status==="Approved"&&l.from<=date&&l.to>=date;});}
  function attendanceSummary(e,period){
    var parts=periodParts(period),monthStart=parts.year+"-"+String(parts.month).padStart(2,"0")+"-01",monthEnd=parts.year+"-"+String(parts.month).padStart(2,"0")+"-"+String(new Date(parts.year,parts.month,0).getDate()).padStart(2,"0"),first=e.start&&e.start>monthStart?e.start:monthStart;
    var scheduled=0,paid=0,unpaid=0,missing=0,present=0,remote=0,paidLeave=0;
    if(first<=monthEnd)for(var day=1;day<=new Date(parts.year,parts.month,0).getDate();day++){
      var date=parts.year+"-"+String(parts.month).padStart(2,"0")+"-"+String(day).padStart(2,"0");if(date<first||!isScheduledWorkday(date))continue;scheduled++;
      var record=data.attendance.find(function(a){return a.employee===e.id&&a.date===date;});
      if(record){if(record.status==="Present"||record.status==="Remote"){paid++;if(record.status==="Present")present++;else remote++;}else if(record.status==="On leave"){var approved=approvedLeaveForDay(e.id,date);if(approved&&approved.type!=="Unpaid leave"){paid++;paidLeave++;}else unpaid++;}else unpaid++;}
      else {var leave=approvedLeaveForDay(e.id,date);if(leave){if(leave.type!=="Unpaid leave"){paid++;paidLeave++;}else unpaid++;}else missing++;}
    }
    return {scheduledDays:scheduled,paidDays:paid,unpaidDays:unpaid,missingDays:missing,presentDays:present,remoteDays:remote,paidLeaveDays:paidLeave,proration:scheduled?paid/scheduled:0};
  }
  function payrollEstimate(e,period){
    var settings=data.payrollSettings,p=payrollProfile(e),attendance=attendanceSummary(e,period),factor=1,gross=Math.round(profileGross(p)),parts=periodParts(period),fyStart=parts.taxYear*12+4;
    var previous=data.payroll.filter(function(x){var q=periodParts(x.period);return x.employee===e.id&&q.yearMonth<parts.yearMonth&&q.yearMonth>=fyStart;});
    var priorGross=previous.reduce(function(n,x){return n+Number(x.gross||0);},0),priorTds=p.priorTds+previous.reduce(function(n,x){return n+Number(x.tds||0);},0);
    var monthsLeft=Math.max(1,13-(parts.month>=4?parts.month-3:parts.month+9)),fullMonthlyGross=profileGross(p);
    var salaryProjection=p.pastSalary+priorGross+fullMonthlyGross*monthsLeft,projection=salaryProjection+p.otherIncome;
    var tax=annualTax(projection,salaryProjection,p,settings),statutoryWages=payrollWageBase({hra:p.hra,otherExcluded:p.otherExcluded},gross),pfBase=p.pfEnabled?Math.min(statutoryWages,settings.pfWageCeiling):0;
    var pf=Math.round(pfBase*settings.pfEmployeeRate/100),employerPf=Math.round(pfBase*settings.pfEmployerRate/100);
    var esi=p.esiEnabled?Math.round(statutoryWages*settings.esiEmployeeRate/100):0,employerEsi=p.esiEnabled?Math.round(statutoryWages*settings.esiEmployerRate/100):0;
    var projectedTds=Math.ceil(Math.max(0,tax.tax-priorTds)/monthsLeft),tds=Math.min(projectedTds,Math.max(0,gross-pf-esi)),loan=Math.min(p.loan,Math.max(0,gross-pf-esi-tds)),deductions=pf+esi+loan+tds;
    return {payModel:"monthly-full-v1",basic:p.basic,da:p.da,hra:p.hra,specialAllowance:p.specialAllowance,otherEarnings:p.otherEarnings,gross:gross,pf:pf,esi:esi,loan:loan,tds:tds,deductions:deductions,net:Math.max(0,gross-deductions),employerPf:employerPf,employerEsi:employerEsi,taxableAnnualProjection:tax.taxable,annualTax:tax.tax,taxRegime:p.taxRegime,scheduledDays:attendance.scheduledDays,paidDays:attendance.paidDays,unpaidDays:attendance.unpaidDays,missingDays:attendance.missingDays,presentDays:attendance.presentDays,remoteDays:attendance.remoteDays,paidLeaveDays:attendance.paidLeaveDays,attendanceFactor:factor};
  }
  function toastMsg(s) {
    if (window.toast) { window.toast(s); return; }
    var el = document.createElement("div"); el.className = "toast"; el.textContent = s;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2300);
  }
  function options(values, selected) {
    return values.map(function (x) {
      var value = x.id || x, label = x.name || x;
      return '<option value="' + esc(value) + '" ' + (value === selected ? "selected" : "") + ">" + esc(label) + "</option>";
    }).join("");
  }
  function employeeOptions(selected) { return options(data.employees.filter(function (e) { return e.active; }), selected || ""); }
  function renderMetrics(items) {
    document.getElementById("metrics").classList.remove("payroll-metrics");
    document.getElementById("metrics").innerHTML = items.map(function (x) {
      return '<div class="metric"><span>' + esc(x[0]) + "</span><b>" + esc(x[1]) + "</b></div>";
    }).join("");
  }
  function formatDate(value,options){
    if(!value)return "—";
    var d=new Date(value+"T12:00:00");
    return isNaN(d.getTime())?value:d.toLocaleDateString("en-IN",options||{day:"numeric",month:"short"});
  }
  function initials(name){return String(name||"User").trim().split(/\s+/).map(function(x){return x.charAt(0);}).join("").slice(0,2).toUpperCase()||"U";}
  function paintAvatar(node,user){
    if(!node)return;
    node.classList.toggle("has-photo",!!(user&&user.photoData));
    if(user&&user.photoData)node.innerHTML='<img alt="" src="'+esc(user.photoData)+'">';
    else node.textContent=initials(user&&user.name);
  }
  function renderDashboard(){
    var active=data.employees.filter(function(e){return e.active;}),activeIds=new Set(active.map(function(e){return e.id;})),todayRows=data.attendance.filter(function(a){return a.date===TODAY&&activeIds.has(a.employee);});
    var present=todayRows.filter(function(a){return a.status==="Present";}).length,remote=todayRows.filter(function(a){return a.status==="Remote";}).length;
    var onLeaveIds=new Set(todayRows.filter(function(a){return a.status==="On leave";}).map(function(a){return a.employee;}));
    data.leaves.filter(function(l){return l.status==="Approved"&&l.from<=TODAY&&l.to>=TODAY&&activeIds.has(l.employee);}).forEach(function(l){onLeaveIds.add(l.employee);});
    var openJobs=data.jobs.filter(function(j){return j.status==="Open";}),pending=data.leaves.filter(function(l){return l.status==="Pending";}),values=document.querySelectorAll("#dashboard .stats .stat .value");
    var todayNode=document.querySelector("#dashboard .welcome .eyebrow"),heading=document.querySelector("#dashboard .welcome h1");
    if(todayNode)todayNode.textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).toUpperCase();
    if(heading)heading.textContent="Hello, "+(currentUser&&currentUser.name?currentUser.name:"there")+" 👋";
    if(values[0])values[0].textContent=active.length;
    if(values[1])values[1].innerHTML=String(present+remote)+' <small style="font-size:12px;color:#8994a7;font-weight:500">/ '+active.length+"</small>";
    if(values[2])values[2].textContent=onLeaveIds.size;
    if(values[3])values[3].textContent=openJobs.length;
    var trends=document.querySelectorAll("#dashboard .stats .stat .trend");
    if(trends[1])trends[1].innerHTML='<span class="up">'+(active.length?Math.round((present+remote)/active.length*100):0)+'%</span> attendance rate';
    if(trends[2])trends[2].innerHTML='Across <b style="color:#43516b">'+new Set(active.map(function(e){return e.dept;})).size+'</b> departments';
    var currentMonth=TODAY.slice(0,7),newJobs=data.jobs.filter(function(j){return j.createdAt&&j.createdAt.slice(0,7)===currentMonth;}).length;
    if(trends[3])trends[3].innerHTML='<span class="up">'+newJobs+' new</span> this month';
    var svg=document.querySelector("#dashboard .chart svg");
    if(svg){
      var todayDate=new Date(TODAY+"T12:00:00"),monday=new Date(todayDate);monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
      var pointsPresent=[],pointsRemote=[],xPoints=[90,200,310,420,530,640];
      for(var day=0;day<6;day++){
        var d=new Date(monday);d.setDate(monday.getDate()+day);var iso=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
        var dayRows=data.attendance.filter(function(a){return a.date===iso&&activeIds.has(a.employee);});
        var p=dayRows.filter(function(a){return a.status==="Present";}).length,r=dayRows.filter(function(a){return a.status==="Remote";}).length;
        pointsPresent.push([xPoints[day],168-(active.length?Math.min(100,p/active.length*100):0)*1.48]);
        pointsRemote.push([xPoints[day],168-(active.length?Math.min(100,r/active.length*100):0)*1.48]);
        var label=svg.querySelectorAll("g text")[5+day];if(label)label.textContent=d.toLocaleDateString("en-IN",{weekday:"short"});
      }
      var paths=svg.querySelectorAll("path");
      if(paths[1])paths[1].setAttribute("d",pointsPresent.map(function(pt,i){return(i?"L":"M")+pt[0]+" "+pt[1].toFixed(1);}).join(" "));
      if(paths[2])paths[2].setAttribute("d",pointsRemote.map(function(pt,i){return(i?"L":"M")+pt[0]+" "+pt[1].toFixed(1);}).join(" "));
      var sums=document.querySelectorAll("#dashboard .sum b");
      if(sums[0])sums[0].textContent=present;if(sums[1])sums[1].textContent=remote;if(sums[2])sums[2].textContent=onLeaveIds.size;
    }
    var reqBox=document.getElementById("requests"),pendingNode=document.getElementById("pending");
    if(pendingNode)pendingNode.textContent="· "+pending.length+" pending";
    if(reqBox)reqBox.innerHTML=pending.length?pending.slice(0,4).map(function(l){
      var emp=person(l.employee),dateText=formatDate(l.from)+(l.from===l.to?"":"–"+formatDate(l.to));
      return '<div class="request" data-leave-id="'+esc(l.id)+'"><div class="avatar">'+esc(initials(emp&&emp.name))+'</div><div class="reqinfo"><b>'+esc(emp?emp.name:"Former employee")+'</b><small>'+esc(l.type)+" · "+days(l.from,l.to)+' day(s)</small><small class="reason">'+esc(dateText+" · "+(l.reason||"No reason provided"))+'</small></div><div class="reqactions"><button class="ok" type="button" aria-label="Approve request">✓</button><button class="no" type="button" aria-label="Decline request">×</button></div></div>';
    }).join(""):'<div class="request empty">You’re all caught up. No pending leave requests.</div>';
    var rows=document.getElementById("rows"),rowCount=document.getElementById("rowcount"),inToday=document.querySelector(".bottom article .sub");
    if(rows){rows.innerHTML=active.slice(0,4).map(function(e){var a=todayRows.find(function(x){return x.employee===e.id;}),status=a?a.status:"Not recorded",time=a&&a.in?a.in:"—",parts=time.split(":"),displayTime=parts.length===2?new Date("2000-01-01T"+time+":00").toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):time;
      return '<tr><td><div class="emp"><div class="avatar">'+esc(initials(e.name))+'</div><span>'+esc(e.name)+'<small>'+esc(e.id.toUpperCase())+'</small></span></div></td><td>'+esc(e.dept)+'</td><td>'+esc(displayTime)+'</td><td><span class="badge '+(status==="Remote"?"remote":status==="On leave"?"leave":"")+'">'+esc(status)+'</span></td></tr>';
    }).join("")||'<tr><td colspan="4" class="empty-state">No active employees.</td></tr>';}
    if(rowCount)rowCount.textContent="Showing "+Math.min(4,active.length)+" of "+active.length+" active employees";
    if(inToday)inToday.textContent="Live status · "+active.length+" active employees";
    var payrollCard=document.querySelector(".bottom .stack article.card"),payrollPeriod=TODAY.slice(0,7),monthPayroll=data.payroll.filter(function(p){return p.period===payrollPeriod;}),reviewed=Math.min(active.length,monthPayroll.length),paid=monthPayroll.filter(function(p){return p.status==="Paid";}).length,percent=active.length?Math.round(reviewed/active.length*100):0,gross=active.reduce(function(total,e){var run=monthPayroll.find(function(p){return p.employee===e.id;});return total+Number(run&&run.gross!=null&&(run.status==="Paid"||run.payModel==="monthly-full-v1")?run.gross:payrollEstimate(e,payrollPeriod).gross)||0;},0),missing=active.reduce(function(total,e){var run=monthPayroll.find(function(p){return p.employee===e.id;});return total+Number(run&&run.missingDays!=null?run.missingDays:attendanceSummary(e,payrollPeriod).missingDays)||0;},0);
    if(payrollCard){var title=payrollCard.querySelector(".title"),badge=payrollCard.querySelector(".badge"),amount=payrollCard.querySelector(".amount"),caption=payrollCard.querySelector(".muted"),bar=payrollCard.querySelector(".progress i"),foot=payrollCard.querySelectorAll(".foot span"),action=payrollCard.querySelector(".btn.primary");
      if(title)title.textContent=new Date(TODAY+"T12:00:00").toLocaleDateString("en-IN",{month:"long",year:"numeric"})+" payroll";
      if(badge){badge.textContent=reviewed===0?"Not started":paid===active.length&&active.length?"Complete":"In progress";badge.classList.toggle("remote",reviewed>0&&paid<active.length);}
      if(amount)amount.textContent=money(gross);if(caption)caption.textContent="Attendance-adjusted gross · "+missing+" days unrecorded";if(bar)bar.style.width=percent+"%";
      if(foot[0])foot[0].textContent=reviewed+" of "+active.length+" reviewed";if(foot[1])foot[1].textContent=percent+"%";
      if(action)action.textContent=reviewed?"Continue payroll →":"Run payroll →";
    }
    var taskCard=document.querySelectorAll(".bottom .stack article.card")[1],taskItems=data.tasks.filter(function(t){return !t.done;}).sort(function(a,b){return String(a.due||"").localeCompare(String(b.due||""));}).slice(0,3);
    if(taskCard){var oldTasks=taskCard.querySelectorAll(".task");oldTasks.forEach(function(t){t.remove();});taskItems.forEach(function(t){var node=document.createElement("div");node.className="task";node.innerHTML='<i class="check"></i><span><b>'+esc(t.text)+'</b><small>'+esc(personName(t.employee))+" · onboarding"+'</small></span><time>'+esc(formatDate(t.due))+'</time>';taskCard.appendChild(node);});if(!taskItems.length){var empty=document.createElement("div");empty.className="task";empty.textContent="No outstanding onboarding tasks.";taskCard.appendChild(empty);}}
  }
  function setHead(title, desc) {
    document.getElementById("modtitle").textContent = title;
    document.getElementById("modhead").textContent = title;
    document.getElementById("moddesc").textContent = desc;
    document.getElementById("modhint").textContent = desc;
  }
  function matching(records, textFn) {
    var q = (document.getElementById("modsearch").value || "").trim().toLowerCase();
    return records.filter(function (r) { return textFn(r).toLowerCase().indexOf(q) >= 0; });
  }
  function table(headers, rows) {
    var content = rows.length ? rows.join("") : '<tr><td colspan="' + headers.length + '" class="empty-state">No records match this view.</td></tr>';
    return '<div class="tablewrap module-table"><table><thead><tr>' + headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" + content + "</tbody></table></div>";
  }
  function btn(id, action, label, extra) {
    return '<button class="' + (extra || "") + '" data-act="' + action + '" data-id="' + esc(id) + '">' + label + "</button>";
  }
  function field(label, input) {
    return '<label><span class="field-label">' + label + "</span>" + input + "</label>";
  }
  function form(cls, children, button) {
    return '<form class="feature-form" data-form="' + cls + '">' + children + '<button class="btn primary">' + button + "</button></form>";
  }
  function renderPeople() {
    setHead("People", "Employee directory · profiles, teams, and compensation");
    var active = data.employees.filter(function (e) { return e.active; });
    renderMetrics([["Active employees", active.length], ["Departments", new Set(data.employees.map(function (e) { return e.dept; })).size], ["Monthly base payroll", money(active.reduce(function (n,e) { return n + Number(e.salary); },0))]]);
    var rows = matching(data.employees, function (e) { return [e.name,e.email,e.dept,e.salary].join(" "); }).map(function (e) {
      var p=payrollProfile(e);
      return "<tr><td>" + esc(e.name) + '<small class="subcell">' + esc(e.email) + "</small></td><td>" + esc(e.dept) + "</td><td>" + money(e.salary) + "</td><td>" + esc(e.start || "—") + '</td><td><label class="profile-toggle"><input type="checkbox" data-employee-flag="pf" data-employee-id="'+esc(e.id)+'" '+(p.pfEnabled?'checked':'')+'> Applies</label></td><td><label class="profile-toggle"><input type="checkbox" data-employee-flag="esi" data-employee-id="'+esc(e.id)+'" '+(p.esiEnabled?'checked':'')+'> Applies</label></td><td><span class="badge ' + (e.active ? "" : "leave") + '">' + (e.active ? "Active" : "Inactive") + "</span></td><td><div class=\"row-actions\">" + btn(e.id,"edit-employee","Edit") + btn(e.id,"toggle-employee",e.active ? "Deactivate" : "Activate","danger") + btn(e.id,"delete-employee","Delete","danger") + "</div></td></tr>";
    });
    var f = form("employee",
      field("Name",'<input name="name" required placeholder="Full name">') +
      field("Work email",'<input name="email" type="email" required placeholder="name@company.com">') +
      field("Department",'<select name="dept">' + options(["Engineering","Product","People","Finance","Sales","Marketing"],"Engineering") + "</select>") +
      field("Monthly salary",'<input name="salary" type="number" min="0" required placeholder="₹ amount">') +
      field("Start date",'<input name="start" type="date">') +
      '<label class="pay-check"><input name="pfEnabled" type="checkbox" checked> PF applies</label><label class="pay-check"><input name="esiEnabled" type="checkbox"> ESI applies</label>', "＋ Add employee");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">Add an employee</div>' + f +
      '<div class="module-tools"><span>PF and ESI applicability is saved in the shared employee profile and used by payroll.</span><span>' + data.employees.length + " records</span></div>" +
      table(["Employee","Department","Monthly salary","Start date","PF","ESI","Status","Actions"], rows);
  }
  function renderAttendance() {
    setHead("Attendance", "Daily attendance · check in, check out, and status");
    var today = data.attendance.filter(function (a) { return a.date === TODAY; });
    renderMetrics([["Present",today.filter(function (a) { return a.status === "Present"; }).length],["Remote",today.filter(function (a) { return a.status === "Remote"; }).length],["On leave",today.filter(function (a) { return a.status === "On leave"; }).length]]);
    var isAdmin=cloudAdmin(),editing=data.attendance.find(function(a){return a.id===attendanceEditorId;});
    var rows = matching(data.attendance, function (a) { return [personName(a.employee),a.date,a.status].join(" "); }).sort(function (a,b) { return b.date.localeCompare(a.date); }).map(function (a) {
      var audit=a.override?'<span class="badge remote">Admin override</span><small class="subcell">'+esc([a.overrideBy||"Administrator",a.overrideAt?new Date(a.overrideAt).toLocaleString():"",a.overrideReason||"Reason not recorded"].filter(Boolean).join(" · "))+'</small>':"—";
      var proof=[],evidenceActions="";if(a.checkInEvidence){var inPoint=isFinite(Number(a.checkInEvidence.latitude))&&isFinite(Number(a.checkInEvidence.longitude))?Number(a.checkInEvidence.latitude).toFixed(5)+", "+Number(a.checkInEvidence.longitude).toFixed(5):"coordinates unavailable";proof.push("In: "+Math.round(Number(a.checkInEvidence.distanceMeters)||0)+" m · GPS ±"+Math.round(Number(a.checkInEvidence.accuracy)||0)+" m · "+inPoint);if(isAdmin&&a.checkInEvidence.path)evidenceActions+=btn(a.checkInEvidence.path,"view-attendance-evidence","In photo");}if(a.checkOutEvidence){var outPoint=isFinite(Number(a.checkOutEvidence.latitude))&&isFinite(Number(a.checkOutEvidence.longitude))?Number(a.checkOutEvidence.latitude).toFixed(5)+", "+Number(a.checkOutEvidence.longitude).toFixed(5):"coordinates unavailable";proof.push((a.checkOutEvidence.automatic?"Auto out: ":"Out: ")+Math.round(Number(a.checkOutEvidence.distanceMeters)||0)+" m · GPS ±"+Math.round(Number(a.checkOutEvidence.accuracy)||0)+" m · "+outPoint);if(isAdmin&&a.checkOutEvidence.path)evidenceActions+=btn(a.checkOutEvidence.path,"view-attendance-evidence","Out photo");}
      var actions=(isAdmin?btn(a.id,"edit-attendance","Edit")+btn(a.id,"delete-attendance","Remove","danger"):"")+evidenceActions;
      return "<tr><td>" + esc(personName(a.employee)) + "</td><td>" + esc(a.date) + '</td><td><span class="badge ' + (a.status === "Remote" ? "remote" : a.status === "On leave" ? "leave" : "") + '">' + esc(a.status) + "</span></td><td>" + esc(a.in || "—") + "</td><td>" + esc(a.out || "—") + "</td><td>"+(proof.length?proof.map(esc).join("<br>"):"—")+'</td><td>'+audit+'</td><td><div class="row-actions">' + actions + "</div></td></tr>";
    });
    var requestRows=matching(data.attendanceRequests,function(r){return personName(r.employee)+" "+r.date+" "+r.reason+" "+r.status+" "+r.requestedStatus;}).map(function(r){var review=r.reviewStatus||r.status,requestActions=review==="Pending"&&isAdmin?btn(r.id,"approve-attendance-request","Approve")+btn(r.id,"reject-attendance-request","Decline","danger"):esc(r.reviewedBy?"Reviewed by "+r.reviewedBy:review);return"<tr><td>"+esc(personName(r.employee))+"</td><td>"+esc(r.date)+"</td><td>"+esc(r.requestedStatus||r.status)+" · "+esc(r.in||"—")+" / "+esc(r.out||"—")+"</td><td>"+esc(r.reason)+"</td><td>"+requestActions+"</td></tr>";});
    var overrideFields=isAdmin?'<label class="pay-check"><input name="adminOverride" type="checkbox" '+(editing&&editing.override?'checked':'')+'> Administrator override</label>'+field("Override reason",'<input name="overrideReason" value="'+esc(editing&&editing.overrideReason||"")+'" placeholder="Required for override">'):"";
    var f = form("attendance",
      '<input type="hidden" name="recordId" value="'+esc(editing&&editing.id||"")+'">'+
      field("Employee",'<select name="employee">' + employeeOptions(editing&&editing.employee) + "</select>") +
      field("Date",'<input name="date" type="date" value="' + esc(editing&&editing.date||TODAY) + '" required>') +
      field("Status",'<select name="status">' + options(["Present","Remote","On leave","Absent"],editing&&editing.status||"Present") + "</select>") +
      field("Check in",'<input name="in" type="time" value="'+esc(editing&&editing.in||"09:00")+'">') +
      field("Check out",'<input name="out" type="time" value="'+esc(editing&&editing.out||"")+'">')+overrideFields, editing?"Update attendance":"Save attendance");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">'+(editing?"Edit attendance record":"Record daily attendance")+'</div>' + f + (editing?'<button class="btn attendance-cancel" type="button" data-act="cancel-attendance">Cancel edit</button>':"")+ 
      '<div class="module-tools"><span>Daily records sync across devices. Present, remote, and approved paid leave count as paid days; admin overrides are audited.</span><span>' + data.attendance.length + " daily records</span></div>" +
      table(["Employee","Date","Status","Check in","Check out","GPS proof","Audit","Actions"], rows)+'<div class="section-caption">Attendance correction requests</div>'+table(["Employee","Date","Requested correction","Reason","Review"],requestRows);
  }
  function renderEmployeeApp(){
    setHead("Employee App","Mobile self-service · attendance, leave, payroll, and team updates");
    var e=linkedEmployee();
    if(!e){stopOfficeLocationWatch();renderMetrics([["Employee account","Not linked"],["Sign-in email",currentUser&&currentUser.email||"—"],["Company","Contact HR"]]);document.getElementById("moduleBody").innerHTML='<div class="employee-link-warning"><b>Your login is not linked to an employee profile yet.</b><span>Ask your HR administrator to create or update your employee profile with the same email address you use to sign in.</span></div><div class="employee-help">Your login email must match an active employee profile in the shared HR workspace.</div>';return;}
    var todayRecord=data.attendance.find(function(a){return a.employee===e.id&&a.date===TODAY;}),ownLeaves=data.leaves.filter(function(l){return l.employee===e.id;}).sort(function(a,b){return b.from.localeCompare(a.from);}),ownPayroll=data.payroll.filter(function(p){return p.employee===e.id;}).sort(function(a,b){return b.period.localeCompare(a.period);}),todayPresent=data.attendance.filter(function(a){return a.date===TODAY&&["Present","Remote"].indexOf(a.status)>=0;}),nextHolidays=data.holidays.filter(function(h){return h.date>=TODAY;}).sort(function(a,b){return a.date.localeCompare(b.date);}).slice(0,5),profile=payrollProfile(e),annualUsed=ownLeaves.filter(function(l){return l.status==="Approved"&&l.type==="Annual leave"&&l.from.slice(0,4)===TODAY.slice(0,4);}).reduce(function(n,l){return n+days(l.from,l.to);},0),sickUsed=ownLeaves.filter(function(l){return l.status==="Approved"&&l.type==="Sick leave"&&l.from.slice(0,4)===TODAY.slice(0,4);}).reduce(function(n,l){return n+days(l.from,l.to);},0),balanceAnnual=Math.max(0,data.settings.annualLeave-annualUsed),balanceSick=Math.max(0,data.settings.sickLeave-sickUsed),fence=officeLocationConfig();
    var openAttendance=todayRecord&&todayRecord.in&&!todayRecord.out?todayRecord:null;syncOfficeLocationMonitor(e,openAttendance);
    var latestPaidSlip=ownPayroll.find(function(p){return p.status==="Paid";}),currentCalc=payrollEstimate(e,TODAY.slice(0,7)),attendanceText=todayRecord?todayRecord.status+(todayRecord.in?" · In "+todayRecord.in:"")+(todayRecord.out?" · Out "+todayRecord.out:""):"Not recorded yet",punchAction=!todayRecord?"employee-check-in":todayRecord.in&&!todayRecord.out?"employee-check-out":"",blockedPunch=todayRecord&&["Absent","On leave"].indexOf(todayRecord.status)>=0,clockButtons=!fence.ready?'<span class="punch-unavailable">Ask HR to set the office location.</span>':blockedPunch?'<span class="punch-unavailable">Attendance is marked '+esc(todayRecord.status)+'. Contact HR if this is incorrect.</span>':punchAction?'<button class="btn primary" type="button" data-act="'+punchAction+'">'+(punchAction==="employee-check-in"?"Office check-in":"Office check-out")+" · photo + GPS</button>":'<span class="punch-unavailable">Today’s check-in and check-out are complete.</span>',cameraInput='<input id="attendanceProofPhoto" class="attendance-camera-input" type="file" accept="image/*" capture="user" aria-label="Take attendance selfie">',punchHelp=fence.ready?"Office fence: "+Math.round(fence.radius)+" m · check-in takes a live photo; GPS monitoring stays active while this page is open and auto-checks you out outside the radius.":"HR must add the office GPS coordinates in Settings → Company profile.",monitorNote=openAttendance?'<small id="officeMonitorStatus" class="punch-monitor-status">Starting location monitoring…</small>':"";
    renderMetrics([["Annual leave balance",balanceAnnual+" days"],["Sick leave balance",balanceSick+" days"],["Attendance today",todayRecord?todayRecord.status:"Not recorded"],["This month take-home estimate",money(currentCalc.net)]]);
    var leaveRows=ownLeaves.slice(0,6).map(function(l){return"<tr><td>"+esc(l.type)+"</td><td>"+esc(l.from)+" – "+esc(l.to)+"</td><td><span class=\"badge "+(l.status==="Approved"?"":l.status==="Pending"?"remote":"leave")+"\">"+esc(l.status)+"</span></td><td>"+esc(l.reason||"—")+"</td><td>"+(l.status==="Pending"?btn(l.id,"employee-cancel-leave","Cancel","danger"):"—")+"</td></tr>";});
    var payRows=ownPayroll.map(function(p){var action=p.status==="Paid"?'<button class="btn" type="button" data-act="employee-payslip" data-id="'+esc(e.id)+'" data-period="'+esc(p.period)+'">Download PDF</button>':'<span class="muted">Available after payroll is paid</span>';return"<tr><td>"+esc(p.period)+"</td><td>"+money(p.gross)+"</td><td>"+money(p.deductions)+"</td><td><b>"+money(p.net)+"</b></td><td>"+esc(p.status)+"</td><td>"+action+"</td></tr>";});
    var latestPayslipShortcut=latestPaidSlip?'<button class="btn primary employee-payslip-shortcut" type="button" data-act="employee-payslip" data-id="'+esc(e.id)+'" data-period="'+esc(latestPaidSlip.period)+'">Download latest payslip PDF · '+esc(latestPaidSlip.period)+'</button>':'<small class="employee-payslip-note">Your payslip PDF will appear here after payroll is marked Paid.</small>';
    var teamRows=todayPresent.slice(0,8).map(function(a){var teammate=person(a.employee);return teammate?"<tr><td>"+esc(teammate.name)+"</td><td>"+esc(teammate.dept)+"</td><td>"+esc(a.status)+"</td></tr>":"";}).join("");
    var holidayRows=nextHolidays.map(function(h){return"<tr><td>"+esc(h.date)+"</td><td>"+esc(h.name)+"</td></tr>";});
    var leaveForm=form("employee-leave",field("Leave type",'<select name="type">'+options(["Annual leave","Sick leave","Personal leave","Unpaid leave"],"Annual leave")+"</select>")+field("From",'<input name="from" type="date" min="'+TODAY+'" required>')+field("To",'<input name="to" type="date" min="'+TODAY+'" required>')+field("Reason",'<input name="reason" required placeholder="Tell your manager why">'),"Submit leave request");
    var correctionForm=form("attendance-request",field("Date",'<input name="date" type="date" max="'+TODAY+'" required>')+field("Correct status to",'<select name="status">'+options(["Present","Remote","On leave","Absent"],"Present")+"</select>")+field("Check in",'<input name="in" type="time">')+field("Check out",'<input name="out" type="time">')+field("Reason",'<input name="reason" required placeholder="Explain the correction">'),"Request correction");
    document.getElementById("moduleBody").innerHTML='<section class="employee-portal"><div class="employee-hero"><div><div class="eyebrow">EMPLOYEE SELF SERVICE</div><h2>Hi '+esc(e.name.split(/\s+/)[0])+',</h2><p>'+esc(e.dept)+' · '+esc(data.settings.company)+' · '+esc(attendanceText)+'</p></div><div class="employee-punch">'+clockButtons+cameraInput+'<small class="punch-help">'+esc(punchHelp)+'</small>'+monitorNote+'<button class="btn app-install" type="button" data-act="install-employee-app">Add to home screen</button></div></div><div class="employee-card-grid"><section class="employee-card"><h3>My attendance</h3><p>Today · '+esc(TODAY)+'</p><div class="employee-card-value">'+esc(todayRecord?todayRecord.status:"Ready to check in")+'</div><small>'+esc(todayRecord&&todayRecord.in?"Check-in: "+todayRecord.in:"Your punch is saved to the shared attendance ledger.")+'</small></section><section class="employee-card"><h3>My pay</h3><p>'+esc(TODAY.slice(0,7))+' monthly salary</p><div class="employee-card-value">'+money(currentCalc.net)+'</div><small>'+"Attendance does not reduce salary · PF "+(profile.pfEnabled?"on":"off")+" · ESI "+(profile.esiEnabled?"on":"off")+'</small>'+latestPayslipShortcut+'</section><section class="employee-card"><h3>Loan instalment</h3><p>Current monthly deduction</p><div class="employee-card-value">'+money(profile.loan)+'</div><small>Ask payroll for the remaining balance statement.</small></section></div><div class="employee-columns"><section class="employee-section"><div class="section-caption">Apply for leave</div>'+leaveForm+'<div class="section-caption">My recent requests</div>'+table(["Type","Dates","Status","Reason","Action"],leaveRows)+'</section><section class="employee-section"><div class="section-caption">My payslips</div>'+table(["Period","Gross","Deductions","Net pay","Status","Payslip"],payRows)+'<div class="section-caption">Holiday calendar</div>'+table(["Date","Holiday"],holidayRows)+'</section></div><div class="employee-columns"><section class="employee-section"><div class="section-caption">Attendance correction</div><p class="employee-help">Send a correction request to HR. The original attendance stays unchanged until an administrator reviews it.</p>'+correctionForm+'</section><section class="employee-section"><div class="section-caption">Who is in today</div>'+table(["Colleague","Department","Status"],teamRows?teamRows.split("</tr>").filter(Boolean).map(function(r){return r+"</tr>";}):[])+'</section></div><div class="employee-help">Use your profile button above to change your photo, contact details, or password. Your HR administrator must match your login email to your employee profile.</div></section>';

    if(openAttendance)officeMonitorMessage(!supabaseClient?"Shared attendance is unavailable. Restore the connection; if you have left the office, request an attendance correction from HR.":!navigator.geolocation?"This browser does not support GPS monitoring. If you have left the office, request an attendance correction from HR.":!officeLocationConfig().ready?"Office GPS settings are unavailable. Ask HR to restore the office location.":officeGeoWatchId!==null?"Location monitoring is active while this page stays open. After two accurate readings outside the office radius, check-out is automatic.":officeGeoWatchKey?"Starting location monitoring…":"GPS monitoring could not start. If you have left the office, request an attendance correction from HR.");
  }
  function days(from,to) {
    return Math.max(1, Math.floor((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / 86400000) + 1);
  }
  function renderLeave() {
    setHead("Leave", "Leave requests · balances, policies, and approvals");
    var pending = data.leaves.filter(function (x) { return x.status === "Pending"; });
    renderMetrics([["Pending approval",pending.length],["Approved",data.leaves.filter(function (x) { return x.status === "Approved"; }).length],["Annual leave allowance",data.settings.annualLeave + " days"]]);
    var rows = matching(data.leaves, function (l) { return [personName(l.employee),l.type,l.reason,l.status].join(" "); }).map(function (l) {
      var acts = l.status === "Pending" ? btn(l.id,"approve-leave","Approve") + btn(l.id,"reject-leave","Decline","danger") : btn(l.id,"delete-leave","Remove","danger");
      return "<tr><td>" + esc(personName(l.employee)) + "</td><td>" + esc(l.type) + "</td><td>" + esc(l.from) + " – " + esc(l.to) + '<small class="subcell">' + days(l.from,l.to) + " day(s)</small></td><td>" + esc(l.reason) + '</td><td><span class="badge ' + (l.status === "Approved" ? "" : "remote") + '">' + esc(l.status) + '</span></td><td><div class="row-actions">' + acts + "</div></td></tr>";
    });
    var f = form("leave",
      field("Employee",'<select name="employee">' + employeeOptions() + "</select>") +
      field("Leave type",'<select name="type">' + options(["Annual leave","Sick leave","Personal leave","Unpaid leave"],"Annual leave") + "</select>") +
      field("From",'<input name="from" type="date" required>') +
      field("To",'<input name="to" type="date" required>') +
      field("Reason",'<input name="reason" required placeholder="Reason for leave">'), "Submit request");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">Submit a leave request</div>' + f +
      '<div class="module-tools"><span>Approve or decline pending requests below.</span><span>' + data.leaves.length + " requests</span></div>" +
      table(["Employee","Leave type","Dates","Reason","Status","Actions"], rows);
  }
  function renderHolidays(){
    setHead("Holidays","Company holiday calendar · upcoming days off");
    var upcoming=data.holidays.filter(function(h){return h.date>=TODAY;}).length;
    renderMetrics([["Calendar entries",data.holidays.length],["Upcoming holidays",upcoming],["Work week",data.settings.workWeek]]);
    var rows=matching(data.holidays,function(h){return h.name+" "+h.date;}).sort(function(a,b){return a.date.localeCompare(b.date);}).map(function(h){return"<tr><td>"+esc(h.date)+"</td><td>"+esc(h.name)+"</td><td>"+btn(h.id,"delete-holiday","Remove","danger")+"</td></tr>";});
    var f=form("holiday",field("Holiday name",'<input name="name" required placeholder="e.g. Company holiday">')+field("Date",'<input name="date" type="date" required>'),"＋ Add holiday");
    document.getElementById("moduleBody").innerHTML='<div class="section-caption">Add a company holiday</div>'+f+'<div class="module-tools"><span>Employees can see upcoming dates in the Employee App.</span><span>'+data.holidays.length+" holidays</span></div>"+table(["Date","Holiday","Action"],rows);
  }
  function renderPayroll() {
    setHead("Payroll", "Full monthly salary · attendance tracked separately · deductions and payslips");
    var period=(document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7),active=data.employees.filter(function(e){return e.active;}),run=data.payroll.filter(function(p){return p.period===period;}),settings=data.payrollSettings;
    if(!payrollEditorEmployee||!active.some(function(e){return e.id===payrollEditorEmployee;}))payrollEditorEmployee=(active[0]||{}).id||"";
    var totals=active.reduce(function(sum,e){var saved=run.find(function(p){return p.employee===e.id;}),calc=saved&&saved.gross!=null&&(saved.status==="Paid"||saved.payModel==="monthly-full-v1")?saved:payrollEstimate(e,period);sum.gross+=Number(calc.gross)||0;sum.net+=Number(calc.net)||0;sum.deductions+=Number(calc.deductions)||0;sum.employer+=Number(calc.employerPf||0)+Number(calc.employerEsi||0);return sum;},{gross:0,net:0,deductions:0,employer:0});
    renderMetrics([["Active employees",active.length],["Monthly gross",money(totals.gross)],["Estimated take home",money(totals.net)],["Employer PF + ESI",money(totals.employer)]]);
    document.getElementById("metrics").classList.add("payroll-metrics");
    var rows=matching(active,function(e){return e.name+" "+e.dept;}).map(function(e){
      var saved=run.find(function(p){return p.employee===e.id;}),c=saved&&saved.gross!=null&&(saved.status==="Paid"||saved.payModel==="monthly-full-v1")?saved:payrollEstimate(e,period),status=saved&&saved.status==="Paid"?"Paid":saved&&saved.payModel!=="monthly-full-v1"?"Recalculate":saved?saved.status:"Preview",p=payrollProfile(e),attendance=String((Number(c.paidDays)||0)+(Number(c.unpaidDays)||0))+" / "+String(c.scheduledDays||0);
      return "<tr><td>"+esc(e.name)+'<small class="subcell">'+esc(e.dept)+" · "+(p.taxRegime==="old"?"Old":"New")+" regime · PF "+(p.pfEnabled?"on":"off")+" · ESI "+(p.esiEnabled?"on":"off")+"</small></td><td>"+attendance+'<small class="subcell">'+(c.missingDays?c.missingDays+" missing":"complete")+"</small></td><td>"+money(c.basic)+"</td><td>"+money(c.da)+"</td><td>"+money(c.hra)+"</td><td>"+money(c.specialAllowance)+"</td><td>"+money(c.otherEarnings)+"</td><td><b>"+money(c.gross)+"</b></td><td>"+money(c.pf)+"</td><td>"+money(c.esi)+"</td><td>"+money(c.loan)+"</td><td>"+money(c.tds)+"</td><td><b>"+money(c.net)+"</b></td><td><span class=\"badge "+(status==="Paid"?"":status==="Recalculate"?"leave":"remote")+"\">"+esc(status)+"</span></td><td><div class=\"row-actions\">"+btn(e.id,"edit-pay","Pay setup")+(c.missingDays?btn(e.id,"review-attendance","Attendance"):"")+(saved&&saved.status==="Ready"&&saved.payModel==="monthly-full-v1"?btn(e.id,"mark-paid","Mark paid"):"")+btn(e.id,"payslip","Payslip PDF")+"</div></td></tr>";
    });
    var emp=active.find(function(e){return e.id===payrollEditorEmployee;})||active[0],p=emp?payrollProfile(emp):{basic:0,da:0,hra:0,specialAllowance:0,otherEarnings:0,otherExcluded:0,loan:0,pfEnabled:true,esiEnabled:false,taxRegime:"new",resident:true,otherIncome:0,oldDeductions:0,pastSalary:0,priorTds:0,ageGroup:"under60"};
    var profileForm=form("pay-profile",
      field("Employee",'<select name="employee" data-payroll-employee>'+options(active.map(function(e){return{id:e.id,name:e.name};}),emp?emp.id:"")+"</select>")+field("Basic salary / month",'<input name="basic" type="number" min="0" step="1" value="'+p.basic+'" required>')+
      field("DA / month",'<input name="da" type="number" min="0" step="1" value="'+p.da+'">')+field("HRA / month",'<input name="hra" type="number" min="0" step="1" value="'+p.hra+'">')+
      field("Special allowance / month",'<input name="specialAllowance" type="number" min="0" step="1" value="'+p.specialAllowance+'">')+field("Other earnings / month",'<input name="otherEarnings" type="number" min="0" step="1" value="'+p.otherEarnings+'">')+field("Other excluded allowances / month",'<input name="otherExcluded" type="number" min="0" step="1" value="'+p.otherExcluded+'">')+
      field("Loan EMI deduction / month",'<input name="loan" type="number" min="0" step="1" value="'+p.loan+'">')+field("Tax regime",'<select name="taxRegime">'+options([{id:"new",name:"New regime (projected)"},{id:"old",name:"Old regime (projected)"}],p.taxRegime)+"</select>")+field("Taxpayer age group",'<select name="ageGroup">'+options([{id:"under60",name:"Below 60"},{id:"60to79",name:"60–79"},{id:"80plus",name:"80+"}],p.ageGroup)+"</select>")+
      field("Other taxable income / year",'<input name="otherIncome" type="number" min="0" step="1" value="'+p.otherIncome+'">')+field("Old regime deductions / exemptions per year",'<input name="oldDeductions" type="number" min="0" step="1" value="'+p.oldDeductions+'">')+
      field("Salary paid before this app in tax year",'<input name="pastSalary" type="number" min="0" step="1" value="'+p.pastSalary+'">')+field("TDS already withheld before this app",'<input name="priorTds" type="number" min="0" step="1" value="'+p.priorTds+'">')+
      '<label class="pay-check"><input name="pfEnabled" type="checkbox" '+(p.pfEnabled?'checked':'')+'> PF applies</label><label class="pay-check"><input name="esiEnabled" type="checkbox" '+(p.esiEnabled?'checked':'')+'> ESI applies this month</label><label class="pay-check"><input name="resident" type="checkbox" '+(p.resident?'checked':'')+'> Resident for tax rebate</label>',"Save salary and tax details");
    var rulesForm=form("payroll-rules",
      field("Employee PF rate (%)",'<input name="pfEmployeeRate" type="number" min="0" max="100" step="0.01" value="'+settings.pfEmployeeRate+'">')+field("Employer PF rate (%)",'<input name="pfEmployerRate" type="number" min="0" max="100" step="0.01" value="'+settings.pfEmployerRate+'">')+
      field("PF wage ceiling / month",'<input name="pfWageCeiling" type="number" min="0" step="1" value="'+settings.pfWageCeiling+'">')+field("Employee ESI rate (%)",'<input name="esiEmployeeRate" type="number" min="0" max="100" step="0.01" value="'+settings.esiEmployeeRate+'">')+
      field("Employer ESI rate (%)",'<input name="esiEmployerRate" type="number" min="0" max="100" step="0.01" value="'+settings.esiEmployerRate+'">')+field("ESI wage ceiling / month",'<input name="esiWageCeiling" type="number" min="0" step="1" value="'+settings.esiWageCeiling+'">')+
      field("New regime standard deduction / year",'<input name="newStandardDeduction" type="number" min="0" step="1" value="'+settings.newStandardDeduction+'">')+field("New regime rebate income limit",'<input name="newRebateLimit" type="number" min="0" step="1" value="'+settings.newRebateLimit+'">')+
      field("New regime rebate maximum",'<input name="newRebateAmount" type="number" min="0" step="1" value="'+settings.newRebateAmount+'">')+field("Old regime standard deduction / year",'<input name="oldStandardDeduction" type="number" min="0" step="1" value="'+settings.oldStandardDeduction+'">')+
      field("Old regime rebate income limit",'<input name="oldRebateLimit" type="number" min="0" step="1" value="'+settings.oldRebateLimit+'">')+field("Old regime rebate maximum",'<input name="oldRebateAmount" type="number" min="0" step="1" value="'+settings.oldRebateAmount+'">')+
      field("Health & education cess (%)",'<input name="cessRate" type="number" min="0" max="100" step="0.01" value="'+settings.cessRate+'">'),"Save payroll settings");
    document.getElementById("moduleBody").innerHTML='<div class="section-caption">Payroll period</div><div class="feature-form payroll-period"><label><span class="field-label">Month</span><input id="payPeriod" type="month" value="'+esc(period)+'"></label><button class="btn primary" data-act="run-payroll">Calculate full monthly payroll</button><button class="btn" data-act="export-payslips">Export payroll CSV</button><span class="muted">Full monthly salary components are paid regardless of attendance. Attendance is recorded separately and does not prorate pay or block payroll. Click Calculate to recalculate unpaid payroll; paid entries stay unchanged. PF, ESI, loan, and TDS still follow the employee profile.</span></div><div class="module-tools"><span>'+esc(period)+" · gross "+money(totals.gross)+" · deductions "+money(totals.deductions)+" · net "+money(totals.net)+"</span><span>"+run.filter(function(x){return x.status==="Paid";}).length+" paid · "+active.reduce(function(n,e){var r=run.find(function(x){return x.employee===e.id;}),c=r&&r.paidDays!=null?r:payrollEstimate(e,period);return n+(Number(c.missingDays)||0);},0)+" attendance days missing (no salary impact)</span></div>"+
      '<div class="section-caption">Full monthly salary and deductions · attendance is separate</div>'+table(["Employee","Attendance recorded","Basic","DA","HRA","Special","Other","Gross","PF","ESI","Loan","TDS","Net pay","Status","Actions"],rows)+
      '<details class="payroll-settings"><summary>PF, ESI, and income tax settings</summary><p class="payroll-help">Rates and thresholds are editable estimates. PF and ESI applicability is read from each employee profile. New and old regime TDS is projected using the values configured here and the employee tax profile.</p>'+rulesForm+'</details>'+
      '<div class="section-caption">Employee salary and tax profile</div><p class="payroll-help">New employees start with an editable sample split: Basic 50% of gross, HRA 40% of Basic, and the balance as Special allowance. The statutory wage base subtracts HRA and any other excluded allowances you enter, subject to the 50% floor. Change these values to your signed salary structure. PF and ESI employer shares are shown in employer cost and are not subtracted from net pay.</p>'+profileForm;
    document.getElementById("payPeriod").onchange=function(){renderPage("Payroll");};
  }
  function renderRecruitment() {
    setHead("Recruitment", "Hiring pipeline · manage open roles and candidates");
    renderMetrics([["Open positions",data.jobs.filter(function (j) { return j.status === "Open"; }).length],["Candidates",data.candidates.length],["Interviews",data.candidates.filter(function (c) { return c.stage === "Interview"; }).length]]);
    var jobs = matching(data.jobs, function (j) { return [j.title,j.dept,j.location].join(" "); }).map(function (j) {
      return "<tr><td>" + esc(j.title) + "</td><td>" + esc(j.dept) + "</td><td>" + esc(j.location) + '</td><td><span class="badge ' + (j.status === "Open" ? "" : "leave") + '">' + esc(j.status) + '</span></td><td>' + btn(j.id,"close-job",j.status === "Open" ? "Close role" : "Reopen role") + "</td></tr>";
    });
    var candidates = matching(data.candidates, function (c) { return [c.name,c.role,c.stage].join(" "); }).map(function (c) {
      return "<tr><td>" + esc(c.name) + '<small class="subcell">' + esc(c.email) + '</small></td><td>' + esc(c.role) + '</td><td><select class="status-select" data-stage="' + esc(c.id) + '">' + options(["Applied","Screening","Interview","Offer","Hired","Rejected"],c.stage) + '</select></td><td>' + btn(c.id,"delete-candidate","Remove","danger") + "</td></tr>";
    });
    var jobForm = form("job",field("Role",'<input name="title" required placeholder="Job title">')+field("Department",'<select name="dept">'+options(["Engineering","Product","People","Finance","Sales","Marketing"],"Engineering")+"</select>")+field("Location",'<input name="location" placeholder="Location">'),"＋ Add role");
    var candidateForm = form("candidate",field("Candidate",'<input name="name" required placeholder="Full name">')+field("Email",'<input name="email" type="email" required placeholder="Email">')+field("Role",'<input name="role" required placeholder="Role applied for">')+field("Stage",'<select name="stage">'+options(["Applied","Screening","Interview","Offer","Hired"],"Applied")+"</select>"),"＋ Add candidate");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">Open a role</div>' + jobForm + '<div class="module-tools"><b>Roles</b><span>' + data.jobs.length + " total</span></div>" + table(["Role","Department","Location","Status","Action"],jobs) +
      '<div class="section-caption">Add a candidate</div>' + candidateForm + '<div class="module-tools"><b>Candidates</b><span>' + data.candidates.length + " total</span></div>" + table(["Candidate","Role","Stage","Action"],candidates);
  }
  function renderOnboarding() {
    setHead("Onboarding", "New joiner checklist · assign and complete setup tasks");
    renderMetrics([["Checklist tasks",data.tasks.length],["Remaining",data.tasks.filter(function (t) { return !t.done; }).length],["Complete",data.tasks.filter(function (t) { return t.done; }).length]]);
    var rows = matching(data.tasks, function (t) { return personName(t.employee) + " " + t.text + " " + t.due; }).map(function (t) {
      return '<tr><td><input class="inline-check" type="checkbox" data-task="' + esc(t.id) + '" ' + (t.done ? "checked" : "") + '> ' + esc(t.text) + "</td><td>" + esc(personName(t.employee)) + "</td><td>" + esc(t.due || "—") + '</td><td><span class="badge ' + (t.done ? "" : "remote") + '">' + (t.done ? "Complete" : "To do") + '</span></td><td>' + btn(t.id,"delete-task","Remove","danger") + "</td></tr>";
    });
    var f = form("task",field("New joiner",'<select name="employee">'+employeeOptions()+"</select>")+field("Task",'<input name="text" required placeholder="Checklist task">')+field("Due date",'<input name="due" type="date">'),"＋ Add task");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">Create a checklist item</div>' + f + '<div class="module-tools"><span>Check items to update their completion status.</span><span>' + data.tasks.length + " tasks</span></div>" + table(["Task","New joiner","Due date","Status","Action"],rows);
  }
  function renderPerformance() {
    setHead("Performance", "Goals and reviews · track progress and feedback");
    renderMetrics([["Goals",data.goals.length],["In progress",data.goals.filter(function (g) { return g.status === "In progress"; }).length],["Reviews recorded",data.reviews.length]]);
    var goals = matching(data.goals, function (g) { return personName(g.employee) + " " + g.text + " " + g.status; }).map(function (g) {
      return "<tr><td>" + esc(g.text) + "</td><td>" + esc(personName(g.employee)) + "</td><td>" + esc(g.due || "—") + '</td><td><select class="status-select" data-goal="' + esc(g.id) + '">' + options(["Not started","In progress","Complete"],g.status) + '</select></td><td>' + btn(g.id,"delete-goal","Remove","danger") + "</td></tr>";
    });
    var reviews = matching(data.reviews, function (r) { return personName(r.employee) + " " + r.comment; }).map(function (r) {
      return "<tr><td>" + esc(personName(r.employee)) + "</td><td>" + esc(r.date) + "</td><td>" + esc(r.rating) + " / 5</td><td>" + esc(r.comment) + "</td><td>" + btn(r.id,"delete-review","Remove","danger") + "</td></tr>";
    });
    var goalForm = form("goal",field("Employee",'<select name="employee">'+employeeOptions()+"</select>")+field("Goal",'<input name="text" required placeholder="Goal description">')+field("Due date",'<input name="due" type="date">'),"＋ Add goal");
    var reviewForm = form("review",field("Employee",'<select name="employee">'+employeeOptions()+"</select>")+field("Rating",'<select name="rating">'+options(["1","2","3","4","5"],"4")+"</select>")+field("Date",'<input name="date" type="date" value="'+TODAY+'">')+field("Feedback",'<input name="comment" required placeholder="Feedback summary">'),"＋ Save review");
    document.getElementById("moduleBody").innerHTML = '<div class="section-caption">Add a goal</div>' + goalForm + '<div class="module-tools"><b>Goals</b><span>' + data.goals.length + " records</span></div>" + table(["Goal","Owner","Due","Status","Action"],goals) + '<div class="section-caption">Record a review</div>' + reviewForm + '<div class="module-tools"><b>Recent reviews</b><span>' + data.reviews.length + " records</span></div>" + table(["Employee","Date","Rating","Feedback","Action"],reviews);
  }
  function officeLocationConfig(){
    var latRaw=data.settings.officeLatitude,lonRaw=data.settings.officeLongitude,lat=latRaw==null||String(latRaw).trim()===""?NaN:Number(latRaw),lon=lonRaw==null||String(lonRaw).trim()===""?NaN:Number(lonRaw),radius=Number(data.settings.officeRadiusMeters)||150;
    return {ready:isFinite(lat)&&lat>=-90&&lat<=90&&isFinite(lon)&&lon>=-180&&lon<=180,latitude:lat,longitude:lon,radius:radius};
  }
  function distanceMeters(lat1,lon1,lat2,lon2){
    var rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad,a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)*Math.sin(dLon/2);a=Math.min(1,Math.max(0,a));return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function indiaDay(){var p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),v={};p.forEach(function(x){v[x.type]=x.value;});return v.year+"-"+v.month+"-"+v.day;}
  function indiaDayOffset(offset){var p=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(Date.now()+offset*86400000)),v={};p.forEach(function(x){v[x.type]=x.value;});return v.year+"-"+v.month+"-"+v.day;}
  var officeGeoWatchId=null,officeGeoWatchKey="",officeGeoEmployeeId="",officeGeoRecordDate="",officeGeoOutsideSamples=0,officeGeoLastOutsideAt=0,officeGeoSubmitPending=false;
  function stopOfficeLocationWatch(){if(officeGeoWatchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(officeGeoWatchId);officeGeoWatchId=null;officeGeoWatchKey="";officeGeoEmployeeId="";officeGeoRecordDate="";officeGeoOutsideSamples=0;officeGeoLastOutsideAt=0;officeGeoSubmitPending=false;}
  function officeMonitorMessage(message){var node=document.getElementById("officeMonitorStatus");if(node)node.textContent=message;}
  async function submitAutomaticOfficeCheckout(position,record,distance){
    if(officeGeoSubmitPending||!supabaseClient)return;officeGeoSubmitPending=true;officeMonitorMessage("You are outside the office radius. Recording automatic check-out…");
    try{
      var result=await supabaseClient.rpc("hrms_employee_auto_checkout",{p_date:record.date,p_latitude:position.coords.latitude,p_longitude:position.coords.longitude,p_accuracy:position.coords.accuracy});if(result.error)throw result.error;
      stopOfficeLocationWatch();try{await refreshEmployeeWorkspace();}catch(refreshError){console.warn("Automatic check-out was recorded, but the attendance view could not refresh.",refreshError);}renderPage("Employee App");toastMsg("Automatic check-out recorded after leaving the office radius ("+Math.round(distance)+" m away).");
    }catch(error){officeGeoSubmitPending=false;officeGeoOutsideSamples=1;officeGeoLastOutsideAt=Date.now();officeMonitorMessage("Automatic check-out could not be saved. Keep this page open and restore GPS or network. If it still fails, request an attendance correction from HR. "+(error&&error.message||""));console.warn("Automatic geofence check-out failed.",error);}
  }
  function processOfficeMonitorPosition(position){
    if(!officeGeoWatchKey||officeGeoSubmitPending)return;
    var record=data.attendance.find(function(a){return a.employee===officeGeoEmployeeId&&a.date===officeGeoRecordDate;});
    if(!record||!record.in||record.out){stopOfficeLocationWatch();return;}
    var coords=position&&position.coords,fence=officeLocationConfig();
    if(!coords||!fence.ready||!isFinite(coords.accuracy)||coords.accuracy>100){officeGeoOutsideSamples=0;officeMonitorMessage("GPS is not accurate enough to monitor checkout. Enable precise location and keep this page open.");return;}
    var distance=distanceMeters(coords.latitude,coords.longitude,fence.latitude,fence.longitude),clearlyOutside=distance-coords.accuracy>fence.radius;
    if(!clearlyOutside){officeGeoOutsideSamples=0;officeGeoLastOutsideAt=0;officeMonitorMessage("Location monitoring is active. Automatic check-out starts after two accurate readings outside the "+Math.round(fence.radius)+" m office radius.");return;}
    var now=Date.now();if(officeGeoOutsideSamples===0){officeGeoOutsideSamples=1;officeGeoLastOutsideAt=now;officeMonitorMessage("GPS detected you outside the office radius. Confirming with another accurate reading…");return;}
    if(now-officeGeoLastOutsideAt<10000)return;
    officeGeoOutsideSamples++;officeGeoLastOutsideAt=now;
    if(officeGeoOutsideSamples>=2)submitAutomaticOfficeCheckout(position,record,distance);
  }
  function syncOfficeLocationMonitor(employee,record){
    if(!employee||!record||!record.in||record.out||!currentUser||cloudAdmin()){stopOfficeLocationWatch();return;}
    if(!navigator.geolocation){stopOfficeLocationWatch();officeMonitorMessage("This browser does not support GPS monitoring. Use manual check-out.");return;}
    if(!supabaseClient){stopOfficeLocationWatch();officeMonitorMessage("Shared attendance is unavailable. Use manual check-out after reconnecting.");return;}
    if(!officeLocationConfig().ready){stopOfficeLocationWatch();officeMonitorMessage("Office GPS settings are unavailable. Ask HR to restore the office location.");return;}
    var key=currentUser.id+"|"+employee.id+"|"+record.date;if(officeGeoWatchKey===key&&officeGeoWatchId!==null)return;
    stopOfficeLocationWatch();officeGeoWatchKey=key;officeGeoEmployeeId=employee.id;officeGeoRecordDate=record.date;officeGeoOutsideSamples=0;officeGeoLastOutsideAt=0;
    try{officeGeoWatchId=navigator.geolocation.watchPosition(processOfficeMonitorPosition,function(error){if(error&&error.code===1){stopOfficeLocationWatch();officeMonitorMessage("Location permission was denied. Allow GPS access and reopen Employee App. If you have left the office, request an attendance correction from HR.");}else{officeMonitorMessage("GPS is temporarily unavailable. Keep this page open and restore location access for automatic check-out. If you have left the office, request an attendance correction from HR.");}},{enableHighAccuracy:true,maximumAge:0,timeout:30000});}
    catch(error){stopOfficeLocationWatch();officeMonitorMessage("This browser could not start GPS monitoring. If you have left the office, request an attendance correction from HR.");}
  }
  function currentGpsPosition(){
    return new Promise(function(resolve,reject){
      if(!navigator.geolocation){reject(new Error("This browser does not provide location access."));return;}
      navigator.geolocation.getCurrentPosition(resolve,function(error){var message=error.code===1?"Allow location access for this site, then try again.":error.code===2?"Your current location could not be determined. Turn on device location and try again.":"Location request timed out. Move near a window and try again.";reject(new Error(message));},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    });
  }
  function compressAttendancePhoto(file){
    return new Promise(function(resolve,reject){
      if(!file||!/^image\//i.test(file.type)){reject(new Error("Take a photo before recording attendance."));return;}
      if(file.size>12*1024*1024){reject(new Error("Choose a photo smaller than 12 MB."));return;}
      var reader=new FileReader();reader.onerror=function(){reject(new Error("The camera photo could not be read."));};reader.onload=function(){
        var image=new Image();image.onerror=function(){reject(new Error("The selected photo could not be opened."));};image.onload=function(){
          var scale=Math.min(1,960/Math.max(image.width,image.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(new Error("The camera photo could not be prepared."));},"image/jpeg",0.72);
        };image.src=reader.result;
      };reader.readAsDataURL(file);
    });
  }
  async function submitOfficePunch(action,file){
    var fence=officeLocationConfig();if(!fence.ready)throw new Error("HR must set the office latitude and longitude in Settings → Company profile before employees can punch in.");
    var position=await currentGpsPosition(),coords=position.coords;if(!isFinite(coords.accuracy)||coords.accuracy>200)throw new Error("GPS accuracy is too low to verify. Turn on precise location and try again.");
    var distance=distanceMeters(coords.latitude,coords.longitude,fence.latitude,fence.longitude);if(distance>fence.radius)throw new Error("You are about "+Math.round(distance)+" m from the office. Attendance is accepted within "+Math.round(fence.radius)+" m.");
    var photo=await compressAttendancePhoto(file),auth=await supabaseClient.auth.getUser();if(auth.error||!auth.data.user)throw new Error("Sign in again before recording attendance.");
    var actionKey=action==="employee-check-in"?"in":"out",path=auth.data.user.id+"/"+indiaDay()+"/"+actionKey+"-"+Date.now()+".jpg",upload=await supabaseClient.storage.from("attendance-evidence").upload(path,photo,{contentType:"image/jpeg",cacheControl:"3600",upsert:false});
    if(upload.error)throw new Error("Could not save the attendance photo: "+upload.error.message);
    var result=await supabaseClient.rpc("hrms_employee_punch",{p_action:actionKey,p_latitude:coords.latitude,p_longitude:coords.longitude,p_accuracy:coords.accuracy,p_photo_path:path});if(result.error)throw result.error;
    await refreshEmployeeWorkspace();renderPage("Employee App");toastMsg((actionKey==="in"?"Check-in":"Check-out")+" saved with GPS and photo evidence.");
  }
  function exportCSV(filename, rows) {
    var text = rows.map(function (r) { return r.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g,'""') + '"'; }).join(","); }).join("\r\n");
    var blob = new Blob(["\ufeff" + text],{type:"text/csv;charset=utf-8"}), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href);
  }
  async function downloadPayslipPDF(employee,pay,period){
    function clean(value){var s=String(value==null?"":value);try{s=s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");}catch(_){}return s.replace(/[^\x20-\x7e]/g," ").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");}
    function amount(value){return "INR "+(Number(value)||0).toLocaleString("en-IN",{maximumFractionDigits:0});}
    function rgb(hex){var h=String(hex||"#000000").replace("#",""),n=parseInt(h,16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255].map(function(x){return x.toFixed(3);}).join(" ");}
    function ascii(value){return new TextEncoder().encode(value);}
    function joinBytes(parts){var length=parts.reduce(function(n,p){return n+p.length;},0),out=new Uint8Array(length),offset=0;parts.forEach(function(p){out.set(p,offset);offset+=p.length;});return out;}
    async function logoImage(){
      var source=data.settings.logoData;if(!source)return null;
      var image=await new Promise(function(resolve,reject){var img=new Image();img.onload=function(){resolve(img);};img.onerror=function(){reject(new Error("The company logo could not be loaded for the payslip."));};img.src=source;});
      var scaleFactor = Number(data.settings.payslipLogoScale || 100) / 100;
      var scale=Math.min(240/image.width,100/image.height) * scaleFactor,canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
      var context=canvas.getContext("2d");context.fillStyle="#ffffff";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      var base64=canvas.toDataURL("image/jpeg",0.9).split(",")[1],binary=atob(base64),bytes=new Uint8Array(binary.length);for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return {width:canvas.width,height:canvas.height,bytes:bytes};
    }
    try{
      var logo=await logoImage(),theme=payslipThemeDetails(data.settings.payslipTheme),design=["classic","compact"].indexOf(data.settings.payslipDesign)>=0?data.settings.payslipDesign:"modern",primary=rgb(theme.primary),accent=rgb(theme.accent),light=rgb(theme.light),ink="0.16 0.22 0.34",muted="0.48 0.54 0.64",lineColor="0.88 0.90 0.94",commands=[];
      function text(value,x,y,size,bold,color){commands.push("BT /"+(bold?"F2":"F1")+" "+size+" Tf "+(color||ink)+" rg "+x+" "+y+" Td ("+clean(value)+") Tj ET");}
      function rule(y){commands.push(lineColor+" RG 48 "+y+" m 547 "+y+" l S");}
      function line(label,value,y,bold){text(label,52,y,10,bold,muted);var str=clean(value),approxWidth=str.length*5.4;text(value,542-approxWidth,y,10,bold,bold?ink:"0.24 0.30 0.40");}
      var companyName=data.settings.legalName||data.settings.company||"Fruitmaster HR";
      if(design==="classic"){
        commands.push("q "+primary+" rg 0 832 595 10 re f Q");text(companyName.slice(0,54),48,806,15,true,primary);text("EMPLOYEE PAYSLIP",48,780,10,true,accent);text("Confidential salary statement",48,763,8,false,muted);
      }else if(design==="compact"){
        commands.push("q "+primary+" rg 0 772 595 70 re f Q");text(companyName.slice(0,54),48,817,14,true,"1 1 1");text("EMPLOYEE PAYSLIP",48,793,9,true,light);text("Confidential salary statement",48,779,8,false,"0.91 0.93 0.97");
      }else{
        commands.push("q "+primary+" rg 0 738 595 104 re f Q");text(companyName.slice(0,54),48,798,16,true,"1 1 1");text("EMPLOYEE PAYSLIP",48,770,10,true,light);text("Confidential salary statement",48,752,9,false,"0.91 0.93 0.97");
      }
      var logoBox=design==="classic"?null:{x:463,y:779,w:84,h:48};
      if(logo){
        var maxW=logoBox?logoBox.w-10:76,maxH=logoBox?logoBox.h-10:42,logoScale=Math.min(maxW/logo.width,maxH/logo.height),logoW=logo.width*logoScale,logoH=logo.height*logoScale,logoX=logoBox?logoBox.x+(logoBox.w-logoW)/2:493-logoW,logoY=logoBox?logoBox.y+(logoBox.h-logoH)/2:778;
        if(logoBox)commands.push("q 1 1 1 rg "+logoBox.x+" "+logoBox.y+" "+logoBox.w+" "+logoBox.h+" re f Q");
        commands.push("q "+logoW.toFixed(2)+" 0 0 "+logoH.toFixed(2)+" "+logoX.toFixed(2)+" "+logoY.toFixed(2)+" cm /Logo Do Q");
      }
      text("Employee",52,704,9,false,muted);text(employee.name,52,685,12,true);
      text("Department",320,704,9,false,muted);text(employee.dept||"—",320,685,12,true);
      text("Pay period",52,657,9,false,muted);text(period,52,639,11,true);
      text("Payroll status",320,657,9,false,muted);text(pay.status||"Paid",320,639,11,true);
      rule(620);text("EARNINGS",52,598,10,true,accent);
      var rowGap=design==="compact"?19:24,earnings=[["Basic salary",pay.basic],["Dearness allowance (DA)",pay.da],["House rent allowance (HRA)",pay.hra],["Special allowance",pay.specialAllowance],["Other earnings",pay.otherEarnings]],y=575;
      earnings.forEach(function(row){line(row[0],amount(row[1]),y,false);y-=rowGap;});rule(y+7);line("Gross earnings",amount(pay.gross),y-13,true);
      y-=design==="compact"?42:47;text("DEDUCTIONS",52,y,10,true,accent);y-=design==="compact"?20:24;
      [["Employee PF",pay.pf],["Employee ESI",pay.esi],["Loan deduction",pay.loan],["Income tax TDS",pay.tds]].forEach(function(row){line(row[0],amount(row[1]),y,false);y-=design==="compact"?19:23;});
      rule(y+7);line("Total deductions",amount(pay.deductions),y-13,true);y-=design==="compact"?45:51;
      commands.push("q "+light+" rg 48 "+(y-18)+" 499 47 re f Q");
      if(design==="classic")commands.push("q "+accent+" rg 48 "+(y-18)+" 4 47 re f Q");
      text("NET PAY",60,y,10,true,accent);text(amount(pay.net),395,y-1,16,true,primary);
      rule(72);text("Generated by "+(data.settings.company||"Fruitmaster HR")+" · Keep this statement for your records.",52,54,8,false,muted);
      var contentBytes=ascii(commands.join("\n")),imageObject=logo?joinBytes([ascii("<< /Type /XObject /Subtype /Image /Width "+logo.width+" /Height "+logo.height+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+logo.bytes.length+" >>\nstream\n"),logo.bytes,ascii("\nendstream")]):null;
      var resources="/Font << /F1 4 0 R /F2 5 0 R >>"+(logo?" /XObject << /Logo 7 0 R >>":""),page="<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << "+resources+" >> /Contents 6 0 R >>";
      var objects=[ascii("<< /Type /Catalog /Pages 2 0 R >>"),ascii("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),ascii(page),ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),ascii("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),joinBytes([ascii("<< /Length "+contentBytes.length+" >>\nstream\n"),contentBytes,ascii("\nendstream")])];if(imageObject)objects.push(imageObject);
      var chunks=[ascii("%PDF-1.4\n")],offsets=[0],byteLength=chunks[0].length;
      objects.forEach(function(obj,index){offsets.push(byteLength);var before=ascii((index+1)+" 0 obj\n"),after=ascii("\nendobj\n");chunks.push(before,obj,after);byteLength+=before.length+obj.length+after.length;});
      var xrefOffset=byteLength,xref="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";for(var oi=1;oi<offsets.length;oi++)xref+=String(offsets[oi]).padStart(10,"0")+" 00000 n \n";
      chunks.push(ascii(xref+"trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xrefOffset+"\n%%EOF"));
      var blob=new Blob([joinBytes(chunks)],{type:"application/pdf"}),a=document.createElement("a"),slug=String(employee.name||"employee").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");a.href=URL.createObjectURL(blob);a.download="payslip-"+(slug||"employee")+"-"+period+".pdf";a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
    }catch(error){console.error("Payslip PDF generation failed",error);toastMsg(error.message||"Payslip PDF could not be created.");}
  }
  function exportData(type) {
    var rows, file;
    if (type === "people") { file="employee-directory.csv"; rows=[["Name","Email","Department","Monthly salary","Start date","PF applies","ESI applies","Status"]].concat(data.employees.map(function(e){var p=payrollProfile(e);return[e.name,e.email,e.dept,e.salary,e.start,p.pfEnabled?"Yes":"No",p.esiEnabled?"Yes":"No",e.active?"Active":"Inactive"];})); }
    else if (type === "attendance") { file="attendance.csv"; rows=[["Employee","Date","Status","Check in","Check out","Check-in distance m","Check-in GPS accuracy m","Check-in photo path","Check-out distance m","Check-out GPS accuracy m","Check-out photo path","Automatic check-out","Check-out method","Admin override","Override by","Override at","Override reason","Change history"]].concat(data.attendance.map(function(a){var checkin=a.checkInEvidence||{},checkout=a.checkOutEvidence||{};return[personName(a.employee),a.date,a.status,a.in,a.out,checkin.distanceMeters,checkin.accuracy,checkin.path,checkout.distanceMeters,checkout.accuracy,checkout.path,checkout.automatic?"Yes":"No",checkout.method||"Manual",a.override?"Yes":"No",a.overrideBy,a.overrideAt,a.overrideReason,JSON.stringify(a.history||[])];})); }
    else if (type === "leave") { file="leave-requests.csv"; rows=[["Employee","Type","From","To","Days","Reason","Status"]].concat(data.leaves.map(function(l){return[personName(l.employee),l.type,l.from,l.to,days(l.from,l.to),l.reason,l.status];})); }
    else if (type === "goals") { file="performance.csv"; rows=[["Record","Employee","Date or due","Status or rating"]].concat(data.goals.map(function(g){return[g.text,personName(g.employee),g.due,g.status];}),data.reviews.map(function(r){return["Review: "+r.comment,personName(r.employee),r.date,"Rating "+r.rating+"/5"];})); }
    else if (type === "payroll") {
      file="payroll.csv"; var period=(document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7);
      rows=[["Employee","Department","Attendance recorded","Scheduled days","Missing attendance days (no pay impact)","Basic","DA","HRA","Special allowance","Other earnings","Gross","Employee PF","Employee ESI","Loan","TDS","Total deductions","Net pay","Employer PF","Employer ESI","Status"]].concat(data.employees.filter(function(e){return e.active;}).map(function(e){var r=data.payroll.find(function(p){return p.employee===e.id&&p.period===period;}),c=r&&r.gross!=null&&(r.status==="Paid"||r.payModel==="monthly-full-v1")?r:payrollEstimate(e,period);return[e.name,e.dept,Math.max(0,(Number(c.scheduledDays)||0)-(Number(c.missingDays)||0)),c.scheduledDays,c.missingDays,c.basic,c.da,c.hra,c.specialAllowance,c.otherEarnings,c.gross,c.pf,c.esi,c.loan,c.tds,c.deductions,c.net,c.employerPf,c.employerEsi,r&&r.status==="Paid"?"Paid":r&&r.payModel!=="monthly-full-v1"?"Recalculate":r?r.status:"Preview"];}));
    } else {
      file="workforce-summary.csv"; var groups={}; data.employees.filter(function(e){return e.active;}).forEach(function(e){groups[e.dept]=(groups[e.dept]||0)+1;});
      rows=[["Department","Employees"]].concat(Object.keys(groups).map(function(k){return[k,groups[k]];}));
    }
    exportCSV(file,rows); toastMsg(file + " downloaded.");
  }
  function renderReports() {
    setHead("Reports", "People analytics · download current workspace data");
    var active=data.employees.filter(function(e){return e.active;}),present=data.attendance.filter(function(a){return a.date===TODAY&&["Present","Remote"].indexOf(a.status)>=0;}).length,groups={};
    active.forEach(function(e){groups[e.dept]=(groups[e.dept]||0)+1;});
    renderMetrics([["Headcount",active.length],["Today attendance",present],["Open leave requests",data.leaves.filter(function(l){return l.status==="Pending";}).length]]);
    var rows=Object.keys(groups).map(function(d){return"<tr><td>"+esc(d)+"</td><td>"+groups[d]+"</td><td>"+Math.round(groups[d]/Math.max(1,active.length)*100)+"%</td></tr>";});
    document.getElementById("moduleBody").innerHTML='<div class="module-tools"><span>Reports reflect the shared workspace records.</span><button class="btn primary" data-act="export-summary">Export workforce CSV</button></div>'+table(["Department","Employees","Headcount share"],rows)+'<div class="section-caption">Download data</div><div class="quickgrid"><button class="quick" data-act="export-people"><i>♙</i><span><b>Employee directory</b><small>Profiles and departments</small></span></button><button class="quick" data-act="export-attendance"><i>◷</i><span><b>Attendance report</b><small>Dates and times</small></span></button><button class="quick" data-act="export-leave"><i>▣</i><span><b>Leave report</b><small>Requests and decisions</small></span></button><button class="quick" data-act="export-goals"><i>↗</i><span><b>Goals and reviews</b><small>Performance records</small></span></button></div>';
  }
  function renderDepartments() {
    setHead("Departments", "Department directory · add, rename, and remove teams");
    renderMetrics([["Departments",data.departments.length],["Employees assigned",data.employees.filter(function(e){return e.active;}).length],["Hiring roles",data.jobs.length]]);
    var rows=matching(data.departments,function(d){return d.name;}).map(function(d){
      var count=data.employees.filter(function(e){return e.dept===d.name;}).length;
      return "<tr><td>"+esc(d.name)+"</td><td>"+count+"</td><td>"+data.jobs.filter(function(j){return j.dept===d.name;}).length+'</td><td><div class="row-actions">'+btn(d.id,"edit-department","Rename")+btn(d.id,"delete-department","Delete","danger")+"</div></td></tr>";
    });
    var f=form("department",field("Department name",'<input name="name" required placeholder="e.g. Customer Success">'),"＋ Add department");
    document.getElementById("moduleBody").innerHTML='<div class="section-caption">Create a department</div>'+f+'<div class="module-tools"><span>Renaming updates employee and hiring records.</span><span>'+data.departments.length+" departments</span></div>"+table(["Department","Employees","Open roles","Actions"],rows);
  }
  function renderRules() {
    setHead("Rules", "HR rules · manage leave, attendance, and payroll settings");
    renderMetrics([["Configured rules",data.rules.length],["Rule categories",new Set(data.rules.map(function(r){return r.category;})).size],["Leave allowance",data.settings.annualLeave+" days"]]);
    var rows=matching(data.rules,function(r){return[r.name,r.category,r.value,r.details].join(" ");}).map(function(r){
      return "<tr><td>"+esc(r.name)+"</td><td>"+esc(r.category)+"</td><td>"+esc(r.value)+"</td><td>"+esc(r.details)+"</td><td><div class=\"row-actions\">"+btn(r.id,"edit-rule","Edit")+btn(r.id,"delete-rule","Delete","danger")+"</div></td></tr>";
    });
    var f=form("rule",field("Rule name",'<input name="name" required placeholder="Rule name">')+field("Category",'<select name="category">'+options(["Leave","Attendance","Payroll","Workflow","Other"],"Leave")+"</select>")+field("Value",'<input name="value" required placeholder="e.g. 18 days">')+field("Description",'<input name="details" placeholder="What this rule controls">'),"＋ Add rule");
    document.getElementById("moduleBody").innerHTML='<div class="section-caption">Add a rule</div>'+f+'<div class="module-tools"><span>Rules are shared with workspace administrators; payroll rates and thresholds are configurable under Payroll.</span><span>'+data.rules.length+" rules</span></div>"+table(["Rule","Category","Value","Description","Actions"],rows);
  }
  function renderSettings() {
    setHead("Settings", "Company profile, workspace preferences, and access");
    renderMetrics([["Company",data.settings.company],["Annual leave",data.settings.annualLeave+" days"],["Sick leave",data.settings.sickLeave+" days"]]);
    var addressField=field("Office address",'<textarea name="companyAddress" rows="2" placeholder="Street address">'+esc(data.settings.companyAddress)+'</textarea>').replace("<label>",'<label class="company-address">');
    var companyForm=form("company-profile",field("Company name",'<input name="company" required value="'+esc(data.settings.company)+'">')+field("Legal name",'<input name="legalName" value="'+esc(data.settings.legalName)+'" placeholder="Registered business name">')+field("Company email",'<input name="companyEmail" type="email" value="'+esc(data.settings.companyEmail)+'" placeholder="hr@company.com">')+field("Phone number",'<input name="companyPhone" type="tel" value="'+esc(data.settings.companyPhone)+'" placeholder="+91 98765 43210">')+field("Website",'<input name="companyWebsite" type="url" value="'+esc(data.settings.companyWebsite)+'" placeholder="https://example.com">')+field("City",'<input name="companyCity" value="'+esc(data.settings.companyCity)+'">')+field("Country",'<input name="companyCountry" value="'+esc(data.settings.companyCountry)+'">')+addressField+field("Office latitude",'<input name="officeLatitude" type="number" min="-90" max="90" step="any" value="'+esc(data.settings.officeLatitude)+'" placeholder="Decimal latitude">')+field("Office longitude",'<input name="officeLongitude" type="number" min="-180" max="180" step="any" value="'+esc(data.settings.officeLongitude)+'" placeholder="Decimal longitude">')+field("Attendance radius (metres)",'<input name="officeRadiusMeters" type="number" min="25" max="1000" step="1" required value="'+esc(data.settings.officeRadiusMeters||150)+'">')+'<button class="btn office-location-button" type="button" data-act="use-office-location">Use this device’s GPS for office location</button><p class="office-location-help">Set this while you are at the premises. Employee check-in and check-out require a camera photo and GPS within this radius.</p>',"Save company profile");
    companyForm=companyForm.replace('class="feature-form"','class="feature-form company-profile-form"');
    var f=form("settings",field("Annual leave days",'<input name="annual" type="number" min="0" value="'+esc(data.settings.annualLeave)+'">')+field("Sick leave days",'<input name="sick" type="number" min="0" value="'+esc(data.settings.sickLeave)+'">')+field("Work week",'<select name="week">'+options(["Monday–Friday","Sunday–Thursday","Monday–Saturday"],data.settings.workWeek)+"</select>"),"Save workspace settings");
    var logoEditor='<div class="section-caption">Company and payslip logo</div><div class="brand-editor"><div class="brand-preview" id="settingLogoPreview"></div><label class="logo-upload">Choose image<input type="file" data-logo-file accept="image/png,image/jpeg,image/webp"></label><button class="btn" type="button" data-act="remove-logo">Remove logo</button><span class="muted">This logo appears in the workspace and both employer and employee payslips · PNG, JPG, or WebP · max 1 MB</span></div>';
    var logoScaleValue = Number(data.settings.payslipLogoScale || 100);
    if (!isFinite(logoScaleValue) || logoScaleValue < 25 || logoScaleValue > 200) logoScaleValue = 100;
    var payslipForm=form("payslip-branding",field("Payslip theme",'<select name="payslipTheme">'+options([{id:"blue",name:"Blue"},{id:"green",name:"Green"},{id:"burgundy",name:"Burgundy"},{id:"purple",name:"Purple"},{id:"charcoal",name:"Charcoal"}],data.settings.payslipTheme||"blue")+'</select>')+field("Payslip design",'<select name="payslipDesign">'+options([{id:"modern",name:"Modern"},{id:"classic",name:"Classic"},{id:"compact",name:"Compact"}],data.settings.payslipDesign||"modern")+'</select>')+field("Logo size (%)",'<input name="payslipLogoScale" type="number" min="25" max="200" step="5" value="'+esc(logoScaleValue)+'">'),"Apply to all payslips");
    var payslipTheme=payslipThemeDetails(data.settings.payslipTheme),payslipPreview='<div class="payslip-preview" data-design="'+esc(data.settings.payslipDesign||"modern")+'" style="--slip-primary:'+esc(payslipTheme.primary)+';--slip-accent:'+esc(payslipTheme.accent)+';--slip-light:'+esc(payslipTheme.light)+';--payslip-logo-scale:'+esc((Number(data.settings.payslipLogoScale || 100) / 100).toFixed(2))+'"><div class="payslip-preview-head">'+(data.settings.logoData?'<img alt="" src="'+esc(data.settings.logoData)+'">':'<span class="payslip-preview-mark">'+esc((data.settings.company||"P").charAt(0).toUpperCase())+'</span>')+'<b>'+esc(data.settings.legalName||data.settings.company)+'</b><small>EMPLOYEE PAYSLIP</small></div><div class="payslip-preview-body"><span>Basic salary</span><b>₹ 25,000</b><span>HRA</span><b>₹ 10,000</b><span class="payslip-preview-net">NET PAY</span><strong>₹ 32,850</strong></div></div>';
    var users=matching(data.users,function(u){return u.name+" "+u.email+" "+u.phone+" "+u.role;}).map(function(u){
      var roleControl=currentUser&&currentUser.id===u.id?"Current user":'<select data-role-user="'+esc(u.id)+'">'+options(["Administrator","HR","Manager","Employee"],u.role)+"</select>";
      return "<tr><td>"+esc(u.name)+"</td><td>"+esc(u.email)+"</td><td>"+esc(u.phone||"—")+"</td><td>"+esc(u.role)+"</td><td>"+roleControl+"</td></tr>";
    });
    var userForm='<div class="employee-help">To add employee access, add the employee profile with their work email. They can then create an account from the sign-in page using that same email. Choose account roles below.</div>';
    document.getElementById("moduleBody").innerHTML='<div class="section-caption" id="companyProfileSection">Company profile</div>'+companyForm+'<p class="company-profile-note">The company name and logo appear throughout the workspace and on the sign-in and recovery screens.</p>'+logoEditor+'<div class="section-caption">Shared payslip appearance</div><p class="company-profile-note">Choose one theme and layout for every payslip. Employer and employee downloads use this same design.</p>'+payslipForm+payslipPreview+'<div class="section-caption">Workspace settings</div>'+f+'<div class="section-caption">User accounts</div>'+userForm+'<div class="module-tools"><span>Supabase sign-in and role permissions</span><span>'+data.users.length+" accounts</span></div>"+table(["Name","Email","Phone","Role","Change access"],users)+'<div class="placeholder"><b>Shared Supabase workspace</b><span>HR records sync across devices. Employee accounts can access their own attendance, leave, and payroll details.</span></div>';
    applyBranding();
  }
  function renderPage(page) {
    if(currentUser&&!cloudAdmin())page="Employee App";
    window.currentHrPage=page;
    document.getElementById("crumb").textContent=page;
    document.querySelectorAll("#nav [data-page]").forEach(function(b){b.classList.toggle("active",b.dataset.page===page);});
    document.getElementById("dashboard").classList.toggle("hidden",page!=="Overview");
    document.getElementById("module").classList.toggle("hidden",page==="Overview");
    document.getElementById("sidebar").classList.remove("open");
    if(page==="Overview"){renderDashboard();return;}
    var renderers={"Employee App":renderEmployeeApp,Holidays:renderHolidays,People:renderPeople,Departments:renderDepartments,Rules:renderRules,Attendance:renderAttendance,Leave:renderLeave,Payroll:renderPayroll,Recruitment:renderRecruitment,Onboarding:renderOnboarding,Performance:renderPerformance,Reports:renderReports,Settings:renderSettings};
    (renderers[page]||renderPeople)();
  }
  function syncNavigationForRole(){
    var employee=!!(currentUser&&!cloudAdmin());
    document.querySelectorAll("#nav [data-page]").forEach(function(button){button.classList.toggle("hidden",employee&&button.dataset.page!=="Employee App");});
    document.querySelectorAll("#nav .navlabel").forEach(function(label){label.classList.toggle("hidden",employee);});
    var add=document.getElementById("add"),exportButton=document.getElementById("export"),profileLink=document.getElementById("companyProfileLink"),moduleAdd=document.getElementById("modadd"),moduleExport=document.getElementById("modexport");
    if(add)add.classList.toggle("hidden",employee);if(exportButton)exportButton.classList.toggle("hidden",employee);if(profileLink)profileLink.classList.toggle("hidden",employee);if(moduleAdd)moduleAdd.classList.toggle("hidden",employee);if(moduleExport)moduleExport.classList.toggle("hidden",employee);
  }
  function addEmployee(name,email,dept,salary,start,pfEnabled,esiEnabled) {
    var monthly=Math.max(0,Number(salary)||0),basic=Math.round(monthly*.5),hra=Math.round(basic*.4),special=Math.max(0,monthly-basic-hra),statutory=payrollWageBase({hra:hra},monthly);
    data.employees.push({id:newId("e"),name:name,email:email,dept:dept,salary:monthly,start:start||TODAY,active:true,pay:{basic:basic,da:0,hra:hra,specialAllowance:special,otherEarnings:0,otherExcluded:0,loan:0,pfEnabled:pfEnabled!==false,esiEnabled:typeof esiEnabled==="boolean"?esiEnabled:statutory<=data.payrollSettings.esiWageCeiling,taxRegime:"new",resident:true,otherIncome:0,oldDeductions:0,pastSalary:0,priorTds:0,ageGroup:"under60"}});
    save(); renderPage("People"); toastMsg(name+" added to the directory.");
  }
  async function submitForm(formEl) {
    var fd=new FormData(formEl), v=function(k){return String(fd.get(k)||"").trim();}, kind=formEl.dataset.form;
    if(kind==="employee"){addEmployee(v("name"),v("email"),v("dept"),v("salary"),v("start"),fd.has("pfEnabled"),fd.has("esiEnabled"));return;}
    if(kind==="department"){
      if(data.departments.some(function(d){return d.name.toLowerCase()===v("name").toLowerCase();})){toastMsg("That department already exists.");return;}
      data.departments.push({id:newId("d"),name:v("name")});toastMsg("Department added.");
    }
    else if(kind==="rule"){data.rules.unshift({id:newId("rule"),name:v("name"),category:v("category"),value:v("value"),details:v("details")});toastMsg("Rule added.");}
    else if(kind==="user"){createLocalUser(v("name"),v("email"),v("password"),v("role"),v("phone")).then(function(){save();renderPage("Settings");toastMsg("Account created. It can sign in on this browser.");}).catch(function(err){toastMsg(err.message||"Could not create account.");});return;}
    if(kind==="employee-leave"){
      if(v("to")<v("from")){toastMsg("End date must be on or after start date.");return;}
      try{var leaveResult=await supabaseClient.rpc("hrms_employee_leave",{p_type:v("type"),p_from:v("from"),p_to:v("to"),p_reason:v("reason")});if(leaveResult.error)throw leaveResult.error;await refreshEmployeeWorkspace();renderPage("Employee App");toastMsg("Leave request sent to HR.");}
      catch(leaveError){toastMsg(leaveError.message||"Leave request could not be sent.");}return;
    }
    if(kind==="attendance-request"){
      try{var correctionResult=await supabaseClient.rpc("hrms_employee_attendance_request",{p_date:v("date"),p_status:v("status"),p_in:v("in"),p_out:v("out"),p_reason:v("reason")});if(correctionResult.error)throw correctionResult.error;await refreshEmployeeWorkspace();renderPage("Employee App");toastMsg("Attendance correction sent to HR.");}
      catch(correctionError){toastMsg(correctionError.message||"Correction could not be submitted.");}return;
    }
    if(kind==="attendance"){
      var recordId=v("recordId"),existing=data.attendance.find(function(x){return x.id===recordId;}),isAdmin=cloudAdmin(),override=isAdmin&&!!formEl.querySelector('[name="adminOverride"]')&&formEl.querySelector('[name="adminOverride"]').checked,reason=v("overrideReason");
      if(override&&!reason){toastMsg("Enter a reason for the administrator override.");return;}
      var a={id:existing?existing.id:newId("a"),employee:v("employee"),date:v("date"),status:v("status"),in:v("in"),out:v("out"),createdAt:existing&&existing.createdAt||new Date().toISOString(),createdBy:existing&&existing.createdBy||currentUser&&currentUser.name||"User",checkInEvidence:existing&&existing.checkInEvidence||null,checkOutEvidence:existing&&existing.checkOutEvidence||null};
      if(existing){a.history=(existing.history||[]).concat([{status:existing.status,in:existing.in,out:existing.out,changedAt:new Date().toISOString(),changedBy:currentUser&&currentUser.name||"User",override:!!existing.override,reason:existing.overrideReason||""}]);}
      if(override){a.override=true;a.overrideBy=currentUser.name;a.overrideAt=new Date().toISOString();a.overrideReason=reason;}
      else if(existing&&existing.override){a.override=false;a.overrideBy="";a.overrideAt="";a.overrideReason="";}
      if(data.attendance.some(function(x){return x.id!==a.id&&x.employee===a.employee&&x.date===a.date;})){toastMsg("An attendance record already exists for this employee and date.");return;}
      if(existing)data.attendance=data.attendance.map(function(x){return x.id===a.id?a:x;});else data.attendance.push(a);
      attendanceEditorId="";invalidateUnpaidPayroll(a.date.slice(0,7));toastMsg(override?"Administrator attendance override saved with reason.":existing?"Attendance record updated.":"Attendance record saved.");
    } else if(kind==="leave"){
      if(v("to")<v("from")){toastMsg("End date must be on or after start date.");return;}
      data.leaves.unshift({id:newId("l"),employee:v("employee"),type:v("type"),from:v("from"),to:v("to"),reason:v("reason"),status:"Pending"});toastMsg("Leave request submitted.");
    } else if(kind==="holiday"){if(data.holidays.some(function(h){return h.date===v("date")&&h.name.toLowerCase()===v("name").toLowerCase();})){toastMsg("That holiday is already in the calendar.");return;}data.holidays.push({id:newId("h"),name:v("name"),date:v("date")});toastMsg("Holiday added to the shared calendar.");}
    else if(kind==="job"){data.jobs.unshift({id:newId("j"),title:v("title"),dept:v("dept"),location:v("location")||"Not specified",status:"Open"});toastMsg("Role added to the hiring pipeline.");}
    else if(kind==="candidate"){data.candidates.unshift({id:newId("c"),name:v("name"),email:v("email"),role:v("role"),stage:v("stage")});toastMsg("Candidate added.");}
    else if(kind==="task"){data.tasks.unshift({id:newId("t"),employee:v("employee"),text:v("text"),due:v("due"),done:false});toastMsg("Onboarding task added.");}
    else if(kind==="goal"){data.goals.unshift({id:newId("g"),employee:v("employee"),text:v("text"),due:v("due"),status:"Not started"});toastMsg("Goal added.");}
    else if(kind==="review"){data.reviews.unshift({id:newId("r"),employee:v("employee"),rating:Number(v("rating")),comment:v("comment"),date:v("date")});toastMsg("Review saved.");}
    else if(kind==="pay-profile"){
      var payEmployee=person(v("employee"));if(!payEmployee){toastMsg("Choose an employee first.");return;}
      var n=function(k){return Math.max(0,Number(fd.get(k))||0);},profile={basic:n("basic"),da:n("da"),hra:n("hra"),specialAllowance:n("specialAllowance"),otherEarnings:n("otherEarnings"),otherExcluded:n("otherExcluded"),loan:n("loan"),pfEnabled:!!formEl.querySelector('[name="pfEnabled"]').checked,esiEnabled:!!formEl.querySelector('[name="esiEnabled"]').checked,taxRegime:v("taxRegime")==="old"?"old":"new",ageGroup:v("ageGroup"),resident:!!formEl.querySelector('[name="resident"]').checked,otherIncome:n("otherIncome"),oldDeductions:n("oldDeductions"),pastSalary:n("pastSalary"),priorTds:n("priorTds")};
      var updatedGross=profileGross(profile);if(updatedGross<=0){toastMsg("Enter at least one salary component above zero.");return;}
      payEmployee.pay=profile;payEmployee.salary=updatedGross;payrollEditorEmployee=payEmployee.id;invalidateUnpaidPayroll((document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7));save();renderPage("Payroll");toastMsg("Salary structure and tax profile saved for "+payEmployee.name+".");return;
    }
    else if(kind==="payroll-rules"){
      var ruleKeys=["pfEmployeeRate","pfEmployerRate","pfWageCeiling","esiEmployeeRate","esiEmployerRate","esiWageCeiling","newStandardDeduction","oldStandardDeduction","newRebateLimit","newRebateAmount","oldRebateLimit","oldRebateAmount","cessRate"],nextRules={};
      for(var rk=0;rk<ruleKeys.length;rk++){var rv=Number(fd.get(ruleKeys[rk]));if(!isFinite(rv)||rv<0||(/Rate$/.test(ruleKeys[rk])&&rv>100)){toastMsg("Check the payroll settings values and percentages.");return;}nextRules[ruleKeys[rk]]=rv;}
      data.payrollSettings=nextRules;invalidateAllUnpaidPayroll();save();renderPage("Payroll");toastMsg("Payroll settings saved.");return;
    }
    else if(kind==="company-profile"){
      var latText=v("officeLatitude").trim(),lonText=v("officeLongitude").trim(),radius=Number(v("officeRadiusMeters"));if((latText==="")!==(lonText==="")){toastMsg("Enter both office latitude and longitude, or leave both blank to disable GPS attendance.");return;}if(latText!==""&&(!isFinite(Number(latText))||Number(latText)<-90||Number(latText)>90||!isFinite(Number(lonText))||Number(lonText)<-180||Number(lonText)>180)){toastMsg("Enter valid office coordinates.");return;}if(!isFinite(radius)||radius<25||radius>1000){toastMsg("Set an attendance radius between 25 and 1000 metres.");return;}
      data.settings.company=v("company");data.settings.legalName=v("legalName");data.settings.companyEmail=v("companyEmail").toLowerCase();data.settings.companyPhone=v("companyPhone");data.settings.companyWebsite=v("companyWebsite");data.settings.companyAddress=v("companyAddress");data.settings.companyCity=v("companyCity");data.settings.companyCountry=v("companyCountry");data.settings.officeLatitude=latText===""?"":Number(latText);data.settings.officeLongitude=lonText===""?"":Number(lonText);data.settings.officeRadiusMeters=radius;
      save();applyBranding();renderPage("Settings");toastMsg("Company profile saved and applied across the workspace.");return;
    }
    else if(kind==="payslip-branding"){
      var validThemes=["blue","green","burgundy","purple","charcoal"],validDesigns=["modern","classic","compact"],theme=v("payslipTheme"),design=v("payslipDesign"),logoScale=Number(v("payslipLogoScale"));
      if(validThemes.indexOf(theme)<0||validDesigns.indexOf(design)<0){toastMsg("Choose a supported payslip theme and design.");return;}
      if(!isFinite(logoScale)||logoScale<25||logoScale>200){toastMsg("Set a payslip logo size between 25% and 200%.");return;}
      data.settings.payslipTheme=theme;data.settings.payslipDesign=design;data.settings.payslipLogoScale=logoScale;save();renderPage("Settings");toastMsg("Payslip styling and logo size applied to employer and employee PDFs.");return;
    }
    else if(kind==="settings"){var priorWeek=data.settings.workWeek;data.settings.annualLeave=Number(v("annual"));data.settings.sickLeave=Number(v("sick"));data.settings.workWeek=v("week");if(priorWeek!==data.settings.workWeek)invalidateAllUnpaidPayroll();toastMsg("Workspace settings saved.");}
    save();renderPage(window.currentHrPage||"Overview");
  }
  var moduleBody=document.getElementById("moduleBody"),pendingAttendanceAction="",attendancePunchBusy=false;
  var companyProfileLink=document.getElementById("companyProfileLink");
  if(companyProfileLink){
    companyProfileLink.addEventListener("click",function(){renderPage("Settings");var section=document.getElementById("companyProfileSection");if(section)section.scrollIntoView({behavior:"smooth",block:"start"});});
  }
  moduleBody.addEventListener("submit",function(e){if(e.target.matches("[data-form]")){e.preventDefault();submitForm(e.target);}});
  moduleBody.addEventListener("change",function(e){
    if(e.target.matches("[data-role-user]")){
      if(!cloudAdmin()){toastMsg("Only an Administrator can change account roles.");renderPage("Settings");return;}
      var targetUser=e.target.dataset.roleUser,nextRole=e.target.value;
      if(targetUser===currentUser.id&&nextRole!==currentUser.role){toastMsg("You cannot change your own access role.");renderPage("Settings");return;}
      supabaseClient.rpc("hrms_admin_set_role",{p_user_id:targetUser,p_role:nextRole}).then(async function(result){
        if(result.error){toastMsg(result.error.message||"Role could not be changed.");return;}
        try{await loadCloudWorkspace({role:currentUser.role});renderPage("Settings");toastMsg("Account role updated.");}catch(err){toastMsg(err.message||"Could not refresh account roles.");}
      });return;
    }
    if(e.target.matches("[data-employee-flag]")){var flagEmployee=person(e.target.dataset.employeeId);if(flagEmployee){flagEmployee.pay=flagEmployee.pay||{};flagEmployee.pay[e.target.dataset.employeeFlag+"Enabled"]=!!e.target.checked;invalidateUnpaidPayroll(TODAY.slice(0,7));save();renderPage("People");toastMsg((e.target.dataset.employeeFlag==="pf"?"PF":"ESI")+" applicability updated for "+flagEmployee.name+".");}return;}
    if(e.target.matches("[data-payroll-employee]")){payrollEditorEmployee=e.target.value;renderPage("Payroll");return;}
    if(e.target.matches("[data-logo-file]")){
      var file=e.target.files&&e.target.files[0];
      if(!file)return;
      if(["image/png","image/jpeg","image/webp"].indexOf(file.type)<0){toastMsg("Choose a PNG, JPG, or WebP image.");e.target.value="";return;}
      if(file.size>1024*1024){toastMsg("Logo file must be 1 MB or smaller.");e.target.value="";return;}
      var reader=new FileReader();
      reader.onload=function(){
        var image=new Image();
        image.onload=function(){
          var scale=Math.min(1,512/Math.max(image.width,image.height)),canvas=document.createElement("canvas");
          canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
          canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
          data.settings.logoData=canvas.toDataURL("image/png");save();applyBranding();toastMsg("Logo updated across the shared workspace.");
        };
        image.onerror=function(){toastMsg("That image could not be opened.");};
        image.src=reader.result;
      };
      reader.onerror=function(){toastMsg("Could not read that image.");};
      reader.readAsDataURL(file);return;
    }
    var id=e.target.dataset.stage, c=data.candidates.find(function(x){return x.id===id;});
    if(c){c.stage=e.target.value;save();renderPage("Recruitment");toastMsg("Candidate stage updated.");return;}
    id=e.target.dataset.goal;var g=data.goals.find(function(x){return x.id===id;});
    if(g){g.status=e.target.value;save();renderPage("Performance");toastMsg("Goal status updated.");return;}
    id=e.target.dataset.task;var t=data.tasks.find(function(x){return x.id===id;});
    if(t){t.done=e.target.checked;save();renderPage("Onboarding");}
  });
  moduleBody.addEventListener("click",async function(e){
    var b=e.target.closest("[data-act]");if(!b)return;var act=b.dataset.act,id=b.dataset.id;
    if(act==="use-office-location"){
      try{var officePosition=await currentGpsPosition(),latField=moduleBody.querySelector('[name="officeLatitude"]'),lonField=moduleBody.querySelector('[name="officeLongitude"]');if(latField&&lonField){latField.value=officePosition.coords.latitude.toFixed(6);lonField.value=officePosition.coords.longitude.toFixed(6);toastMsg("Current GPS copied into the office location fields. Save the company profile to apply it.");}}
      catch(officeError){toastMsg(officeError.message||"Could not read this device location.");}return;
    }
    if(act==="employee-check-in"||act==="employee-check-out"){
      if(attendancePunchBusy)return;var photoInput=document.getElementById("attendanceProofPhoto");if(!photoInput){toastMsg("Open the Employee App again and retry the attendance action.");return;}pendingAttendanceAction=act;photoInput.value="";photoInput.click();return;
    }
    if(act==="view-attendance-evidence"){
      if(!cloudAdmin()){toastMsg("Only HR administrators can review attendance photos.");return;}
      var evidenceWindow=window.open("about:blank","_blank"),signed=await supabaseClient.storage.from("attendance-evidence").createSignedUrl(id,120);
      if(signed.error){if(evidenceWindow)evidenceWindow.close();toastMsg(signed.error.message||"Could not open attendance photo.");return;}
      if(evidenceWindow)evidenceWindow.location=signed.data.signedUrl;else location.href=signed.data.signedUrl;return;
    }
    if(act==="install-employee-app"){
      if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;}
      else toastMsg(/iphone|ipad|ipod/i.test(navigator.userAgent)?"In Safari, tap Share, then Add to Home Screen.":"Open your browser menu and choose Install app or Add to Home screen.");
      return;
    }
    if(supabaseClient&&currentUser&&!cloudAdmin()&&act==="employee-cancel-leave"){
      try{var cancelLeave=await supabaseClient.rpc("hrms_employee_cancel_leave",{p_leave_id:id});if(cancelLeave.error)throw cancelLeave.error;await refreshEmployeeWorkspace();renderPage("Employee App");toastMsg("Leave request cancelled.");}catch(err){toastMsg(err.message||"Leave request could not be cancelled.");}return;
    }
    if(supabaseClient&&currentUser&&!cloudAdmin()&&act==="employee-payslip"){
      var employeeProfile=linkedEmployee(),payslipPeriod=b.dataset.period||"",ownPay=employeeProfile&&employeeProfile.id===id&&data.payroll.find(function(x){return x.employee===employeeProfile.id&&x.period===payslipPeriod;});
      if(!ownPay){toastMsg("That payslip is not available for your account.");return;}
      if(ownPay.status!=="Paid"){toastMsg("Your PDF payslip will be available after payroll is marked paid.");return;}
      downloadPayslipPDF(employeeProfile,ownPay,payslipPeriod);return;
    }
    if(act==="remove-logo"){data.settings.logoData="";save();applyBranding();renderPage("Settings");toastMsg("Logo removed.");}
    else if(act==="cancel-attendance"){attendanceEditorId="";renderPage("Attendance");}
    else if(act==="edit-attendance"){
      if(!cloudAdmin()){toastMsg("Only an Administrator can override attendance records.");return;}
      attendanceEditorId=id;renderPage("Attendance");
    }
    else if(act==="review-attendance"){renderPage("Attendance");}
    else if(act==="delete-employee"){
      var doomed=person(id);if(!doomed)return;
      if(!confirm("Permanently delete "+doomed.name+" and their linked attendance, leave, onboarding, payroll, and performance records?"))return;
      data.employees=data.employees.filter(function(x){return x.id!==id;});
      ["attendance","leaves","tasks","goals","reviews","payroll"].forEach(function(k){data[k]=data[k].filter(function(x){return x.employee!==id;});});
      save();renderPage("People");toastMsg("Employee and linked records deleted.");
    }
    else if(act==="edit-department"){
      var dept=data.departments.find(function(x){return x.id===id;});if(!dept)return;
      var oldName=dept.name,newName=prompt("Department name",oldName);if(newName===null)return;newName=newName.trim();
      if(!newName){toastMsg("Department name cannot be empty.");return;}
      if(data.departments.some(function(x){return x.id!==id&&x.name.toLowerCase()===newName.toLowerCase();})){toastMsg("That department already exists.");return;}
      dept.name=newName;data.employees.forEach(function(x){if(x.dept===oldName)x.dept=newName;});data.jobs.forEach(function(x){if(x.dept===oldName)x.dept=newName;});
      save();renderPage("Departments");toastMsg("Department renamed.");
    }
    else if(act==="delete-department"){
      var delDept=data.departments.find(function(x){return x.id===id;});if(!delDept)return;
      var empCount=data.employees.filter(function(x){return x.dept===delDept.name;}).length,jobCount=data.jobs.filter(function(x){return x.dept===delDept.name;}).length;
      var target=data.departments.find(function(x){return x.id!==id;});
      if((empCount||jobCount)&&!target){target={id:newId("d"),name:"Unassigned"};data.departments.push(target);}
      var msg=(empCount||jobCount)?"Reassign "+empCount+" employee(s) and "+jobCount+" role(s) to "+target.name+" and delete "+delDept.name+"?":"Delete department "+delDept.name+"?";
      if(!confirm(msg))return;
      if(empCount||jobCount){data.employees.forEach(function(x){if(x.dept===delDept.name)x.dept=target.name;});data.jobs.forEach(function(x){if(x.dept===delDept.name)x.dept=target.name;});}
      data.departments=data.departments.filter(function(x){return x.id!==id;});save();renderPage("Departments");toastMsg("Department deleted.");
    }
    else if(act==="edit-rule"){
      var rule=data.rules.find(function(x){return x.id===id;});if(!rule)return;
      var value=prompt("Rule value",rule.value);if(value===null)return;
      var details=prompt("Description",rule.details);if(details===null)return;
      rule.value=value.trim();rule.details=details.trim();save();renderPage("Rules");toastMsg("Rule updated.");
    }
    else if(act==="delete-rule"){
      var ruleToDelete=data.rules.find(function(x){return x.id===id;});
      if(ruleToDelete&&confirm("Delete rule “"+ruleToDelete.name+"”?")){data.rules=data.rules.filter(function(x){return x.id!==id;});save();renderPage("Rules");toastMsg("Rule deleted.");}
    }
    else if(act==="delete-holiday"){
      if(!cloudAdmin()){toastMsg("Only HR administrators can edit the holiday calendar.");return;}
      var holiday=data.holidays.find(function(h){return h.id===id;});if(holiday&&confirm("Remove "+holiday.name+" from the company calendar?")){data.holidays=data.holidays.filter(function(h){return h.id!==id;});save();renderPage("Holidays");toastMsg("Holiday removed.");}
    }
    else if(act==="approve-attendance-request"||act==="reject-attendance-request"){
      if(!cloudAdmin()){toastMsg("Only HR administrators can review attendance corrections.");return;}
      var correction=data.attendanceRequests.find(function(r){return r.id===id;});if(!correction)return;
      if(act==="approve-attendance-request"){
        var prior=data.attendance.find(function(a){return a.employee===correction.employee&&a.date===correction.date;}),updated={id:prior?prior.id:newId("a"),employee:correction.employee,date:correction.date,status:correction.requestedStatus||"Present",in:correction.in||"",out:correction.out||"",createdAt:prior&&prior.createdAt||new Date().toISOString(),createdBy:prior&&prior.createdBy||currentUser.name,checkInEvidence:prior&&prior.checkInEvidence||null,checkOutEvidence:prior&&prior.checkOutEvidence||null,override:true,overrideBy:currentUser.name,overrideAt:new Date().toISOString(),overrideReason:"Approved employee correction: "+correction.reason,history:prior?(prior.history||[]).concat([{status:prior.status,in:prior.in,out:prior.out,changedAt:new Date().toISOString(),changedBy:currentUser.name,override:true,reason:correction.reason}]):[]};
        if(prior)data.attendance=data.attendance.map(function(a){return a.id===prior.id?updated:a;});else data.attendance.push(updated);
        invalidateUnpaidPayroll(correction.date.slice(0,7));
      }
      correction.reviewStatus=act==="approve-attendance-request"?"Approved":"Rejected";correction.reviewedBy=currentUser.name;correction.reviewedAt=new Date().toISOString();save();renderPage("Attendance");toastMsg("Correction "+correction.reviewStatus.toLowerCase()+".");
    }
    else if(act==="delete-user"){
      var userToDelete=data.users.find(function(x){return x.id===id;});
      if(userToDelete&&confirm("Remove login account for "+userToDelete.name+"?")){data.users=data.users.filter(function(x){return x.id!==id;});save();renderPage("Settings");toastMsg("Account removed.");}
    }
    else if(act==="edit-pay"){
      payrollEditorEmployee=id;renderPage("Payroll");var setup=document.querySelector("#moduleBody [data-form=pay-profile]");if(setup)setup.scrollIntoView({behavior:"smooth",block:"center"});
    } else if(act==="edit-employee"){
      var emp=person(id);if(!emp)return;var name=prompt("Employee name",emp.name);if(name===null)return;
      var dept=prompt("Department",emp.dept);if(dept===null)return;var salary=prompt("Monthly salary in INR",emp.salary);if(salary===null)return;
      emp.name=name.trim()||emp.name;emp.dept=dept.trim()||emp.dept;var nextSalary=Number(salary);if(isFinite(nextSalary)&&nextSalary>=0){resizePayrollProfile(emp,nextSalary);emp.salary=nextSalary;}invalidateUnpaidPayroll(TODAY.slice(0,7));save();renderPage("People");toastMsg("Employee profile updated.");
    } else if(act==="toggle-employee"){var p=person(id);if(p){p.active=!p.active;save();renderPage("People");toastMsg(p.name+(p.active?" activated.":" deactivated."));}}
    else if(act==="delete-attendance"){
      if(!cloudAdmin()){toastMsg("Only an Administrator can remove attendance records.");return;}
      var removedAttendance=data.attendance.find(function(a){return a.id===id;});data.attendance=data.attendance.filter(function(a){return a.id!==id;});if(removedAttendance)invalidateUnpaidPayroll(removedAttendance.date.slice(0,7));save();renderPage("Attendance");
    }
    else if(act==="approve-leave"||act==="reject-leave"){var l=data.leaves.find(function(x){return x.id===id;});if(l){l.status=act==="approve-leave"?"Approved":"Rejected";invalidateLeavePayroll(l);save();renderPage("Leave");toastMsg("Leave request "+l.status.toLowerCase()+".");}}
    else if(act==="delete-leave"){var leaveToRemove=data.leaves.find(function(x){return x.id===id;});invalidateLeavePayroll(leaveToRemove);data.leaves=data.leaves.filter(function(x){return x.id!==id;});save();renderPage("Leave");}
    else if(act==="close-job"){var j=data.jobs.find(function(x){return x.id===id;});if(j){j.status=j.status==="Open"?"Closed":"Open";save();renderPage("Recruitment");}}
    else if(act==="delete-candidate"){data.candidates=data.candidates.filter(function(x){return x.id!==id;});save();renderPage("Recruitment");}
    else if(act==="delete-task"){data.tasks=data.tasks.filter(function(x){return x.id!==id;});save();renderPage("Onboarding");}
    else if(act==="delete-goal"){data.goals=data.goals.filter(function(x){return x.id!==id;});save();renderPage("Performance");}
    else if(act==="delete-review"){data.reviews=data.reviews.filter(function(x){return x.id!==id;});save();renderPage("Performance");}
    else if(act==="run-payroll"){
      var period=(document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7),alreadyPaid=data.payroll.filter(function(p){return p.period===period&&p.status==="Paid";});data.payroll=data.payroll.filter(function(p){return p.period!==period||p.status==="Paid";});
      data.employees.filter(function(x){return x.active;}).forEach(function(x){if(alreadyPaid.some(function(p){return p.employee===x.id;}))return;var calc=payrollEstimate(x,period);data.payroll.push(Object.assign({id:newId("p"),employee:x.id,period:period,status:"Ready"},calc));});
      save();renderPage("Payroll");toastMsg("Payroll calculated for "+period+".");
    } else if(act==="mark-paid"){
      var period=(document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7),pay=data.payroll.find(function(p){return p.employee===id&&p.period===period;});
      if(pay&&pay.payModel!=="monthly-full-v1"){toastMsg("Recalculate full monthly payroll before marking this record paid.");return;}
      if(pay&&pay.status==="Ready"){pay.status="Paid";save();renderPage("Payroll");toastMsg("Payment marked as paid.");}
    } else if(act==="payslip"){
      if(!cloudAdmin()){toastMsg("Only HR administrators can download employer payslips.");return;}
      var employerEmployee=person(id),employerPeriod=(document.getElementById("payPeriod")||{}).value||TODAY.slice(0,7);
      if(!employerEmployee){toastMsg("Employee record was not found.");return;}
      var savedEmployerPay=data.payroll.find(function(x){return x.employee===employerEmployee.id&&x.period===employerPeriod;}),employerPay=savedEmployerPay&&savedEmployerPay.gross!=null&&(savedEmployerPay.status==="Paid"||savedEmployerPay.payModel==="monthly-full-v1")?savedEmployerPay:payrollEstimate(employerEmployee,employerPeriod);
      if(savedEmployerPay&&savedEmployerPay.status==="Paid")employerPay.status="Paid";else if(savedEmployerPay&&savedEmployerPay.status==="Ready"&&savedEmployerPay.payModel==="monthly-full-v1")employerPay.status="Ready";else employerPay.status=savedEmployerPay&&savedEmployerPay.payModel!=="monthly-full-v1"?"Recalculate":"Preview";
      await downloadPayslipPDF(employerEmployee,employerPay,employerPeriod);
    } else if(act==="export-payslips"){exportData("payroll");}
    else if(act.indexOf("export-")===0){exportData(act.slice(7));}
  });
  moduleBody.addEventListener("change",async function(e){
    if(!e.target||e.target.id!=="attendanceProofPhoto"||!pendingAttendanceAction)return;
    var action=pendingAttendanceAction,file=e.target.files&&e.target.files[0];pendingAttendanceAction="";if(!file)return;if(attendancePunchBusy)return;attendancePunchBusy=true;
    try{await submitOfficePunch(action,file);}
    catch(punchError){toastMsg(punchError.message||"Attendance could not be saved.");}
    finally{attendancePunchBusy=false;e.target.value="";}
  });
  document.getElementById("modsearch").oninput=function(){renderPage(window.currentHrPage||"Overview");};
  document.getElementById("search").oninput=function(e){
    var q=e.target.value.toLowerCase();
    if((window.currentHrPage||"Overview")==="Overview"){document.querySelectorAll("#rows tr").forEach(function(r){r.classList.toggle("hidden",r.innerText.toLowerCase().indexOf(q)<0);});}
    else{document.getElementById("modsearch").value=e.target.value;renderPage(window.currentHrPage);}
  };
  document.getElementById("modexport").onclick=function(){
    var p=window.currentHrPage;
    exportData(p==="People"?"people":p==="Attendance"?"attendance":p==="Leave"?"leave":p==="Payroll"?"payroll":p==="Performance"?"goals":"summary");
  };
  document.getElementById("modadd").onclick=function(){
    var f=document.querySelector("#moduleBody [data-form]"), input=f&&f.querySelector("input:not([type=date]),select");
    if(input)input.focus();else toastMsg("Choose a form below to add a record.");
  };
  document.getElementById("export").onclick=function(){exportData("summary");};
  function authGate(){
    if(window.HRMS_SUPABASE_CONFIG&&!supabaseClient){
      var unavailable=document.getElementById("authGate");if(!unavailable){unavailable=document.createElement("div");unavailable.id="authGate";document.body.appendChild(unavailable);}
      unavailable.className="auth-gate";setWorkspaceInert(true);
      unavailable.innerHTML='<section class="auth-card"><div class="auth-eyebrow">SIGN-IN SERVICE UNAVAILABLE</div><h1>Could not load secure sign-in</h1><p class="auth-copy">Refresh this page while connected to the internet. If it keeps happening, the Supabase client script may be blocked by your network.</p></section>';unavailable.classList.remove("hidden");return;
    }
    if(supabaseClient){showCloudAuth("login","");return;}
    var gate=document.getElementById("authGate");
    if(!gate){gate=document.createElement("div");gate.id="authGate";document.body.appendChild(gate);}
    var setup=data.users.length===0,company=esc(data.settings.company||"PeopleOS");
    var brand=data.settings.logoData?'<img alt="" src="'+esc(data.settings.logoData)+'">':esc((data.settings.company||"P").trim().charAt(0).toUpperCase());
    gate.className="auth-gate";
    setWorkspaceInert(true);
    gate.innerHTML='<section class="auth-card"><div class="auth-brand"><div class="auth-mark">'+brand+'</div><b>'+company+'</b></div><div class="auth-eyebrow">'+(setup?"FIRST-TIME SETUP":"SECURE SIGN IN")+'</div><h1>'+(setup?"Create administrator account":"Sign in to your workspace")+'</h1><p class="auth-copy">'+(setup?"Set up the first administrator before opening the HR workspace.":"Enter your account details to continue.")+'</p><form id="authForm">'+
      (setup?'<label>Full name<input name="name" autocomplete="name" required></label>':'')+
      (setup?'<label>Phone number<input name="phone" type="tel" autocomplete="tel" placeholder="+91 98765 43210" required></label>':'')+
      '<label>Email<input name="email" type="email" autocomplete="username" required></label>'+ 
      '<label>Password<input name="password" type="password" autocomplete="'+(setup?"new-password":"current-password")+'" minlength="8" required></label>'+
      (setup?'<label>Confirm password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>':'')+
      '<p class="auth-error" id="authError" role="alert"></p><button class="btn primary auth-submit">'+(setup?"Create account":"Sign in")+'</button></form>'+(setup?"":'<button class="auth-link" id="forgotPasswordLink" type="button">Forgot password?</button>')+'<p class="auth-note">Accounts and records in this demo are stored in this browser; shared sign-in and live recovery need server setup.</p></section>';
    gate.classList.remove("hidden");
  }
  function showCloudAuth(mode,message){
    if(!gateNode)return;
    var company=esc(data.settings.company||"Fruitmaster HR"),brand=data.settings.logoData?'<img alt="" src="'+esc(data.settings.logoData)+'">':esc((data.settings.company||"F").trim().charAt(0).toUpperCase()),isAdmin=mode==="setup-admin";
    var title=mode==="signup"?"Create employee account":isAdmin?"Set up first administrator":mode==="recovery-start"?"Forgot password?":mode==="recovery-verify"?"Verify recovery code":mode==="recovery-reset"?"Choose a new password":"Sign in to your workspace";
    var body="";
    if(mode==="signup"||isAdmin){
      body='<form id="cloudSignupForm"><label>Full name<input name="name" autocomplete="name" required></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" placeholder="+91 98765 43210" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label>'+(isAdmin?'<label>One-time administrator setup code<input name="setupCode" autocomplete="off" required></label>':'')+'<p class="auth-error" id="authError" role="alert">'+esc(message||"")+'</p><button class="btn primary auth-submit">'+(isAdmin?"Create administrator":"Create employee account")+'</button></form><button class="auth-link" type="button" id="backToLogin">Back to sign in</button>';
    }else if(mode==="recovery-start"){
      body='<p class="auth-copy">Enter the email address on your account. Supabase will send a recovery code to that email.</p><form id="recoveryStartForm"><label>Account email<input name="email" type="email" autocomplete="email" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(message||"")+'</p><button class="btn primary auth-submit">Send recovery code</button></form><button class="auth-link" type="button" id="backToLogin">Back to sign in</button>';
    }else if(mode==="recovery-verify"){
      body='<p class="auth-copy">Enter the code sent to '+esc(recoveryState.email||"your email")+'.</p><form id="recoveryVerifyForm"><label>Email code<input name="emailCode" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(message||"")+'</p><button class="btn primary auth-submit">Verify code</button></form><button class="auth-link" type="button" id="backToLogin">Back to sign in</button>';
    }else if(mode==="recovery-reset"){
      body='<p class="auth-copy">Choose a new password for your account.</p><form id="recoveryResetForm"><label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(message||"")+'</p><button class="btn primary auth-submit">Reset password</button></form>';
    }else{
      body='<form id="authForm"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><p class="auth-error" id="authError" role="alert">'+esc(message||"")+'</p><button class="btn primary auth-submit">Sign in</button></form><button class="auth-link" id="forgotPasswordLink" type="button">Forgot password?</button><div class="auth-divider">New to the employee app?</div><button class="auth-link" type="button" id="createEmployeeAccount">Create employee account</button><button class="auth-link" type="button" id="createFirstAdmin">First-time administrator setup</button>';
    }
    gateNode.className="auth-gate";
    setWorkspaceInert(true);
    gateNode.innerHTML='<section class="auth-card"><div class="auth-brand"><div class="auth-mark">'+brand+'</div><b>'+company+'</b></div><div class="auth-eyebrow">'+(mode==="login"?"SECURE SIGN IN":isAdmin?"FIRST ADMINISTRATOR":mode.indexOf("recovery-")===0?"ACCOUNT RECOVERY":"EMPLOYEE ACCESS")+'</div><h1>'+title+'</h1>'+body+'<p class="auth-note">Employee sign-up must use the same email address as the employee profile entered by HR.</p></section>';
    gateNode.classList.remove("hidden");
  }
  async function finishCloudSignIn(authUser){
    var loaded=await supabaseClient.from("hrms_profiles").select("user_id,email,full_name,phone,photo_data,role").eq("user_id",authUser.id).single();
    if(loaded.error)throw loaded.error;
    await loadCloudWorkspace(loaded.data);
    var p=loaded.data;
    enterApp({id:p.user_id,name:p.full_name||authUser.email,email:p.email||authUser.email,phone:p.phone||"",role:p.role,photoData:p.photo_data||""});
  }
  function setWorkspaceInert(inert){
    document.querySelectorAll(".sidebar,.main").forEach(function(el){
      if(inert)el.setAttribute("inert","");
      else el.removeAttribute("inert");
    });
  }
  var pendingPhotoData="";
  var accountModal=document.createElement("div");
  accountModal.id="accountModal";accountModal.className="account-backdrop hidden";accountModal.innerHTML='<section class="account-dialog" role="dialog" aria-modal="true" aria-labelledby="accountTitle"><div class="account-dialog-head"><div><div class="eyebrow">Personal settings</div><h2 id="accountTitle">My profile</h2></div><button class="close" type="button" id="closeAccount" aria-label="Close profile">×</button></div><form id="profileForm"><div class="account-photo"><div class="avatar" id="accountAvatar">U</div><div><label class="photo-upload">Change photo<input id="accountPhotoFile" type="file" accept="image/png,image/jpeg,image/webp"></label><button class="account-link" type="button" id="removeAccountPhoto">Remove photo</button><small>PNG, JPG, or WebP · max 1 MB</small></div></div><label>Full name<input name="name" required autocomplete="name"></label><label>Email address<input name="email" type="email" required autocomplete="email"></label><label>Phone number<input name="phone" type="tel" required autocomplete="tel" placeholder="+91 98765 43210"></label><p class="account-error" id="profileError" role="alert"></p><button class="btn primary" type="submit">Save profile</button></form><form id="changePasswordForm" class="password-form"><h3>Change password</h3><label>Current password<input name="current" type="password" autocomplete="current-password" required></label><label>New password<input name="next" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label><p class="account-error" id="passwordError" role="alert"></p><button class="btn" type="submit">Update password</button></form></section>';
  document.body.appendChild(accountModal);
  function syncAccountHeader(){
    if(!currentUser)return;
    var name=document.getElementById("loggedUserName"),role=document.getElementById("loggedUserRole"),profile=document.getElementById("profileBtn"),profileName=document.getElementById("profileName");
    if(name)name.textContent=currentUser.name;if(role)role.textContent=currentUser.role;
    paintAvatar(document.getElementById("userAvatar"),currentUser);paintAvatar(document.getElementById("profileAvatar"),currentUser);
    if(profileName)profileName.textContent=currentUser.name;
    if(profile){profile.onclick=openAccountModal;profile.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();openAccountModal();}};}
  }
  function renderAccountModal(){
    if(!currentUser)return;
    var formNode=document.getElementById("profileForm");formNode.elements.name.value=currentUser.name||"";formNode.elements.email.value=currentUser.email||"";formNode.elements.phone.value=currentUser.phone||"";
    pendingPhotoData=currentUser.photoData||"";paintAvatar(document.getElementById("accountAvatar"),{name:currentUser.name,photoData:pendingPhotoData});
    document.getElementById("profileError").textContent="";document.getElementById("passwordError").textContent="";
  }
  function openAccountModal(){if(!currentUser)return;renderAccountModal();accountModal.classList.remove("hidden");document.getElementById("profileForm").elements.name.focus();}
  function closeAccountModal(){accountModal.classList.add("hidden");}
  document.getElementById("closeAccount").onclick=closeAccountModal;
  accountModal.addEventListener("click",function(e){if(e.target===accountModal)closeAccountModal();});
  document.getElementById("removeAccountPhoto").onclick=function(){pendingPhotoData="";paintAvatar(document.getElementById("accountAvatar"),{name:currentUser&&currentUser.name});};
  document.getElementById("accountPhotoFile").onchange=function(e){
    var file=e.target.files&&e.target.files[0];if(!file)return;
    if(["image/png","image/jpeg","image/webp"].indexOf(file.type)<0||file.size>1024*1024){toastMsg("Choose a PNG, JPG, or WebP image under 1 MB.");e.target.value="";return;}
    var reader=new FileReader();reader.onload=function(){var image=new Image();image.onload=function(){var scale=Math.min(1,512/Math.max(image.width,image.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);pendingPhotoData=canvas.toDataURL("image/png");paintAvatar(document.getElementById("accountAvatar"),{name:currentUser&&currentUser.name,photoData:pendingPhotoData});};image.onerror=function(){toastMsg("That image could not be opened.");};image.src=reader.result;};reader.readAsDataURL(file);
  };
  document.getElementById("profileForm").addEventListener("submit",async function(e){
    e.preventDefault();if(!currentUser)return;
    var fd=new FormData(e.target),name=String(fd.get("name")||"").trim(),email=String(fd.get("email")||"").trim().toLowerCase(),phone=cleanPhone(fd.get("phone")),error=document.getElementById("profileError");
    if(!name){error.textContent="Enter your name.";return;}if(!validPhone(phone)){error.textContent="Enter a phone number with country code, such as +91 98765 43210.";return;}
    if(supabaseClient){
      var profileUpdate=await supabaseClient.from("hrms_profiles").update({full_name:name,phone:phone,photo_data:pendingPhotoData}).eq("user_id",currentUser.id);
      if(profileUpdate.error){error.textContent=profileUpdate.error.message;return;}
      var emailPending=false;
      if(email!==currentUser.email){var emailUpdate=await supabaseClient.auth.updateUser({email:email});if(emailUpdate.error){error.textContent=emailUpdate.error.message;return;}emailPending=true;}
      currentUser.name=name;currentUser.phone=phone;currentUser.photoData=pendingPhotoData;if(!emailPending)currentUser.email=email;
      var selfProfile=data.users.find(function(u){return u.id===currentUser.id;});if(selfProfile){selfProfile.name=name;selfProfile.phone=phone;selfProfile.photoData=pendingPhotoData;if(!emailPending)selfProfile.email=email;}
      syncAccountHeader();renderPage(window.currentHrPage||"Overview");toastMsg(emailPending?"Profile saved. Confirm the email change using the message sent to the new address.":"Profile updated.");return;
    }
    if(data.users.some(function(u){return u.id!==currentUser.id&&u.email.toLowerCase()===email;})){error.textContent="Another account already uses that email.";return;}
    if(data.users.some(function(u){return u.id!==currentUser.id&&u.phone&&cleanPhone(u.phone)===phone;})){error.textContent="Another account already uses that phone number.";return;}
    currentUser.name=name;currentUser.email=email;currentUser.phone=phone;currentUser.photoData=pendingPhotoData;save();syncAccountHeader();renderPage(window.currentHrPage||"Overview");toastMsg("Profile updated.");
  });
  document.getElementById("changePasswordForm").addEventListener("submit",async function(e){
    e.preventDefault();if(!currentUser)return;
    var fd=new FormData(e.target),oldPassword=String(fd.get("current")||""),newPassword=String(fd.get("next")||""),confirmPassword=String(fd.get("confirm")||""),error=document.getElementById("passwordError");
    error.textContent="";
    try{
      if(newPassword.length<8){error.textContent="Use at least 8 characters for the new password.";return;}
      if(newPassword!==confirmPassword){error.textContent="New passwords do not match.";return;}
      if(supabaseClient){
        var verified=await supabaseClient.auth.signInWithPassword({email:currentUser.email,password:oldPassword});
        if(verified.error){error.textContent="Current password is incorrect.";return;}
        var cloudPassword=await supabaseClient.auth.updateUser({password:newPassword});
        if(cloudPassword.error){error.textContent=cloudPassword.error.message;return;}
        e.target.reset();toastMsg("Password updated.");return;
      }
      var oldDigest=await passwordHash(oldPassword,currentUser.salt);
      if(oldDigest.hash!==currentUser.passwordHash){error.textContent="Current password is incorrect.";return;}
      if(newPassword.length<8){error.textContent="Use at least 8 characters for the new password.";return;}
      if(newPassword!==confirmPassword){error.textContent="New passwords do not match.";return;}
      var digest=await passwordHash(newPassword);currentUser.salt=digest.salt;currentUser.passwordHash=digest.hash;save();e.target.reset();toastMsg("Password updated.");
    }catch(err){error.textContent=err.message||"Password could not be changed.";}
  });
  function enterApp(user){
    currentUser=user;
    try{sessionStorage.setItem("peopleos-demo-session",user.id);}catch(_){}
    save();
    document.getElementById("authGate").classList.add("hidden");
    setWorkspaceInert(false);
    syncNavigationForRole();syncAccountHeader();applyBranding();window.showPage(["Administrator","HR"].indexOf(user.role)>=0?"Overview":"Employee App");
  }
  var gateNode=document.createElement("div");gateNode.id="authGate";document.body.appendChild(gateNode);
  var recoveryState={};
  function showRecoveryScreen(step,message){
    if(supabaseClient){showCloudAuth("recovery-"+step,message||"");return;}
    var company=esc(data.settings.company||"PeopleOS"),error=message||"";
    gateNode.className="auth-gate";setWorkspaceInert(true);
    var body=step==="start"
      ?'<p class="auth-copy">Enter the email saved on your account. A verification code will be sent to that email.</p><form id="recoveryStartForm"><label>Account email<input name="email" type="email" autocomplete="email" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(error)+'</p><button class="btn primary auth-submit">Send email code</button></form>'
      :step==="verify"
      ?'<p class="auth-copy">Enter the verification code sent to your registered email.</p><form id="recoveryVerifyForm"><label>Email verification code<input name="emailCode" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(error)+'</p><button class="btn primary auth-submit">Verify email code</button></form>'
      :'<p class="auth-copy">Choose a new password for your account.</p><form id="recoveryResetForm"><label>New password<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><label>Confirm new password<input name="confirm" type="password" autocomplete="new-password" minlength="8" required></label><p class="auth-error" id="recoveryError" role="alert">'+esc(error)+'</p><button class="btn primary auth-submit">Reset password</button></form>';
    gateNode.innerHTML='<section class="auth-card"><div class="auth-brand"><div class="auth-mark">'+(data.settings.logoData?'<img alt="" src="'+esc(data.settings.logoData)+'">':esc((data.settings.company||"P").charAt(0).toUpperCase()))+'</div><b>'+company+'</b></div><div class="auth-eyebrow">ACCOUNT RECOVERY</div><h1>'+(step==="start"?"Forgot password?":step==="verify"?"Verify your email":"Set a new password")+'</h1>'+body+'<button class="auth-link" type="button" id="backToLogin">Back to sign in</button><p class="auth-note">The verification code is sent to the email saved on the account.</p></section>';
  }
  async function recoveryRequest(action,values){
    var response=await fetch("/.netlify/functions/auth-recovery",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({action:action},values||{}))});
    var result={};try{result=await response.json();}catch(_){}
    if(!response.ok||!result.ok)throw new Error(result.message||"Password recovery service is not configured on this site yet.");
    return result;
  }
  gateNode.addEventListener("click",function(e){
    if(e.target.id==="createEmployeeAccount"){showCloudAuth("signup","");return;}
    if(e.target.id==="createFirstAdmin"){
      if(!supabaseClient){authGate();return;}
      supabaseClient.rpc("hrms_setup_open").then(function(result){
        if(result.error){showCloudAuth("login","Run the Supabase setup SQL before creating the first administrator.");return;}
        if(result.data!==true){showCloudAuth("login","First administrator setup is already complete. Ask an administrator to create your access.");return;}
        showCloudAuth("setup-admin","");
      });return;
    }
    if(e.target.id==="forgotPasswordLink"&&supabaseClient){recoveryState={};showCloudAuth("recovery-start","");return;}
    if(e.target.id==="forgotPasswordLink"){recoveryState={};showRecoveryScreen("start");}
    if(e.target.id==="backToLogin"){recoveryState={};authGate();}
  });
  gateNode.addEventListener("submit",async function(e){
    if(supabaseClient&&e.target.id==="cloudSignupForm"){
      e.preventDefault();var signup=new FormData(e.target),signupName=String(signup.get("name")||"").trim(),signupEmail=String(signup.get("email")||"").trim().toLowerCase(),signupPhone=cleanPhone(signup.get("phone")),signupPassword=String(signup.get("password")||""),signupConfirm=String(signup.get("confirm")||""),setupCode=String(signup.get("setupCode")||"").trim(),adminSignup=!!signup.has("setupCode"),signupError=document.getElementById("authError");
      if(signupPassword.length<8){signupError.textContent="Use at least 8 characters for the password.";return;}
      if(signupPassword!==signupConfirm){signupError.textContent="Passwords do not match.";return;}
      if(!validPhone(signupPhone)){signupError.textContent="Enter a phone number with country code, such as +91 98765 43210.";return;}
      if(adminSignup){
        var openSetup=await supabaseClient.rpc("hrms_setup_open");if(openSetup.error||openSetup.data!==true){signupError.textContent="Administrator setup is closed. Ask the workspace owner for an employee account.";return;}
        var validSetup=await supabaseClient.rpc("hrms_setup_code_valid",{p_code:setupCode});if(validSetup.error||validSetup.data!==true){signupError.textContent="That one-time setup code is not correct. Copy it again from the SQL Editor result.";return;}
      }
      var signUpResult=await supabaseClient.auth.signUp({email:signupEmail,password:signupPassword,options:{data:{full_name:signupName,phone:signupPhone,setup_code:adminSignup?setupCode:""}}});
      if(signUpResult.error){signupError.textContent=signUpResult.error.message;return;}
      if(signUpResult.data.session){try{await finishCloudSignIn(signUpResult.data.user);}catch(err){await supabaseClient.auth.signOut();clearCloudSessionData();showCloudAuth("login",err.message||"Account was created, but workspace setup is incomplete.");}return;}
      showCloudAuth("login","Account created. Check your email to confirm it, then sign in here.");
      return;
    }
    if(supabaseClient&&e.target.id==="authForm"){
      e.preventDefault();var login=new FormData(e.target),loginEmail=String(login.get("email")||"").trim().toLowerCase(),loginPassword=String(login.get("password")||""),loginError=document.getElementById("authError");
      var loginResult=await supabaseClient.auth.signInWithPassword({email:loginEmail,password:loginPassword});
      if(loginResult.error){loginError.textContent=loginResult.error.message;return;}
      try{await finishCloudSignIn(loginResult.data.user);}catch(err){await supabaseClient.auth.signOut();clearCloudSessionData();showCloudAuth("login",err.message||"Could not load your HR workspace.");}
      return;
    }
    if(supabaseClient&&e.target.id==="recoveryStartForm"){
      e.preventDefault();var recoveryEmail=String(new FormData(e.target).get("email")||"").trim().toLowerCase();
      var sentCode=await supabaseClient.auth.resetPasswordForEmail(recoveryEmail);
      if(sentCode.error){showCloudAuth("recovery-start",sentCode.error.message);return;}
      recoveryState={email:recoveryEmail};showCloudAuth("recovery-verify","");return;
    }
    if(supabaseClient&&e.target.id==="recoveryVerifyForm"){
      e.preventDefault();var recoveryCode=String(new FormData(e.target).get("emailCode")||"").trim();
      var verifiedCode=await supabaseClient.auth.verifyOtp({email:recoveryState.email,token:recoveryCode,type:"recovery"});
      if(verifiedCode.error){showCloudAuth("recovery-verify",verifiedCode.error.message);return;}
      showCloudAuth("recovery-reset","");return;
    }
    if(supabaseClient&&e.target.id==="recoveryResetForm"){
      e.preventDefault();var resetValues=new FormData(e.target),newPassword=String(resetValues.get("password")||""),confirmNew=String(resetValues.get("confirm")||"");
      if(newPassword.length<8){showCloudAuth("recovery-reset","Use at least 8 characters.");return;}
      if(newPassword!==confirmNew){showCloudAuth("recovery-reset","Passwords do not match.");return;}
      var updatePassword=await supabaseClient.auth.updateUser({password:newPassword});
      if(updatePassword.error){showCloudAuth("recovery-reset",updatePassword.error.message);return;}
      await supabaseClient.auth.signOut();clearCloudSessionData();recoveryState={};showCloudAuth("login","Password reset. Sign in with your new password.");return;
    }
    if(e.target.id==="recoveryStartForm"){
      e.preventDefault();var email=String(new FormData(e.target).get("email")||"").trim().toLowerCase();
      var savedUser=data.users.find(function(u){return u.email.toLowerCase()===email;});
      if(!savedUser){showRecoveryScreen("start","If this account exists, a recovery code will be sent to its saved email address.");return;}
      try{var sent=await recoveryRequest("start",{email:savedUser.email});recoveryState={email:savedUser.email,requestId:sent.requestId||""};showRecoveryScreen("verify");}
      catch(err){showRecoveryScreen("start",err.message||"Could not send the verification code.");}
      return;
    }
    if(e.target.id==="recoveryVerifyForm"){
      e.preventDefault();var codes=new FormData(e.target);
      try{var verified=await recoveryRequest("verify",{email:recoveryState.email,requestId:recoveryState.requestId,emailCode:String(codes.get("emailCode")||"").trim()});recoveryState.resetToken=verified.resetToken||"";showRecoveryScreen("reset");}
      catch(err){showRecoveryScreen("verify",err.message||"The code could not be verified.");}
      return;
    }
    if(e.target.id==="recoveryResetForm"){
      e.preventDefault();var reset=new FormData(e.target),next=String(reset.get("password")||""),confirmNext=String(reset.get("confirm")||""),localUser=data.users.find(function(u){return u.email.toLowerCase()===recoveryState.email;});
      if(next.length<8){showRecoveryScreen("reset","Use at least 8 characters.");return;}
      if(next!==confirmNext){showRecoveryScreen("reset","Passwords do not match.");return;}
      if(!localUser){showRecoveryScreen("start","If this account exists, recovery instructions will be sent to its saved contacts.");return;}
      try{var digest=await passwordHash(next);await recoveryRequest("complete",{email:recoveryState.email,requestId:recoveryState.requestId,resetToken:recoveryState.resetToken,salt:digest.salt,passwordHash:digest.hash});localUser.salt=digest.salt;localUser.passwordHash=digest.hash;save();recoveryState={};authGate();document.getElementById("authError").textContent="Password reset. Sign in with your new password.";}
      catch(err){showRecoveryScreen("reset",err.message||"Password could not be reset.");}
      return;
    }
    if(e.target.id!=="authForm")return;
    e.preventDefault();
    var fd=new FormData(e.target),email=String(fd.get("email")||"").trim().toLowerCase(),password=String(fd.get("password")||"");
    var err=document.getElementById("authError");
    try{
      if(data.users.length===0){
        var name=String(fd.get("name")||"").trim(),confirmPassword=String(fd.get("confirm")||"");
        if(password!==confirmPassword){err.textContent="Passwords do not match.";return;}
        await createLocalUser(name,email,password,"Administrator",fd.get("phone"));save();enterApp(data.users[data.users.length-1]);return;
      }
      var user=data.users.find(function(u){return u.email.toLowerCase()===email;});
      if(!user){err.textContent="Email or password is incorrect.";return;}
      var digest=await passwordHash(password,user.salt);
      if(digest.hash!==user.passwordHash){err.textContent="Email or password is incorrect.";return;}
      enterApp(user);
    }catch(error){err.textContent=error.message||"Sign-in could not be completed.";}
  });
  document.getElementById("logoutBtn").onclick=async function(){
    if(supabaseClient){await supabaseClient.auth.signOut();clearCloudSessionData();authGate();return;}
    try{sessionStorage.removeItem("peopleos-demo-session");}catch(_){}
    currentUser=null;authGate();
  };
  async function startAuthentication(){
    if(window.HRMS_SUPABASE_CONFIG&&!supabaseClient){authGate();return;}
    if(supabaseClient){
      var sessionResult=await supabaseClient.auth.getSession();
      if(sessionResult.error){authGate();return;}
      if(sessionResult.data.session){try{await finishCloudSignIn(sessionResult.data.session.user);}catch(err){await supabaseClient.auth.signOut();clearCloudSessionData();showCloudAuth("login",err.message||"Could not connect to the workspace. Run the Supabase SQL setup first.");}}
      else authGate();
      return;
    }
    var savedId="";
    try{savedId=sessionStorage.getItem("peopleos-demo-session")||"";}catch(_){}
    var user=data.users.find(function(u){return u.id===savedId;});
    if(user)enterApp(user);else authGate();
  }
  document.getElementById("form").onsubmit=function(e){
    e.preventDefault();var fd=new FormData(e.target);
    addEmployee(String(fd.get("name")).trim(),String(fd.get("email")).trim(),String(fd.get("dept")),Number(fd.get("salary"))||80000,String(fd.get("start")||TODAY),fd.has("pfEnabled"),fd.has("esiEnabled"));
    document.getElementById("modal").classList.add("hidden");e.target.reset();
  };
  var requests=document.getElementById("requests"),freshRequests=requests.cloneNode(true);
  requests.parentNode.replaceChild(freshRequests,requests);
  freshRequests.addEventListener("click",function(e){
    var button=e.target.closest(".ok,.no");if(!button)return;
    var row=button.closest(".request"),label=row&&row.querySelector(".request-info b");
    var employee=data.employees.find(function(x){return label&&x.name===label.textContent;});
    var leave=employee&&data.leaves.find(function(x){return x.employee===employee.id&&x.status==="Pending";});
    if(leave){leave.status=button.classList.contains("ok")?"Approved":"Rejected";invalidateLeavePayroll(leave);save();}
    row.remove();
    var count=freshRequests.querySelectorAll(".request").length;
    document.getElementById("pending").textContent="· "+count+" pending";
    if(count===0)freshRequests.innerHTML='<div class="request empty">You’re all caught up. No pending leave requests.</div>';
    renderPage("Overview");toastMsg("Leave request "+(leave?leave.status.toLowerCase():"updated")+".");
  });
  document.querySelectorAll("[data-action]").forEach(function(b){
    b.onclick=function(){if(b.dataset.action==="Add employee"){document.getElementById("add").click();}else{window.showPage(b.dataset.action);}};
  });
  window.showPage=function(page){renderPage(page);};
  window.addEventListener("storage",function(e){
    if(e.key!==STORAGE||!e.newValue)return;
    try{data=JSON.parse(e.newValue);if(!data||!Array.isArray(data.users))return;}catch(_){return;}
    if(currentUser){var latest=data.users.find(function(u){return u.id===currentUser.id;});if(!latest){currentUser=null;try{sessionStorage.removeItem("peopleos-demo-session");}catch(_){}authGate();return;}currentUser=latest;syncAccountHeader();}
    else{authGate();return;}
    renderPage(window.currentHrPage||"Overview");
  });
  applyBranding(); save(); startAuthentication();
  if(supabaseClient)setInterval(refreshCloudUpdates,12000);
}());
