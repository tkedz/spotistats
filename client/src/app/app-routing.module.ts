import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { AppComponent } from './app.component';
import { FrontpageComponent } from './components/frontpage/frontpage.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RecentlyListenedComponent } from './components/recently-listened/recently-listened.component';
import { TopArtistsComponent } from './components/top-artists/top-artists.component';
import { ComparisionProfileComponent } from './components/comparision-profile/comparision-profile.component';
import { CompareComponent } from './components/compare/compare.component';
import { TopTracksComponent } from './components/top-tracks/top-tracks.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';

const routes: Routes = [
  { path: '', component: FrontpageComponent, pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  {
    path: 'me',
    component: ProfileComponent,
    children: [
      { path: '', component: RecentlyListenedComponent },
      { path: 'top-artists', component: TopArtistsComponent },
      { path: 'top-tracks', component: TopTracksComponent },
      { path: 'comparision', component: ComparisionProfileComponent },
    ],
  },
  {
    path: 'compare/:id',
    component: CompareComponent,
  },
  {
    path: 'recommendations',
    component: RecommendationsComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
