import { useState } from 'react';
import Input from '../UI/Input';
import Button from '../UI/Button';
import TagInput from '../UI/TagInput';

const ContactForm = ({ contact, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    company: contact?.company || '',
    location: contact?.location || '',
    tags: contact?.tags || [],
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        type="text"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="John Doe"
        required
        error={errors.name}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="john@example.com"
        error={errors.email}
      />

      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        placeholder="+1 234 567 8900"
      />

      <Input
        label="Company"
        type="text"
        value={formData.company}
        onChange={(e) => handleChange('company', e.target.value)}
        placeholder="Acme Inc."
      />

      <Input
        label="Location"
        type="text"
        value={formData.location}
        onChange={(e) => handleChange('location', e.target.value)}
        placeholder="New York, USA"
      />

      <TagInput
        tags={formData.tags}
        onChange={(tags) => handleChange('tags', tags)}
        placeholder="Add tags (press Enter)"
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          {contact ? 'Update Contact' : 'Add Contact'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
