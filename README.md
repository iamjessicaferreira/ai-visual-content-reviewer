# AI Visual Content Reviewer

A Next.js web application that analyzes uploaded images and provides structured AI feedback on visual content. Perfect for reviewing banners, social posts, landing pages, and product visuals.

## Features

- **Image Upload**: Drag & drop or click to upload images (PNG, JPG, WEBP)
- **Multiple Analysis Modes**:
  - **Marketing Feedback**: Evaluate messaging, value proposition, and marketing effectiveness
  - **UX / Landing Page Feedback**: Analyze user experience, navigation, and interface design
  - **Accessibility & Readability**: Check contrast, readability, and accessibility compliance
  - **Brand Analysis**: Evaluate brand consistency, visual identity, and brand messaging
  - **Color & Typography**: Analyze color psychology, typography choices, and visual hierarchy
  - **Social Media Optimization**: Optimize for social platforms, engagement, and shareability
  - **Conversion Optimization**: Focus on conversion rates, CTAs, and persuasive design elements
  - **Custom Prompt**: Write your own custom analysis prompt for specific needs
- **Structured Feedback**: Get organized results including:
  - Image description
  - Message clarity evaluation
  - Issues list
  - Actionable suggestions
  - Headline and CTA variations
- **Auto-Retry**: Automatically retries analysis if responses are incomplete or empty
- **Copy & Export**: Copy individual sections or export full results as JSON
- **Error Handling**: Graceful fallback chain (Gemini → Hugging Face → BLIP + Groq)
- **Progress Feedback**: Visual progress bar on the analyze button during processing

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, React Icons
- **Backend**: Next.js API Routes
- **AI Services**:
  - **Primary**: Google Gemini Vision API (gemini-1.5-flash, gemini-1.5-pro) - True vision-language model
  - **Fallback 1**: Hugging Face Inference API (captioning models)
  - **Fallback 2**: BLIP image captioning + Groq LLM for structured feedback
- **Deployment**: Vercel-ready (optimized for Vercel Pro plan with 60s timeout)

## Setup

### Prerequisites

- Node.js 18+ and npm
- **Recommended**: Google Gemini API key (best results for vision analysis)
- (Optional) Hugging Face API token for fallback
- (Optional) Groq API key for last-resort fallback

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vpl-project
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local` (see `.env.example` for the template with links to generate tokens):

### Getting API Keys

- **Google Gemini** (Highly Recommended - Best Vision Model):
  - Get your API key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
  - Free tier available with generous limits
  - This is the **primary recommended API** for vision analysis - it actually sees and analyzes images
  - Set `GEMINI_API_KEY` in your `.env.local`

- **Hugging Face** (Optional):
  - Get your token at [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
  - **Token Type**: Select "Read" token (simplest option) or "Fine-grained" token with "Make calls to Inference Providers" permission enabled
  - The "Read" token is sufficient for calling public models via Inference API
  - If you need custom endpoints or more control, use "Fine-grained" and enable "Make calls to Inference Providers"
  
- **Groq** (Optional - Last Fallback):
  - Get your API key at [https://console.groq.com/keys](https://console.groq.com/keys)
  - Only used as last resort when vision APIs fail (text-only, less accurate)

**Note**: 
- **Gemini is highly recommended** - it provides real image analysis, not generic responses
- The app will try Gemini first (primary), then Hugging Face, then Groq as fallback
- At minimum, set `GEMINI_API_KEY` for best results
- The app includes automatic retry logic if responses are incomplete or empty

See `.env.example` for the complete template with direct links to generate tokens.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## Deployment to Vercel

1. Push your code to GitHub, GitLab, or Bitbucket

2. Import your repository in [Vercel](https://vercel.com)

3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY` (highly recommended)
   - `HF_API_TOKEN` (optional)
   - `GROQ_API_KEY` (optional)

4. Deploy! Vercel will automatically build and deploy your app.

### Vercel Configuration

