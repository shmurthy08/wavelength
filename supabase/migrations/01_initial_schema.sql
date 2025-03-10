-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    bio TEXT
);

-- Create wavelengths table
CREATE TABLE public.wavelengths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    intensity FLOAT NOT NULL DEFAULT 0.5 CHECK (intensity >= 0 AND intensity <= 1),
    active_users_count INTEGER NOT NULL DEFAULT 0,
    creator_id UUID REFERENCES public.profiles(id)
);

-- Create user_wavelengths table
CREATE TABLE public.user_wavelengths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    wavelength_id UUID REFERENCES public.wavelengths(id) NOT NULL,
    tuned_in_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, wavelength_id)
);

-- Create posts table
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    wavelength_id UUID REFERENCES public.wavelengths(id) NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    location GEOGRAPHY(POINT)
);

-- Create indexes for better query performance
CREATE INDEX wavelength_active_users_idx ON public.wavelengths (active_users_count DESC);
CREATE INDEX wavelength_category_idx ON public.wavelengths (category);
CREATE INDEX wavelength_expiry_idx ON public.wavelengths (expires_at);
CREATE INDEX user_wavelength_active_idx ON public.user_wavelengths (user_id, active);
CREATE INDEX posts_wavelength_idx ON public.posts (wavelength_id, created_at DESC);

-- Function to get distinct categories
CREATE OR REPLACE FUNCTION get_distinct_categories()
RETURNS TABLE (category text) AS $$
BEGIN
  RETURN QUERY SELECT DISTINCT w.category FROM public.wavelengths w ORDER BY w.category;
END;
$$ LANGUAGE plpgsql;

-- Functions to increment and decrement active users count
CREATE OR REPLACE FUNCTION increment_active_users_count(wavelength_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.wavelengths
  SET active_users_count = active_users_count + 1
  WHERE id = wavelength_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_active_users_count(wavelength_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.wavelengths
  SET active_users_count = GREATEST(active_users_count - 1, 0)
  WHERE id = wavelength_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize profile after user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, created_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NULL, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();