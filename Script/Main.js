
// // -------- STEP 1: Generate Code Verifier --------
// function generateCodeVerifier(length = 128) {
//   const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
//   let verifier = "";
//   for (let i = 0; i < length; i++) {
//     verifier += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return verifier;
// }



// // -------- STEP 2: Generate Code Challenge from Verifier --------
// async function generateCodeChallenge(verifier) {
//   const data = new TextEncoder().encode(verifier);
//   const digest = await crypto.subtle.digest("SHA-256", data);
//   return btoa(String.fromCharCode(...new Uint8Array(digest)))
//     .replace(/\+/g, "-")
//     .replace(/\//g, "_")
//     .replace(/=+$/, "");
// }


// // -------- STEP 3: Start Login Flow --------
// document.getElementById("login").addEventListener("click", async () => {
//   const verifier = generateCodeVerifier();
//   const challenge = await generateCodeChallenge(verifier);

//   localStorage.setItem("verifier", verifier); // Save it for later

//   const params = new URLSearchParams({
//     response_type: "code",
//     client_id: "c11a67257ed149cc8f261144716db203",
//     scope: "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state",
//     redirect_uri: "http://127.0.0.1:5500/Index.html",
//     code_challenge_method: "S256",
//     code_challenge: challenge
//   });


//     // Redirect to Spotify login
//   window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
// });




// // -------- STEP 4: Handle Redirect --------
// window.addEventListener("load", async () => {
//   const code = new URLSearchParams(window.location.search).get("code");
//   if (!code) return; // No code = user hasn't logged in yet

//   const verifier = localStorage.getItem("verifier");

//   const body = new URLSearchParams({
//     grant_type: "authorization_code",
//     code,
//     redirect_uri: "http://127.0.0.1:5500/Index.html",
//     client_id: "c11a67257ed149cc8f261144716db203",
//     code_verifier: verifier
//   });

//   const response = await fetch("https://accounts.spotify.com/api/token", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body
//   });

//   const data = await response.json();
//   const accessToken = data.access_token;
// localStorage.setItem("accessToken", accessToken);
//   console.log("ACCESS TOKEN:", accessToken);
//   // 👇 You can now use accessToken to call Spotify APIs
// });







// // -------- MOOD CARD CLICK HANDLER --------
// async function fetchTracksByMood(mood) {
//   const token = localStorage.getItem("accessToken");
//   if (!token) {
//     alert("Please login to Spotify first.");
//     return;
//   }

//   const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(mood)}&type=track&limit=10`, {
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   if (response.status === 401) {
//     alert("Session expired. Please login again.");
//     localStorage.removeItem("accessToken");
//     updateSessionUI();
//     return;
//   }

//   const data = await response.json();
//   const resultsDiv = document.getElementById("results");
//   resultsDiv.innerHTML = "";

//   data.tracks.items.forEach(track => {
//     const trackDiv = document.createElement("div");
//     trackDiv.innerHTML = `
//       <p><strong>${track.name}</strong> by ${track.artists.map(a => a.name).join(", ")}</p>
//       <audio controls src="${track.preview_url}"></audio>
//     `;
//     resultsDiv.appendChild(trackDiv);
//   });
// }

// document.addEventListener("DOMContentLoaded", () => {
//   document.querySelectorAll(".mood-card").forEach(card => {
//     card.addEventListener("click", () => {
//       const mood = card.dataset.mood;
//       fetchTracksByMood(mood);
//     });
//   });
// });





// Spotify Configuration
const CLIENT_ID = 'f4a0c64226b64512ac6a842eb183f16a'; // Replace with your actual client ID
const REDIRECT_URI = 'http://127.0.0.1:5500/index.html';
const SCOPES = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private';

// Application State
let accessToken = '';
let selectedMood = '';
let playlists = [];

// DOM Elements
const loginButton = document.getElementById('login');
const getStartedButton = document.querySelector('.btn-primary[href="#mood-selection"]');
const footerButton = document.getElementById('main-cta-btn');
const moodCards = document.querySelectorAll('.mood-card');
const resultsSection = document.getElementById('results');

// PKCE Helper Functions
function generateRandomString(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Spotify Authentication
async function initiateSpotifyLogin() {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    
    window.location.href = authUrl.toString();
}

async function handleRedirect() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
        const codeVerifier = sessionStorage.getItem('code_verifier');
        
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: codeVerifier || '',
                }),
            });
            
            const data = await response.json();
            
            if (data.access_token) {
                accessToken = data.access_token;
                sessionStorage.removeItem('code_verifier');
                window.history.replaceState({}, document.title, '/');
                updateLoginButton();
            } else {
                console.error('Token exchange failed:', data);
            }
        } catch (error) {
            console.error('Error during token exchange:', error);
        }
    }
}

