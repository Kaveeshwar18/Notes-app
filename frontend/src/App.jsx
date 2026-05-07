import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, LogOut, Users, FileText, Image as ImageIcon, Trash2, Edit3, Save, X, ShieldAlert, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = 'http://127.0.0.1:8000';

// --- COMPONENTS ---

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/" />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/notes" />;
  
  return children;
};

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';

    try {
      const { data } = await axios.post(`${API_URL}${endpoint}`, { email, password });
      
      if (isLogin) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        toast.success('Logged in successfully!');
        navigate(data.role === 'admin' ? '/admin/dashboard' : '/notes');
      } else {
        toast.success('Signup successful! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 relative">
        <div className="flex flex-col items-center justify-center mb-6">
          <FileText className="text-blue-600 mb-2" size={40} />
          <h1 className="text-2xl font-bold text-gray-800">Notes App</h1>
        </div>
        <h2 className="text-xl font-medium text-center mb-8 text-gray-600">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="block w-full text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col hidden md:flex">
      <div className="flex items-center gap-2 mb-8">
        <FileText className="text-blue-600" size={28} />
        <span className="text-xl font-bold text-gray-800">Notes App</span>
      </div>

      <nav className="flex-1 space-y-2">
        <Link
          to="/notes"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <FileText size={20} />
          My Notes
        </Link>

        {role === 'admin' && (
          <Link
            to="/admin/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Users size={20} />
            User Mgmt
          </Link>
        )}
      </nav>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition font-medium mt-auto"
      >
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
};

const NotesDashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null });
  const [noteFile, setNoteFile] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/notes`, authHeaders);
      setNotes(data);
    } catch (err) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('title', currentNote.title);
    formData.append('content', currentNote.content);
    if (noteFile) formData.append('file', noteFile);

    try {
      if (currentNote.id) {
        await axios.put(`${API_URL}/notes/${currentNote.id}`, formData, authHeaders);
        toast.success('Note updated!');
      } else {
        await axios.post(`${API_URL}/notes`, formData, authHeaders);
        toast.success('Note created!');
      }
      setShowNoteForm(false);
      setCurrentNote({ title: '', content: '', id: null });
      setNoteFile(null);
      fetchNotes();
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await axios.delete(`${API_URL}/notes/${id}`, authHeaders);
      toast.success('Note deleted');
      fetchNotes();
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Notes</h1>
        <button
          onClick={() => {
            setCurrentNote({ title: '', content: '', id: null });
            setShowNoteForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {showNoteForm && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          <form onSubmit={handleSaveNote} className="space-y-4">
            <input
              type="text"
              placeholder="Note Title"
              required
              className="w-full text-xl font-semibold border-b border-gray-200 pb-2 focus:outline-none focus:border-blue-500 bg-transparent"
              value={currentNote.title}
              onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
            />
            <textarea
              placeholder="Write something amazing..."
              required
              rows="4"
              className="w-full border-none focus:outline-none resize-none bg-transparent"
              value={currentNote.content}
              onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
            />
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <label className="cursor-pointer text-gray-500 hover:text-blue-600 flex items-center gap-2 transition">
                <ImageIcon size={20} />
                <span className="text-sm font-medium">{noteFile ? noteFile.name : 'Add Image'}</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setNoteFile(e.target.files[0])}
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />} Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-blue-500">
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              {note.image && (
                <img
                  src={`${API_URL}/${note.image}`}
                  alt={note.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{note.title}</h3>
                <p className="text-gray-600 whitespace-pre-wrap mb-4">{note.content}</p>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => {
                      setCurrentNote({ title: note.title, content: note.content, id: note._id });
                      setShowNoteForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {notes.length === 0 && !showNoteForm && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">No notes yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUserId, setEditUserId] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/auth/users`, authHeaders);
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateUserRole = async (id, newRole) => {
    try {
      await axios.put(`${API_URL}/auth/users/${id}`, { role: newRole }, authHeaders);
      toast.success('User updated successfully');
      setEditUserId(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user and all their notes?')) return;
    try {
      await axios.delete(`${API_URL}/auth/users/${id}`, authHeaders);
      toast.success('User and notes deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div className="flex-1 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">User Management</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20 text-blue-500">
          <Loader2 size={40} className="animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Created At</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-800">{u.email}</td>
                  <td className="p-4">
                    {editUserId === u._id ? (
                      <select
                        className="border border-gray-300 rounded p-1"
                        defaultValue={u.role}
                        onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button
                      onClick={() => setEditUserId(editUserId === u._id ? null : u._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title={editUserId === u._id ? "Cancel Edit" : "Edit Role"}
                    >
                      {editUserId === u._id ? <X size={18} /> : <Edit3 size={18} />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete User & Notes"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<AuthForm />} />
        
        {/* Protected Application Layout */}
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <NotesDashboard />
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <AdminDashboard />
              </div>
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
