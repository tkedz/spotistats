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
  // played_at?: string;
  popularity?: number;
  spotifyURL: string;
  spotifyURI: SafeUrl;
  image: string;
  id: string;
}

export interface ArtistResponse {
  name: string;
  popularity: number;
  image: string;
  genres: string[];
  followers: number;
  spotifyURL: string;
  spotifyURI: SafeUrl;
  id: string;
}

export interface AlbumResponse {
  name: string,
  artists: Array<string>
  image: string,
  spotifyURL: string,
  spotifyURI: SafeUrl,
  id: string,
}

interface PartialCompare {
  topArtists: Array<ArtistResponse>,
  topTracks: Array<TrackResponse>,
  favGenres: Array<string>,
  mostPopularArtists: Array<ArtistResponse>,
  leastPopularArtists: Array<ArtistResponse>,
  mostPopularTracks: Array<TrackResponse>,
  leastPopularTracks: Array<TrackResponse>
}

export interface CompareResponse {
  short: {
    [key: string]: PartialCompare | any[],
    artistsIntersection: Array<ArtistResponse>,
    tracksIntersection: Array<TrackResponse>,
  },
  medium: {
    [key: string]: PartialCompare | any[],
    artistsIntersection: Array<ArtistResponse>,
    tracksIntersection: Array<TrackResponse>,
  },
  long: {
    [key: string]: PartialCompare | any[],
    artistsIntersection: Array<ArtistResponse>,
    tracksIntersection: Array<TrackResponse>,
  },
  comparedUserAvatar: string
}

export interface SearchResponse {
  albums: Array<AlbumResponse>,
  tracks: Array<TrackResponse>
}

@Injectable({
  providedIn: 'root',
})
export class SpotifyService {
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  getRecentlyPlayedTracks(user: User): Observable<Array<TrackResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
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
          console.log(res);
          return res.map((item:any) =>  {
            return {
              ...item,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.spotifyURI)
            }
          })
        })
      );
  }

  private getFavTracks(
    user: User,
    timeRange: string
  ): Observable<Array<TrackResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
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
          return res.map((item:any) =>  {
            return {
              ...item,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.spotifyURI)
            }
          })
        })
      );
  }

  private getFavArtists(
    user: User,
    timeRange: string
  ): Observable<Array<ArtistResponse>> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
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
          return res.map((item:any) =>  {
            return {
              ...item,
              spotifyURI: this.sanitizer.bypassSecurityTrustUrl(item.spotifyURI)
            }
          })
        })
      );
  }

  getFavourite(
    what: string,
    user: User,
    timeRange: string
  ): Observable<Array<ArtistResponse>> | Observable<Array<TrackResponse>> | Observable<any> {
    if (what === 'artists') {
      return this.getFavArtists(user, timeRange);
    } else {
      return this.getFavTracks(user, timeRange);
    }
  }

  private iterateToAllowURI(obj: any) {
    Object.keys(obj).forEach((key: string) => {

    if(key === 'spotifyURI') obj[key] = this.sanitizer.bypassSecurityTrustUrl(obj[key]);

    if (typeof obj[key] === 'object' && obj[key] !== null) {
            this.iterateToAllowURI(obj[key])
        }
    })
  }

  compare(user: User, comparedUser: string): Observable<CompareResponse> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
    });

    return this.http.get<CompareResponse>(
      `http://localhost:5001/mgr-backend/us-central1/api/compare/${comparedUser}`, {headers: authHeader}
    ).pipe(tap(res => {
        this.iterateToAllowURI(res);
    }));
  }

  search(user: User, query: string): Observable<SearchResponse> {
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
    });

    return this.http.get<SearchResponse>(
      `http://localhost:5001/mgr-backend/us-central1/api/search?q=${query}`, {headers: authHeader}
    ).pipe(tap(res => {
        this.iterateToAllowURI(res)
    }));
  }
}
