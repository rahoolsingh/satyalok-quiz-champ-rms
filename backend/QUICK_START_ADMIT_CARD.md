# 🚀 Quick Start: Admit Card PDF Testing

## Step 1: Start the Backend Server

```bash
cd quiz-champ/backend
npm run dev
```

Wait for these messages:
- `✅ Test routes enabled at /api/test`
- `✅ Static files served from /public`
- `✅ Test UI available at http://localhost:3001/test-admit-card.html`

## Step 2: Open the Test Page

Simply open your browser and go to:

```
http://localhost:3001/test-admit-card.html
```

Or use command line:

```bash
# macOS
open http://localhost:3001/test-admit-card.html

# Linux
xdg-open http://localhost:3001/test-admit-card.html

# Windows
start http://localhost:3001/test-admit-card.html
```

## Step 3: Generate Your First PDF

Click the **"📄 Generate Sample PDF"** button. A PDF will download automatically!

## That's It! 🎉

Now you can:
- ✅ Click "Generate Sample PDF" for quick testing
- ✅ Fill the form for custom data (already prefilled!)
- ✅ Edit JSON directly for advanced testing
- ✅ Modify `src/services/admitCardPdf.ts` to change styling
- ✅ Edit `src/test-data/sample-admit-card.json` for default data

## Testing Workflow

1. Make changes to `src/services/admitCardPdf.ts`
2. Save the file (server will auto-reload)
3. Refresh the test page in browser
4. Click "Generate Sample PDF"
5. View the PDF
6. Repeat!

## API Endpoints

All test endpoints are at `http://localhost:3001/api/test/`:

- `GET /admit-card` - Generate with sample data
- `POST /admit-card` - Generate with custom JSON
- `GET /admit-card/sample` - Get sample JSON structure

## Need Help?

See `ADMIT_CARD_TESTING.md` for detailed documentation.
