"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/solid";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function ChatboxAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Dạ, em chào anh/chị. Em là trợ lý ảo của Fis. Em có thể hỗ trợ giải đáp các thông tin về giá phòng, giờ nhận/trả phòng, các tiện ích hoặc chính sách của khách sạn. Anh/chị cần em giúp gì ạ?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestDesc, setRequestDesc] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading, showForm]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || loading || showForm) return;

    const userText = inputVal;
    setInputVal("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      // Map history to match api requirements
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: history.slice(0, -1), // Exclude the greeting
        }),
      });

      if (!res.ok) throw new Error("API failed");

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      
      if (data.triggerForm) {
        setShowForm(true);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Dạ, hệ thống đang gặp gián đoạn kết nối. Anh/chị vui lòng thử lại sau giây lát hoặc liên hệ trực tiếp với chúng em qua hotline ạ.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Vui lòng điền đầy đủ họ tên và số điện thoại.");
      return;
    }
    setFormSubmitted(true);

    try {
      const res = await fetch("/api/chat/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          requestDetails: requestDesc,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send request");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Dạ, thông tin của anh/chị (${name} - ${phone}) đã được gửi trực tiếp tới bộ phận Chăm sóc khách hàng. Nhân viên tư vấn sẽ liên hệ lại hỗ trợ anh/chị ngay lập tức ạ!`,
        },
      ]);
      setShowForm(false);
      setName("");
      setPhone("");
      setRequestDesc("");
    } catch (err) {
      console.error("Form submit error:", err);
      alert("Dạ, hệ thống gửi yêu cầu đang bận. Anh/chị vui lòng thử lại sau giây lát hoặc liên hệ trực tiếp với chúng em qua hotline ạ.");
    } finally {
      setFormSubmitted(false);
    }
  };


  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[400px] h-[500px] sm:h-[550px] bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <RocketLaunchIcon className="w-5 h-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Fis Assistant</h4>
                <span className="text-xs text-white/80">Trợ lý ảo 24/7</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-all text-white/90 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950/20">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"}`}>
                    {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <RocketLaunchIcon className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-100 dark:border-neutral-700/30 rounded-tl-none shadow-sm"
                  }`}>
                    {msg.text.split("\n").map((line, lIdx) => (
                      <p key={lIdx}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center">
                    <RocketLaunchIcon className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-neutral-800 p-3 rounded-2xl rounded-tl-none border border-neutral-100 dark:border-neutral-700/30 shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Inline CSKH Form */}
            {showForm && (
              <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-md space-y-3">
                <h5 className="font-bold text-xs uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Gửi yêu cầu hỗ trợ (CSKH)
                </h5>
                <form onSubmit={handleFormSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Họ và tên *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nguyễn Văn A" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Số điện thoại *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0901234567" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase mb-1">Yêu cầu của bạn</label>
                    <textarea 
                      placeholder="Tôi muốn đặt phòng Deluxe hướng biển ngày mai..." 
                      value={requestDesc}
                      onChange={(e) => setRequestDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 rounded-xl focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      type="submit"
                      disabled={formSubmitted}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      {formSubmitted ? "Đang gửi..." : "Gửi thông tin"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center space-x-2 bg-white dark:bg-neutral-900"
          >
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={showForm ? "Vui lòng điền form phía trên..." : "Nhập câu hỏi của bạn..."}
              disabled={loading || showForm}
              className="flex-1 text-sm px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-950/20 focus:outline-none focus:border-blue-500 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400"
            />
            <button 
              type="submit"
              disabled={loading || showForm || !inputVal.trim()}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group relative"
      >
        {isOpen ? (
          <XMarkIcon className="w-7 h-7" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-7 h-7" />
        )}
        
        {/* Tooltip on hover */}
        {!isOpen && (
          <span className="absolute right-16 bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-md pointer-events-none">
            Trợ giúp trực tuyến 24/7
          </span>
        )}
      </button>
    </div>
  );
}
