# Stock Controller

A modern, full-featured inventory management application built with Next.js, React, and TypeScript. Scan product barcodes, manage stock movements, track inventory levels, and monitor low-stock alerts in real-time.

## Features

- **📱 Barcode Scanning**: Scan or manually input product barcodes via camera or keyboard
- **📦 Stock Management**: Track inventory with stock in/out/adjustment movements
- **⚠️ Low Stock Alerts**: Real-time notifications when products fall below minimum stock levels
- **📊 Dashboard**: Visual overview of inventory status and recent activity
- **🔍 Product Details**: Comprehensive product information including pricing and stock history
- **📝 Activity Log**: Track all inventory movements and changes
- **🌓 Dark Mode**: Full dark mode support for comfortable use in any lighting
- **⚡ Offline Support**: Works offline with automatic sync when connection restored
- **🔄 Multi-Database Support**: Compatible with Firebase, Supabase, and Prisma/SQLite

## Tech Stack

- **Frontend**: Next.js 15+, React 18+, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: Lucide React icons
- **Database**: 
  - Prisma ORM
  - Firebase Realtime Database
  - Supabase PostgreSQL
- **State Management**: Zustand (app-store)
- **Notifications**: Sonner toast library
- **Utilities**: nanoid, date formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A modern browser with camera support (for barcode scanning)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Configure your database credentials (Firebase, Supabase, or SQLite).

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── api/                    # API routes
│   ├── products/          # Product endpoints
│   └── sync/              # Sync operations
├── components/            # Reusable React components
│   ├── scanner/           # Barcode scanner component
│   ├── stock/             # Stock-related components
│   └── ui/                # UI components (header, nav)
├── dashboard/             # Dashboard page
├── history/               # Activity history page
├── products/              # Product management pages
├── scan/                  # Main barcode scanning page
├── settings/              # Settings page
├── lib/                   # Utilities and services
│   ├── db.ts             # Database operations
│   ├── firebase.ts       # Firebase configuration
│   ├── supabase.ts       # Supabase configuration
│   ├── sync.ts           # Sync logic
│   └── utils.ts          # Utility functions
├── store/                # Zustand store
└── types/                # TypeScript type definitions
```

## Usage

### Scanning Products

1. Navigate to the **Scan** page
2. Allow camera access when prompted
3. Point camera at barcode, or switch to keyboard mode to paste
4. Once product is found, choose **Stock In**, **Stock Out**, or view details
5. Confirm the movement with quantity and optional notes

### Managing Products

- **View All**: Browse products on the Products page
- **Create**: Add new products manually or after scanning unknown barcode
- **Edit**: Update product details, pricing, and minimum stock levels
- **Delete**: Remove products from inventory

### Dashboard

- Quick overview of low-stock items
- Recent activity feed
- Stock movement summary
- Navigation to all key features

### Sync

Products and movements automatically sync with your database. Check the sync status and manual refresh available in settings.

## Development

### Building

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

### Database

#### Using Prisma (SQLite)
```bash
npx prisma migrate dev
npx prisma db seed
```

#### Using Firebase
Set up Firebase project and configure credentials in `lib/firebase.ts`

#### Using Supabase
Configure Supabase connection in `lib/supabase.ts`

## Key Components

### BarcodeScanner
Camera-based barcode scanning with real-time preview.

### StockMovementModal
Modal for recording stock in/out/adjustment movements with optional notes.

### ProductCard
Displays product information with quick action buttons.

### LowStockAlert
Highlights products below minimum stock threshold.

## API Routes

- `GET /api/products` - Fetch all products
- `GET /api/products/[id]` - Fetch product details
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/sync` - Trigger sync operation

## Troubleshooting

**Camera not working?**
- Check browser permissions
- Ensure HTTPS in production (required for camera access)
- Try keyboard input mode instead

**Barcode not scanning?**
- Ensure barcode is in focus and well-lit
- Try different barcode angles
- Use keyboard input mode to manually enter barcode

**Sync issues?**
- Check internet connection
- Verify database credentials
- Check browser console for errors

## Contributing

Contributions welcome! Please:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
