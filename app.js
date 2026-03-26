document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://openrouter.ai/api/v1/models';
    
    // UI Elements
    const modelGrid = document.getElementById('modelGrid');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const chips = document.querySelectorAll('.chip');
    
    let allModels = [];
    let currentFilter = 'all';

    // Fetch data from OpenRouter Live API
    async function fetchModels() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            // Clean up and format the models data
            allModels = data.data.map(model => {
                const id = model.id;
                const name = model.name || id;
                const provider = id.split('/')[0]; // e.g., 'anthropic/claude...' -> 'anthropic'
                
                // OpenRouter gives price per 1 token. We want to show price per 1 Million tokens.
                const pricePrompt = parseFloat(model.pricing?.prompt || 0) * 1_000_000;
                const priceCompletion = parseFloat(model.pricing?.completion || 0) * 1_000_000;
                const totalRefPrice = pricePrompt + priceCompletion;
                
                const contextLength = parseInt(model.context_length || 0);
                
                return {
                    id,
                    name,
                    provider,
                    pricePrompt,
                    priceCompletion,
                    totalRefPrice,
                    contextLength,
                    rawModel: model
                };
            });

            // Remove loading state and trigger initial render
            loadingState.classList.add('hidden');
            renderModels();

        } catch (error) {
            console.error("Error fetching models:", error);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }

    // Advanced Formatting Utilities
    function formatPrice(price) {
        if (price === 0) return 'Kostenlos';
        if (price < 0.01) return `< $0.01`;
        return '$' + price.toFixed(2);
    }

    function formatContext(length) {
        if (length >= 1_000_000) return (length / 1_000_000).toFixed(1) + 'M';
        if (length >= 1_000) return Math.round(length / 1000) + 'K';
        return length.toString();
    }

    // Heuristics to auto-tag models for the Use Case Matcher
    function getModelTags(model) {
        const idLower = model.id.toLowerCase();
        let tags = [];
        
        // Coding models
        if (idLower.includes('coder') || idLower.includes('sonnet') || idLower.includes('gpt-4o') || idLower.includes('qwen')) {
            tags.push('coding');
        }
        
        // Reasoning / Math models
        if (idLower.includes('o1') || idLower.includes('o3') || idLower.includes('math') || idLower.includes('think') || idLower.includes('reasoning')) {
            tags.push('reasoning');
        }
        
        // Cheap & Fast (if total cost per 1M is less than $0.50)
        if (model.totalRefPrice > 0 && model.totalRefPrice < 0.5) {
            tags.push('cheap');
        }
        
        // Huge Context (>= 128k)
        if (model.contextLength >= 128000) {
            tags.push('huge_context');
        }
        
        return tags;
    }

    function renderModels() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;
        
        modelGrid.innerHTML = '';
        modelGrid.classList.add('hidden');
        emptyState.classList.add('hidden');

        // Apply Search and Filters
        let filteredModels = allModels.filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchTerm) || 
                                  model.provider.toLowerCase().includes(searchTerm) ||
                                  model.id.toLowerCase().includes(searchTerm);
            
            const tags = getModelTags(model);
            const matchesFilter = currentFilter === 'all' || tags.includes(currentFilter);
            
            return matchesSearch && matchesFilter;
        });

        // Apply Sorting
        filteredModels.sort((a, b) => {
            if (sortBy === 'price_asc') {
                return a.pricePrompt - b.pricePrompt;
            } else if (sortBy === 'price_desc') {
                return b.pricePrompt - a.pricePrompt;
            } else if (sortBy === 'context_desc') {
                return b.contextLength - a.contextLength;
            } else {
                // popularity / standard (Let's keep the API's default order or push big names up)
                const aTop = a.id.includes('openai') || a.id.includes('anthropic') || a.id.includes('google');
                const bTop = b.id.includes('openai') || b.id.includes('anthropic') || b.id.includes('google');
                if (aTop && !bTop) return -1;
                if (!aTop && bTop) return 1;
                return 0; // maintain original order otherwise
            }
        });

        // If no results
        if (filteredModels.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        modelGrid.classList.remove('hidden');

        // Render Cards (limit to 100 to prevent DOM lag on massive searches, but OpenRouter has ~200)
        filteredModels.slice(0, 100).forEach((model, index) => {
            const card = document.createElement('div');
            card.className = 'model-card fade-in';
            card.style.animationDelay = `${(index % 10) * 0.05}s`;

            const providerName = model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
            const tagsSpan = getModelTags(model).map(tag => {
                const labels = { coding: 'Coding', reasoning: 'Logik', cheap: 'Erschwinglich', huge_context: 'Großer Kontext' };
                return `<span class="tag">${labels[tag] || tag}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="card-header">
                    <span class="provider-badge">${providerName}</span>
                    <span class="model-id" title="${model.id}">${model.id.length > 20 ? model.id.substring(model.provider.length+1, 30) + '...' : model.id}</span>
                </div>
                <h3 class="model-name">${model.name}</h3>
                
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2 6 14h6l-2 8 8-12h-6z"/></svg>
                            Input (1M)
                        </div>
                        <div class="stat-value ${model.pricePrompt < 1 ? 'cheap' : ''}">${formatPrice(model.pricePrompt)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
                            Output (1M)
                        </div>
                        <div class="stat-value">${formatPrice(model.priceCompletion)}</div>
                    </div>
                    <div class="context-window">
                        <span>Kontext-Fenster</span>
                        <span>${formatContext(model.contextLength)} Tokens</span>
                    </div>
                </div>

                <div class="card-footer">
                    ${tagsSpan}
                </div>
            `;

            modelGrid.appendChild(card);
        });
    }

    // Event Listeners
    searchInput.addEventListener('input', renderModels);
    sortSelect.addEventListener('change', renderModels);

    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            // Remove active from all
            chips.forEach(c => c.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');
            
            currentFilter = e.target.dataset.filter;
            renderModels();
        });
    });

    // Start Fetching on Load
    fetchModels();
});
