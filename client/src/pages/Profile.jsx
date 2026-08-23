import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import DashboardLayout from "../layouts/DashboardLayout";
import api, { getPhotoUrl } from "../services/api";
import { PRELOADED_AVATARS } from "../assets/avatarsList";
import DatePicker from "../components/DatePicker";
import {
  User, Mail, Phone, Home, Calendar, ShieldAlert,
  Pencil, Save, X, Loader2, Users, PlusCircle, Trash2, ChevronDown, Heart,
} from "lucide-react";

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

// Format as DD-MM-YYYY for display
const formatDobDisplay = (dob) => {
  if (!dob) return "N/A";
  const d = new Date(dob);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return day + "-" + month + "-" + year;
};

const genderLabel = (g) => {
  if (!g) return "N/A";
  return g.charAt(0) + g.slice(1).toLowerCase();
};

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const RELATION_OPTIONS = ["Spouse", "Child", "Parent", "Sibling", "Grandparent", "Grandchild", "In-law", "Relative", "Other"];

const inputClass = "block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all";
const selectClass = "block w-full px-4 py-2.5 bg-brand-ivory/50 border border-brand-gray rounded-2xl text-sm text-brand-charcoal focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:outline-none transition-all appearance-none cursor-pointer";
const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-4">
    <div className="w-10 h-10 rounded-xl bg-brand-ivory flex items-center justify-center border border-brand-gray/30 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-brand-charcoal truncate">{value || "N/A"}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editGender, setEditGender] = useState(user?.gender || "");
  const [editDob, setEditDob] = useState(user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", relation: "", gender: "", dateOfBirth: "" });
  const [savingMember, setSavingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone);
      setEditGender(user.gender || "");
      setEditDob(user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "");
    }
  }, [user]);

  // Lock background page scroll whenever Add Family Member modal is open
  useEffect(() => {
    if (showAddMemberModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddMemberModal]);

  useEffect(() => { fetchFamilyMembers(); }, []);

  const fetchFamilyMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get("/family-members");
      if (res.data.success) setFamilyMembers(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingMembers(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) { showToast("Invalid file type.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("File too large (max 5MB).", "error"); return; }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("name", editName);
      formData.append("email", editEmail);
      formData.append("phone", editPhone);
      if (editGender) formData.append("gender", editGender);
      if (editDob) formData.append("dateOfBirth", editDob);
      const response = await api.patch("/auth/profile", formData, { headers: { "Content-Type": "multipart/form-data" } });
      if (response.data.success) { updateUser(response.data.data.user); showToast("Avatar updated!", "success"); }
    } catch (error) { showToast(error.response?.data?.message || "Failed to upload.", "error"); }
    finally { setUploadingAvatar(false); }
  };

  const selectPreloadedAvatar = async (avatarUrl) => {
    setUploadingAvatar(true);

    try {
      const response = await api.patch("/auth/profile", {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        gender: editGender || null,
        dateOfBirth: editDob || null,

        // Save the selected preloaded avatar permanently
        profilePhotoUrl: avatarUrl,
      });

      if (response.data.success) {
        // Update AuthContext with the user returned from MongoDB
        updateUser(response.data.data.user);

        showToast("Avatar updated successfully!", "success");
      } else {
        showToast(
          response.data.message || "Failed to update avatar.",
          "error"
        );
      }
    } catch (error) {
      console.error("Avatar selection error:", error);

      showToast(
        error.response?.data?.message || "Failed to save avatar.",
        "error"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) { showToast("Name, email and phone are required.", "warning"); return; }
    setSaving(true);
    try {
      const response = await api.patch("/auth/profile", { name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim(), gender: editGender || null, dateOfBirth: editDob || null });
      if (response.data.success) { updateUser(response.data.data.user); showToast("Profile updated!", "success"); setIsEditing(false); }
    } catch (error) { showToast(error.response?.data?.message || "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || ""); setEditEmail(user?.email || ""); setEditPhone(user?.phone || "");
    setEditGender(user?.gender || ""); setEditDob(user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "");
    setIsEditing(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.relation) { showToast("Name and relation are required.", "warning"); return; }
    setSavingMember(true);
    try {
      const res = await api.post("/family-members", { name: memberForm.name.trim(), relation: memberForm.relation, gender: memberForm.gender || null, dateOfBirth: memberForm.dateOfBirth || null });
      if (res.data.success) {
        setFamilyMembers((prev) => [...prev, res.data.data]);
        setShowAddMemberModal(false);
        setMemberForm({ name: "", relation: "", gender: "", dateOfBirth: "" });
        showToast("Family member added!", "success");
      }
    } catch (err) { showToast(err.response?.data?.message || "Failed to add member.", "error"); }
    finally { setSavingMember(false); }
  };

  const handleDeleteMember = async (id) => {
    setDeletingMemberId(id);
    try {
      await api.delete(`/family-members/${id}`);
      setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("Family member removed.", "info");
    } catch (err) { showToast("Failed to remove member.", "error"); }
    finally { setDeletingMemberId(null); }
  };

  const profileAge = user?.dateOfBirth ? calculateAge(user.dateOfBirth) : null;
  const editAge = editDob ? calculateAge(editDob) : null;
  const memberFormAge = memberForm.dateOfBirth ? calculateAge(memberForm.dateOfBirth) : null;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-brand-charcoal">
              My Profile
            </h1>

            <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xl">
              Manage your personal details and society registration information
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-md select-none whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Add Member</span>
              </button>
            )}

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-gray bg-white hover:bg-brand-gray-light text-brand-charcoal hover:text-brand-primary font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-sm select-none whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Avatar Card */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group shrink-0">
              {uploadingAvatar ? (
                <div className="w-24 h-24 rounded-full bg-brand-gray-light flex items-center justify-center border border-brand-gray/50 animate-pulse">
                  <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                </div>
              ) : user?.profilePhotoUrl ? (
                <img src={getPhotoUrl(user.profilePhotoUrl)} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-brand-primary/20 shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-3xl border border-brand-primary/20 uppercase shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={() => fileInputRef.current.click()} disabled={uploadingAvatar} className="absolute bottom-0 right-0 p-2 bg-brand-primary hover:bg-brand-primary-light text-white rounded-full transition-colors cursor-pointer shadow border border-white disabled:opacity-60" title="Upload Avatar">
                <Pencil className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <input type="file" accept="image/*" onChange={handleAvatarChange} ref={fileInputRef} className="hidden" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-brand-charcoal">{user?.name}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/25 uppercase tracking-wider select-none">
                  {user?.role === "ADMIN" ? "Secretary" : "Resident"}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider select-none">Flat {user?.apartmentNumber} &bull; Resident Member</p>
              {(profileAge !== null || user?.gender) && (
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  {user?.gender && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{genderLabel(user.gender)}</span>}
                  {profileAge !== null && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Age {profileAge}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Preloaded Avatar Options Selector */}
          {isEditing && (
            <div className="pt-4 border-t border-brand-gray/30 w-full">
              <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider mb-3">Or choose a preloaded illustrated avatar:</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pb-2">
                {PRELOADED_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => selectPreloadedAvatar(av.url)}
                    className={`w-12 h-12 rounded-full border-2 transition-all p-0.5 shrink-0 mx-auto hover:scale-105 active:scale-95 cursor-pointer ${user?.profilePhotoUrl === av.url ? 'border-brand-primary bg-[#EEEAFE]' : 'border-brand-gray hover:border-brand-primary'
                      }`}
                    title={av.label}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details / Edit Form */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider mb-6">Registration Information</h3>

          {isEditing ? (
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Apartment / Flat (Locked)</label>
                  <input type="text" value={"Flat " + user?.apartmentNumber} disabled className="block w-full px-4 py-2.5 bg-brand-gray-light/50 border border-brand-gray rounded-2xl text-sm text-gray-400 cursor-not-allowed font-medium" />
                </div>
                <div className="relative">
                  <label className={labelClass}>Gender</label>
                  <div className="relative">
                    <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className={selectClass}>
                      {GENDER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center"><ChevronDown className="w-4 h-4 text-gray-400" /></div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Date of Birth
                    {editAge !== null && (
                      <span className="ml-2 normal-case font-extrabold text-brand-primary">(Age {editAge})</span>
                    )}
                  </label>
                  <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-brand-gray/25">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60 select-none">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
                <button type="button" onClick={handleCancelEdit} disabled={saving} className="px-6 py-3 border border-brand-gray bg-white text-gray-500 hover:text-brand-primary hover:bg-brand-gray-light font-bold text-sm rounded-2xl transition-all cursor-pointer select-none">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="divide-y divide-brand-gray/25">
              <InfoRow icon={<User className="w-5 h-5 text-brand-primary" />} label="Full Name" value={user?.name} />
              <InfoRow icon={<Mail className="w-5 h-5 text-brand-primary" />} label="Email Address" value={user?.email} />
              <InfoRow icon={<Phone className="w-5 h-5 text-brand-primary" />} label="Phone Number" value={user?.phone} />
              <InfoRow icon={<Home className="w-5 h-5 text-brand-primary" />} label="Apartment / Flat Number" value={"Flat " + user?.apartmentNumber} />
              <InfoRow icon={<User className="w-5 h-5 text-indigo-500" />} label="Gender" value={genderLabel(user?.gender)} />
              <InfoRow icon={<Calendar className="w-5 h-5 text-brand-primary" />} label="Date of Birth" value={formatDobDisplay(user?.dateOfBirth)} />
              <InfoRow icon={<Calendar className="w-5 h-5 text-emerald-500" />} label="Age" value={profileAge !== null ? profileAge + " years old" : "N/A"} />
              <div className="flex items-center gap-4 py-4 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-brand-ivory flex items-center justify-center border border-brand-gray/30 shrink-0"><Calendar className="w-5 h-5 text-brand-primary" /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-bold text-brand-charcoal truncate">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Family Members Section */}
        <div className="bg-brand-card border border-brand-gray/40 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-extrabold text-brand-charcoal uppercase tracking-wider">Family Members</h3>
            <span className="text-xs text-gray-400 font-semibold">{familyMembers.length} {familyMembers.length === 1 ? "Member" : "Members"}</span>
          </div>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-primary" /></div>
          ) : familyMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="p-4 bg-brand-ivory rounded-2xl border border-brand-gray/30"><Users className="w-8 h-8 text-gray-300" /></div>
              <div>
                <p className="text-sm font-bold text-brand-charcoal">No family members added</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Click "Add Member" to register your family members.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((m) => {
                const mAge = m.dateOfBirth ? calculateAge(m.dateOfBirth) : null;
                return (
                  <div key={m.id} className="flex items-center gap-4 p-4 bg-brand-ivory/70 rounded-2xl border border-brand-gray/30 hover:border-brand-primary/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-base uppercase shrink-0 border border-brand-primary/15">{m.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-charcoal">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/15">{m.relation}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">{genderLabel(m.gender)}</span>
                        <span className="text-[10px] font-semibold text-gray-400">{mAge !== null ? "Age " + mAge : "Age N/A"}</span>
                        {m.dateOfBirth && <span className="text-[10px] text-gray-400 font-medium">DOB: {formatDobDisplay(m.dateOfBirth)}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteMember(m.id)} disabled={deletingMemberId === m.id} className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-0 bg-transparent disabled:opacity-50" title="Remove member">
                      {deletingMemberId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Support Note */}
        <div className="bg-brand-ivory border border-brand-gray/50 rounded-2xl p-4 flex gap-3 text-xs text-gray-500 leading-relaxed font-semibold">
          <ShieldAlert className="w-5 h-5 text-gray-400 shrink-0" />
          <p>For security reasons, updating registered flat numbers or society roles requires secretary verification. Please raise a maintenance request under the <strong className="text-brand-primary">"Other"</strong> category if you need flat details updated.</p>
        </div>

      </div>

      {/* ADD MEMBER MODAL � centered & scrollable */}
      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-hidden px-4 pt-8 pb-8 sm:pt-10 sm:pb-10">

          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-brand-charcoal/50 backdrop-blur-sm"
            onClick={() => setShowAddMemberModal(false)}
          />

          {/* Modal Card */}
          <div
            className="
        relative z-10
        w-full max-w-md
        bg-white
        rounded-3xl
        shadow-2xl
        border border-brand-gray/50
        flex flex-col
        animate-fade-in
        max-h-[calc(100vh-4rem)]
        sm:max-h-[calc(100vh-5rem)]
        overflow-hidden
      "
          >

            {/* Header */}
            <div
              className="
          flex items-center justify-between
          px-6 py-5
          border-b border-brand-gray/40
          bg-brand-primary/5
          rounded-t-3xl
          shrink-0
        "
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 rounded-xl">
                  <Heart className="w-5 h-5 text-brand-primary" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-brand-charcoal">
                    Add Family Member
                  </h2>

                  <p className="text-xs text-gray-400 font-medium">
                    Register a household member
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="
            p-2
            rounded-xl
            text-gray-400
            hover:bg-brand-gray-light
            hover:text-brand-charcoal
            transition-all
            cursor-pointer
            border-0
            bg-transparent
          "
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 min-h-0 overflow-visible">
              <form
                onSubmit={handleAddMember}
                className="p-6 space-y-4"
              >

                {/* Full Name */}
                <div>
                  <label className={labelClass}>
                    Full Name <span className="text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={memberForm.name}
                    onChange={(e) =>
                      setMemberForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    className={inputClass}
                    required
                  />
                </div>

                {/* Relation */}
                <div className="relative">
                  <label className={labelClass}>
                    Relation <span className="text-red-400">*</span>
                  </label>

                  <div className="relative">
                    <select
                      value={memberForm.relation}
                      onChange={(e) =>
                        setMemberForm((f) => ({
                          ...f,
                          relation: e.target.value,
                        }))
                      }
                      className={selectClass}
                      required
                    >
                      <option value="">Select relation</option>

                      {RELATION_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div className="relative">
                  <label className={labelClass}>
                    Gender
                  </label>

                  <div className="relative">
                    <select
                      value={memberForm.gender}
                      onChange={(e) =>
                        setMemberForm((f) => ({
                          ...f,
                          gender: e.target.value,
                        }))
                      }
                      className={selectClass}
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={labelClass}>
                    Date of Birth
                  </label>
                  <DatePicker
                    value={memberForm.dateOfBirth}
                    onChange={(dateVal) =>
                      setMemberForm((f) => ({
                        ...f,
                        dateOfBirth: dateVal,
                      }))
                    }
                    max={new Date().toISOString().split("T")[0]}
                    placeholder="DD-MM-YYYY"
                  />
                </div>

                {/* Calculated Age */}
                {memberFormAge !== null && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />

                    <p className="text-xs font-bold text-emerald-700">
                      Calculated Age:{" "}
                      <span className="text-emerald-600">
                        {memberFormAge} years old
                      </span>
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2 border-t border-brand-gray/25">

                  <button
                    type="submit"
                    disabled={savingMember}
                    className="
                flex-1
                flex items-center justify-center gap-2
                py-3 px-4
                bg-brand-primary
                hover:bg-brand-primary-light
                text-white
                font-bold text-sm
                rounded-2xl
                shadow-md
                transition-all
                cursor-pointer
                disabled:opacity-60
                select-none
              "
                  >
                    {savingMember ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Add Member
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    disabled={savingMember}
                    className="
                px-6 py-3
                border border-brand-gray
                bg-white
                text-gray-500
                hover:text-brand-primary
                hover:bg-brand-gray-light
                font-bold text-sm
                rounded-2xl
                transition-all
                cursor-pointer
                select-none
              "
                  >
                    Cancel
                  </button>

                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;


