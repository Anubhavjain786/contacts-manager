import { useState, useEffect } from 'react';
import { Plus, LogOut, Users, Download, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import database from '../../db/database';
import ContactCard from './ContactCard';
import ContactForm from './ContactForm';
import ContactFilters from './ContactFilters';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import Toast from '../UI/Toast';

const ContactList = () => {
  const { logout, user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery, selectedTag]);

  const loadContacts = async () => {
    try {
      const data = await database.getAllContacts();
      setContacts(data);
      
      // Extract all unique tags
      const tags = new Set();
      data.forEach(contact => {
        contact.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      showToast('Failed to load contacts', 'error');
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query)
      );
    }

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(contact =>
        contact.tags?.includes(selectedTag)
      );
    }

    setFilteredContacts(filtered);
  };

  const handleAddContact = async (contactData) => {
    try {
      await database.createContact(contactData);
      await loadContacts();
      setIsModalOpen(false);
      showToast('Contact added successfully', 'success');
    } catch (error) {
      showToast('Failed to add contact', 'error');
    }
  };

  const handleUpdateContact = async (contactData) => {
    try {
      await database.updateContact(editingContact.id, contactData);
      await loadContacts();
      setIsModalOpen(false);
      setEditingContact(null);
      showToast('Contact updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update contact', 'error');
    }
  };

  const handleDeleteContact = async (contact) => {
    setDeleteConfirm(contact);
  };

  const confirmDelete = async () => {
    try {
      await database.deleteContact(deleteConfirm.id);
      await loadContacts();
      setDeleteConfirm(null);
      showToast('Contact deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete contact', 'error');
    }
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const exportToCSV = () => {
    if (contacts.length === 0) {
      showToast('No contacts to export', 'info');
      return;
    }

    // CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Tags'];
    
    // CSV rows
    const rows = contacts.map(contact => [
      contact.name,
      contact.email || '',
      contact.phone || '',
      contact.company || '',
      contact.location || '',
      contact.tags?.join('; ') || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${contacts.length} contacts to CSV`, 'success');
  };

  const exportDatabaseFile = async () => {
    try {
      const success = await database.exportDatabaseFile();
      if (success) {
        showToast('Database exported successfully!', 'success');
      }
    } catch (error) {
      if (error.message.includes('not supported')) {
        showToast('File System API not supported in this browser', 'error');
      } else {
        showToast('Failed to export database', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contacts Manager</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={exportDatabaseFile}>
                <Database className="w-4 h-4 mr-2" />
                Export DB
              </Button>
              <Button variant="secondary" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats & Actions */}
        <div className="mb-8 flex justify-between items-center">
          <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Contacts</p>
            <p className="text-3xl font-bold text-primary-600">{contacts.length}</p>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <ContactFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={selectedTag}
            onTagSelect={setSelectedTag}
            allTags={allTags}
          />
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {contacts.length === 0
                ? 'Get started by adding your first contact'
                : 'Try adjusting your search or filters'}
            </p>
            {contacts.length === 0 && (
              <Button onClick={openAddModal}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={openEditModal}
                onDelete={handleDeleteContact}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingContact ? 'Edit Contact' : 'Add New Contact'}
      >
        <ContactForm
          contact={editingContact}
          onSubmit={editingContact ? handleUpdateContact : handleAddContact}
          onCancel={closeModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Contact"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={confirmDelete} className="flex-1">
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ContactList;
