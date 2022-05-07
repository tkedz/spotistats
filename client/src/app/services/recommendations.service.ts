import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { AlbumResponse, TrackResponse } from './spotify.service';

interface Set {
  type: string,
  data: Array<AlbumResponse> | Array<TrackResponse>
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationsService {

  constructor(private http: HttpClient) { }

  getRecommendations(user: User, set: Array<Set>): Observable<Array<TrackResponse>> {
    console.log(set);
    const authHeader = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
    });

    return this.http.post<Array<TrackResponse>>(`http://localhost:5001/mgr-backend/us-central1/api/recommendations`, set, {
      headers: authHeader
    })
  }
}
