import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock,
  MapPin,
  Users,
  Filter,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

interface TimetableProps {
  darkMode: boolean;
  facultyId: string;
}

interface TimetableSlot {
  _id: string;
  subject: string;
  subjectCode: string;
  semester: number;
  branch: string;
  section: string;
  day: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  classType: string;
}

interface GroupedTimetable {
  Monday: TimetableSlot[];
  Tuesday: TimetableSlot[];
  Wednesday: TimetableSlot[];
  Thursday: TimetableSlot[];
  Friday: TimetableSlot[];
  Saturday: TimetableSlot[];
}

const FacultyTimetable: React.FC<TimetableProps> = ({ darkMode, facultyId }) => {
  const [timetable, setTimetable] = useState<GroupedTimetable>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: '',
    branch: ''
  });

  useEffect(() => {
    fetchTimetable();
  }, [facultyId, filters]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.branch) params.append('branch', filters.branch);

      const response = await axios.get(
        `http://localhost:5000/api/faculty-dashboard/timetable/${facultyId}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setTimetable(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '9:00-9:50',
    '9:50-10:40',
    '11:00-11:50',
    '11:50-12:40',
    '1:30-2:20',
    '2:20-3:10',
    '3:30-4:20',
    '4:20-5:10'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getSlotForTime = (day: string, timeSlot: string) => {
    const daySlots = timetable[day as keyof GroupedTimetable] || [];
    return daySlots.find(slot => {
      const slotTime = `${slot.startTime}-${slot.endTime}`;
      return slotTime === timeSlot;
    });
  };

  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case 'Lecture': return 'from-blue-500 to-blue-600';
      case 'Tutorial': return 'from-green-500 to-green-600';
      case 'Practical': return 'from-purple-500 to-purple-600';
      case 'Lab': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Weekly Timetable
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Your class schedule for the current academic year
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filters.semester}
                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
            
            <select
              value={filters.branch}
              onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
              className={`px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">All Branches</option>
              <option value="CSE">Computer Science</option>
              <option value="ECE">Electronics</option>
              <option value="ME">Mechanical</option>
              <option value="CE">Civil</option>
              <option value="EEE">Electrical</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Timetable Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-4 py-4 text-left text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} min-w-[120px]`}>
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className={`px-4 py-4 text-center text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} min-w-[160px]`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {timeSlots.map((timeSlot, index) => (
                <tr key={timeSlot} className={index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')}>
                  <td className={`px-4 py-4 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{timeSlot}</span>
                    </div>
                  </td>
                  {days.map(day => {
                    const slot = getSlotForTime(day, timeSlot);
                    return (
                      <td key={`${day}-${timeSlot}`} className="px-2 py-2">
                        {slot ? (
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${getClassTypeColor(slot.classType)} text-white text-xs`}>
                            <div className="font-semibold truncate">{slot.subject}</div>
                            <div className="opacity-90 mt-1">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{slot.semester} {slot.branch} - {slot.section}</span>
                              </div>
                              <div className="flex items-center space-x-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>{slot.roomNumber}</span>
                              </div>
                            </div>
                            <div className="text-xs opacity-75 mt-1">{slot.classType}</div>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-lg border-2 border-dashed ${darkMode ? 'border-gray-600' : 'border-gray-300'} text-center`}>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Class Types
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { type: 'Lecture', color: 'from-blue-500 to-blue-600' },
            { type: 'Tutorial', color: 'from-green-500 to-green-600' },
            { type: 'Practical', color: 'from-purple-500 to-purple-600' },
            { type: 'Lab', color: 'from-orange-500 to-orange-600' }
          ].map(({ type, color }) => (
            <div key={type} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded bg-gradient-to-r ${color}`}></div>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{type}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FacultyTimetable;
