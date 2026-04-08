import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { PlusCircle, MapPin, Database, Save, ClipboardList, Copy } from 'lucide-react';

const AdminDashboard = () => {
  const { account, connectWallet, contract } = useWeb3();
  
  // States for Adding Donor
  const [trackingId, setTrackingId] = useState('');
  const [donorId, setDonorId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // States for Updating Usage
  const [updateTracker, setUpdateTracker] = useState('');
  const [location, setLocation] = useState('');
  const [organization, setOrganization] = useState('');
  const [isUsed, setIsUsed] = useState(false);

  // Local Storage State for preventing lost IDs
  const [savedRecords, setSavedRecords] = useState([]);

  useEffect(() => {
    const loaded = localStorage.getItem('lifeChainTrackingDb');
    if (loaded) {
      setSavedRecords(JSON.parse(loaded));
    }
  }, []);

  const saveToLocalDb = (aadhaar, trkId, group) => {
    const newRecord = { 
      aadhaar, 
      trackingId: trkId, 
      group, 
      date: new Date().toLocaleDateString() 
    };
    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    localStorage.setItem('lifeChainTrackingDb', JSON.stringify(updated));
  };

  const generateTrackingId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TRK-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTrackingId(result);
  };

  const handleAddDonor = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect MetaMask (Admin Wallet) first!");
    if (!trackingId) return alert("Please generate a Tracking ID first.");
    
    try {
      console.log(`Pushing Transaction: addDonor(${trackingId}, ${donorId}, ${bloodGroup})`);
      const tx = await contract.addDonor(trackingId, donorId, bloodGroup);
      await tx.wait();
      
      // Successfully pushed to blockchain, now save mapping locally!
      saveToLocalDb(donorId, trackingId, bloodGroup);

      alert(`Success! Donor linked securely to ledger. The Tracking ID has been saved locally.`);
      setTrackingId('');
      setDonorId('');
    } catch (err) {
      console.error(err);
      alert("Transaction failed! Ensure you are the assigned Admin wallet.");
    }
  };

  const handleUpdateUsage = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect MetaMask (Admin Wallet) first!");

    try {
      console.log(`Pushing Transaction: updateUsage(${updateTracker}, ${location}, ${organization}, ${isUsed})`);
      const tx = await contract.updateUsage(updateTracker, location, organization, isUsed);
      await tx.wait();
      
      alert(`Success! Blood usage lifecycle updated on un-alterable ledger.`);
      setUpdateTracker('');
      setLocation('');
      setOrganization('');
      setIsUsed(false);
    } catch (err) {
      console.error(err);
      alert("Transaction failed! Ensure Tracking ID is correct and you are the Admin.");
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="flex justify-between items-center mb-8">
        <h2>Admin <span className="text-gradient-red">Control Center</span></h2>
        {!account ? (
          <button className="btn btn-primary" onClick={connectWallet}>Connect MetaMask</button>
        ) : (
          <span className="badge badge-safe p-2">Admin Wallet Connected</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* ADD DONOR PANEL */}
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle color="var(--brand-primary)" />
            <h3>Register New Donor</h3>
          </div>
          <form onSubmit={handleAddDonor} className="flex flex-col gap-4">
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Donor Identity (Aadhaar / Public Key)</label>
              <input 
                className="input-field mt-1" 
                placeholder="e.g. 123456789012"
                value={donorId}
                onChange={(e) => setDonorId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Blood Group</label>
              <select 
                className="input-field mt-1"
                style={{ appearance: 'none', background: 'rgba(0,0,0,0.4)', color: 'white' }}
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Blockchain Tracking ID</label>
              <div className="flex gap-2 mt-1">
                <input 
                  className="input-field flex-1" 
                  value={trackingId}
                  readOnly
                  placeholder="Generate ID..."
                />
                <button type="button" className="btn btn-secondary" onClick={generateTrackingId}>Generate</button>
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary mt-4">Execute Smart Contract Entry</button>
          </form>
        </div>

        {/* UPDATE USAGE PANEL */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <Database color="var(--brand-secondary)" />
            <h3>Update Logistics Lifecycle</h3>
          </div>
          
          <form onSubmit={handleUpdateUsage} className="flex flex-col gap-4">
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Target Tracking ID</label>
              <input 
                className="input-field mt-1" 
                placeholder="TRK-XXXXXXXX"
                value={updateTracker}
                onChange={(e) => setUpdateTracker(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Current Entity / Organization</label>
              <input 
                className="input-field mt-1" 
                placeholder="e.g. City Central Hospital"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Geographic Location</label>
              <input 
                className="input-field mt-1" 
                placeholder="e.g. Block A, Ward 4, New Delhi"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2 mt-2 p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                id="usedCheck"
                checked={isUsed}
                onChange={(e) => setIsUsed(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="usedCheck" className="text-danger" style={{ cursor: 'pointer' }}>Mark Asset as Consumed / Used</label>
            </div>
            
            <button type="submit" className="btn btn-blue mt-4">Append to Ledger</button>
          </form>
        </div>
      </div>

      {/* LOCAL STORAGE DIRECTORY */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '4rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList color="var(--success)" />
            <h3>Local Tracking Directory</h3>
            <span className="badge badge-unverified ml-4" style={{ fontSize: '0.75rem' }}>Aadhaar ➔ Tracking ID DB</span>
          </div>
          
          {savedRecords.length === 0 ? (
            <p className="text-secondary text-center p-4">No records saved locally yet.</p>
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem' }}>Donor Aadhaar / Key</th>
                    <th style={{ padding: '0.75rem' }}>Tracking ID</th>
                    <th style={{ padding: '0.75rem' }}>Group</th>
                    <th style={{ padding: '0.75rem' }}>Date Registered</th>
                    <th style={{ padding: '0.75rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRecords.map((rec, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem' }} className="font-mono">{rec.aadhaar}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }} className="text-gradient-red">
                        <div className="flex items-center gap-2">
                          {rec.trackingId}
                          <button 
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                            onClick={() => {
                              navigator.clipboard.writeText(rec.trackingId);
                            }}
                            title="Copy Tracking ID"
                          >
                            <Copy size={16} color="var(--text-secondary)" />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{rec.group}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{rec.date}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }}
                          onClick={() => {
                            setUpdateTracker(rec.trackingId);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Use Tracker
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

export default AdminDashboard;
