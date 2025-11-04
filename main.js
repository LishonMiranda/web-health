
// --- Component Imports ---
import './family-health.js';
import './babymate.js';
import './senior-mode.js';
import './hydration-tracker.js';
import './diet-suggestions.js';
import './prescription-gallery.js';


class MainDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                /* Inherit CSS variables from document theme */

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    grid-auto-rows: 160px;
                    gap: 1.25rem;
                    opacity: 0;
                    transform: translateY(20px);
                    animation: contentAppear 0.8s ease-out 0.2s forwards;
                }

                @keyframes contentAppear {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dashboard-card {
                    background: var(--accent-color);
                    border-radius: var(--border-radius-main);
                    padding: 1.5rem;
                    display: flex; /* Centering content */
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    cursor: pointer;
                    border: 1px solid var(--primary-color);
                    box-shadow: 0 4px 20px var(--shadow-color-dark);
                    transition: transform 0.3s, box-shadow 0.3s, filter 0.2s;
                }

                .dashboard-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 8px 25px var(--shadow-color-dark), 0 0 15px var(--glow-color);
                    filter: brightness(1.02);
                }

                .dashboard-card h3 {
                    font-family: var(--font-family-headings);
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--font-color);
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                /* Varied layout: make some cards wider/taller on larger screens */
                @media (min-width: 900px) {
                    .dashboard-card--wide { grid-column: span 2; }
                    .dashboard-card--tall { grid-row: span 2; }
                    .dashboard-card--feature { grid-column: span 2; grid-row: span 2; }
                }

                /* Modal Styles */
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1001;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background-color: rgba(0,0,0,0.6);
                    backdrop-filter: blur(5px);
                    animation: fadeInModal 0.5s ease-out;
                }

                @keyframes fadeInModal {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-content {
                    font-family: var(--font-family-body);
                    background: var(--bg-color);
                    border: 1px solid var(--primary-color);
                    margin: 10% auto;
                    padding: 2rem;
                    width: 90%;
                    max-width: 600px;
                    border-radius: var(--border-radius-main);
                    box-shadow: 0 8px 32px 0 var(--shadow-color-dark);
                    position: relative;
                    animation: slideInModal 0.5s ease-out;
                }

                .modal-content h2 {
                    font-family: var(--font-family-headings);
                }
                
                @keyframes slideInModal {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .close {
                    color: var(--font-color-dark);
                    position: absolute;
                    top: 1rem;
                    right: 1.5rem;
                    font-size: 2rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: color 0.3s, transform 0.3s;
                }

                .close:hover, .close:focus {
                    color: var(--secondary-color);
                    transform: scale(1.2);
                    text-decoration: none;
                }
            </style>

            <div class="dashboard-grid">
                 <div class="dashboard-card dashboard-card--feature" data-feature="family-health">
                    <h3>Family Health</h3>
                </div>
                <div class="dashboard-card" data-feature="babymate">
                    <h3>BabyMate</h3>
                </div>
                <div class="dashboard-card dashboard-card--wide" data-feature="senior-mode">
                    <h3>Senior Mode</h3>
                </div>
                <div class="dashboard-card dashboard-card--tall" data-feature="hydration-tracker">
                    <h3>Hydration Tracker</h3>
                </div>
                <div class="dashboard-card" data-feature="diet-suggestions">
                    <h3>Diet Suggestions</h3>
                </div>
                <div class="dashboard-card dashboard-card--wide" data-feature="sleep-stress-notes">
                    <h3>Sleep & Stress Notes</h3>
                </div>
                <div class="dashboard-card" data-feature="quick-log">
                    <h3>Quick Log</h3>
                </div>
                <div class="dashboard-card" data-feature="health-tips">
                    <h3>Health Tips</h3>
                </div>
                <div class="dashboard-card dashboard-card--tall" data-feature="first-aid">
                    <h3>First Aid</h3>
                </div>
                <div class="dashboard-card" data-feature="emergency-sos">
                    <h3>Emergency SOS</h3>
                </div>
                <div class="dashboard-card dashboard-card--wide" data-feature="prescription-gallery">
                    <h3>Prescription Gallery</h3>
                </div>
            </div>

            <div id="feature-modal" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div id="feature-content"></div>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector('.dashboard-grid').addEventListener('click', (e) => {
            const card = e.target.closest('.dashboard-card');
            if (card) {
                const feature = card.dataset.feature;
                this.showFeature(feature);
            }
        });

        this.shadowRoot.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });
    }

    showFeature(feature) {
        const featureContent = this.shadowRoot.getElementById('feature-content');
        featureContent.innerHTML = ''; // Clear previous content

        const featureMap = {
            'family-health': '<family-health></family-health>',
            'babymate': '<baby-mate></baby-mate>',
            'senior-mode': '<senior-mode></senior-mode>',
            'hydration-tracker': '<hydration-tracker></hydration-tracker>',
            'diet-suggestions': '<diet-suggestions></diet-suggestions>',
            'prescription-gallery': '<prescription-gallery></prescription-gallery>',
            // Add other features here
        };

        if (featureMap[feature]) {
            featureContent.innerHTML = featureMap[feature];
        } else {
            const componentName = feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            featureContent.innerHTML = `<h2>${componentName}</h2><p>This feature is under construction.</p>`;
        }

        this.shadowRoot.getElementById('feature-modal').style.display = 'block';
    }

    closeModal() {
        this.shadowRoot.getElementById('feature-modal').style.display = 'none';
    }
}

customElements.define('main-dashboard', MainDashboard);
