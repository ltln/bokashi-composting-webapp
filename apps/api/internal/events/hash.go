package events

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"

	"github.com/google/uuid"
)

// UserHash returns hex(HMAC-SHA256(secret, userID)). It lets admins count
// unique users without storing the user id, email or name in the logs.
func UserHash(secret []byte, userID uuid.UUID) string {
	m := hmac.New(sha256.New, secret)
	m.Write([]byte(userID.String()))
	return hex.EncodeToString(m.Sum(nil))
}
