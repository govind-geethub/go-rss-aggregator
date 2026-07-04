const BASE_URL = "https://go-rss-aggregator-ez9y.onrender.com";

// Helper utility to collect state from the credential field automatically
function getHeaders() {
    const apiKey = document.getElementById("apiKey").value.trim();
    return {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${apiKey}`
    };
}

// ──── 1. CREATE USER (POST) ────
async function createUser() {
    const username = document.getElementById("usernameInput").value.trim();
    if (!username) return alert("Please type a username first.");

    try {
        const response = await fetch(`${BASE_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: username })
        });

        if (!response.ok) throw new Error("Could not register user endpoint profile.");
        const user = await response.json();

        // Inject generated system configurations straight onto the viewport
        document.getElementById("userResult").innerHTML = `
            <div style="background:#121214; margin-top:10px; padding:10px; border-radius:4px; font-size:13px;">
                <p style="color: #04d361; margin:0 0 5px 0;">✔ User Created successfully!</p>
                <strong>Name:</strong> ${user.name}<br>
                <strong>Key:</strong> <code style="color:#04d361;">${user.api_key}</code>
            </div>
        `;
        
        // Auto-populate the active authentication header box for convenience
        document.getElementById("apiKey").value = user.api_key;
        alert(`Welcome ${user.name}! Your API key was auto-loaded.`);
    } catch (err) {
        alert(err.message);
    }
}

// ──── 2. CREATE FEED LINK (POST - AUTHENTICATED) ────
async function createFeed() {
    const name = document.getElementById("feedNameInput").value.trim();
    const url = document.getElementById("feedUrlInput").value.trim();
    if (!name || !url) return alert("Both Feed Name and RSS URL must be populated.");

    try {
        const response = await fetch(`${BASE_URL}/feeds`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ name: name, url: url })
        });

        if (!response.ok) throw new Error("Feed registration failed. Is your Active API Key valid?");
        
        alert("New RSS feed registered to global directory!");
        document.getElementById("feedNameInput").value = "";
        document.getElementById("feedUrlInput").value = "";
        fetchPublicFeeds(); // Auto reload directory view to display the changes
    } catch (err) {
        alert(err.message);
    }
}

// ──── 3. READ PUBLIC DIRECTORY (GET - ANONYMOUS) ────
async function fetchPublicFeeds() {
    const list = document.getElementById("publicFeedsList");
    list.innerHTML = "<li>Querying global server indexes...</li>";

    try {
        const response = await fetch(`${BASE_URL}/feeds`, { method: "GET" });
        if (!response.ok) throw new Error("Could not download public feeds directory.");
        const feeds = await response.json();
        list.innerHTML = "";

        if (feeds.length === 0) {
            list.innerHTML = "<li>The directory index is currently empty.</li>";
            return;
        }

        feeds.forEach(feed => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div>
                    <strong>📡 ${feed.name}</strong><br>
                    <small style="color: #a8a8b3;">ID: ${feed.id}</small>
                </div>
                <button onclick="copyValueToClipboard('${feed.id}')" style="background:#323238; color:white; font-size:11px; padding:5px 8px;">Copy ID</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        list.innerHTML = `<li style="color:var(--danger-color);">Error: ${err.message}</li>`;
    }
}

// ──── 4. FOLLOW A CHANNEL (POST - AUTHENTICATED) ────
async function followFeed() {
    const feedId = document.getElementById("feedIdInput").value.trim();
    if (!feedId) return alert("Provide a valid target Feed UUID.");

    try {
        const response = await fetch(`${BASE_URL}/feed_follows`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ feed_id: feedId })
        });

        if (!response.ok) throw new Error("Follow connection rejected. Check your API key authentication.");
        
        alert("Channel added to personal subscription tracks!");
        document.getElementById("feedIdInput").value = "";
        fetchFollowedFeeds(); // Auto-refresh your dashboard tracking list
    } catch (err) {
        alert(err.message);
    }
}

