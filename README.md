# Wavelength

A unique social media app aimed to reduce doomscrolling and embrace community and serendipity. Instead of following people as on traditional platforms, users "tune into" experience channels called "wavelengths" that are centered around activities, moments, and shared interests happening in real-time.

## Core Concept

Wavelength reimagines social connectivity by focusing on shared experiences rather than individual profiles. Users join "wavelengths" based on what they're currently experiencing, creating ephemeral communities around activities and moments.

### Key Differentiators

1. **Experience-Centered Design**
   - Content organized around activities rather than individuals
   - Examples: "Morning Coffee," "Coding Projects," "Weekend Hiking"

2. **Temporal Relevance**
   - Wavelengths have defined lifespans (hours, days, weeks)
   - Content remains contextually relevant and fresh
   - Reduces endless scrolling and content overload

3. **Depth Over Breadth**
   - Limited simultaneous wavelength participation
   - Quality interactions over quantity of connections

4. **Contextual Discovery**
   - Smart wavelength suggestions based on time, location, and interests
   - Serendipitous discovery of like-minded people

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account (free tier works fine)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/wavelength.git
   cd wavelength
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Supabase project and set up the database:
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor in your Supabase dashboard
   - Run the SQL scripts from `supabase/migrations` in order

4. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
wavelength/
├── README.md                     # Project overview
├── package.json                  # Dependencies and scripts
├── .env.local                    # For local environment variables
├── public/                       # Static assets
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── layout/               # Layout components
│   │   ├── wavelength/           # Wavelength-specific components
│   │   └── shared/               # Reusable components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility functions and API clients
│   │   └── supabase.js           # Supabase client initialization
│   ├── pages/                    # Page components
│   │   ├── Home.jsx
│   │   ├── Discover.jsx
│   │   ├── Profile.jsx
│   │   ├── WavelengthView.jsx
│   │   ├── CreateWavelength.jsx
│   │   ├── SignIn.jsx
│   │   └── SignUp.jsx
│   ├── context/                  # React context providers
│   ├── styles/                   # Global styles
│   ├── App.jsx                   # Main app component
│   └── main.jsx                  # Entry point
└── supabase/                     # Supabase configuration and migrations
```

## Database Schema

### Primary Tables

1. **wavelengths**
   - id (UUID, primary key)
   - name (string)
   - description (string)
   - category (string)
   - created_at (timestamp)
   - expires_at (timestamp)
   - intensity (float, 0-1)
   - active_users_count (integer)
   - creator_id (UUID, foreign key to profiles)

2. **profiles**
   - id (UUID, primary key, references auth.users)
   - username (string)
   - avatar_url (string)
   - created_at (timestamp)
   - bio (text)

3. **user_wavelengths**
   - id (UUID, primary key)
   - user_id (UUID, foreign key to profiles)
   - wavelength_id (UUID, foreign key to wavelengths)
   - tuned_in_at (timestamp)
   - active (boolean)

4. **posts** (Experience Capsules)
   - id (UUID, primary key)
   - user_id (UUID, foreign key to profiles)
   - wavelength_id (UUID, foreign key to wavelengths)
   - content (text)
   - media_url (string, optional)
   - created_at (timestamp)
   - location (geography, optional)

## Features

- User authentication (sign up, sign in)
- Create and discover wavelengths
- Tune in/out of wavelengths
- Post content to wavelengths
- Real-time updates
- Profile customization
- Temporal wavelength expiration

## Technical Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API + React Query
- **Backend & Database**: Supabase (Authentication, Database, Storage, Real-time)

## Development Roadmap

### Phase 1: Core Functionality (Current)
- Basic authentication
- Wavelength creation and discovery
- Posting in wavelengths
- Profile management

### Phase 2: Enhanced Features
- Media uploads for posts
- Notifications
- Advanced wavelength discovery algorithm
- Direct messaging between users in the same wavelength

### Phase 3: Mobile Optimization
- Progressive Web App (PWA) setup
- Responsive design improvements
- Touch gesture optimization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
