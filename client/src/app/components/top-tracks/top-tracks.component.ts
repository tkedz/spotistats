import { Component, OnInit } from '@angular/core';
import {
  TrackResponse,
  SpotifyService,
} from 'src/app/services/spotify.service';
import { User } from 'src/app/models/user.model';
import { AuthService } from 'src/app/auth/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-top-tracks',
  templateUrl: './top-tracks.component.html',
  styleUrls: ['./top-tracks.component.css'],
})
export class TopTracksComponent implements OnInit {
  user: User = null;
  top3tracks: Array<TrackResponse> = [];
  tracks: Array<TrackResponse> = [];

  constructor(
    private authService: AuthService,
    private spotifyService: SpotifyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.user.subscribe((user) => {
      this.user = user;
    });

    this.route.queryParamMap.subscribe(params => {
      const timeRange = params.get('timeRange');
      this.onGetFavTracks(timeRange);
    });
  }

  onGetFavTracks(timeRange: string) {
    this.spotifyService.getFavourite('tracks', this.user, timeRange).subscribe(
      (res) => {
        console.log(res);
        this.top3tracks = res.slice(0, 3);
        this.tracks = res.slice(3);
      },
      (err) => console.log(err)
    );
  }
}