// ──── 5. READ PERSONAL SUBSCRIPTIONS (GET - AUTHENTICATED) ────
async function fetchFollowedFeeds() {
    const list = document.getElementById("followsList");
    list.innerHTML = "<li>Assembling user personal feed structures...</li>";

    try {
        const response = await fetch(`${BASE_URL}/feed_follows`, {
            method: "GET",
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Fetch blocked. Check your API Key string.");
        const userFollowsArray = await response.json();
        list.innerHTML = "";

        if (userFollowsArray.length === 0) {
            list.innerHTML = "<li>You aren't tracking any RSS channels yet!</li>";
            return;
        }

        userFollowsArray.forEach(relation => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>
                    <strong>📌 Subscription Connection ID:</strong> ${relation.id}<br>
                    <small style="color:#a8a8b3;">Tracking Feed Target ID: ${relation.feed_id}</small>
                </span>
                <button class="delete-btn" onclick="unfollowFeed('${relation.id}')">Unfollow</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        list.innerHTML = `<li style="color:var(--danger-color);">Error: ${err.message}</li>`;
    }
}

// ──── 6. DELETE RELATION CONSTRAINT (DELETE - AUTHENTICATED) ────
async function unfollowFeed(relationshipId) {
    if (!confirm("Are you sure you want to drop this feed tracking relationship?")) return;

    try {
        const response = await fetch(`${BASE_URL}/feed_follows/${relationshipId}`, {
            method: "DELETE",
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Could not execute deletion query.");
        alert("Subscription record terminated successfully.");
        fetchFollowedFeeds(); // Refresh the personal tracking stream
    } catch (err) {
        alert(err.message);
    }
}

// Clipboard Helper
function copyValueToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Feed UUID saved to clipboard buffer!");
}

// Binding Application Click Handlers
document.getElementById("btnCreateUser").addEventListener("click", createUser);
document.getElementById("btnCreateFeed").addEventListener("click", createFeed);
document.getElementById("btnFetchPublicFeeds").addEventListener("click", fetchPublicFeeds);
document.getElementById("btnFollow").addEventListener("click", followFeed);
document.getElementById("btnFetchFollows").addEventListener("click", fetchFollowedFeeds);
document.getElementById("btnFetchPosts").addEventListener("click", fetchUserPosts);

// ──── 6. READ PERSONALIZED POSTS STREAM (GET - AUTHENTICATED) ────
async function fetchUserPosts() {
    const streamContainer = document.getElementById("postsStreamContainer");
    const limit = document.getElementById("postLimitInput").value || 10;
    
    streamContainer.innerHTML = "<p>Scanning database for new articles...</p>";

    try {
        // Appending URL parameters if your backend queries handle dynamic sizing limits (optional)
        const response = await fetch(`${BASE_URL}/posts?limit=${limit}`, {
            method: "GET",
            headers: getHeaders() // Packages up your authorization credentials
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const backendMessage = errorData.error || `Status Code: ${response.status}`;
            throw new Error(`Backend Error: ${backendMessage}`);
        }
        const posts = await response.json();
        streamContainer.innerHTML = "";

        if (posts.length === 0) {
            streamContainer.innerHTML = `
                <p style="color: #a8a8b3; grid-column: span 2;">
                    No posts found. Make sure your Backend scraper is active and running ('go run .')!
                </p>
                `;
            return;
        }

        // Loop over each article record and generate clean card layouts
        posts.forEach(post => {
            const articleCard = document.createElement("article");
            articleCard.className = "post-card";
            
            // Format dates neatly if they exist
            const publishDate = post.published_at ? new Date(post.published_at).toLocaleDateString() : "Recent";

            articleCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 18px;">${post.title}</h3>
                    <span style="background: #202024; color: #04d361; font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: bold; white-space: nowrap; border: 1px solid #323238;">
                        📡 ${post.feed_name}
                    </span>
                </div>
                <small style="color: #a8a8b3;">Published: ${publishDate}</small>
                <p style="margin: 10px 0; color: #c4c4cc; line-height: 1.5;">${post.description || "No preview description provided for this article."}</p>
                <a href="${post.url}" target="_blank" class="read-link">Read Full Article ↗</a>
            `;
            streamContainer.appendChild(articleCard);
        });
    } catch (err) {
        streamContainer.innerHTML = `<p style="color: var(--danger-color);">Error: ${err.message}</p>`;
    }
}