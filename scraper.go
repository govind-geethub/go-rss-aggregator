package main

import (
	"context"
	"database/sql"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/govind-geethub/go-rss-aggregator/internal/database"
)

// concurrency int : how many goroutines we want to do the scraping on
func startScraping(db *database.Queries, concurrency int, timeBetweenRequest time.Duration) {

	log.Printf("Scraping on %v goroutines every %s duration", concurrency, timeBetweenRequest)

	ticker := time.NewTicker(timeBetweenRequest)
	for ; ; <-ticker.C { // ticker channel every givenTime val will be sent accross the channel
		// context.Background() : global context if we don't have access to scoped context

		feeds, err := db.GetNextFeedsToFetch(context.Background(), int32(concurrency))
		if err != nil {
			log.Println("error fetching feeds: ", err)
			continue // startScraping should always be running to fetch
		}

		// fecthing each individually at the same time
		// synchronization mechanism
		wg := &sync.WaitGroup{}
		for _, feed := range feeds {
			wg.Add(1) // adding 1 to all as done decrements the by 1
			go scrapeFeed(db, wg, feed)
		}
		wg.Wait()
	}
}

func scrapeFeed(db *database.Queries, wg *sync.WaitGroup, feed database.Feed) {
	defer wg.Done()

	// mark the feed that is getting fetched
	_, err := db.MarkFeedAsFetched(context.Background(), feed.ID)
	if err != nil {
		log.Println("error marking feed as fetched: ", err)
		return
	}

	// scrape to feed
	rssFeed, err := urlToFeed(feed.Url)
	if err != nil {
		log.Println("error fetching feed: ", err)
		return
	}

	for _, item := range rssFeed.Channel.Item {

		description := sql.NullString{}
		if item.Description != "" {
			description.String = item.Description
			description.Valid = true
		}

		// RFC is a layout for parsing and formatting timestamps
		pubAt, err := time.Parse(time.RFC1123Z, item.PubDate)
		if err != nil {
			pubAt, err = time.Parse(time.RFC1123, item.PubDate)
			if err != nil {
				log.Printf("couldn't parse date %v, falling back to current time", item.PubDate)
				pubAt = time.Now().UTC()
			}
		}

		_, err = db.CreatePost(context.Background(),
			database.CreatePostParams{
				ID:          uuid.New(),
				CreatedAt:   time.Now().UTC(),
				UpdatedAt:   time.Now().UTC(),
				Title:       item.Title,
				Description: description,
				PublishedAt: pubAt, // string needs to parsed
				Url:         item.Link,
				FeedID:      feed.ID,
			})

		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") {
				continue
			}
			log.Println("failed to create post:", err)
		}
	}

	log.Printf("Feed %s collected, %v postes found", feed.Name, len(rssFeed.Channel.Item))
}

// now hooking the startScraping function to main file
