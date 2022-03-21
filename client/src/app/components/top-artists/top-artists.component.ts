import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import {
  SpotifyService,
  ArtistResponse,
} from 'src/app/services/spotify.service';
import { User } from 'src/app/models/user.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-stats',
  templateUrl: './top-artists.component.html',
  styleUrls: ['./top-artists.component.css'],
})
export class TopArtistsComponent implements OnInit {
  user: User = null;
  top3artists: Array<ArtistResponse> = [];
  artists: Array<ArtistResponse> = [];

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
      this.onGetFavArtists(timeRange);
    });
  }

  onGetFavArtists(timeRange: string) {
    this.spotifyService.getFavourite('artists', this.user, timeRange).subscribe(
      (res) => {
        console.log(res);
        this.top3artists = res.slice(0, 3);
        this.artists = res.slice(3);
      },
      (err) => console.log(err)
    );
  }
}