function updateLoginButton() {
    if (accessToken) {
        loginButton.textContent = 'Logout';
        loginButton.onclick = handleLogout;
        loginButton.classList.remove('btn-primary');
        loginButton.classList.add('btn-outline-danger');
    } else {
        loginButton.textContent = 'Login with Spotify';
        loginButton.onclick = initiateSpotifyLogin;
        loginButton.classList.remove('btn-outline-danger');
        loginButton.classList.add('btn-primary');
    }
}

function handleLogout() {
    accessToken = '';
    playlists = [];
    selectedMood = '';
    updateLoginButton();
    clearResults();
    clearMoodSelection();
}

// Playlist Fetching
async function fetchPlaylists(mood) {
    if (!accessToken) {
        await initiateSpotifyLogin();
        return;
    }
    
    selectedMood = mood;
    updateMoodSelection();
    showLoadingIndicator();
    
    try {
        // First try to get user's playlists that match the mood
        const userPlaylistsResponse = await fetch(
            'https://api.spotify.com/v1/me/playlists?limit=50',
            {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            }
        );
        
        const userPlaylistsData = await userPlaylistsResponse.json();
        let moodPlaylists = [];
        
        if (userPlaylistsData.items) {
            // Filter user playlists that might match the mood
            moodPlaylists = userPlaylistsData.items.filter(playlist => 
                playlist.name.toLowerCase().includes(mood.toLowerCase()) ||
                (playlist.description && playlist.description.toLowerCase().includes(mood.toLowerCase()))
            );
        }
        
        // If we don't have enough user playlists, search for public ones
        if (moodPlaylists.length < 6) {
            const searchResponse = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(mood + ' mood')}&type=playlist&limit=${6 - moodPlaylists.length}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                }
            );
            
            const searchData = await searchResponse.json();
            if (searchData.playlists?.items) {
                moodPlaylists = [...moodPlaylists, ...searchData.playlists.items];
            }
        }
        
        playlists = moodPlaylists;
        displayPlaylists();
        
    } catch (error) {
        console.error('Error fetching playlists:', error);
        playlists = [];
        displayPlaylists();
    } finally {
        hideLoadingIndicator();
    }
}

// UI Updates
function updateMoodSelection() {
    moodCards.forEach(card => {
        const cardMood = card.getAttribute('data-mood');
        if (selectedMood === cardMood) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function clearMoodSelection() {
    moodCards.forEach(card => {
        card.classList.remove('selected');
    });
}

function showLoadingIndicator() {
    resultsSection.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Finding perfect ${selectedMood} playlists for you...</p>
        </div>
    `;
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function hideLoadingIndicator() {
    // Loading indicator will be replaced by playlist results
}

function clearResults() {
    resultsSection.innerHTML = '';
}

function displayPlaylists() {
    if (playlists.length === 0) {
        resultsSection.innerHTML = `
            <div class="text-center py-5">
                <h3>No ${selectedMood} playlists found</h3>
                <p class="text-muted">Try selecting a different mood or check your Spotify connection.</p>
            </div>
        `;
        return;
    }
    
    const playlistsHTML = `
        <div class="container mt-5">
            <h2 class="text-center mb-4" style="color: #4b3f72;">Your ${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Playlists</h2>
            <div class="row g-4">
                ${playlists.map(playlist => `
                    <div class="col-md-4">
                        <div class="card h-100 playlist-card-result">
                            <img src="${playlist.images[0]?.url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f'}" 
                                 class="card-img-top" alt="${playlist.name}" style="height: 200px; object-fit: cover;">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${playlist.name}</h5>
                                <p class="card-text flex-grow-1">${playlist.description || 'No description available'}</p>
                                <div class="mt-auto">
                                    <small class="text-muted">${playlist.tracks?.total || 0} tracks</small>
                                    <br>
                                    <a href="${playlist.external_urls.spotify}" target="_blank" class="btn btn-success mt-2">
                                        <i class="fab fa-spotify"></i> Open in Spotify
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    resultsSection.innerHTML = playlistsHTML;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Handle redirect on page load
    handleRedirect();
    updateLoginButton();
    
    // Login button event listener
    if (loginButton) {
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (accessToken) {
                handleLogout();
            } else {
                initiateSpotifyLogin();
            }
        });
    }
    
    // Mood card event listeners
    moodCards.forEach(card => {
        card.addEventListener('click', () => {
            const mood = card.getAttribute('data-mood');
            fetchPlaylists(mood);
        });
    });
    
    // Get Started button
    if (getStartedButton) {
        getStartedButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (accessToken) {
                // Scroll to mood selection
                document.querySelector('.choosemood').scrollIntoView({ behavior: 'smooth' });
            } else {
                initiateSpotifyLogin();
            }
        });
    }
    
    // Footer CTA button
    if (footerButton) {
        footerButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (accessToken) {
                fetchPlaylists('happy'); // Default to happy mood
            } else {
                initiateSpotifyLogin();
            }
        });
    }
});





