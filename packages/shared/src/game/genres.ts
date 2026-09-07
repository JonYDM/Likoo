/**
 * Géneros disponibles para el juego. Se usan como filtro `genre:` en el search
 * de Spotify (search q=genre:rock type=track). Ya NO son IDs de playlists
 * editoriales (esos endpoints se removieron en dev mode).
 *
 * `query`: valor que va al filtro genre:. `label`: lo que ve el usuario.
 */
export interface GenreOption {
  query: string
  label: string
}

export const GENRES: GenreOption[] = [
  { query: "pop", label: "Pop" },
  { query: "rock", label: "Rock" },
  { query: "hip-hop", label: "Hip-Hop" },
  { query: "reggaeton", label: "Reggaetón" },
  { query: "latin", label: "Latino" },
  { query: "electronic", label: "Electrónica" },
  { query: "r-n-b", label: "R&B" },
  { query: "indie", label: "Indie" },
  { query: "metal", label: "Metal" },
  { query: "jazz", label: "Jazz" },
  { query: "classical", label: "Clásica" },
  { query: "k-pop", label: "K-Pop" },
]
