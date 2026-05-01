import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Landing = () => {
  const { login } = useAuth();
  const { connectWallet, account, contract, hashAadhaar } = useWeb3();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [searchAadhaar, setSearchAadhaar] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login('admin@ledger.com', password);
    if (result.success) {
      toast.success("Welcome, Admin");
      navigate('/admin');
    } else {
      toast.error(result.message);
    }
  };

  const handleTrackBlood = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect MetaMask first.");
    
    setIsSearching(true);
    setSearchResult(null);
    const toastId = toast.loading("Querying Blockchain...");

    try {
      // Use hashing to find the packet
      const hashedId = hashAadhaar(searchAadhaar);
      const packet = await contract.getPacketByDonor(hashedId);
      
      const statusLabels = ["Active", "In Transit", "Consumed", "Discarded"];
      
      setSearchResult({
        trackingId: packet.trackingId,
        group: packet.bloodGroup,
        location: packet.location,
        organization: packet.organization,
        status: statusLabels[packet.status],
        isUsed: packet.status === 2,
        timestamp: new Date(Number(packet.timestamp) * 1000).toLocaleString()
      });
      
      toast.success("Found!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("No record found for this ID.", { id: toastId });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', overflowX: 'hidden' }}>
      <div className="bg-gradient-spot"></div>
      
      <div className="grid grid-cols-2 gap-8 items-center" style={{ minHeight: '60vh' }}>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge text="Blockchain Verified" icon={<ShieldCheck size={16} />} />
          <h1 className="mt-4 mb-4">
            Decentralized <br/><span className="text-gradient-red">Blood Tracking</span>
          </h1>
          <p className="text-secondary mb-8" style={{ fontSize: '1.2rem', maxWidth: '500px' }}>
            A secure ledger operated by Administrators to track the exact location and usage of your donated blood.
          </p>
          
          <div className="flex gap-4">
            {!account ? (
              <button className="btn btn-primary" onClick={connectWallet}>Connect MetaMask</button>
            ) : (
              <span className="badge badge-safe p-2">Wallet Connected</span>
            )}
            <a href="#track" className="btn btn-secondary">Track Now</a>
          </div>
        </motion.div>

        <motion.div 
          className="glass-panel" 
          style={{ padding: '2rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h3>Admin Portal Login</h3>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-4">
            <input 
              type="password" 
              className="input-field" 
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">Dashboard</button>
          </form>
        </motion.div>
      </div>

      <motion.div 
        id="track" 
        className="glass-card mt-8 mb-8" 
        style={{ padding: '3rem' }}
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <div className="text-center mb-8">
          <h2>Transparency Portal</h2>
          <p className="text-secondary">Query the EVM ledger with your Aadhaar.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-8">
          <form onSubmit={handleTrackBlood} className="flex flex-col justify-center gap-4">
            <input 
              className="input-field" 
              placeholder="Enter Aadhaar Number" 
              value={searchAadhaar}
              onChange={(e) => setSearchAadhaar(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-blue" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Trace Data'}
            </button>
          </form>

          {searchResult ? (
            <motion.div 
              className="glass-panel" 
              style={{ padding: '1.5rem', background: searchResult.isUsed ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h4>Asset: <span className="text-gradient-blue">{searchResult.trackingId}</span></h4>
                <span className={`badge ${searchResult.isUsed ? 'badge-unsafe' : 'badge-safe'}`}>
                  {searchResult.status}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                <p><strong>Blood Group:</strong> <span className="text-gradient-red font-bold">{searchResult.group}</span></p>
                <p><strong>Organization:</strong> {searchResult.organization}</p>
                <p className="flex items-center gap-2"><Search size={16}/> <strong>Location:</strong> {searchResult.location}</p>
                <p className="text-secondary text-sm">Last Update: {searchResult.timestamp}</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center flex-col text-muted">
              <Search size={48} opacity={0.3} className="mb-4" />
              <p>Results will appear here.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const Badge = ({ text, icon }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-secondary">
    {icon} {text}
  </div>
);

export default Landing;
