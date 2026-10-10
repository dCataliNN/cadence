import { BadgeCheck, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { ArtistCard } from "@/components/artists/ArtistCard";
import { FollowButton } from "@/components/collection/LibraryButtons";
import { PlayCollectionButtons } from "@/components/collection/PlayCollectionButtons";
import { PlaylistCard } from "@/components/playlists/PlaylistCard";
import { ExpandableTrackList } from "@/components/tracks/ExpandableTrackList";
import { Artwork } from "@/components/ui/Artwork";
import { Shelf, SectionHeading } from "@/components/ui/Shelf";
import { EmptyState } from "@/components/ui/States";
import { formatCount, pluralize } from "@/lib/format";
import { loadOr404, optional } from "@/services/music/load";
import { musicService } from "@/services/music/music.service";
import { SOURCE_NAMES, type Artist } from "@/types/music";

type Props = PageProps<"/artist/[source]/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source, id } = await params;
  const artist = await optional(musicService.getArtist(source, id), null);
  return { title: artist?.name ?? "Artist" };
}

export default async function ArtistPage({ params }: Props) {
  const { source, id } = await params;
  const artist = await loadOr404(musicService.getArtist(source, id));
  const { popularTracks, playlists, relatedArtists, ...profile } = artist;
  // Client components only need the profile, not the nested lists.
  const artistSnapshot: Artist = profile;
  const banner = artist.coverImage?.large ?? artist.coverImage?.medium;

  return (
    <div>
      <header className="border-border relative -mx-4 -mt-6 mb-8 overflow-hidden border-b px-4 pt-16 pb-8 md:-mx-8 md:-mt-8 md:px-8 md:pt-28">
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary; see Artwork
          <img
            src={banner}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-35 grayscale-[35%]"
          />
        )}
        <div className="via-background/70 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        <div className="bg-dot-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:text-left">
          <Artwork
            image={artist.image}
            size="large"
            rounded="full"
            placeholder="artist"
            eager
            className="ring-border size-40 shrink-0 shadow-[0_24px_60px_-28px_var(--primary)] ring-1 ring-offset-8 ring-offset-transparent md:size-52"
          />
          <div className="min-w-0">
            <p className="label-mono flex items-center justify-center gap-1.5 sm:justify-start">
              {artist.isVerified && <BadgeCheck className="text-primary size-3.5" />}
              <span className="text-primary">[</span>
              {artist.isVerified ? "Verified artist" : "Artist"}
              <span className="text-primary">]</span>
            </p>
            <h1 className="mt-3 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1] font-medium tracking-[-0.055em] break-words">
              {artist.name}
            </h1>
            <p className="text-muted-foreground mt-4 font-mono text-xs tracking-wide">
              {artist.followerCount !== undefined &&
                `${formatCount(artist.followerCount)} followers`}
              {artist.trackCount !== undefined && ` · ${pluralize(artist.trackCount, "track")}`}
            </p>
          </div>
        </div>
      </header>

      <PlayCollectionButtons tracks={popularTracks}>
        <FollowButton artist={artistSnapshot} />
      </PlayCollectionButtons>

      <section className="mb-10">
        <SectionHeading title="Popular" eyebrow="Most played" />
        {popularTracks.length > 0 ? (
          <ExpandableTrackList tracks={popularTracks} initial={5} showPlays />
        ) : (
          <EmptyState
            title="No tracks yet"
            description={`${artist.name} hasn't released any public tracks.`}
          />
        )}
      </section>

      {playlists.length > 0 && (
        <Shelf title="Albums & playlists">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </Shelf>
      )}

      {relatedArtists.length > 0 && (
        <Shelf title="Fans also like">
          {relatedArtists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </Shelf>
      )}

      {(artist.bio || artist.location) && (
        <section className="bg-card mb-10 max-w-3xl rounded-xl p-6">
          <SectionHeading title="About" eyebrow="Profile" className="mb-4" />
          {artist.location && (
            <p className="text-muted-foreground mb-3 flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" /> {artist.location}
            </p>
          )}
          {artist.bio && (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {artist.bio}
            </p>
          )}
        </section>
      )}

      {artist.externalUrl && (
        <p className="text-subtle text-xs">
          Profile from {SOURCE_NAMES[artist.source]} ·{" "}
          <a
            href={artist.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground underline"
          >
            View on {SOURCE_NAMES[artist.source]}
          </a>
        </p>
      )}
    </div>
  );
}
