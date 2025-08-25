import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Edit, 
  Key, 
  User,
  UserCog,
  ShieldCheck,
  X,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import axios from 'axios';

interface UserAccount {
  _id: string;
  username: string;
  email: string;
  role: string;
  userType: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  employeeId?: string;
  department?: string;
  designation?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface CollegeManagementProps {
  darkMode: boolean;
}

const CollegeManagement: React.FC<CollegeManagementProps> = ({ darkMode }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, userTypeFilter, departmentFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch admins
      const adminResponse = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch faculty
      const facultyResponse = await axios.get('http://localhost:5000/api/admin/faculty', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 } // Get all faculty
      });

      const admins = adminResponse.data.users?.map((user: any, index: number) => ({
        ...user,
        userType: 'admin',
        fullName: user.username,
        department: user.department || ['Finance', 'Student Management', 'Academic Affairs', 'Administration'][index % 4],
        designation: user.designation || 'Admin'
      })) || [];

      const faculty = facultyResponse.data.faculty?.map((fac: any) => ({
        ...fac,
        userType: 'faculty',
        department: fac.department || 'General'
      })) || [];

      let allUsers = [...admins, ...faculty];

      // Apply filters
      if (searchTerm) {
        allUsers = allUsers.filter(user => 
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (userTypeFilter !== 'all') {
        allUsers = allUsers.filter(user => user.userType === userTypeFilter);
      }

      if (departmentFilter !== 'all') {
        allUsers = allUsers.filter(user => user.department === departmentFilter);
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      let endpoint, payload;
      
      if (selectedUser.userType === 'admin') {
        endpoint = 'http://localhost:5000/api/auth/change-password';
        payload = {
          userId: selectedUser._id,
          newPassword
        };
      } else {
        endpoint = 'http://localhost:5000/api/auth/change-password';
        payload = {
          userId: selectedUser._id,
          userType: selectedUser.userType,
          newPassword
        };
      }

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        alert('Password updated successfully!');
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.message || 'Error changing password');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!selectedUser || !newUsername) return;

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      let endpoint, payload;
      
      if (selectedUser.userType === 'admin') {
        endpoint = 'http://localhost:5000/api/auth/change-username';
        payload = {
          userId: selectedUser._id,
          newUsername,
          oldUsername: selectedUser.username
        };
      } else {
        endpoint = 'http://localhost:5000/api/auth/change-username';
        payload = {
          userId: selectedUser._id,
          userType: selectedUser.userType,
          newUsername,
          oldUsername: selectedUser.username
        };
      }

      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowUsernameModal(false);
        setSelectedUser(null);
        setNewUsername('');
        alert('Username updated successfully!');
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error changing username:', error);
      alert(error.response?.data?.message || 'Error changing username');
    } finally {
      setUpdating(false);
    }
  };

  const openPasswordModal = (user: UserAccount) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const openUsernameModal = (user: UserAccount) => {
    setSelectedUser(user);
    setNewUsername(user.username);
    setShowUsernameModal(true);
  };

  const getRoleIcon = (role: string, userType: string) => {
    if (userType === 'admin') return <ShieldCheck className="w-4 h-4 text-red-500" />;
    if (role === 'hod') return <UserCog className="w-4 h-4 text-purple-500" />;
    return <User className="w-4 h-4 text-blue-500" />;
  };

  const getRoleBadge = (role: string, userType: string) => {
    if (userType === 'admin') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Admin</span>;
    }
    
    if (role === 'hod') {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">HOD</span>;
    }
    
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Faculty</span>;
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="w-8 h-8 mr-3 text-blue-500" />
          College Management
        </h1>
        <p className="text-gray-500 mt-1">Manage usernames and passwords for faculty and admin accounts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Users</option>
            <option value="admin">Admins</option>
            <option value="faculty">Faculty</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Departments</option>
            <option value="Finance">Finance</option>
            <option value="Student Management">Student Management</option>
            <option value="Academic Affairs">Academic Affairs</option>
            <option value="Administration">Administration</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-lg shadow-lg overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type & Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <motion.tr
                    key={`${user.userType}-${user._id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.fullName ? user.fullName[0] : user.username[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{user.fullName || user.username}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          {user.employeeId && (
                            <div className="text-xs text-gray-400">{user.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role, user.userType)}
                        {getRoleBadge(user.role, user.userType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : user.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openUsernameModal(user)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          title="Change Username"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Username</span>
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                          <span className="hidden sm:inline">Password</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <Key className="w-6 h-6 mr-2 text-green-500" />
                  Change Password
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Changing password for:
                </p>
                <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {selectedUser.fullName ? selectedUser.fullName[0] : selectedUser.username[0]}
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser.fullName || selectedUser.username}</div>
                    <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    minLength={6}
                    className={`w-full px-3 py-2 border rounded-lg pr-10 ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!newPassword || newPassword.length < 6 || updating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Username Modal */}
      <AnimatePresence>
        {showUsernameModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 max-w-md w-full`}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <Edit className="w-6 h-6 mr-2 text-blue-500" />
                  Change Username
                </h2>
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Changing username for:
                </p>
                <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {selectedUser.fullName ? selectedUser.fullName[0] : selectedUser.username[0]}
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser.fullName || selectedUser.username}</div>
                    <div className="text-sm text-gray-500">Current: @{selectedUser.username}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                  placeholder="Enter new username"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Username should be lowercase and unique
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowUsernameModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeUsername}
                  disabled={!newUsername || newUsername === selectedUser.username || updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Username</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollegeManagement;
