import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { FrontpageComponent } from './components/frontpage/frontpage.component';
import { ProfileComponent } from './components/profile/profile.component';
import { RecentlyListenedComponent } from './components/recently-listened/recently-listened.component';
import { TopArtistsComponent } from './components/top-artists/top-artists.component';
import { ComparisionProfileComponent } from './components/comparision-profile/comparision-profile.component';
import { CompareComponent } from './components/compare/compare.component';
import { TopTracksComponent } from './components/top-tracks/top-tracks.component';
import { CardComponent } from './components/card/card.component';
import { RecommendationsComponent } from './components/recommendations/recommendations.component';
import { RemoveParenthesis } from './pipes/remove-parenthesis.pipe';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    HeaderComponent,
    FrontpageComponent,
    ProfileComponent,
    RecentlyListenedComponent,
    TopArtistsComponent,
    ComparisionProfileComponent,
    CompareComponent,
    TopTracksComponent,
    CardComponent,
    RecommendationsComponent,
    RemoveParenthesis,
  ],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
