
class HydrationTracker extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .hydration-tracker-container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                    text-align: center;
                }
                h3 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .water-level {
                    position: relative;
                    width: 150px;
                    height: 200px;
                    border: 2px solid var(--primary-color);
                    border-radius: 10px;
                    margin: 1rem auto;
                    overflow: hidden;
                }
                .water-level-fill {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background-color: var(--secondary-color);
                    height: 50%; /* Example fill percentage */
                }
                .add-water-btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    font-size: 2rem;
                    cursor: pointer;
                    margin-top: 1rem;
                }
            </style>
            <div class="hydration-tracker-container">
                <h3>Hydration Tracker</h3>
                <div class="water-level">
                    <div class="water-level-fill"></div>
                </div>
                <div>
                    <button class="add-water-btn">+</button>
                </div>
            </div>
        `;
    }
}

customElements.define('hydration-tracker', HydrationTracker);
