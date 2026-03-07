'use client';

import React, { useEffect, useState } from 'react';
import { FreelanceBanner } from './FreelanceBanner';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { VibecoderProject, VibecoderProfile } from '@/types';
import { usePathname } from 'next/navigation';

export function FreelanceBannerWrapper() {
    const supabase = createSupabaseBrowserClient();
    const pathname = usePathname();
    const [profile, setProfile] = useState<VibecoderProfile | undefined>();
    const [projects, setProjects] = useState<VibecoderProject[]>([]);
    const [verificationStatus, setVerificationStatus] = useState<string>('none');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data: profileData } = await supabase
            .from('vibecoder_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileData) {
            setProfile(profileData as VibecoderProfile);
            setVerificationStatus(profileData.verification_status || 'none');

            const { data: projectsData } = await supabase
                .from('vibecoder_projects')
                .select('*')
                .eq('profile_id', user.id);

            if (projectsData) {
                setProjects(projectsData as VibecoderProject[]);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();

        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            loadData();
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (loading || !profile || (verificationStatus !== 'none' && verificationStatus !== 'pending') || pathname?.startsWith('/profile')) {
        return null;
    }

    return (
        <FreelanceBanner
            verificationStatus={verificationStatus}
            profile={profile}
            projects={projects}
            onApplicationSubmitted={loadData}
        />
    );
}
