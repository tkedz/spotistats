import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';
import {
  SpotifyService,
  TrackResponse,
} from 'src/app/services/spotify.service';

@Component({
  selector: 'app-recently-listened',
  templateUrl: './recently-listened.component.html',
  styleUrls: ['./recently-listened.component.css'],
})
export class RecentlyListenedComponent implements OnInit, OnDestroy {
  user: User = null;
  userSub: Subscription;
  tracks: Array<TrackResponse> = [];
  isLoaded: boolean = false;
  error: boolean = false;

  constructor(
    private authService: AuthService,
    private spotifyService: SpotifyService
  ) {}

  ngOnInit(): void {
    this.error = false;

    this.userSub = this.authService.user.subscribe((user) => {
      this.user = user;
    });

    this.onGetRecentlyPlayed();
  }
  
  
  onGetRecentlyPlayed(): void {
    this.spotifyService
    .getRecentlyPlayedTracks(this.user)
    .subscribe((tracks) => {
      this.tracks = tracks;
      console.log(tracks);
      this.isLoaded = true;
    }, (err) => {
      this.error = true;
    })
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }
}
