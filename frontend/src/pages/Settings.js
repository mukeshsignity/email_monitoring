import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Clock, Shield, Info } from 'lucide-react';
import AutoSyncControl from '../components/AutoSyncControl';
import GmailSyncButton from '../components/GmailSyncButton';

const Settings = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          System Settings
        </h1>
        <p style={{ color: '#6b7280' }}>
          Configure email monitoring and sync settings
        </p>
      </div>

      {/* Auto-Sync Settings */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} />
          Automatic Email Synchronization
        </h2>
        <AutoSyncControl />
      </div>

      {/* Gmail Integration Info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} />
            Gmail Integration Guide
          </h3>
        </div>
        <div className="card-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              How to Set Up Gmail Sync
            </h4>
            <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: '1.8' }}>
              <li>
                Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: '600' }}>Google App Passwords</a>
              </li>
              <li>Sign in to your Google account if prompted</li>
              <li>
                Select app: <strong>"Mail"</strong>, Select device: <strong>"Other (Custom name)"</strong>
              </li>
              <li>Enter a name like "Email Monitoring System"</li>
              <li>Click <strong>"Generate"</strong></li>
              <li>Copy the 16-character password (format: xxxx xxxx xxxx xxxx)</li>
              <li>Add this password to your team member profile</li>
            </ol>
          </div>

          <div style={{ 
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem'
          }}>
            <Info size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.125rem' }} />
            <div>
              <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: '600', marginBottom: '0.5rem' }}>
                Security Note
              </p>
              <p style={{ fontSize: '0.875rem', color: '#92400e', margin: 0 }}>
                App passwords are more secure than using your actual Gmail password. They can be revoked at any time without affecting your main account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Sync */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} />
            Manual Email Synchronization
          </h3>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: '1rem', color: '#374151' }}>
            Trigger an immediate sync of unread emails from all configured Gmail accounts.
          </p>
          <GmailSyncButton />
        </div>
      </div>

      {/* System Info */}
      <div className="card" style={{ marginTop: '1.5rem', background: '#f3f4f6' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} />
            System Information
          </h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ fontWeight: '600', color: '#6b7280' }}>Application:</div>
            <div style={{ color: '#374151' }}>Email Monitoring System</div>
            
            <div style={{ fontWeight: '600', color: '#6b7280' }}>Version:</div>
            <div style={{ color: '#374151' }}>1.0.0</div>
            
            <div style={{ fontWeight: '600', color: '#6b7280' }}>Email Protocol:</div>
            <div style={{ color: '#374151' }}>IMAP (Gmail)</div>
            
            <div style={{ fontWeight: '600', color: '#6b7280' }}>Sync Method:</div>
            <div style={{ color: '#374151' }}>Automatic & Manual</div>
            
            <div style={{ fontWeight: '600', color: '#6b7280' }}>Status:</div>
            <div style={{ color: '#10b981', fontWeight: '600' }}>✓ Operational</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;