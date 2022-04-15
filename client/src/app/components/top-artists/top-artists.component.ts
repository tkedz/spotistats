import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import {
  SpotifyService,
  ArtistResponse,
} from 'src/app/services/spotify.service';
import { User } from 'src/app/models/user.model';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-stats',
  templateUrl: './top-artists.component.html',
  styleUrls: ['./top-artists.component.css'],
})
export class TopArtistsComponent implements OnInit {
  user: User = null;
  userSub: Subscription;
  top3artists: Array<ArtistResponse> = [];
  artists: Array<ArtistResponse> = [];
  error: boolean = false;

  constructor(
    private authService: AuthService,
    private spotifyService: SpotifyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.error = false;

    this.userSub = this.authService.user.pipe(take(1)).subscribe((user) => {
      this.user = user;
      
      this.route.queryParamMap.subscribe(params => {
        const timeRange = params.get('timeRange');
        this.onGetFavArtists(timeRange);
      });
    });

  }

  onGetFavArtists(timeRange: string) {
    this.error = false;

    this.spotifyService.getFavourite('artists', this.user, timeRange).subscribe(
      (res) => {
        console.log(res);
        this.top3artists = res.slice(0, 3);
        this.artists = res.slice(3);
      },
      (err) => {this.error = true;}
    );
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }
}
