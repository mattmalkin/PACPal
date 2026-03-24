// 1. YOUR FIREBASE CONNECTION KEYS
const firebaseConfig = {
    apiKey: "AIzaSyA5uz0RFyrCkxJocq8kZwFg_pcO2P6WTUg",
    authDomain: "pacpal-9f9bf.firebaseapp.com",
    projectId: "pacpal-9f9bf",
    storageBucket: "pacpal-9f9bf.firebasestorage.app",
    messagingSenderId: "993977477357",
    appId: "1:993977477357:web:72a2c5dee83d40e4b7c4e4",
    measurementId: "G-QMLLEV67R5"
};

// --- DARK MODE LOGIC (Moved to Top for Reliability) ---
const body = document.body;
const themeBtn = document.getElementById('theme-toggle');

// Apply saved preference immediately
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-theme');
}

// Listen for clicks (only if button exists)
if (themeBtn) {
    themeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const isDark = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// --- INITIALIZE FIREBASE & SEARCH ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let myDatabase = [];
let fuse;

const searchInput = document.getElementById('medSearch');
const searchResults = document.getElementById('searchResults');
const medicationList = document.getElementById('medicationList');
const printBtn = document.getElementById('printBtn');
const listHeader = document.getElementById('listHeader');

async function init() {
    try {
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerHTML = "↻ Connecting to Database...";
        
        const snapshot = await db.collection('medications').get();
        myDatabase = snapshot.docs.map(doc => doc.data());
        
        fuse = new Fuse(myDatabase, {
            keys: ["name", "category"],
            threshold: 0.3,
            ignoreLocation: true
        });

        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Search (e.g., Lisinopril)...";
        }
        if (statusEl) statusEl.innerHTML = "✓ Database Online";
    } catch (error) {
        if (document.getElementById('status')) {
            document.getElementById('status').innerHTML = "✖ Error connecting to database.";
        }
        console.error("Firebase error:", error);
    }
}

// --- SEARCH LOGIC ---
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        if (query.length < 2) { searchResults.innerHTML = ''; return; }

        const results = fuse.search(query);
        if (results.length > 0) {
            let html = '';
            results.forEach(res => {
                const item = res.item;
                const safeInstructions = item.instructions || 'No instructions provided.';
                
                html += `
                    <div class="card search-result-card">
                        <h3 class="med-name">${item.name}</h3>
                        <span class="category-badge">${item.category || 'General'}</span>
                        <p class="instruction-text">${safeInstructions.substring(0, 80)}...</p>
                        <button class="add-btn" onclick="addToList('${btoa(JSON.stringify(item))}')">Add to List +</button>
                    </div>
                `;
            });
            searchResults.innerHTML = html;
        } else {
            searchResults.innerHTML = '<p>No matches found.</p>';
        }
    });
}

// --- LIST LOGIC ---
window.addToList = function(encodedData) {
    const item = JSON.parse(atob(encodedData));
    const safeInstructions = item.instructions || 'No instructions provided.';
    
    const card = document.createElement('div');
    card.className = 'card pinned-card';
    card.innerHTML = `
        <button class="remove-btn" onclick="this.parentElement.remove(); updateUI();">×</button>
        <h3 class="med-name">${item.name}</h3>
        <span class="category-badge">${item.category || 'General'}</span>
        <p class="instruction-text">${safeInstructions}</p>
    `;
    medicationList.appendChild(card);
    
    searchInput.value = '';
    searchResults.innerHTML = '';
    updateUI();
}

function updateUI() {
    const hasItems = medicationList.children.length > 0;
    if (printBtn) printBtn.style.display = hasItems ? 'block' : 'none';
    if (listHeader) listHeader.style.display = hasItems ? 'block' : 'none';
}

// START ENGINE
init();
