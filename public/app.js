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

// --- 1. DARK MODE (Top Priority) ---
const body = document.body;
const themeBtn = document.getElementById('theme-toggle');

if (localStorage.getItem('theme') === 'dark') { body.classList.add('dark-theme'); }

if (themeBtn) {
    themeBtn.onclick = () => {
        body.classList.toggle('dark-theme');
        localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    };
}

// --- 2. FIREBASE & SEARCH INIT ---
firebase.initializeApp(firebaseConfig); // Use your existing config object
const db = firebase.firestore();
let myDatabase = [];
let fuse = null;

async function init() {
    try {
        // Safety check for status element
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.innerHTML = "↻ Connecting...";

        const snapshot = await db.collection('medications').get();
        myDatabase = snapshot.docs.map(doc => doc.data());
        
        // Initialize Fuse
        fuse = new Fuse(myDatabase, { keys: ["name", "category"], threshold: 0.3 });

        if (statusEl) statusEl.innerHTML = "✓ Database Online";
        
        const searchInput = document.getElementById('medSearch');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.placeholder = "Search (e.g., Lisinopril)...";
        }
    } catch (error) {
        console.error("Init Error:", error);
        if (document.getElementById('status')) document.getElementById('status').innerHTML = "✖ Error.";
    }
}

// --- 3. SEARCH LOGIC (With Null Checks) ---
const searchInput = document.getElementById('medSearch');
const searchResults = document.getElementById('searchResults');

if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value;
        // Check if fuse is actually ready yet
        if (!fuse || query.length < 2) { 
            if (searchResults) searchResults.innerHTML = ''; 
            return; 
        }

        const results = fuse.search(query);
        if (searchResults) {
            if (results.length > 0) {
                searchResults.innerHTML = results.map(res => {
                    const item = res.item;
                    return `
                        <div class="card search-result-card">
                            <h3>${item.name}</h3>
                            <span class="category-badge">${item.category || 'General'}</span>
                            <p>${(item.instructions || '').substring(0, 80)}...</p>
                            <button class="add-btn" onclick="addToList('${btoa(JSON.stringify(item))}')">Add to List +</button>
                        </div>
                    `;
                }).join('');
            } else {
                searchResults.innerHTML = '<p>No matches found.</p>';
            }
        }
    });
}

// --- 4. LIST LOGIC ---
window.addToList = function(encodedData) {
    const item = JSON.parse(atob(encodedData));
    const medicationList = document.getElementById('medicationList');
    if (!medicationList) return;

    const card = document.createElement('div');
    card.className = 'card pinned-card';
    card.innerHTML = `
        <button class="remove-btn" onclick="this.parentElement.remove(); updateUI();">×</button>
        <h3>${item.name}</h3>
        <span class="category-badge">${item.category || 'General'}</span>
        <p>${item.instructions || 'No instructions.'}</p>
    `;
    medicationList.appendChild(card);
    
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
    updateUI();
};

function updateUI() {
    const printBtn = document.getElementById('printBtn');
    const medicationList = document.getElementById('medicationList');
    if (printBtn && medicationList) {
        printBtn.style.display = medicationList.children.length > 0 ? 'block' : 'none';
    }
}

init();
