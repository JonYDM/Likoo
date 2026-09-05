import { describe, expect, it } from "vitest"
import { mapImage, mapPage, mapPlaylist, mapTrack } from "./client"
import type { RawPlaylist, RawTrack } from "./types"

const rawTrack: RawTrack = {
  id: "t1",
  name: "Song",
  uri: "spotify:track:t1",
  duration_ms: 210_000,
  artists: [
    { id: "a1", name: "Artist One" },
    { id: "a2", name: "Artist Two" },
  ],
  album: {
    id: "al1",
    name: "The Album",
    images: [{ url: "http://img/1", width: 640, height: 640 }],
  },
}

const rawPlaylist: RawPlaylist = {
  id: "p1",
  name: "My Playlist",
  description: "desc",
  images: [{ url: "http://img/p1", width: null, height: null }],
  owner: { id: "u1", display_name: "Jony" },
  tracks: { total: 42 },
}

describe("mapImage", () => {
  it("mapea url/width/height tal cual", () => {
    expect(mapImage({ url: "u", width: 1, height: 2 })).toEqual({
      url: "u",
      width: 1,
      height: 2,
    })
  })
})

describe("mapTrack", () => {
  it("convierte duration_ms → durationMs y aplana artists/album", () => {
    const t = mapTrack(rawTrack)
    expect(t.durationMs).toBe(210_000)
    expect(t).not.toHaveProperty("duration_ms")
    expect(t.artists).toEqual([
      { id: "a1", name: "Artist One" },
      { id: "a2", name: "Artist Two" },
    ])
    expect(t.album.name).toBe("The Album")
    expect(t.album.images[0]).toEqual({
      url: "http://img/1",
      width: 640,
      height: 640,
    })
  })
})

describe("mapPlaylist", () => {
  it("convierte display_name → displayName y tracks.total → trackCount", () => {
    const p = mapPlaylist(rawPlaylist)
    expect(p.owner).toEqual({ id: "u1", displayName: "Jony" })
    expect(p.trackCount).toBe(42)
    expect(p).not.toHaveProperty("tracks")
  })
})

describe("mapPage", () => {
  it("valida la envoltura y mapea los items", () => {
    const page = mapPage(
      {
        items: [rawTrack],
        total: 1,
        limit: 20,
        offset: 0,
        next: null,
      },
      mapTrack,
    )
    expect(page.total).toBe(1)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.durationMs).toBe(210_000)
  })

  it("lanza si la envoltura no tiene la forma esperada", () => {
    expect(() =>
      // total ausente → la validación de envoltura debe fallar
      mapPage(
        // @ts-expect-error probamos deliberadamente una envoltura inválida
        { items: [], limit: 20, offset: 0, next: null },
        mapTrack,
      ),
    ).toThrow()
  })
})
