'use client';

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { HireTab } from "@/components/HireTab";
import { GetHiredTab } from "@/components/GetHiredTab";
import { LearningTab } from "@/components/LearningTab";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

type TabId = 'hire' | 'get-hired' | 'learning';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('hire');
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const tabs: { id: TabId; label: string }[] = [
    { id: 'hire', label: 'Get Hired' },
    { id: 'get-hired', label: 'Hire' },
    // { id: 'learning', label: 'Learning' },
  ];

  const handlePortfolioClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/profile');
    } else {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/profile` }
      });
    }
  };

  const tabNavigation = (
    <div className="w-full flex justify-center">
      <div className="inline-flex bg-[#161616]/20 p-1.5 rounded-full items-center shrink-0 border border-border/50 shadow-sm overflow-x-auto w-full max-w-fit justify-start md:justify-center backdrop-blur-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 md:px-8 py-2 md:py-2.5 text-sm md:text-base font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-[#ffffff]/4 text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={handlePortfolioClick}
          className="px-6 md:px-8 py-2 md:py-2.5 text-sm md:text-base font-semibold rounded-full transition-all duration-300 whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-muted/40"
        >
          My Portfolio
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tab Content takes full width and renders its own max-w contexts */}
      <div className="w-full flex justify-center">
        {activeTab === 'hire' && <HireTab tabs={tabNavigation} />}
        {activeTab === 'get-hired' && <GetHiredTab tabs={tabNavigation} />}
        {activeTab === 'learning' && <LearningTab />}
      </div>
    </div>
  );
}
