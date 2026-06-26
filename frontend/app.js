const BASE_URL = "http://localhost:8080/v1"; // Change if your Go server port is different

// Helper function to get auth headers automatically
function getHeaders() {
    const apiKey = document.getElementById("apiKey").value;
    return {
        "Content-Type": "application/json",
        "Authorization": `ApiKey ${apiKey}`
    };
}

// 1. GET Request: Fetch Followed Feeds
async function fetchFollowedFeeds() {
    const listContainer = document.getElementById("followsList");
    listContainer.innerHTML = "<li>Loading your subscriptions...</li>";

    try {
        const response = await fetch(`${BASE_URL}/feed_follows`, {
            method: "GET",
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch. Check API Key.");

        const data = await response.json(); // Parsing raw HTTP body string into JavaScript objects
        listContainer.innerHTML = ""; // Clear loader

        if (data.length === 0) {
            listContainer.innerHTML = "<li>You aren't following any feeds yet!</li>";
            return;
        }

        data.forEach(follow => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>Feed ID: ${follow.feed_id}</span>
                <button class="delete-btn" onclick="unfollowFeed('${follow.id}')">Unfollow</button>
            `;
            listContainer.appendChild(li);
        });

    } catch (err) {
        listContainer.innerHTML = `<li style="color: red;">Error: ${err.message}</li>`;
    }
}

// 2. POST Request: Follow a Feed
async function followFeed() {
    const feedId = document.getElementById("feedIdInput").value;
    if (!feedId) return alert("Please enter a Feed UUID");

    try {
        const response = await fetch(`${BASE_URL}/feed_follows`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ feed_id: feedId }) // Converting JSON data structure back to a plain string for the wire
        });

        if (!response.ok) throw new Error("Could not follow feed.");

        alert("Successfully followed feed!");
        document.getElementById("feedIdInput").value = "";
        fetchFollowedFeeds(); // Auto refresh layout
    } catch (err) {
        alert(err.message);
    }
}

// 3. DELETE Request: Unfollow a Feed using the dynamic URL param
async function unfollowFeed(feedFollowId) {
    if (!confirm("Are you sure you want to unfollow this feed?")) return;

    try {
        const response = await fetch(`${BASE_URL}/feed_follows/${feedFollowId}`, {
            method: "DELETE",
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Could not delete subscription.");

        alert("Unfollowed successfully!");
        fetchFollowedFeeds(); // Auto refresh layout
    } catch (err) {
        alert(err.message);
    }
}

// Attach Event Listeners to UI Buttons
document.getElementById("btnFetchFollows").addEventListener("click", fetchFollowedFeeds);
document.getElementById("btnFollow").addEventListener("click", followFeed);