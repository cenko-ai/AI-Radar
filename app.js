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

    // Magic Search Elements
    const magicInput = document.getElementById('magicInput');
    const magicBtn = document.getElementById('magicBtn');
    const magicBanner = document.getElementById('magicBanner');
    const magicBannerTitle = document.getElementById('magicBannerTitle');
    const magicBannerText = document.getElementById('magicBannerText');
    const clearMagicBtn = document.getElementById('clearMagicBtn');
    
    let allModels = [];
    let currentFilter = 'all';
    let currentMagicCategory = null;

    // Domain Intelligence Matrix
    const domainKeywords = {
        expert: {
            keywords: ['medizin', 'arzt', 'jura', 'anwalt', 'recht', 'maschinenbau', 'ingenieur', 'wissenschaft', 'forschung', 'mathe', 'physik', 'finanzen', 'analyse', 'strategie', 'studium'],
            title: 'Die besten Modelle für hochkomplexe Fachthemen',
            desc: 'Für komplexe Fachgebiete wie Medizin oder Technik brauchst du maximale Intelligenz. Wir empfehlen die absoluten Elite-Modelle (Frontier Models).',
            match: (id) => id.includes('opus') || id.includes('gpt-4o') || id.includes('gemini-1.5-pro') || id.includes('gemini-2.5-pro') || id.includes('claude-3-7') || id.includes('o1') || id.includes('o3')
        },
        creative: {
            keywords: ['kochen', 'rezept', 'schreiben', 'autor', 'buch', 'blog', 'social media', 'marketing', 'übersetzung', 'gedicht', 'kreativ', 'alltag', 'texten', 'brief', 'email'],
            title: 'Die besten Modelle für Kreatives & Alltag',
            desc: 'Hierfür eignen sich schnelle, smarte Modelle mit einem sehr natürlichen und flüssigen Schreibstil hervorragend.',
            match: (id) => id.includes('haiku') || id.includes('gpt-4o-mini') || id.includes('llama-3.3-70b') || id.includes('gemini-1.5-flash') || id.includes('gemini-2.0-flash')
        },
        roleplay: {
            keywords: ['rollenspiel', 'roleplay', 'charakter', 'spiel', 'gaming', 'fantasie', 'geschichte', 'rp'],
            title: 'Die besten Modelle für Roleplay & Storytelling',
            desc: 'Diese Modelle glänzen im Storytelling und sind bekannt dafür, überzeugend in Rollen zu schlüpfen (häufig completely Uncensored).',
            match: (id) => id.includes('llama-3') || id.includes('mythomax') || id.includes('command-r') || id.includes('wizard') || id.includes('goliath') || id.includes('qwen')
        },
        coding: {
            keywords: ['programmieren', 'coding', 'code', 'skript', 'it', 'informatik', 'web', 'app', 'software', 'entwickler', 'developer', 'html', 'python', 'javascript'],
            title: 'Die besten Modelle für Programmierung',
            desc: 'Die absoluten Champions der Branche im Schreiben, Debuggen und Analysieren von Code.',
            match: (id) => id.includes('sonnet') || id.includes('gpt-4o') || id.includes('deepseek-coder') || id.includes('qwen-2.5-coder') || id.includes('claude-3-7')
        },
        general: {
            keywords: [],
            title: 'Top Allround-Modelle',
            desc: 'Wir konnten dein Thema keiner direkten Nische zuordnen. Diese Modelle sind die besten Allrounder für die allermeisten Aufgaben!',
            match: (id) => id.includes('gpt-4o') || id.includes('claude-3-5') || id.includes('gemini-1.5')
        }
    };

    // Fetch data from OpenRouter Live API
    async function fetchModels() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            allModels = data.data.map(model => {
                const id = model.id;
                const name = model.name || id;
                const provider = id.split('/')[0];
                
                const pricePrompt = parseFloat(model.pricing?.prompt || 0) * 1_000_000;
                const priceCompletion = parseFloat(model.pricing?.completion || 0) * 1_000_000;
                const totalRefPrice = pricePrompt + priceCompletion;
                const contextLength = parseInt(model.context_length || 0);
                
                return {
                    id, name, provider, pricePrompt, priceCompletion, totalRefPrice, contextLength, rawModel: model
                };
            });

            loadingState.classList.add('hidden');
            renderModels();

        } catch (error) {
            console.error("Error fetching models:", error);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }

    // Formatting Utilities
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

    // Heuristics for standard quick tags
    function getModelTags(model) {
        const idLower = model.id.toLowerCase();
        let tags = [];
        if (idLower.includes('coder') || idLower.includes('sonnet') || idLower.includes('gpt-4o') || idLower.includes('qwen')) tags.push('coding');
        if (idLower.includes('o1') || idLower.includes('o3') || idLower.includes('math') || idLower.includes('think') || idLower.includes('reasoning')) tags.push('reasoning');
        if (model.totalRefPrice > 0 && model.totalRefPrice < 0.5) tags.push('cheap');
        if (model.contextLength >= 128000) tags.push('huge_context');
        return tags;
    }

    // Handle Magic Search Execution
    function executeMagicSearch() {
        const query = magicInput.value.toLowerCase().trim();
        if (!query) return;

        // Reset quick filters
        chips.forEach(c => c.classList.remove('active'));
        searchInput.value = '';
        currentFilter = 'magic';

        // Find best matching category
        let matchedCategory = 'general';
        for (const [cat, data] of Object.entries(domainKeywords)) {
            if (cat === 'general') continue;
            if (data.keywords.some(kw => query.includes(kw))) {
                matchedCategory = cat;
                break;
            }
        }

        currentMagicCategory = domainKeywords[matchedCategory];
        
        // Show Banner
        magicBannerTitle.textContent = currentMagicCategory.title;
        magicBannerText.textContent = currentMagicCategory.desc;
        magicBanner.classList.remove('hidden');

        renderModels();
    }

    function clearMagicSearch() {
        magicInput.value = '';
        currentFilter = 'all';
        currentMagicCategory = null;
        magicBanner.classList.add('hidden');
        chips.forEach(c => c.dataset.filter === 'all' ? c.classList.add('active') : c.classList.remove('active'));
        renderModels();
    }

    function renderModels() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortBy = sortSelect.value;
        
        modelGrid.innerHTML = '';
        modelGrid.classList.add('hidden');
        emptyState.classList.add('hidden');

        let filteredModels = allModels.filter(model => {
            const matchesSearch = model.name.toLowerCase().includes(searchTerm) || 
                                  model.provider.toLowerCase().includes(searchTerm) ||
                                  model.id.toLowerCase().includes(searchTerm);
            
            if (currentFilter === 'magic' && currentMagicCategory) {
                return currentMagicCategory.match(model.id.toLowerCase()) && matchesSearch;
            }

            const tags = getModelTags(model);
            const matchesFilter = currentFilter === 'all' || currentFilter === 'magic' || tags.includes(currentFilter);
            
            return matchesSearch && matchesFilter;
        });

        // Sorting
        filteredModels.sort((a, b) => {
            if (sortBy === 'price_asc') return a.pricePrompt - b.pricePrompt;
            if (sortBy === 'price_desc') return b.pricePrompt - a.pricePrompt;
            if (sortBy === 'context_desc') return b.contextLength - a.contextLength;

            const aTop = a.id.includes('openai') || a.id.includes('anthropic') || a.id.includes('google');
            const bTop = b.id.includes('openai') || b.id.includes('anthropic') || b.id.includes('google');
            if (aTop && !bTop) return -1;
            if (!aTop && bTop) return 1;
            return 0;
        });

        if (filteredModels.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        modelGrid.classList.remove('hidden');

        // Render Cards (limit to 100 max)
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
    searchInput.addEventListener('input', () => {
        if (currentFilter === 'magic') clearMagicSearch();
        renderModels();
    });
    
    sortSelect.addEventListener('change', renderModels);

    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            chips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            if (currentFilter === 'magic') {
                magicBanner.classList.add('hidden');
                magicInput.value = '';
                currentMagicCategory = null;
            }
            
            currentFilter = e.target.dataset.filter;
            renderModels();
        });
    });

    magicBtn.addEventListener('click', executeMagicSearch);
    magicInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executeMagicSearch();
    });
    clearMagicBtn.addEventListener('click', clearMagicSearch);

    // Start
    fetchModels();
});
