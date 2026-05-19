import { describe, expect, it } from "vitest";
import { parseRecentlyAdded } from "@/lib/plex";

describe("parseRecentlyAdded", () => {
  it("separates recently added movies and episodes", () => {
    const xml = `
      <MediaContainer>
        <Video type="movie" ratingKey="1" title="Heat" year="1995" duration="10200000" addedAt="1716044400" thumb="/library/metadata/1/thumb" contentRating="R" />
        <Video type="episode" ratingKey="2" title="Pilot" grandparentTitle="Silo" parentIndex="1" index="1" year="2023" duration="3000000" addedAt="1716134400" grandparentThumb="/library/metadata/2/thumb" contentRating="TV-14" />
      </MediaContainer>
    `;

    const result = parseRecentlyAdded(xml);

    expect(result.movies).toHaveLength(1);
    expect(result.movies[0]).toMatchObject({
      id: "1",
      title: "Heat",
      duration: "2h 50m",
      posterUrl: "/api/plex/image?path=%2Flibrary%2Fmetadata%2F1%2Fthumb",
    });

    expect(result.shows).toHaveLength(1);
    expect(result.shows[0]).toMatchObject({
      id: "2",
      title: "Silo",
      subtitle: "S01E01 - Pilot",
      rating: "TV-14",
    });
  });
});
