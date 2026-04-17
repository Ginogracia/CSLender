'use client';
import Image from 'next/image';
import './globals.css'
import { useEffect, useState, useRef } from 'react';

const USERS = [
  { id: 'gino',   color: '#e060c0' },
  { id: 'pampas', color: '#5ba4f5' },
  { id: 'pulka',  color: '#3ecf6e' },
  { id: 'figor',  color: '#e8a827' },
];

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDays() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function cycle(cur) {
  if (!cur) return 'available';
  if (cur === 'available') return 'unavailable';
  return null;
}

function isFullSquad(data, key) {
  return USERS.every(u => (data[u.id] || {})[key] === 'available');
}

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('gino');
  const [data, setData] = useState({});
  const days = getDays();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  useEffect(() => {
    USERS.forEach(u => {
      fetch(`/api/availability?user=${u.id}`)
        .then(res => res.json())
        .then(res => {
          const map = {};
          res.forEach(item => { map[item.date] = item.status; });
          setData(prev => ({ ...prev, [u.id]: map }));
        });
    });
  }, []);

const pendingClicks = useRef({});

async function handleClick(day) {
  const key = day.toISOString().split('T')[0];

  // Ignore if this cell already has a request in flight
  if (pendingClicks.current[key]) return;
  pendingClicks.current[key] = true;

  const current = (data[selectedUser] || {})[key];
  const newState = cycle(current);

  setData(prev => {
    const updated = { ...prev[selectedUser] };
    if (newState === null) delete updated[key];
    else updated[key] = newState;
    return { ...prev, [selectedUser]: updated };
  });

  await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: selectedUser, date: key, status: newState }),
  });

  // Unlock after request finishes
  delete pendingClicks.current[key];
}

  const months = {};
  days.forEach(d => {
    const k = d.getFullYear() + '/' + d.getMonth();
    if (!months[k]) months[k] = {
      label: d.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
      days: [],
    };
    months[k].days.push(d);
  });

  return (
    <div className="wrap">
      <div className="header">
        <div className="wordmark">
          C
          <Image
            src="/cs-2-logo.png"
            alt="CS2"
            width={52}
            height={52}
            className="wordmark-img"
          />
          LENDER
        </div>
        <p>När blir det gibb?</p>
      </div>

      <div className="players">
        {USERS.map(u => (
          <div
            key={u.id}
            className={'pbtn' + (u.id === selectedUser ? ' on' : '')}
            style={{ color: u.id === selectedUser ? u.color : '' }}
            onClick={() => setSelectedUser(u.id)}
          >
            <div className="pip" style={{ background: u.color, opacity: u.id === selectedUser ? 1 : 0.4 }} />
            {u.id}
          </div>
        ))}
      </div>
      <div className="tutorial-box">
        <p>Börja med att klicka på ditt namn, sedan klicka en gång på dagarna du kan och två gånger på de du inte kan.</p>
      </div>

      {Object.values(months).map(m => {
        let dow = m.days[0].getDay(); dow = (dow + 6) % 7;
        const blanks = Array.from({ length: dow });

        return (
          <div key={m.label}>
            <div className="month-lbl">{m.label}</div>

            {/* ── Desktop grid ── */}
            <div className="wkrow">
              {['Mån','Tis','Ons','Tor','Fre','Lör','Sön'].map(w => (
                <div key={w} className="wk">{w}</div>
              ))}
            </div>
            <div className="grid">
              {blanks.map((_, i) => <div key={'e' + i} className="cell empty" />)}
              {m.days.map(day => {
                const key = day.toISOString().split('T')[0];
                const mySt = (data[selectedUser] || {})[key];
                const isToday = day.getTime() === today.getTime();
                return (
                  <div
                    key={key}
                    className={'cell' + (isToday ? ' today' : '') + (isFullSquad(data, key) ? ' full-squad' : '')}
                    style={{
                      background: mySt === 'available'
                        ? 'rgba(62,207,110,.08)'
                        : mySt === 'unavailable'
                        ? 'rgba(232,64,64,.07)'
                        : undefined,
                    }}
                    onClick={() => handleClick(day)}
                  >
                    <div
                      className="dnum"
                      style={{
                        color: mySt === 'available' ? '#6eedaa'
                          : mySt === 'unavailable' ? '#f07070'
                          : undefined,
                      }}
                    >
                      {day.getDate()}
                    </div>
                    <div className="dots">
                      {USERS.map(u => {
                        const st = (data[u.id] || {})[key];
                        return (
                          <div
                            key={u.id}
                            className={'udot' + (st === 'available' ? ' av' : st === 'unavailable' ? ' un' : '')}
                            style={{ background: u.color }}
                            title={`${u.id}: ${st || 'not set'}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Mobile list ── */}
            <div className="mobile-list">
              {m.days.map(day => {
                const key = day.toISOString().split('T')[0];
                const mySt = (data[selectedUser] || {})[key];
                const isToday = day.getTime() === today.getTime();
                return (
                  <div
                    key={'m' + key}
                    className={'mobile-row' + (isToday ? ' today' : '') + (isFullSquad(data, key) ? ' full-squad' : '')}
                    style={{
                      background: mySt === 'available'
                        ? 'rgba(62,207,110,.08)'
                        : mySt === 'unavailable'
                        ? 'rgba(232,64,64,.07)'
                        : undefined,
                    }}
                    onClick={() => handleClick(day)}
                  >
                    <div className="mobile-date">
                      <div className="mobile-daynum">{day.getDate()}</div>
                      <div className="mobile-weekday">{WEEKDAYS[day.getDay()]}</div>
                    </div>

                    <div className="mobile-divider" />

                    <div className="mobile-dots">
                      {USERS.map(u => {
                        const st = (data[u.id] || {})[key];
                        return (
                          <div key={u.id} className="mobile-user">
                            <div
                              className={'mobile-pip' + (st === 'available' ? ' av' : st === 'unavailable' ? ' un' : '')}
                              style={{ background: u.color }}
                            />
                            <span className="mobile-name" style={{ color: st === 'available' ? u.color : undefined }}>
                              {u.id}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <a className="gino-shoutout" target="_blank" href="https://ginogracia.se">Gino Gracia Baumkircher @2026</a>
    <Image
        src="/funnybebe.jpg"
        alt="CS2"
        width={50}
        height={50}
        className="easter-egg-img"
    />
    </div>
  );
}