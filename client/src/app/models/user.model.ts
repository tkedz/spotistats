export interface Image {
  height: number;
  url: string;
  width: number;
}

export class User {
  constructor(
    public displayName: string,
    public id: string,
    private images: Image[],
    //private _spotifyToken: string,
    private _accessToken: string,
    private _refreshToken:string,
    private _expiration: number
  ) {}

  // get spotifyToken() {
  //   return this._spotifyToken;
  // }

  get accessToken() {
    return this._accessToken;
  }

  
  set accessToken(v) {
    this._accessToken = v;
  }
  
  get refreshToken() {
    return this._refreshToken;
  }

  get expiration() {
    return this._expiration;
  }

  get img() {
    return this.images[0].url;
  }

  save() {
    localStorage.setItem('userData', JSON.stringify(this))
  }

  remove() {
    localStorage.removeItem('userData');
  }

  static checkStorage(): boolean {
    if(localStorage.getItem('userData')) 
      return true;
    else return false;
  }
}
