import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import './ExportPanel.css';

const ExportPanel = () => {
  const [loading, setLoading] = useState('');
  const [shareLink, setShareLink] = useState(null);
  const toast = useToast();

  const handleExport = async (type) => {
    setLoading(type);
    try {
      if (type === 'pdf') {
        const response = await api.get('/export/pdf', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'GPA_Summary.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (type === 'excel') {
        const response = await api.get('/export/excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'GPA_Summary.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (type === 'share') {
        const response = await api.get('/export/share');
        setShareLink(response.data.shareLink);
        navigator.clipboard.writeText(response.data.shareLink);
        toast.success('Share link generated and copied to clipboard!');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}. Please try again.`);
    } finally {
      setLoading('');
      if (type !== 'share') {
        toast.success(`${type.toUpperCase()} report generated successfully!`);
      }
    }
  };

  return (
    <motion.div
      className="export-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="export-buttons">
        <motion.button
          className="export-btn pdf"
          onClick={() => handleExport('pdf')}
          disabled={loading !== ''}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading === 'pdf' ? (
            <span className="loading">Generating...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span>Export PDF</span>
            </>
          )}
        </motion.button>

        <motion.button
          className="export-btn excel"
          onClick={() => handleExport('excel')}
          disabled={loading !== ''}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading === 'excel' ? (
            <span className="loading">Generating...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              <span>Export Excel</span>
            </>
          )}
        </motion.button>

        <motion.button
          className="export-btn share"
          onClick={() => handleExport('share')}
          disabled={loading !== ''}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading === 'share' ? (
            <span className="loading">Generating...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <span>Get Share Link</span>
            </>
          )}
        </motion.button>
      </div>

      {shareLink && (
        <motion.div
          className="share-link-box"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p>Share link copied to clipboard:</p>
          <div className="link-container">
            <input type="text" value={shareLink} readOnly />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success('Link copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExportPanel;

