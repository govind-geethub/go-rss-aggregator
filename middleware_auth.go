// created a new middleware to dry up the code
// instead of copying the code of getUserHandler everytime
package main

import (
	"fmt"
	"net/http"

	"github.com/govind-geethub/go-rss-aggregator/internal/auth"
	"github.com/govind-geethub/go-rss-aggregator/internal/database"
)

type authedHandler func(http.ResponseWriter, *http.Request, database.User)

func (cfg *apiConfig) middlewareAuth(handler authedHandler) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		// to register an acc. don't need an api key
		// to get your own user info we need api key
		// last end point so to abstarct its logic we created a package for it
		apiKey, err := auth.GetAPIKey(r.Header)
		if err != nil {
			respondWithError(w, 403, fmt.Sprintf("Auth error: %v", err))
			return
		}

		user, err := cfg.DB.GetUserByAPIKey(r.Context(), apiKey)
		if err != nil {
			respondWithError(w, 400, fmt.Sprintf("couldn't get user: %v", err))
			return
		}

		handler(w, r, user)
	}
}
