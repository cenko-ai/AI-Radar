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

    // Hochspezifische Domain-Intelligenz ("Wirklich die Beste")
    const specificDomains = {
        medizin: {
            keywords: ['medizin', 'arzt', 'krankheit', 'gesundheit', 'diagnose', 'pharma', 'biologie'],
            bestModels: ['openai/o1', 'anthropic/claude-3.5-sonnet', 'google/gemini-1.5-pro', 'openai/gpt-4o'],
            title: 'Medizin & Biowissenschaften',
            desc: 'Für medizinische Analysen führt aktuell kein Weg an High-Reasoning-Modellen vorbei. OpenAI o1 und Claude 3 haben auf medizinischen Benchmark-Tests (MedQA) die höchsten Scores erzielt, die KIs jemals hatten.'
        },
        jura: {
            keywords: ['jura', 'anwalt', 'recht', 'gesetz', 'vertrag', 'urteil', 'steuern'],
            bestModels: ['anthropic/claude-3.5-sonnet', 'openai/o1', 'openai/gpt-4o'],
            title: 'Jura, Recht & Verträge',
            desc: 'Die Verarbeitung komplexer Rechtsdokumente erfordert absolute Textpräzision. Claude ist mit seiner unglaublichen Text- und Mustererkennung (sowie großem Kontextfenster) der Branchenfavorit für Rechtstexte.'
        },
        maschinenbau: {
            keywords: ['maschinenbau', 'ingenieur', 'technik', 'physik', 'mechanik', 'cad', 'konstruktion', 'mathe', 'mathematik'],
            bestModels: ['openai/o1', 'anthropic/claude-3.5-sonnet', 'google/gemini-1.5-pro'],
            title: 'Ingenieurwesen, Physik & Mathe',
            desc: 'Diese Themen sind stark logisch und abstrakt geprägt. OpenAI o1 ist dank seines tiefgehenden "Chain-of-Thought" Reasonings momentan der absolute Goldstandard für Ingenieure und Mathematiker.'
        },
        kochen: {
            keywords: ['kochen', 'rezept', 'backen', 'ernährung', 'küche', 'lebensmittel', 'essen', 'diät'],
            bestModels: ['openai/gpt-4o-mini', 'anthropic/claude-3-haiku', 'meta-llama/llama-3.1-70b-instruct'],
            title: 'Kochen, Rezepte & Lifestyle',
            desc: 'Hier brauchst du keine teuren Super-Computer. Schnelle, ausdrucksstarke Modelle wie GPT-4o-mini oder Claude Haiku liefern erstklassige, kreative Rezepte für praktisch null Cent pro Anfrage.'
        },
        programmieren: {
            keywords: ['programmieren', 'coding', 'code', 'skript', 'it', 'informatik', 'web', 'app', 'software', 'entwickler', 'developer', 'html', 'python', 'javascript'],
            bestModels: ['anthropic/claude-3.5-sonnet', 'openai/o1', 'openai/gpt-4o', 'deepseek/deepseek-coder'],
            title: 'Softwareentwicklung & Programmierung',
            desc: 'Claude 3.5 Sonnet wird von Entwicklern weitreichend als der unangefochtene Champion des Codings angesehen, dicht gefolgt von OpenAI o1 für extrem komplexe Architektur-Probleme.'
        },
        kreativ: {
            keywords: ['schreiben', 'autor', 'buch', 'blog', 'social media', 'marketing', 'übersetzung', 'gedicht', 'kreativ', 'texten', 'story', 'brief'],
            bestModels: ['anthropic/claude-3-opus', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.1-70b-instruct'],
            title: 'Kreatives Schreiben & Storytelling',
            desc: 'Claude 3 Opus ist berühmt für seinen immens natürlichen, literarischen Schreibstil, der viel weniger "roboterhaft" klingt als die Konkurrenz. Perfekt für Blogs, Bücher und kreative Texte!'
        },
        general: {
            keywords: [],
            bestModels: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-1.5-pro'],
            title: 'Top Allround-Modelle',
            desc: 'Wir konnten dein Thema keiner direkten Nische zuordnen, aber mit diesen 3 Modellen triffst du immer die beste Wahl für allgemeine Aufgaben!'
        }
    };

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
                
                return { id, name, provider, pricePrompt, priceCompletion, totalRefPrice, contextLength, rawModel: model };
            });

            loadingState.classList.add('hidden');
            renderModels();
        } catch (error) {
            console.error("Error fetching models:", error);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }

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

    // Helper: Is this model strictly one of the exact IDs defined?
    function isExactModelMatch(modelId, bestModelsArray) {
        // We match exactly, or with openrouter additions like ":free" or date codes. 
        // Example "openai/gpt-4o" should match "openai/gpt-4o-2024-05-13" or "openai/gpt-4o"
        return bestModelsArray.some(bestId => modelId.startsWith(bestId));
    }

    // Helper: Find index of model in bestModels array to rank it
    function getModelRank(modelId, bestModelsArray) {
        const index = bestModelsArray.findIndex(bestId => modelId.startsWith(bestId));
        return index !== -1 ? index : 999;
    }

    function executeMagicSearch() {
        const query = magicInput.value.toLowerCase().trim();
        if (!query) return;

        chips.forEach(c => c.classList.remove('active'));
        searchInput.value = '';
        currentFilter = 'magic';

        // Find best matching category
        let matchedCategory = 'general';
        for (const [cat, data] of Object.entries(specificDomains)) {
            if (cat === 'general') continue;
            // Tokenize query for better matching
            const words = query.split(/[\s,]+/);
            if (data.keywords.some(kw => words.some(w => w.includes(kw) || kw.includes(w) && w.length > 3))) {
                matchedCategory = cat;
                break;
            }
        }

        currentMagicCategory = specificDomains[matchedCategory];
        
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

        let filteredModels = allModels;

        // Apply Magic Category Filter: ALWAYS RESTRICT TO EXACT 'BEST' MODELS if magic is active
        if (currentFilter === 'magic' && currentMagicCategory) {
            filteredModels = allModels.filter(model => {
                return isExactModelMatch(model.id.toLowerCase(), currentMagicCategory.bestModels);
            });
            // Also deduplicate base vs dated models if they both match. (Keep the base mostly)
            // But let's keep it simple for now, OpenRouter usually has 1 main endpoint per model.
        } else {
            // Apply standard search & quick filters
            filteredModels = allModels.filter(model => {
                const matchesSearch = model.name.toLowerCase().includes(searchTerm) || 
                                      model.provider.toLowerCase().includes(searchTerm) ||
                                      model.id.toLowerCase().includes(searchTerm);
                const tags = getModelTags(model);
                const matchesFilter = currentFilter === 'all' || tags.includes(currentFilter);
                return matchesSearch && matchesFilter;
            });
        }

        // Sorting
        filteredModels.sort((a, b) => {
            if (currentFilter === 'magic' && currentMagicCategory) {
                // If MAGIC, sort strictly by our curated ranking!
                const rankA = getModelRank(a.id.toLowerCase(), currentMagicCategory.bestModels);
                const rankB = getModelRank(b.id.toLowerCase(), currentMagicCategory.bestModels);
                return rankA - rankB;
            }

            if (sortBy === 'price_asc') return a.pricePrompt - b.pricePrompt;
            if (sortBy === 'price_desc') return b.pricePrompt - a.pricePrompt;
            if (sortBy === 'context_desc') return b.contextLength - a.contextLength;

            const aTop = a.id.includes('openai') || a.id.includes('anthropic') || a.id.includes('google');
            const bTop = b.id.includes('openai') || b.id.includes('anthropic') || b.id.includes('google');
            if (aTop && !bTop) return -1;
            if (!aTop && bTop) return 1;
            return 0;
        });

        // Filter out extreme duplicates if necessary (optional)
        const seenBases = new Set();
        const finalModels = [];
        for (const model of filteredModels) {
            // Some basic deduplication based on name so we don't list gpt-4o and gpt-4o-2024-05-13 if magic search is active
            if (currentFilter === 'magic') {
                const baseName = model.name.split(' (')[0].split(' - ')[0]; // E.g., 'GPT-4o'
                if (!seenBases.has(baseName)) {
                    seenBases.add(baseName);
                    finalModels.push(model);
                }
            } else {
                finalModels.push(model);
            }
        }

        if (finalModels.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        modelGrid.classList.remove('hidden');

        // Render Cards
        finalModels.slice(0, 100).forEach((model, index) => {
            const card = document.createElement('div');
            card.className = 'model-card fade-in';
            card.style.animationDelay = `${(index % 10) * 0.05}s`;

            const providerName = model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
            const isNumberOne = (currentFilter === 'magic' && index === 0);

            // Give the #1 model a gold glow!
            if (isNumberOne) {
                card.style.border = '2px solid rgba(251, 191, 36, 0.8)';
                card.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.2)';
            }

            const trophyHtml = isNumberOne ? `<div style="background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 6px;">
                🏆 #1 Empfehlung
            </div>` : '';

            card.innerHTML = `
                ${trophyHtml}
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
