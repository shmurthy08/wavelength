-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wavelengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wavelengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Only the owner can update their profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Wavelengths policies
-- Anyone can view wavelengths
CREATE POLICY "Wavelengths are viewable by everyone" ON public.wavelengths
  FOR SELECT USING (true);

-- Only authenticated users can create wavelengths
CREATE POLICY "Authenticated users can create wavelengths" ON public.wavelengths
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the creator can update or delete their wavelengths
CREATE POLICY "Users can update their own wavelengths" ON public.wavelengths
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own wavelengths" ON public.wavelengths
  FOR DELETE USING (auth.uid() = creator_id);

-- User Wavelengths policies
-- Users can view all user-wavelength relationships
CREATE POLICY "User wavelengths are viewable by everyone" ON public.user_wavelengths
  FOR SELECT USING (true);

-- Users can only manipulate their own tuned-in status
CREATE POLICY "Users can manage their own tuned-in status" ON public.user_wavelengths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tuned-in status" ON public.user_wavelengths
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tuned-in status" ON public.user_wavelengths
  FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
-- Anyone can view posts
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

-- Only authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the author can update or delete their posts
CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);