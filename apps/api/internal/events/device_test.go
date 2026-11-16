package events

import (
	"io"
	"log/slog"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/ltln/bokashi-composting-webapp/apps/api/internal/app"
)

func testDeps() *app.Deps {
	return &app.Deps{Logger: slog.New(slog.NewTextHandler(io.Discard, nil))}
}

const (
	uaIPhoneSafari  = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
	uaIPhoneChrome  = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1"
	uaIPad          = "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
	uaAndroidPhone  = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
	uaAndroidTablet = "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
	uaSamsung       = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36"
	uaFirefoxPhone  = "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0"
	uaWinChrome     = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
	uaWinEdge       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.2849.68"
	uaMacSafari     = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
	uaMacFirefox    = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0"
	uaLinuxOpera    = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/115.0.0.0"
	uaCrOS          = "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
	uaCocCoc        = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/131.0.200 Chrome/130.0.0.0 Safari/537.36"
)

func TestDevice(t *testing.T) {
	cases := []struct {
		name, ua, chMobile string
		wantType, wantInfo string
	}{
		{"iphone safari (no hints)", uaIPhoneSafari, "", "mobile", "iOS / Safari"},
		{"iphone chrome", uaIPhoneChrome, "", "mobile", "iOS / Chrome"},
		{"ipad", uaIPad, "", "tablet", "iOS / Safari"},
		{"android phone with hint", uaAndroidPhone, "?1", "mobile", "Android / Chrome"},
		{"android phone hint only", "", "?1", "mobile", "Other / Other"},
		{"android tablet sends ?0", uaAndroidTablet, "?0", "tablet", "Android / Chrome"},
		{"samsung internet", uaSamsung, "?1", "mobile", "Android / Samsung Internet"},
		{"firefox android (no hints)", uaFirefoxPhone, "", "mobile", "Android / Firefox"},
		{"windows chrome", uaWinChrome, "?0", "desktop", "Windows / Chrome"},
		{"windows edge", uaWinEdge, "?0", "desktop", "Windows / Edge"},
		{"mac safari", uaMacSafari, "", "desktop", "macOS / Safari"},
		{"mac firefox", uaMacFirefox, "", "desktop", "macOS / Firefox"},
		{"linux opera", uaLinuxOpera, "?0", "desktop", "Linux / Opera"},
		{"chromeos", uaCrOS, "?0", "desktop", "ChromeOS / Chrome"},
		{"coc coc", uaCocCoc, "?0", "desktop", "Windows / Coc Coc"},
		{"phone in desktop mode", uaWinChrome, "?0", "desktop", "Windows / Chrome"},
		{"empty", "", "", "desktop", "Other / Other"},
		{"curl", "curl/8.5.0", "", "desktop", "Other / Other"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			h := http.Header{}
			if c.ua != "" {
				h.Set("User-Agent", c.ua)
			}
			if c.chMobile != "" {
				h.Set("Sec-CH-UA-Mobile", c.chMobile)
			}
			if got := DeviceType(h); got != c.wantType {
				t.Errorf("DeviceType = %q, want %q", got, c.wantType)
			}
			got := DeviceInfo(h)
			if got != c.wantInfo {
				t.Errorf("DeviceInfo = %q, want %q", got, c.wantInfo)
			}
			if len(got) > maxDeviceInfoLen || strings.ContainsAny(got, "0123456789") {
				t.Errorf("DeviceInfo %q leaks versions or is too long", got)
			}
		})
	}
}

func TestUserHash(t *testing.T) {
	id := uuid.MustParse("3b241101-e2bb-4255-8caf-4136c566a962")
	secret := []byte("test-secret")

	a, b := UserHash(secret, id), UserHash(secret, id)
	if a != b {
		t.Fatalf("hash not stable: %s vs %s", a, b)
	}
	// Known answer, computed independently:
	//   printf %s 3b241101-e2bb-4255-8caf-4136c566a962 | openssl dgst -sha256 -hmac test-secret
	if want := "57b7345a57a5121214380cec86496a8c5541f73a90848382530aad25515355de"; a != want {
		t.Errorf("UserHash = %s, want %s", a, want)
	}
	if len(a) != 64 || strings.Trim(a, "0123456789abcdef") != "" {
		t.Errorf("not lowercase hex sha256: %q", a)
	}
	if UserHash([]byte("other-secret"), id) == a {
		t.Error("hash does not depend on the secret")
	}
	if UserHash(secret, uuid.New()) == a {
		t.Error("hash does not depend on the user")
	}
	if strings.Contains(a, id.String()) {
		t.Error("hash contains the raw id")
	}
}
