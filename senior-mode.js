class SeniorMode extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .senior-mode-container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                }
                h3 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .reminder-list {
                    list-style: none;
                    padding: 0;
                }
                .reminder-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    border-bottom: 1px solid #eee;
                }
                .add-reminder-btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                }
            </style>
            <div class="senior-mode-container">
                <h3>Senior Mode - Reminders</h3>
                <ul class="reminder-list">
                    <li class="reminder-item"><span>Take morning tablets</span> <span>8:00 AM</span></li>
                    <li class="reminder-item"><span>Short walk</span> <span>11:00 AM</span></li>
                    <li class="reminder-item"><span>Take afternoon tablets</span> <span>1:00 PM</span></li>
                </ul>
                <button class="add-reminder-btn">+ Add Reminder</button>
            </div>
        `;
    }
}

customElements.define('senior-mode', SeniorMode);
