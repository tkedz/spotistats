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
  private refreshTimer: any;

  constructor(private http: HttpClient, private router: Router) { }

  login(code: string): void {
    this.http
      .post<any>('http://localhost:5001/mgr-backend/us-central1/login', {
        code,
      })
      .subscribe(
        (userData) => {
          console.log(userData);
          const loggedUser = new User(
            userData.displayName,
            userData.id,
            userData.images as Image[],
            userData.firebaseAccessToken,
            userData.firebaseRefreshToken,
            Math.ceil(new Date().getTime() / 1000) + +userData.expiresIn!
          );
          loggedUser.save();
          this.user.next(loggedUser);
          this.autoLogout(+userData.expiresIn! * 1000);
          this.autoRefresh();
        },
        (error) => {
          //TODO login error
          console.log(error.message);
          console.log('Nie udało się zalogować, spróbuj ponownie później');
        }
      );
  }

  autoLogin() {
    const user = JSON.parse(localStorage.getItem('userData')!);

    if (user) {
      const loggedUser = new User(
        user.displayName,
        user.id,
        user.images as Image[],
        user._accessToken,
        user._refreshToken,
        +user._expiration
      );
      this.user.next(loggedUser)
      this.refresh(this.user.value);
    } 
  }


  logout() {
    this.user.value.remove();
    this.user.next(null);
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.logoutTimer = null;
    this.router.navigate(['/']);
  }

  autoLogout(expiresIn: number) {
    if(this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    this.logoutTimer = setTimeout(() => {
      if(this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      this.logout();
    }, expiresIn);
  }

  refresh(loggedUser: User) {
    if(!loggedUser) return;

    const currentDate = Math.ceil(new Date().getTime() / 1000);
    const tokenExpirationDate = loggedUser.expiration;

    if (currentDate < tokenExpirationDate) {
      console.log('refresh call');
      this.http
        .post<any>('http://localhost:5001/mgr-backend/us-central1/refresh', {
          uid: loggedUser.id,
          refreshToken: loggedUser.refreshToken,
        })
        .subscribe(
          (data) => {
            loggedUser.accessToken = data.firebaseAccessToken;
            loggedUser.save();
            this.user.next(loggedUser);
            this.autoLogout((tokenExpirationDate - currentDate) * 1000);
            this.autoRefresh();
          },
          (error) => {
            this.logout();
          }
        );
    } else {
      this.logout();
    }
  }

  autoRefresh() {
    if(this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.refreshTimer = setTimeout(() => {
      this.refresh(this.user.value);
    }, 3500 * 1000)
  }

  loginRedirect() {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${environment.spotifyClientId}&response_type=code&redirect_uri=http://localhost:4200&scope=user-top-read,user-read-recently-played`;
  }
}
