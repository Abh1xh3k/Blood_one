import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { PlusCircle, MapPin, Database, Save, ClipboardList, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { account, connectWallet, contract, hashAadhaar } = useWeb3();
  
  // States for Adding Donor
  const [trackingId, setTrackingId] = useState('');
  const [donorId, setDonorId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // States for Updating Usage
  const [updateTracker, setUpdateTracker] = useState('');
  const [location, setLocation] = useState('');
  const [organization, setOrganization] = useState('');
  const [isUsed, setIsUsed] = useState(false);

  // Local Storage State
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
    if (!contract) return toast.error("Connect MetaMask first!");
    if (!trackingId) return toast.error("Generate a Tracking ID.");
    
    const tid = toast.loading("Registering on Blockchain...");
    try {
      const donorHash = hashAadhaar(donorId);
      const metadataCID = "QmDemo123456789"; 
      const initLocation = "Central Vault";
      const initOrg = "LifeChain Central";

      const tx = await contract.registerPacket(
        trackingId, 
        donorHash, 
        bloodGroup, 
        initLocation, 
        initOrg, 
        metadataCID
      );
      await tx.wait();
      
      saveToLocalDb(donorId, trackingId, bloodGroup);
      toast.success("Donor registered!", { id: tid });
      setTrackingId('');
      setDonorId('');
    } catch (err) {
      console.error(err);
      toast.error("Transaction failed.", { id: tid });
    }
  };

  const handleUpdateUsage = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect MetaMask first!");

    const tid = toast.loading("Updating Ledger...");
    try {
      // 0=Active, 1=InTransit, 2=Consumed
      const status = isUsed ? 2 : 1; 
      const tx = await contract.updateLogistics(updateTracker, location, organization, status);
      await tx.wait();
      
      toast.success("Lifecycle updated!", { id: tid });
      setUpdateTracker('');
      setLocation('');
      setOrganization('');
      setIsUsed(false);
    } catch (err) {
      console.error(err);
      toast.error("Update failed.", { id: tid });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="flex justify-between items-center mb-8">
        <h2>Admin <span className="text-gradient-red">Control Center</span></h2>
        {!account ? (
          <button className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <span className="badge badge-safe p-2">Wallet Connected</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle color="var(--brand-primary)" />
            <h3>Register Blood Packet</h3>
          </div>
          <form onSubmit={handleAddDonor} className="flex flex-col gap-4">
            <input 
              className="input-field" 
              placeholder="Donor Aadhaar (will be hashed)"
              value={donorId}
              onChange={(e) => setDonorId(e.target.value)}
              required
            />
            <select 
              className="input-field"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="input-field flex-1" value={trackingId} readOnly placeholder="ID..."/>
              <button type="button" className="btn btn-secondary" onClick={generateTrackingId}>Gen</button>
            </div>
            <button type="submit" className="btn btn-primary mt-4">Execute Registration</button>
          </form>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-2 mb-6">
            <Database color="var(--brand-secondary)" />
            <h3>Logistics Update</h3>
          </div>
          <form onSubmit={handleUpdateUsage} className="flex flex-col gap-4">
            <input className="input-field" placeholder="Tracking ID" value={updateTracker} onChange={(e) => setUpdateTracker(e.target.value)} required/>
            <input className="input-field" placeholder="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} required/>
            <input className="input-field" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} required/>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
              <input type="checkbox" id="usedCheck" checked={isUsed} onChange={(e) => setIsUsed(e.target.checked)}/>
              <label htmlFor="usedCheck" className="text-danger cursor-pointer">Mark as Consumed</label>
            </div>
            <button type="submit" className="btn btn-blue mt-4">Update Lifecycle</button>
          </form>
        </div>
      </div>

      <div className="glass-panel p-6 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <ClipboardList color="var(--success)" />
            <h3>Admin Directory (Local)</h3>
          </div>
          
          {savedRecords.length === 0 ? (
            <p className="text-secondary text-center">No local records.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-secondary">
                    <th className="p-3">Aadhaar</th>
                    <th className="p-3">Tracking ID</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRecords.map((rec, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-3 font-mono">{rec.aadhaar}</td>
                      <td className="p-3 font-bold text-gradient-red">{rec.trackingId}</td>
                      <td className="p-3">{rec.group}</td>
                      <td className="p-3 text-secondary text-sm">{rec.date}</td>
                      <td className="p-3">
                        <button className="btn py-1 px-2 text-xs bg-white/10" onClick={() => {setUpdateTracker(rec.trackingId); window.scrollTo({ top: 0, behavior: 'smooth' });}}>Use</button>
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
