import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchUserById } from "../../reducer/userReducer";
import { useLoader } from "../../context/LoaderContext";

const Row = ({ label, value }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-200 last:border-0">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
);

const sectionIcons = {
    "Personal details": (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
    ),
    "Work Information": (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
    ),
    "Emergency & Reference": (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.45 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    "Notes": (
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
};

const SectionCard = ({ title, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden h-fit">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                {sectionIcons[title] && (
                    <span className="text-[#3535b0]">{sectionIcons[title]}</span>
                )}
                {title}
            </h3>
        </div>
        <div className="px-5 py-1 bg-white">{children}</div>
    </div>
);

const StatusBadge = ({ value }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${value ? "bg-green-100 text-green-700" : "bg-red-50 text-red-500"}`}>
        {value ? "Yes" : "No"}
    </span>
);

export default function UserProfile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoader();
    const [imgError, setImgError] = useState(false);

    const currentUser = useSelector((state) => state.auth.user);
    const { selectedUser: user, loading } = useSelector((state) => state.user);

    useEffect(() => {
        if (currentUser?.id) {
            const fetchProfile = async () => {
                showLoader();
                await dispatch(fetchUserById(currentUser.id));
                hideLoader();
            };
            fetchProfile();
        }
    }, [dispatch, currentUser?.id, showLoader, hideLoader]);

    if (!user) return null;

    const onBack = () => navigate(-1);

    const onEdit = () => {
        navigate(`/users/edit/${user.id}`);
    };

    return (
        <div className="min-h-screen bg-[#f0f2f7] font-sans">
            <div className="w-full px-6 py-6">

                {/* Back */}
                <div className="flex items-center justify-between mb-5">

                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-[#3535b0]">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </span>
                        User Profile
                    </h1>
                    {onBack && currentUser?.only_profile === false && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-[#3535b0] text-sm font-medium hover:opacity-75 transition-opacity"
                        >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Back
                        </button>
                    )}
                </div>


                {/* Profile Top Banner */}
                <div className="bg-white rounded-xl border border-gray-200 px-8 py-6 mb-5 relative overflow-hidden">
                    <div className="flex items-end justify-between gap-6 relative z-10">
                        <div className="flex items-end gap-5">
                            {/* Avatar */}
                            {user.image && !imgError ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    onError={() => setImgError(true)}
                                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-[#3535b0] flex items-center justify-center border-2 border-white shadow-md flex-shrink-0">
                                    <span className="text-xl font-bold text-white capitalize">
                                        {user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </span>
                                </div>
                            )}

                            {/* Name & email */}
                            <div className="pb-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                                </div>
                                <p className="text-sm text-gray-400">{user.username}</p>
                            </div>
                        </div>

                        {/* Edit Button */}
                        {(currentUser?.role.toLowerCase() === "admin executive" && currentUser?.only_profile === false) && (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3535b0] text-[#3535b0] text-sm font-semibold hover:bg-gray-100 hover:text-black transition-all duration-150 flex-shrink-0 mb-1"
                            >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Quick stats strip */}
                    <div className="flex flex-wrap gap-8 mt-5 pt-4 border-t border-gray-100">
                        {[
                            { label: "Employee ID", value: user.emp_id },
                            { label: "Department", value: user.department_id?.name || "-" },
                            { label: "Role", value: user.role?.name || user.role || "-" },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{s.label}</div>
                                <div className="text-sm font-semibold text-gray-800">{s.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-5">

                        {/* Personal Details */}
                        <SectionCard title="Personal details">
                            <Row label="Full name" value={user.name} />
                            <Row label="Date of Birth" value={user.dob} />
                            <Row label="Phone Number" value={user.phone_number} />
                            <Row label="Email" value={user.email || "-"} />
                        </SectionCard>

                        {/* Security Settings */}
                        {/* <SectionCard title="Security Settings">
                            <Row label="Username" value={`@${user.username}`} />
                            <Row
                                label="Password"
                                value={
                                    <span className="flex items-center gap-3">
                                        <span className="tracking-widest text-gray-400 text-base leading-none">••••••••••</span>
                                        <button className="text-xs text-[#3535b0] font-semibold hover:underline">Change</button>
                                    </span>
                                }
                            />
                        </SectionCard> */}

                        {/* Emergency & Reference */}
                        <SectionCard title="Emergency & Reference">
                            <Row label="Emergency Contact" value={user.emergency_number} />
                            <Row label="Reference Name" value={user.reference_name} />
                            {currentUser?.role.toLowerCase() === "admin executive" && currentUser?.only_profile === false && (
                                <Row label="Only Profile" value={<StatusBadge value={user.only_profile} />} />
                            )}
                        </SectionCard>


                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-5">

                        {/* Work Information */}
                        <SectionCard title="Work Information">
                            <Row label="Employee ID" value={user.emp_id} />
                            <Row label="Company" value={user.company_id?.company_name || "-"} />
                            <Row label="Work" value={user.work_id?.work_name || "-"} />
                            <Row label="Date of Joining" value={user.doj} />
                            <Row label="Is Head" value={<StatusBadge value={user.is_head} />} />
                            <Row label="Pricing Specialist" value={<StatusBadge value={user.is_pricing_specialist} />} />
                        </SectionCard>


                        {/* Notes */}
                        {currentUser?.role.toLowerCase() === "admin executive" && currentUser?.only_profile === false && (
                            <SectionCard title="Notes">
                                <div className="py-3 text-sm text-gray-600 leading-relaxed break-words">{user.notes || "-"}</div>
                            </SectionCard>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}