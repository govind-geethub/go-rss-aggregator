package auth

import (
	"errors"
	"net/http"
	"strings"
)

// extarcts an api key from headers
// of an HTTP request
// example: authorization(header) : ApiKey {string}   {insert apikey here}
func GetAPIKey(headers http.Header) (string, error) {

	// find the value associated with auth key
	val := headers.Get("Authorization")
	if val == "" {
		return "", errors.New("no Authentication info found")
	}

	vals := strings.Split(val, " ") // string and delimiter: split accor. to spaces

	if len(vals) != 2 {
		return "", errors.New("malformed auth header")
		// string should be split in 2 {key,val}
	}

	if vals[0] != "ApiKey" {
		return "", errors.New("malformed first part of auth header")
	}

	return vals[1], nil
}