The app is configured for Vercel with:
- Node.js runtime (`export const runtime = 'nodejs'`)
- 60-second timeout (configured for Pro plan)
- Automatic API route handling
- Optimized timeouts: Gemini (20s), Hugging Face (15s), BLIP/Groq (10s)

**Note**: 
- On Vercel Hobby plan, the 10-second timeout may cause issues with AI API calls
- Consider upgrading to Pro plan (60s timeout) for better reliability
- The app includes automatic retry logic (up to 2 retries) for incomplete responses

## Usage

1. **Upload an Image**: Drag and drop or click to select an image file (PNG, JPG, WEBP up to 10MB)
2. **Select Analysis Mode**: Choose from 8 analysis modes or create a custom prompt
3. **Click Analyze**: Watch the progress bar fill as the AI processes your image
4. **Review Results**: Browse structured feedback in organized cards
5. **Copy or Export**: Use copy icons for individual sections or export full JSON
6. **Generate Prompt** (optional): Generate a code prompt based on analysis suggestions

## Project Structure

```
vpl-project/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       # API endpoint for image analysis
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main page
│   └── globals.css            # Global styles
├── components/
│   ├── ImageUploader.tsx      # Image upload component (drag & drop)
│   ├── ModeSelect.tsx         # Analysis mode selector (8 modes + custom)
│   ├── AnalyzeButton.tsx      # Analyze button with progress bar
│   └── ResultsPanel.tsx       # Results display component with copy/export
├── lib/
│   ├── ai/
│   │   ├── gemini.ts          # Google Gemini Vision API client (primary)
│   │   ├── huggingface.ts     # Hugging Face API client (fallback)
│   │   ├── groq.ts             # Groq API client (last fallback)
│   │   └── prompts.ts         # Mode-specific prompts
│   └── utils/
│       ├── image.ts           # Image processing utilities
│       ├── parser.ts          # AI response parser
│       └── result-checker.ts  # Validation for empty/incomplete responses
├── types/
│   └── analysis.ts            # TypeScript interfaces
└── README.md
```

## How It Works

1. **Image Upload**: User uploads an image via drag & drop or file picker
2. **API Processing** (with automatic retry):
   - Image is converted to base64
   - **Primary**: Sent to Google Gemini Vision API with mode-specific prompt
   - **Fallback 1**: If Gemini fails, try Hugging Face captioning models
   - **Fallback 2**: If both fail, image is captioned with BLIP, then sent to Groq LLM
3. **Response Validation**: System checks if response is complete and valid
4. **Auto-Retry**: If response is incomplete/empty, automatically retries (up to 2 times)
5. **Response Parsing**: AI response is parsed and normalized into structured schema
6. **Display**: Results are shown in organized cards with copy/export functionality

## Error Handling

The app includes comprehensive error handling:
- Image validation (type, size, max 10MB)
- API timeout handling (20s for Gemini, 15s for HF, 10s for BLIP/Groq)
- Graceful fallback chain (Gemini → Hugging Face → BLIP → Groq)
- Automatic retry for incomplete/empty responses (up to 2 retries)
- Detection of incomplete text (cut-off sentences, unclosed parentheses, etc.)
- Detection of "cannot see image" responses
- User-friendly error messages
- Network error recovery

## Limitations

- AI feedback may be imperfect - use as a starting point for review
- Free API endpoints have rate limits (Gemini free tier is generous)
- Large images (>10MB) are rejected
- Processing time depends on API response times (typically 5-15 seconds)
- Automatic retries may increase total processing time if responses are incomplete
- Vercel Hobby plan has 10s timeout limit (may cause issues)

## Troubleshooting

### "Failed to analyze image"
- Check your internet connection
- Verify API keys are set correctly (if using)
- Try again - APIs may be temporarily unavailable
- Check browser console for detailed error messages

### Slow responses
- API endpoints may be experiencing high load
- Consider adding API keys for better rate limits
- Check Vercel function timeout settings

### Build errors
- Ensure Node.js 18+ is installed
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run build`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
