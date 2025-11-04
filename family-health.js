class FamilyHealth extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .family-health-container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                }
                h3 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .family-member-list {
                    list-style: none;
                    padding: 0;
                }
                .family-member-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    border-bottom: 1px solid #eee;
                }
                .add-member-btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                }
            </style>
            <div class="family-health-container">
                <h3>Family Health</h3>
                <ul class="family-member-list">
                    <li class="family-member-item"><span>John Doe (Father)</span> <span>Healthy</span></li>
                    <li class="family-member-item"><span>Jane Doe (Mother)</span> <span>Minor Cold</span></li>
                </ul>
                <button class="add-member-btn">+ Add Member</button>
            </div>
        `;
    }
}

customElements.define('family-health', FamilyHealth);
