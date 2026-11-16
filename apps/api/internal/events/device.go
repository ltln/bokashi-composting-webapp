package events

import (
	"net/http"
	"strings"
)

// Device types stored in web_access_logs.device_type.
const (
	DeviceMobile  = "mobile"
	DeviceTablet  = "tablet"
	DeviceDesktop = "desktop"
)

// maxDeviceInfoLen caps device_info; the value is only ever "OS / browser".
const maxDeviceInfoLen = 64

// DeviceType classifies a request as mobile, tablet or desktop from the
// Sec-CH-UA-Mobile client hint and the User-Agent. The client never chooses
// this value.
//
// Sec-CH-UA-Mobile: ?1 is authoritative for mobile. Otherwise tablet
// signatures in the UA win (Android tablets send ?0), then ?0 means desktop,
// then the UA decides for browsers that send no hints (Safari, Firefox).
func DeviceType(h http.Header) string {
	chMobile := strings.TrimSpace(h.Get("Sec-CH-UA-Mobile"))
	if chMobile == "?1" {
		return DeviceMobile
	}
	ua := h.Get("User-Agent")
	if isTabletUA(ua) {
		return DeviceTablet
	}
	if chMobile == "?0" {
		return DeviceDesktop
	}
	if isMobileUA(ua) {
		return DeviceMobile
	}
	return DeviceDesktop
}

func isTabletUA(ua string) bool {
	switch {
	case strings.Contains(ua, "iPad"),
		strings.Contains(ua, "Tablet"),
		strings.Contains(ua, "Kindle"),
		strings.Contains(ua, "Silk/"):
		return true
	case strings.Contains(ua, "Android") && !strings.Contains(ua, "Mobile"):
		return true
	}
	return false
}

func isMobileUA(ua string) bool {
	for _, s := range []string{"Mobi", "iPhone", "iPod", "Android", "Windows Phone", "Opera Mini"} {
		if strings.Contains(ua, s) {
			return true
		}
	}
	return false
}

// DeviceInfo returns a coarse "OS / browser" label (for example
// "iOS / Safari"), never the full User-Agent and never version numbers, so
// it cannot be used as a fingerprint.
func DeviceInfo(h http.Header) string {
	ua := h.Get("User-Agent")
	s := osName(ua) + " / " + browserName(ua)
	if len(s) > maxDeviceInfoLen {
		s = s[:maxDeviceInfoLen]
	}
	return s
}

func osName(ua string) string {
	switch {
	case strings.Contains(ua, "iPhone"), strings.Contains(ua, "iPad"), strings.Contains(ua, "iPod"):
		return "iOS"
	case strings.Contains(ua, "Android"):
		return "Android"
	case strings.Contains(ua, "Windows"):
		return "Windows"
	case strings.Contains(ua, "CrOS"):
		return "ChromeOS"
	case strings.Contains(ua, "Macintosh"), strings.Contains(ua, "Mac OS X"):
		return "macOS"
	case strings.Contains(ua, "Linux"):
		return "Linux"
	}
	return "Other"
}

func browserName(ua string) string {
	// Order matters: most Chromium browsers also claim "Chrome" and "Safari".
	switch {
	case strings.Contains(ua, "Edg/"), strings.Contains(ua, "EdgA/"), strings.Contains(ua, "EdgiOS/"):
		return "Edge"
	case strings.Contains(ua, "OPR/"), strings.Contains(ua, "Opera"):
		return "Opera"
	case strings.Contains(ua, "SamsungBrowser/"):
		return "Samsung Internet"
	case strings.Contains(ua, "coc_coc_browser/"):
		return "Coc Coc"
	case strings.Contains(ua, "FxiOS/"), strings.Contains(ua, "Firefox/"):
		return "Firefox"
	case strings.Contains(ua, "CriOS/"), strings.Contains(ua, "Chrome/"), strings.Contains(ua, "Chromium/"):
		return "Chrome"
	case strings.Contains(ua, "Safari/"):
		return "Safari"
	}
	return "Other"
}
