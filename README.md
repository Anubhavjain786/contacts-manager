# Contacts Manager

A modern, web-based contacts management application built with React, Tailwind CSS, and SQLite.

## Features

- 🔐 Simple username/password authentication
- 📇 Complete CRUD operations for contacts
- 🏷️ Tag-based organization
- 🔍 Search and filter functionality
- 💾 **SQLite database** stored in browser (IndexedDB)
- 📁 **Export database to `.db` file** - save a real SQLite file to your computer!
- 📤 Export contacts to CSV
- 🎨 Beautiful UI with Tailwind CSS
- 📱 Responsive design
- 🔒 100% local - no cloud, no servers

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Database**: SQLite (sql.js) with IndexedDB persistence
- **Export**: File System Access API for database export
- **Bundler**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A modern browser (Chrome, Edge, Firefox, Safari)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

4. **Database Storage**: 
   - Data is automatically saved to your browser's IndexedDB
   - Click **"Export DB"** button to save a `.db` file to your computer anytime
   - The exported file is a real SQLite database you can open with any SQLite tool!

### Default Login Credentials

- **Username**: admin
- **Password**: admin123

## Project Structure

```
contacts-manager/
├── src/
│   ├── components/
│   │   ├── Auth/          # Authentication components
│   │   ├── Contacts/      # Contact management components
│   │   └── UI/            # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── db/                # Database layer
│   ├── utils/             # Helper functions
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Features

### Contacts Management

- Add new contacts with name, email, phone, company, location, and tags
- Edit existing contacts
- Delete contacts with confirmation
- Search contacts by name, email, or company
- Filter contacts by tags

### Database

- **SQLite Database**: Real SQLite database running in your browser
- **IndexedDB Persistence**: All data automatically saved to browser storage
- **Export to .db File**: Click "Export DB" to save a real SQLite file to disk
  - Compatible with [DB Browser for SQLite](https://sqlitebrowser.org/)
  - Can be opened with any SQLite tool
  - Perfect for backups or sharing
- **Export to CSV**: Export contacts in CSV format for Excel/Google Sheets
- No external servers or cloud services
- 100% local and private

### Export Options

1. **Export DB** - Saves the entire SQLite database as a `.db` file
   - Use this for complete backups
   - Can re-import into other SQLite tools
   - Preserves all data structure

2. **Export CSV** - Exports contacts to CSV format
   - Use for importing to other contact managers
   - Compatible with Excel, Google Sheets, etc.
   - Human-readable format

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
