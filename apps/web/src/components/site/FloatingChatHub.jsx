import React, { useState } from "react";
import AIAssistantWidget from "./AIAssistantWidget";
import ChatWidget from "./ChatWidget";

export default function FloatingChatHub() {
  const [activeTab, setActiveTab] = useState("ai"); // 'ai' | 'vendor'

  return (
    <div className="relative z-50">
      {activeTab === "ai" ? (
        <AIAssistantWidget onSwitchToVendorChat={() => setActiveTab("vendor")} />
      ) : (
        <ChatWidget onSwitchToAI={() => setActiveTab("ai")} />
      )}
    </div>
  );
}
