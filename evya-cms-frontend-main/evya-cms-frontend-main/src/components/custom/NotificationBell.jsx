import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BellIcon } from "@radix-ui/react-icons";
import { fetchOpenIssuesCount } from '@/store/reducers/issues/issuesSlice';
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const issues = useSelector((state) => state.issues.list);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
const openIssues=useSelector((state) => state.issues.openIssuesCount);
  // const openIssues = issues.filter(
  //   (issue) => issue.status !== 'Resolved' && issue.status !== 'Closed'
  // );
console.log(openIssues)
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  const handleIssueClick = (issue) => {
    navigate(`/issues/${issue.id}`, { state: { issue } });
    setIsOpen(false);
  };

  useEffect(() => {
    dispatch(fetchOpenIssuesCount());
    const interval = setInterval(() => {
      dispatch(fetchOpenIssuesCount());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-5 w-5" />
        {openIssues.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {openIssues.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-2 max-h-64 overflow-y-auto z-50 border border-gray-200">
          {openIssues.length === 0 ? (
            <div className="text-gray-500 text-sm p-2">No open issues</div>
          ) : (
            openIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => handleIssueClick(issue)}
              >
                <div className="font-semibold text-sm">{issue.ticketId}</div>
                <div className="text-xs text-gray-600 truncate">{issue.issue}</div>
                <Badge 
                  variant={
                    issue.status === 'Open' ? 'destructive' :
                    issue.status === 'In Progress' ? 'warning' : 'default'
                  }
                  className="mt-1 text-xs"
                >
                  {issue.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}