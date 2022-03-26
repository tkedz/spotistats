import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../models/user.model';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';

export interface TrackResponse {
  artists: string[];
  name: string;
  preview_url: string;
  played_at?: string;
  popularity?: number;
  spotifyURL: string;
  spotifyURI: SafeUrl;
  image: string;
}

export interface ArtistResponse {
  name: string;
  popularity: number;
  image: string;
  genres: string[];
  followers: number;
  spotifyURL: string;
  spotifyURI: SafeUrl;
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getRecentlyPlayedTracks(user: User): Observable<Array<TrackResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.firebaseToken}`,
    });

    return this.http
      .get<any>(
        'http://localhost:5001/mgr-backend/us-central1/api/recently-played',
        {
          headers: authHeader,
        }
      )
      .pipe(
        map((res) => {
          console.log(res)
          return res.items.map((item: any) => {
            return {
              artists: item.track.artists.map((artist: any) => {
                return artist.name;
              }),
              name: item.track.name,
              preview_url: item.track.preview_url,
              played_at: item.played_at,
              spotifyURL: item.track.external_urls.spotify,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.track.uri),
              image: item.track.album.images[0].url,
            };
          });
        })
      );
  }

  private getFavTracks(
    user: User,
    timeRange: string
  ): Observable<Array<TrackResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.firebaseToken}`,
    });

    return this.http
      .get<any>(
        `http://localhost:5001/mgr-backend/us-central1/api/top/tracks?time_range=${timeRange}&limit=50`,
        {
          headers: authHeader,
        }
      )
      .pipe(
        map((res) => {
          return res.items.map((item: any) => {
            return {
              artists: item.artists.map((artist: any) => {
                return artist.name;
              }),
              name: item.name,
              preview_url: item.preview_url,
              popularity: item.popularity,
              spotifyURL: item.external_urls.spotify,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.uri),
              image: item.album.images[0].url,
            };
          });
        })
      );
  }

  private getFavArtists(
    user: User,
    timeRange: string
  ): Observable<Array<ArtistResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.firebaseToken}`,
    });

    return this.http
      .get<any>(
        `http://localhost:5001/mgr-backend/us-central1/api/top/artists?time_range=${timeRange}&limit=50`,
        {
          headers: authHeader,
        }
      )
      .pipe(
        map((res) => {
          return res.items.map((item: any) => {
            return {
              name: item.name,
              popularity: item.popularity,
              image: item.images[0].url,
              genres: item.genres,
              followers: item.followers.total,
              spotifyURL: item.external_urls.spotify,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.uri),
            };
          });
        })
      );
  }

  getFavourite(
    what: string,
    user: User,
    timeRange: string
  ):
    | Observable<Array<ArtistResponse>>
    | Observable<Array<TrackResponse>>
    | Observable<any> {
    if (what === 'artists') {
      return this.getFavArtists(user, timeRange);
    } else {
      return this.getFavTracks(user, timeRange);
    }
  }
}
