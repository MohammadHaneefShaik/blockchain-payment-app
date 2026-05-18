import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const navigate = useNavigate();

    return (
        <div className="page settings-page">
            <div className="page-header"><h1>Settings</h1><p>App preferences</p></div>

            <div className="profile-sections">
                <div className="profile-section">
                    <h3>Network</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-label">Blockchain</span>
                            <span className="info-value">Polygon Amoy Testnet</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Chain ID</span>
                            <span className="info-value">80002</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Currency</span>
                            <span className="info-value">POL (Test)</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Explorer</span>
                            <a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer" className="info-value link-value">
                                amoy.polygonscan.com ↗
                            </a>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>About BlockPay</h3>
                    <div className="info-rows">
                        <div className="info-row">
                            <span className="info-label">Version</span>
                            <span className="info-value">2.0.0</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Architecture</span>
                            <span className="info-value">Server-side Signing</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Wallet</span>
                            <span className="info-value">Auto-managed (No MetaMask)</span>
                        </div>
                    </div>
                </div>

                <div className="profile-section">
                    <h3>Data</h3>
                    <button className="btn-secondary full-width" onClick={() => {
                        if (confirm('Clear cached data?')) {
                            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                            alert('Cache cleared!');
                        }
                    }}>
                        Clear Cache
                    </button>
                </div>
            </div>
        </div>
    );
}
