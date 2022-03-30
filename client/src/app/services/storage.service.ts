import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { SpotifyService } from './spotify.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(
    private http: HttpClient,
    private spotifyService: SpotifyService
  ) {}

  private getDataFromSpotify(user: User) {
    return forkJoin([
      this.spotifyService.getFavourite('artists', user, 'short_term'),
      this.spotifyService.getFavourite('artists', user, 'medium_term'),
      this.spotifyService.getFavourite('artists', user, 'long_term'),
      this.spotifyService.getFavourite('tracks', user, 'short_term'),
      this.spotifyService.getFavourite('tracks', user, 'medium_term'),
      this.spotifyService.getFavourite('tracks', user, 'long_term'),
    ]).pipe(
      map(
        ([
          artistsShortTerm,
          artistsMediumTerm,
          artistsLongTerm,
          tracksShortTerm,
          tracksMediumTerm,
          tracksLongTerm,
        ]) => {
          return {
            artists: {
              shortTerm: artistsShortTerm,
              mediumTerm: artistsMediumTerm,
              longTerm: artistsLongTerm,
            },
            tracks: {
              shortTerm: tracksShortTerm,
              mediumTerm: tracksMediumTerm,
              longTerm: tracksLongTerm,
            },
          };
        }
      )
    );
  }

  saveData(user: User) {
    this.getDataFromSpotify(user).subscribe((data) => {
      this.http
        .put(`${environment.firebaseDb}/${user.id}.json`, data)
        .subscribe();
    });
  }

  fetchDataToCompare(me: User, compareWith: string) {
    console.log(compareWith);
    return forkJoin([
      this.getDataFromSpotify(me),
      this.http.get(
        `${environment.firebaseDb}/${compareWith}.json`
      ),
    ]).pipe(
      map(([myData, compareWithData]) => {
        return { myData, compareWithData };
      })
    );
  }
}
