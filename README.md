# Gratitude Backend

## Setup

1. Copy `.env.example` to `.env` and fill the values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start server:
   ```bash
   npm run dev
   # or
   npm start
   ```

## Endpoints

- POST /api/upload        -- multipart form field 'image' to upload to Cloudinary
- POST /api/entries/add   -- { userId, date, text, imageUrl? } adds entry and updates streak
- POST /api/summary/generate -- { userId, month } returns AI summary (text only)

