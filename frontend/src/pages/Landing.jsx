import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { Search, ShieldCheck } from 'lucide-react';

const Landing = () => {
  const { login } = useAuth();
  const { connectWallet, account, contract } = useWeb3();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [searchAadhaar, setSearchAadhaar] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login('admin@ledger.com', password);
    if (result.success) {
      navigate('/admin');
    } else {
      alert(result.message);
    }
  };

  const handleTrackBlood = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Please connect MetaMask first to fetch data from the Blockchain.");
    
    setIsSearching(true);
    setSearchResult(null);

    try {
      // Direct Aadhaar Lookup! Triggers our newly mapped function behind the scenes.
      const data = await contract.getBloodDetailsByAadhaar(searchAadhaar);
      
      const [trackingId, group, location, organization, isUsed, timestampStr] = data;
      
      setSearchResult({
        trackingId,
        group,
        location,
        organization,
        isUsed,
        timestamp: new Date(Number(timestampStr) * 1000).toLocaleString()
      });
      
    } catch (err) {
      console.error(err);
      alert("Error: Data not found. No active blood packets registered for this Aadhaar ID.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="bg-gradient-spot"></div>
      
      <div className="grid grid-cols-2 gap-8 items-center" style={{ minHeight: '60vh' }}>
        <div className="animate-fade-in">
          <Badge text="Blockchain Verified" icon={<ShieldCheck size={16} />} />
          <h1 className="mt-4 mb-4">
            Decentralized <br/><span className="text-gradient-red">Blood Tracking</span> System
          </h1>
          <p className="text-secondary mb-8" style={{ fontSize: '1.2rem', maxWidth: '500px' }}>
            A secure ledger operated by Administrators to track the exact location and usage of your donated blood, ensuring complete transparency and peace of mind.
          </p>
          
          <div className="flex gap-4">
            {!account ? (
              <button className="btn btn-primary" onClick={connectWallet}>
                Connect MetaMask
              </button>
            ) : (
              <span className="badge badge-safe p-2">Wallet Connected</span>
            )}
            <a href="#track" className="btn btn-secondary">Track Your Donation</a>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Admin Portal Login</h3>
          <p className="text-secondary mb-4">Secured access for authorized personnel to append ledger data.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-secondary" style={{ fontSize: '0.875rem' }}>Admin Password</label>
              <input 
                type="password" 
                className="input-field mt-2" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary mt-2 flex justify-center">Access Dashboard</button>
            <p className="text-muted text-center" style={{ fontSize: '0.75rem' }}>
              Hint for demo: password is 'admin'
            </p>
          </form>
        </div>
      </div>

      {/* Tracking Section */}
      <div id="track" className="glass-card mt-8 mb-8" style={{ padding: '3rem' }}>
        <div className="text-center mb-8">
          <h2>Donor Transparency Portal</h2>
          <p className="text-secondary">Directly query the EVM ledger securely with just your Aadhaar.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <form onSubmit={handleTrackBlood} className="flex flex-col flex-1 justify-center gap-4">
            <input 
              className="input-field" 
              placeholder="Enter your Aadhaar Number to Track" 
              value={searchAadhaar}
              onChange={(e) => setSearchAadhaar(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-blue" disabled={isSearching}>
              {isSearching ? 'Querying Ledger...' : 'Trace Data on Ledger'}
            </button>
          </form>

          {searchResult ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: searchResult.isUsed ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex justify-between items-center mb-4">
                <h4>Asset ID: <span className="text-gradient-blue">{searchResult.trackingId}</span></h4>
                {searchResult.isUsed ? (
                  <span className="badge badge-unsafe p-1.5 px-3">Status: Consumed/Used</span>
                ) : (
                  <span className="badge badge-safe p-1.5 px-3">Status: Active</span>
                )}
              </div>
              <div className="flex flex-col gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p><strong>Blood Group:</strong> <span className="text-gradient-red" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{searchResult.group}</span></p>
                <p><strong>Current Origin/Holder:</strong> {searchResult.organization}</p>
                <p className="flex gap-2 items-center"><Search size={16} color="var(--brand-secondary)"/> <strong>Geographic Location:</strong> {searchResult.location}</p>
                <p className="text-secondary text-sm">Last Block Update Timestamp: {searchResult.timestamp}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-col text-muted" style={{ height: '100%', minHeight: '200px' }}>
              <Search size={48} opacity={0.3} className="mb-4" />
              <p>Type Identity to automatically resolve Tracking Hash.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, icon }) => (
  <div style={{ 
    display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '0.85rem', 
    alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' 
  }}>
    {icon} {text}
  </div>
);

export default Landing;
