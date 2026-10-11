import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from './components';
import './ControlTower.css';

/**
 * CTShell — a simple context-free layout wrapper for all CT pages.
 */
export default function CTShell({ children, pendingOwnerCount = 0, totalBlocked = 0, onNewFloorClick, hideHeader = false }) {
  const navigate = useNavigate();
  return (
    <div className="ct-scope">
      <div className="app">
        {/* HEADER */}
        {!hideHeader && (
          <div className="hdr">
            <div className="brand">
              <div className="bicon">🗼</div>
              <div>
                <div className="btitle">Control Tower</div>
                <div className="bsub" style={{ color: '#D97706' }}>Phase 1 · Shop Floor Command</div>
              </div>
            </div>
            <div className="hright">
              <Clock />
              {/* {pendingOwnerCount > 0 && (
                <button className="hbtn owner" onClick={() => navigate('/control-tower/owner')}>
                  👑 Owner Queue <span className="badge">{pendingOwnerCount}</span>
                </button>
              )}
              {totalBlocked > 0 && (
                <button className="hbtn warn" onClick={() => navigate('/control-tower/pipeline')}>
                  ⛔ Blocked <span className="badge">{totalBlocked}</span>
                </button>
              )} */}
              {onNewFloorClick && (
                <button className="hbtn new-floor" onClick={onNewFloorClick}>+ New Floor</button>
              )}
            </div>
          </div>
        )}

        {/* PAGE CONTENT */}
        <div className="body">
          <div className="main">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
