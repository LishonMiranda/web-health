class BabyMate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .babymate-container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                }
                h3 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .vaccine-chart {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                .vaccine-chart th, .vaccine-chart td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .vaccine-chart th {
                    background-color: #f2f2f2;
                }
            </style>
            <div class="babymate-container">
                <h3>BabyMate - Vaccine Tracker</h3>
                <table class="vaccine-chart">
                    <tr>
                        <th>Vaccine</th>
                        <th>Due Date</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td>BCG</td>
                        <td>At Birth</td>
                        <td>Administered</td>
                    </tr>
                    <tr>
                        <td>Hepatitis B - 1</td>
                        <td>At Birth</td>
                        <td>Administered</td>
                    </tr>
                    <tr>
                        <td>OPV - 1</td>
                        <td>6 Weeks</td>
                        <td>Upcoming</td>
                    </tr>
                </table>
            </div>
        `;
    }
}

customElements.define('baby-mate', BabyMate);
