package main

import "net/http"

func handlerReadiness(w http.ResponseWriter, r *http.Request) {
	type respond struct {
		Status string `json:"status"`
	}
	respondWithJSON(w, http.StatusOK, respond{
		Status: "ok",
	})
}
