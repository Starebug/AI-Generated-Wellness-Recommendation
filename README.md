# AI-Generated Wellness Recommendation Board

A personalized wellness recommendation application that uses AI to generate health tips based on user profile (age, gender, and wellness goals). Users can explore tips, view detailed guidance, and save their favorite recommendations.

## 1. Project Setup & Demo

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API Key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "AI-Generated Wellness Recommendation"
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

6. Preview production build:
```bash
npm run preview
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Demo Flow
1. **Profile Capture** (`/`): User enters age, selects gender, and chooses a wellness goal
2. **Tips Board** (`/board`): Displays 5 AI-generated wellness tips as scrollable cards
3. **Tip Detail** (`/board/:tipId`): Shows detailed explanation and step-by-step advice for a selected tip
4. **Saved Tips** (`/board/saved`): Displays all saved tips in a grid layout

## 2. Problem Understanding

### Problem Statement
Create a personalized wellness recommendation board that:
- Captures user profile (age, gender, wellness goal)
- Generates 5 personalized health tips using AI
- Displays tips as scrollable cards with icons and titles
- Provides detailed explanations and step-by-step advice on tap
- Allows users to save favorite tips and persist them locally

### Assumptions Made
1. **Single Goal Selection**: Users can only select one wellness goal at a time for focused recommendations
2. **Age Range**: Age validation is set between 10-80 years for appropriate content generation
3. **Local Storage**: All user data (profile, saved tips, cached tips) is stored in browser localStorage for persistence across sessions
4. **API Response Format**: Gemini API returns valid JSON arrays/objects that can be parsed directly
5. **Responsive Design**: Application is optimized for mobile, tablet, and desktop viewports
6. **Offline Capability**: Cached tips and details are available even without network connection (from localStorage)

## 3. AI Prompts & Iterations

### Initial Prompt Structure

**For Tips Generation:**
```
You are a wellness coach.
Generate exactly 5 concise wellness tips focused on the goal: "{goalLabel}" for a person who is {age} years old.
Make the tips age-appropriate and relevant to their life stage.
Return ONLY a valid JSON array (no markdown, no extra text) with 5 objects of this shape:
{ "id": "kebab-case-id", "icon": "single emoji", "title": "short title <= 40 chars", "category": "1-2 word category", "duration": "very short duration label" }.
```

**For Tip Details:**
```
You are a practical wellness coach.
The user is {age} years old and selected the wellness goal "{goalLabel}" and the tip titled "{tipTitle}".
Provide age-appropriate guidance and step-by-step advice suitable for their age.
Return ONLY a JSON object (no markdown, no extra text) with:
{ "description": "1 short paragraph, max 120 words", "steps": ["5 concrete numbered steps, each <= 20 words"] }.
```

### Issues Faced & Solutions

1. **Issue**: API sometimes returned markdown code blocks instead of raw JSON
   - **Solution**: Added `extractJsonBlock()` function to strip markdown fences and extract JSON

2. **Issue**: Empty or invalid icon strings from API
   - **Solution**: Implemented `safeIcon()` helper function with fallback to 💡 emoji

3. **Issue**: API response format inconsistencies
   - **Solution**: Added comprehensive error handling and JSON parsing validation

4. **Issue**: Network failures and API errors
   - **Solution**: Implemented retry logic with `withRetry()` helper function (retries once on failure)

5. **Issue**: Age not being used in initial prompts
   - **Solution**: Added age parameter to both tips and detail generation prompts for age-appropriate content

### Refined Prompts

The prompts were refined to:
- Explicitly request JSON format (no markdown)
- Include age parameter for personalized recommendations
- Specify exact response structure and constraints
- Request age-appropriate content for different life stages

## 4. Architecture & Code Structure

### Navigation Management
- **`App.tsx`**: Main application component that manages routing using React Router
  - Routes defined: `/` (ProfileCapture), `/board` (TipsBoard), `/board/saved` (SavedTipsBoard), `/board/:tipId` (TipDetail)
  - Wraps application with `SavedTipsProvider` for global state management

### Component Structure

#### `ProfileCapture.tsx`
- Handles user profile input (age, gender, wellness goal)
- Validates age range (10-80 years)
- Allows single wellness goal selection
- Persists profile to localStorage on completion
- Navigates to `/board` after profile submission

#### `TipsBoard.tsx`
- Main board component displaying AI-generated tips
- Handles both list view (`/board`) and detail view (`/board/:tipId`)
- Fetches tips from Gemini API with caching in localStorage
- Implements horizontal scrollable card layout
- Includes "Regenerate Tips" functionality
- Provides logout functionality to clear all data

#### `SavedTipsBoard.tsx`
- Displays saved tips in a responsive grid layout
- Loads tip data from localStorage cache
- Allows navigation to tip details on card click

#### `TipDetailView` (within TipsBoard.tsx)
- Presentational component for detailed tip information
- Shows description and step-by-step advice
- Includes save/unsave functionality
- Handles loading and error states

### State Management

**React Context API** (`SavedTipsContext.tsx`):
- Manages global state for saved tips
- Provides `saveTip()`, `removeTip()`, and `isTipSaved()` functions
- Persists saved tips to localStorage
- Used across TipsBoard and SavedTipsBoard components

**Local Component State**:
- Each component manages its own local state using React hooks (`useState`, `useEffect`)
- Profile data stored in localStorage
- Tips and tip details cached in localStorage for performance

### AI Service Integration

**API Calls** (within `TipsBoard.tsx`):
- `fetchGeminiTips()`: Generates 5 wellness tips based on goal and age
- `fetchGeminiDetail()`: Generates detailed explanation for a specific tip
- Both functions include:
  - Retry logic for network failures
  - Comprehensive error handling
  - JSON parsing and validation
  - Response caching in localStorage

**Caching Strategy**:
- Tips list cached with key: `tips:{goalLabel}:{age}`
- Tip details cached with key: `tipDetail:{goalLabel}:{tipId}:{age}`
- Cache persists across sessions using localStorage
- Cache can be cleared via "Regenerate Tips" or logout

### Data Persistence

**localStorage Keys**:
- `wellnessProfile`: User profile data (age, gender, goals)
- `wellnessSavedTips`: Array of saved tip IDs with metadata
- `tips:{goalLabel}:{age}`: Cached tips list
- `tipDetail:{goalLabel}:{tipId}:{age}`: Cached tip details

## 5. Features & Functionality

### Core Features
- ✅ Profile capture with age, gender, and wellness goal selection
- ✅ AI-generated personalized wellness tips (5 tips per goal)
- ✅ Age-appropriate content generation
- ✅ Scrollable tip cards with icons and categories
- ✅ Detailed tip explanations with step-by-step guidance
- ✅ Save/unsave favorite tips
- ✅ Saved tips board with grid layout
- ✅ Regenerate tips functionality
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Logout functionality (clears all data)

### UI/UX Enhancements
- Modern, clean design with Tailwind CSS
- Smooth transitions and hover effects
- Loading states for async operations
- Error handling with retry options
- Responsive typography and spacing
- Accessible focus states and keyboard navigation

## 6. Known Issues / Improvements

### Known Issues
- **Icon Display**: Some tips may show fallback icon (💡) if API returns invalid emoji
- **Cache Invalidation**: Cached tips persist even after profile changes (requires manual regeneration)
- **Error Recovery**: Limited error recovery beyond single retry attempt

### Planned Improvements

1. **Dynamic Prompt Attributes**
   - Implement a system to randomly include additional attributes in AI prompts
   - Attributes could include: time of day, weather, activity level, dietary preferences, health conditions
   - These attributes would dynamically change the AI response to be more contextual
   - Example: "Generate tips for morning routine" or "Tips for rainy day wellness"

2. **Enhanced Personalization**
   - Multi-goal selection support
   - User preferences and history tracking
   - Personalized tip recommendations based on saved tips

3. **Performance Optimizations**
   - Implement service worker for offline functionality
   - Add pagination for large tip lists
   - Optimize image loading and caching

4. **User Experience**
   - Add tip sharing functionality
   - Implement tip search and filtering
   - Add progress tracking for wellness goals
   - Dark mode support

5. **Data Management**
   - Export/import saved tips
   - Cloud sync for saved tips across devices
   - Tip history and analytics

## 7. Bonus Work

### Additional Features Implemented

1. **Comprehensive Error Handling**
   - Network error detection and user-friendly messages
   - API error handling with specific error messages
   - JSON parsing validation
   - Graceful fallbacks for all error scenarios

2. **Retry Logic**
   - Automatic retry mechanism for failed API calls
   - Configurable retry attempts and delays
   - Improves reliability for transient network issues

3. **Responsive Design**
   - Mobile-first approach with breakpoints for all screen sizes
   - Adaptive layouts for different viewports
   - Touch-friendly interactions on mobile devices
   - Optimized horizontal scrolling for tip cards

4. **Performance Optimizations**
   - localStorage caching to reduce API calls
   - Efficient state management with React Context
   - Lazy loading considerations for future scalability

5. **Accessibility**
   - Semantic HTML structure
   - ARIA labels for screen readers
   - Keyboard navigation support
   - Focus visible states

6. **Code Quality**
   - TypeScript for type safety
   - ESLint configuration for code quality
   - Modular component structure
   - Reusable utility functions

## Technology Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.10.0
- **Styling**: Tailwind CSS 4.1.17
- **AI Integration**: Google Gemini API (gemini-2.5-flash model)
- **State Management**: React Context API
- **Storage**: Browser localStorage

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Note**: The `.env` file is already included in `.gitignore` to prevent committing sensitive API keys.

## License

This project is private and proprietary.
