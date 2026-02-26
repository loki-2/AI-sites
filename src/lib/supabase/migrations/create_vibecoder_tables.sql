-- Create vibecoder_profiles table
CREATE TABLE IF NOT EXISTS public.vibecoder_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    social_url TEXT,
    badges JSONB DEFAULT '[]'::jsonb, -- Array of { name: 'Frontend', level: 'Expert' }
    total_projects INTEGER DEFAULT 0,
    shipped_projects INTEGER DEFAULT 0,
    in_progress_projects INTEGER DEFAULT 0,
    experiment_projects INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- set up RLS for vibecoder_profiles
ALTER TABLE public.vibecoder_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
    ON public.vibecoder_profiles FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own profile."
    ON public.vibecoder_profiles FOR INSERT
    WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
    ON public.vibecoder_profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vibecoder_profiles_updated_at
    BEFORE UPDATE ON public.vibecoder_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create vibecoder_projects table
CREATE TABLE IF NOT EXISTS public.vibecoder_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.vibecoder_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}'::text[], -- e.g., 'shipped', 'in progress', 'experiment'
    images TEXT[] DEFAULT '{}'::text[], -- Array of image URLs
    live_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- set up RLS for vibecoder_projects
ALTER TABLE public.vibecoder_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public projects are viewable by everyone."
    ON public.vibecoder_projects FOR SELECT
    USING ( true );

CREATE POLICY "Users can insert their own projects."
    ON public.vibecoder_projects FOR INSERT
    WITH CHECK ( auth.uid() = profile_id );

CREATE POLICY "Users can update own projects."
    ON public.vibecoder_projects FOR UPDATE
    USING ( auth.uid() = profile_id );

CREATE POLICY "Users can delete own projects."
    ON public.vibecoder_projects FOR DELETE
    USING ( auth.uid() = profile_id );

CREATE TRIGGER update_vibecoder_projects_updated_at
    BEFORE UPDATE ON public.vibecoder_projects
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- Trigger to update project counts in vibecoder_profiles on insert/update/delete/
CREATE OR REPLACE FUNCTION update_vibecoder_project_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.vibecoder_profiles
        SET 
            total_projects = total_projects + 1,
            shipped_projects = shipped_projects + (CASE WHEN 'shipped' = ANY(NEW.tags) THEN 1 ELSE 0 END),
            in_progress_projects = in_progress_projects + (CASE WHEN 'in progress' = ANY(NEW.tags) THEN 1 ELSE 0 END),
            experiment_projects = experiment_projects + (CASE WHEN 'experiment' = ANY(NEW.tags) THEN 1 ELSE 0 END)
        WHERE id = NEW.profile_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only if tags changed (simplified for basic tags adjustment or recalculation)
        UPDATE public.vibecoder_profiles
        SET 
            shipped_projects = (SELECT COUNT(*) FROM public.vibecoder_projects WHERE profile_id = NEW.profile_id AND 'shipped' = ANY(tags)),
            in_progress_projects = (SELECT COUNT(*) FROM public.vibecoder_projects WHERE profile_id = NEW.profile_id AND 'in progress' = ANY(tags)),
            experiment_projects = (SELECT COUNT(*) FROM public.vibecoder_projects WHERE profile_id = NEW.profile_id AND 'experiment' = ANY(tags))
        WHERE id = NEW.profile_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.vibecoder_profiles
        SET 
            total_projects = total_projects - 1,
            shipped_projects = shipped_projects - (CASE WHEN 'shipped' = ANY(OLD.tags) THEN 1 ELSE 0 END),
            in_progress_projects = in_progress_projects - (CASE WHEN 'in progress' = ANY(OLD.tags) THEN 1 ELSE 0 END),
            experiment_projects = experiment_projects - (CASE WHEN 'experiment' = ANY(OLD.tags) THEN 1 ELSE 0 END)
        WHERE id = OLD.profile_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.vibecoder_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_vibecoder_project_counts();


-- Storage Bucket for project images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project_images', 'project_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project_images
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'project_images' );

CREATE POLICY "Authenticated users can upload images" 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'project_images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own images" 
    ON storage.objects FOR UPDATE 
    USING ( bucket_id = 'project_images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own images" 
    ON storage.objects FOR DELETE 
    USING ( bucket_id = 'project_images' AND auth.uid() = owner );

-- Storage Bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Public Access Avatars" 
    ON storage.objects FOR SELECT 
    USING ( bucket_id = 'avatars' );

CREATE POLICY "Authenticated users can upload avatars" 
    ON storage.objects FOR INSERT 
    WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own avatars" 
    ON storage.objects FOR UPDATE 
    USING ( bucket_id = 'avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatars" 
    ON storage.objects FOR DELETE 
    USING ( bucket_id = 'avatars' AND auth.uid() = owner );

-- =========================================================================
-- UPDATE 3: Adding UX Profile fields
-- Adds the custom build tags and github linkage
-- =========================================================================
ALTER TABLE public.vibecoder_profiles
ADD COLUMN IF NOT EXISTS build_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS github_username TEXT;
