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
    private _firebaseToken: string,
    private _expiration: number
  ) {}

  // get spotifyToken() {
  //   return this._spotifyToken;
  // }

  get firebaseToken() {
    return this._firebaseToken;
  }

  get expiration() {
    return this._expiration;
  }

  get img() {
    return this.images[0].url;
  }
}
