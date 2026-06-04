# Go RSS Feed Aggregator

A lightweight, concurrent RSS feed aggregator built in Go. It background-scrapes RSS feeds efficiently using goroutines, parses the XML, and stores articles in a PostgreSQL database via a REST API.

## ✨ Features
* **Concurrent Fetching:** Uses goroutines and channels to safely background-scrape multiple feeds simultaneously.
* **User & Feed Management:** API-key authenticated endpoints to create users, add feeds, and follow/unfollow feeds.
* **Type-Safe Database:** Built using PostgreSQL and SQLC for type-safe query generation.

## 🛠️ Tech Stack
* **Backend:** Go (Golang)
* **Database:** PostgreSQL
* **Tools:** SQLC (SQL generator), Goose (migrations)
