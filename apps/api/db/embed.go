// Package db embeds the goose SQL migrations into the API binary, so the
// image can run `api migrate` without any files on disk.
package db

import "embed"

// Migrations holds db/migrations/*.sql. Use fs.Sub(Migrations, "migrations").
//
//go:embed migrations/*.sql
var Migrations embed.FS
