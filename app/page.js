'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchUser = async (token) => {
    try {
      const response = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        await fetchUser(data.token);
        setLoginForm({ email: '', password: '' });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(noteForm)
      });

      const data = await response.json();

      if (response.ok) {
        setNoteForm({ title: '', content: '' });
        fetchNotes();
      } else {
        setError(data.message || data.error || 'Failed to create note');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${user.tenantSlug}/upgrade`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Upgraded to Pro plan!');
        fetchUser(token);
      } else {
        const data = await response.json();
        setError(data.error || 'Upgrade failed');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotes([]);
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Multi-Tenant Notes SaaS</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        <div style={{ marginTop: '20px', fontSize: '14px' }}>
          <p><strong>Test Accounts:</strong></p>
          <p>admin@acme.test / password</p>
          <p>user@acme.test / password</p>
          <p>admin@globex.test / password</p>
          <p>user@globex.test / password</p>
        </div>
      </div>
    );
  }

  const isFreePlan = user.tenantSlug && notes.length >= 3;
  const canUpgrade = user.role === 'admin' && isFreePlan;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Notes - {user.tenantSlug}</h1>
        <div>
          <span style={{ marginRight: '10px' }}>{user.email} ({user.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

      {canUpgrade && (
        <div style={{ backgroundColor: '#fff3cd', padding: '10px', marginBottom: '20px', border: '1px solid #ffeaa7' }}>
          <p>You've reached the 3-note limit for the Free plan.</p>
          <button onClick={handleUpgrade} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', border: 'none' }}>
            Upgrade to Pro
          </button>
        </div>
      )}

      <form onSubmit={handleCreateNote} style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px' }}>
        <h3>Create New Note</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Note title"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="Note content"
            value={noteForm.content}
            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
            required
            rows="4"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>Create Note</button>
      </form>

      <div>
        <h3>Your Notes ({notes.length})</h3>
        {notes.length === 0 ? (
          <p>No notes yet. Create your first note above!</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4>{note.title}</h4>
                  <p>{note.content}</p>
                  <small>Created by: {note.createdBy.email} on {new Date(note.createdAt).toLocaleDateString()}</small>
                </div>
                <button 
                  onClick={() => handleDeleteNote(note.id)}
                  style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', border: 'none' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}