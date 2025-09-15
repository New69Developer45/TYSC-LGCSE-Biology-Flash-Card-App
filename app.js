document.addEventListener('DOMContentLoaded', () => {

    const appState = {
        currentView: 'topic-view',
        selectedTopicId: null,
        learnedTerms: {}, // { topicId: [term1, term2, ...] }
        sessionTerms: [],
        currentTermIndex: 0,
    };

    // --- DOM Elements ---
    const views = {
        topic: document.getElementById('topic-view'),
        termList: document.getElementById('term-list-view'),
        flashcard: document.getElementById('flashcard-view'),
    };
    const topicListEl = document.getElementById('topic-list');
    const termListEl = document.getElementById('term-list');
    const termListTitleEl = document.getElementById('term-list-title');
    const flashcardTopicTitleEl = document.getElementById('flashcard-topic-title');
    const flashcardEl = document.getElementById('flashcard');
    const cardTermEl = document.getElementById('card-term');
    const cardDefinitionEl = document.getElementById('card-definition');
    const cardBackTermEl = document.getElementById('card-back-term');
    const progressEl = document.getElementById('flashcard-progress');
    const markLearnedBtn = document.getElementById('mark-learned-btn');
    
    // --- Data ---
    const allTopics = glossaryData.glossary;

    // --- Local Storage ---
    const saveLearnedTerms = () => {
        localStorage.setItem('biologyLearnedTerms', JSON.stringify(appState.learnedTerms));
    };

    const loadLearnedTerms = () => {
        const learned = localStorage.getItem('biologyLearnedTerms');
        if (learned) {
            appState.learnedTerms = JSON.parse(learned);
        }
    };

    // --- View Management ---
    const showView = (viewId) => {
        Object.values(views).forEach(view => view.classList.remove('active-view'));
        views[viewId].classList.add('active-view');
        appState.currentView = viewId + '-view';
    };

    // --- Rendering Functions ---
    const renderTopicView = () => {
        topicListEl.innerHTML = '';
        allTopics.forEach(topic => {
            const learnedCount = appState.learnedTerms[topic.topicId]?.length || 0;
            const totalCount = topic.terms.length;
            const progressPercent = totalCount > 0 ? (learnedCount / totalCount) * 100 : 0;

            const li = document.createElement('li');
            li.className = 'list-item';
            li.dataset.topicId = topic.topicId;
            li.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${topic.topicName}</div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                </div>
            `;
            topicListEl.appendChild(li);
        });
        showView('topic');
    };

    const renderTermListView = (topicId) => {
        const topic = allTopics.find(t => t.topicId == topicId);
        if (!topic) return;

        appState.selectedTopicId = topicId;
        termListTitleEl.textContent = topic.topicName;
        termListEl.innerHTML = '';

        const learnedInTopic = appState.learnedTerms[topicId] || [];

        topic.terms.forEach((term, index) => {
            const isLearned = learnedInTopic.includes(term.term);
            const li = document.createElement('li');
            li.className = `list-item ${isLearned ? 'learned' : ''}`;
            li.dataset.termIndex = index;
            li.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${term.term}</div>
                </div>
            `;
            termListEl.appendChild(li);
        });
        showView('termList');
    };
    
    const startFlashcardSession = (isShuffled) => {
        const topic = allTopics.find(t => t.topicId == appState.selectedTopicId);
        if (!topic) return;
        
        let terms = [...topic.terms];
        if (isShuffled) {
            for (let i = terms.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [terms[i], terms[j]] = [terms[j], terms[i]];
            }
        }
        appState.sessionTerms = terms;
        appState.currentTermIndex = 0;
        flashcardTopicTitleEl.textContent = topic.topicName;
        renderCurrentCard();
        showView('flashcard');
    };
    
    const renderCurrentCard = () => {
        if (appState.sessionTerms.length === 0) return;
        
        flashcardEl.classList.remove('is-flipped');
        
        const currentTerm = appState.sessionTerms[appState.currentTermIndex];
        cardTermEl.textContent = currentTerm.term;
        cardBackTermEl.textContent = currentTerm.term;
        cardDefinitionEl.textContent = currentTerm.definition;
        
        progressEl.textContent = `Card ${appState.currentTermIndex + 1} of ${appState.sessionTerms.length}`;
        
        // Update "Mark as Learned" button state
        const learnedInTopic = appState.learnedTerms[appState.selectedTopicId] || [];
        if (learnedInTopic.includes(currentTerm.term)) {
            markLearnedBtn.classList.add('learned');
            markLearnedBtn.innerHTML = `<span class="icon">✓</span> Marked as Learned`;
        } else {
            markLearnedBtn.classList.remove('learned');
            markLearnedBtn.innerHTML = `<span class="icon"></span>Mark as Learned`;
        }
    };

    // --- Event Handlers ---
    topicListEl.addEventListener('click', (e) => {
        const topicItem = e.target.closest('li');
        if (topicItem && topicItem.dataset.topicId) {
            renderTermListView(topicItem.dataset.topicId);
        }
    });
    
    document.getElementById('back-to-topics').addEventListener('click', renderTopicView);
    document.getElementById('back-to-termlist').addEventListener('click', () => renderTermListView(appState.selectedTopicId));
    
    document.getElementById('start-session-btn').addEventListener('click', () => startFlashcardSession(false));
    document.getElementById('shuffle-session-btn').addEventListener('click', () => startFlashcardSession(true));

    flashcardEl.addEventListener('click', () => flashcardEl.classList.toggle('is-flipped'));

    document.getElementById('next-card-btn').addEventListener('click', () => {
        if (appState.currentTermIndex < appState.sessionTerms.length - 1) {
            appState.currentTermIndex++;
            renderCurrentCard();
        }
    });

    document.getElementById('prev-card-btn').addEventListener('click', () => {
        if (appState.currentTermIndex > 0) {
            appState.currentTermIndex--;
            renderCurrentCard();
        }
    });

    markLearnedBtn.addEventListener('click', () => {
        const topicId = appState.selectedTopicId;
        const term = appState.sessionTerms[appState.currentTermIndex].term;
        
        if (!appState.learnedTerms[topicId]) {
            appState.learnedTerms[topicId] = [];
        }
        
        const termIndexInLearned = appState.learnedTerms[topicId].indexOf(term);
        
        if (termIndexInLearned > -1) {
            // It's already learned, so unlearn it
            appState.learnedTerms[topicId].splice(termIndexInLearned, 1);
        } else {
            // It's not learned, so learn it
            appState.learnedTerms[topicId].push(term);
        }
        
        saveLearnedTerms();
        renderCurrentCard(); // Re-render to update button state
    });

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    // --- App Initialization ---
    const init = () => {
        loadLearnedTerms();
        renderTopicView();
    };

    init();
});