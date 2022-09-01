import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/models/user.model';
import { RecommendationsService } from 'src/app/services/recommendations.service';
import {
  AlbumResponse,
  SpotifyService,
  TrackResponse,
} from 'src/app/services/spotify.service';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.css'],
})
export class RecommendationsComponent implements OnInit, OnDestroy {
  user: User = null;
  userSub: Subscription;
  searchValue: string = '';
  albums: Array<AlbumResponse> = [];
  tracks: Array<TrackResponse> = [];
  selected: Array<any> = [];
  recommendations: Array<TrackResponse> = [];
  displayModal: boolean = false;
  recommendationsError: boolean = false;
  generatingRecommendations: boolean = false;
  searching: boolean = false;
  searchError: boolean = false;

  constructor(
    private authService: AuthService,
    private spotifyService: SpotifyService,
    private recommendationsService: RecommendationsService,
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.user.pipe(take(1)).subscribe((user) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
  }

  onSearch(): void {
    this.searching = true;
    this.searchError = false;

    this.spotifyService.search(this.user, this.searchValue).subscribe(
      (res) => {
        this.searching = false;
        this.albums = res.albums;
        this.tracks = res.tracks;
        console.log(this.albums, this.tracks);
      },
      (err) => {
        this.searching = false;
        this.searchError = true;
        console.log(err);
      }
    );
  }

  addToSet(index: number, type: string): void {
    const data = type === 'album' ? this.albums[index] : this.tracks[index];
    //check if item is already in set
    if (!this.selected.some((o) => o.data.id === data.id)) {
      this.selected.push({ type, data });
    }
    console.log(this.selected);
  }

  deleteFromSet(index: number): void {
    this.selected.splice(index, 1);
  }

  onGetRecommendations(): void {
    this.generatingRecommendations = true;
    this.recommendationsError = false;

    console.log(this.selected);
    const set = [];
    for(const element of this.selected) {
      set.push({type: element.type, id: element.data.id});
    }

    this.recommendationsService
      .getRecommendations(this.user, set)
      .subscribe(
        (recommendations) => {
          this.generatingRecommendations = false;
          this.recommendations = recommendations;
        },
        (err) => {
          this.generatingRecommendations = false;
          this.recommendationsError = true;
          console.log(err);
        }
      );
  }

  displayRecommendations(): void {
    this.displayModal = true;
  }

  hideRecommendations(): void {
    this.displayModal = false;
  }
}
