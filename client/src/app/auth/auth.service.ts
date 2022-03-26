import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { User, Image } from '../models/user.model';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private logoutTimer: any;

  constructor(private http: HttpClient, private router: Router) {
  }

  // login(fragment: string) {
  //   //console.log('FRAGMENT ' + fragment);
  //   const accessToken = new URLSearchParams(fragment).get('access_token');
  //   const expiresIn = new URLSearchParams(fragment).get('expires_in');

  //   if (!accessToken) {
  //     return; //this.user.next(null);
  //   }

  //   //this.persistToken(accessToken, expiresIn);
  //   this.http
  //     .get<any>('https://api.spotify.com/v1/me', {
  //       headers: new HttpHeaders({ Authorization: `Bearer ${accessToken}` }),
  //     })
  //     .subscribe(
  //       (userData) => {
  //         //console.log(userData);
  //         const loggedUser = new User(
  //           userData.display_name,
  //           userData.id,
  //           userData.images as Image[],
  //           accessToken,
  //           Math.ceil(new Date().getTime() / 1000) + +expiresIn!
  //         );
  //         this.user.next(loggedUser);
  //         localStorage.setItem('userData', JSON.stringify(loggedUser));
  //         this.autoLogout(+expiresIn! * 1000);
  //       },
  //       (error) => console.log(error)
  //     );
  // }

  login(code: string) {
    //console.log(code);
    this.http.post<any>('http://localhost:5001/mgr-backend/us-central1/login',{code}).subscribe((userData)=>{
      console.log(userData)
      const loggedUser = new User(
        userData.displayName,
        userData.id,
        userData.images as Image[],
        //userData.spotifyAccessToken,
        userData.firebaseAccessToken,
        Math.ceil(new Date().getTime() / 1000) + +userData.expiresIn!
      );
      this.user.next(loggedUser);
      localStorage.setItem('userData', JSON.stringify(loggedUser));
      this.autoLogout(+userData.expiresIn! * 1000);
    }, (error) => {
      //TODO login error
      console.log('Nie udało się zalogować, spróbuj ponownie później')});
  }

  autoLogin() {
    const user = JSON.parse(localStorage.getItem('userData')!);

    if (user) {
      const loggedUser = new User(
        user.displayName,
        user.id,
        user.images as Image[],
        //user._spotifyToken,
        user._firebaseToken,
        +user._expiration
      );
      const currentDate = Math.ceil(new Date().getTime() / 1000);
      const tokenExpirationDate = +user._expiration;

      if (currentDate < tokenExpirationDate) {
        this.user.next(loggedUser);
        this.autoLogout((tokenExpirationDate - currentDate) * 1000);
      } else {
        this.logout();
      }
    }
  }

  logout() {
    this.user.next(null);
    localStorage.removeItem('userData');
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.logoutTimer = null;
    this.router.navigate(['/']);
  }

  autoLogout(expiresIn: number) {
    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, expiresIn);
  }

  loginRedirect() {
    // window.location.href = `https://accounts.spotify.com/authorize?client_id=${environment.spotifyClientId}&response_type=token&redirect_uri=http://localhost:4200/&scope=user-top-read,user-read-recently-played`;
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${environment.spotifyClientId}&response_type=code&redirect_uri=http://localhost:4200&scope=user-top-read,user-read-recently-played`;
  }
}
