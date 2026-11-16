package events

import "testing"

func TestValid(t *testing.T) {
	cases := []struct {
		typ, target string
		want        bool
	}{
		{"page_view", "", true},
		{"page_view", "Tab_1_Setup", false},
		{"switch_tab", "Tab_2_FAQ", true},
		{"switch_tab", "", false},
		{"view_3d_step", "3D_Setup_Layer3", true},
		{"view_3d_step", "FAQ_1_Smell", false},
		{"click_faq_3d", "FAQ_5_Disposal", true},
		{"nope", "", false},
	}
	for _, c := range cases {
		if got := Valid(c.typ, c.target); got != c.want {
			t.Errorf("Valid(%q, %q) = %v, want %v", c.typ, c.target, got, c.want)
		}
	}
	if len(EventTypes) != 4 || len(FeatureTargets) != 10 {
		t.Fatalf("got %d types / %d targets, want 4 / 10", len(EventTypes), len(FeatureTargets))
	}
}
