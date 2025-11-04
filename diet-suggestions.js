class DietSuggestions extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .diet-suggestions-container {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    padding: 1.5rem;
                }
                h3 {
                    margin-top: 0;
                    color: var(--primary-color);
                }
                .food-list {
                    list-style: none;
                    padding: 0;
                }
                .food-item {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem;
                    border-bottom: 1px solid #eee;
                }
                .food-item .material-icons {
                    color: var(--accent-color);
                    margin-right: 1rem;
                }
            </style>
            <div class="diet-suggestions-container">
                <h3>Diet Suggestions</h3>
                <ul class="food-list">
                    <li class="food-item">
                        <i class="material-icons">local_florist</i>
                        <span>Oatmeal with berries</span>
                    </li>
                    <li class="food-item">
                        <i class="material-icons">restaurant_menu</i>
                        <span>Grilled chicken salad</span>
                    </li>
                    <li class="food-item">
                        <i class="material-icons">fastfood</i>
                        <span>Salmon with roasted vegetables</span>
                    </li>
                </ul>
            </div>
        `;
    }
}

customElements.define('diet-suggestions', DietSuggestions);
