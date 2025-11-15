# Contacts Manager

A modern, web-based contacts management application built with React, Tailwind CSS, and SQLite.

## Features

- 🔐 Simple username/password authentication
- 📇 Complete CRUD operations for contacts
- 🏷️ Tag-based organization
- 🔍 Search and filter functionality
- 💾 Local SQLite database (no cloud, no servers)
- 🎨 Beautiful UI with Tailwind CSS
- 📱 Responsive design

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Database**: SQLite (sql.js)
- **Bundler**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm

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

- All data stored locally in browser using IndexedDB
- No external servers or cloud services required
- Automatic persistence

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
