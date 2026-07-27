"use client";

import React, { useState, useEffect } from "react";
import Label from "@/components/Label";
import Avatar from "@/shared/Avatar";
import ButtonPrimary from "@/shared/ButtonPrimary";
import Input from "@/shared/Input";
import Select from "@/shared/Select";
import Textarea from "@/shared/Textarea";
import { useAuth } from "@/lib/auth-context";

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  
  // State for form fields
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("Male");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [aboutYou, setAboutYou] = useState("");

  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state with user data from context
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      
      // Additional metadata fields (from user_metadata)
      setGender((user as any).gender || "Male");
      setUsername((user as any).username || "");
      setDob((user as any).date_of_birth || "");
      setAddress((user as any).address || "");
      setAboutYou((user as any).about_you || "");
    }
  }, [user]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          gender,
          username,
          date_of_birth: dob,
          address,
          about_you: aboutYou,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Cập nhật thông tin thất bại.");
      }

      const data = await res.json();
      
      // Update global user state in AuthContext
      updateUser(data.user);
      
      setSuccessMsg("Cập nhật thông tin tài khoản thành công!");
    } catch (err: any) {
      console.error("Update profile error:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi kết nối khi cập nhật.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADING */}
      <h2 className="text-3xl font-semibold">Account information</h2>
      <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>
      
      {successMsg && (
        <div className="p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm">
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex-shrink-0 flex items-start">
          <div className="relative rounded-full overflow-hidden flex">
            <Avatar sizeClass="w-32 h-32" userName={fullName} />
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-neutral-50 cursor-pointer">
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.5 5H7.5C6.83696 5 6.20107 5.26339 5.73223 5.73223C5.26339 6.20107 5 6.83696 5 7.5V20M5 20V22.5C5 23.163 5.26339 23.7989 5.73223 24.2678C6.20107 24.7366 6.83696 25 7.5 25H22.5C23.163 25 23.7989 24.7366 24.2678 24.2678C24.7366 23.7989 25 23.163 25 22.5V17.5M5 20L10.7325 14.2675C11.2013 13.7988 11.8371 13.5355 12.5 13.5355C13.1629 13.5355 13.7987 13.7988 14.2675 14.2675L17.5 17.5M25 12.5V17.5M25 17.5L23.0175 15.5175C22.5487 15.0488 21.9129 14.7855 21.25 14.7855C20.5871 14.7855 19.9513 15.0488 19.4825 15.5175L17.5 17.5M17.5 17.5L20 20M22.5 5H27.5M25 2.5V7.5M17.5 10H17.5125"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="mt-1 text-xs">Change Image</span>
            </div>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
        <div className="flex-grow mt-10 md:mt-0 md:pl-16 max-w-3xl space-y-6">
          <div>
            <Label>Name</Label>
            <Input 
              className="mt-1.5" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {/* ---- */}
          <div>
            <Label>Gender</Label>
            <Select 
              className="mt-1.5"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          {/* ---- */}
          <div>
            <Label>Username</Label>
            <Input 
              className="mt-1.5" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {/* ---- */}
          <div>
            <Label>Email</Label>
            <Input 
              className="mt-1.5" 
              value={email}
              disabled
              readOnly
            />
          </div>
          {/* ---- */}
          <div className="max-w-lg">
            <Label>Date of birth</Label>
            <Input 
              className="mt-1.5" 
              type="date" 
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          {/* ---- */}
          <div>
            <Label>Address</Label>
            <Input 
              className="mt-1.5" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          {/* ---- */}
          <div>
            <Label>Phone number</Label>
            <Input 
              className="mt-1.5" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {/* ---- */}
          <div>
            <Label>About you</Label>
            <Textarea 
              className="mt-1.5" 
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <ButtonPrimary 
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Update info"}
            </ButtonPrimary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
