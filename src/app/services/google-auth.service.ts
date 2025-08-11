import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface GoogleUserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isNewUser: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private googleProvider = new GoogleAuthProvider();

  constructor(
    private afAuth: AngularFireAuth,
    private authService: AuthService
  ) {
    // Configurar escopo do Google
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
  }

  /**
   * Realiza login com Google
   * @returns Observable com dados do usuário
   */
  signInWithGoogle(): Observable<GoogleUserData> {
    return from(this.afAuth.signInWithPopup(this.googleProvider)).pipe(
      map(result => {        
        const user = result.user;
        const isNewUser = result.additionalUserInfo?.isNewUser || false;

        if (!user || !user.uid || !user.email) {
          throw new Error('Usuário do Google inválido ou dados obrigatórios ausentes.');
        }
        
        const googleUserData = {
          uid: user?.uid,
          email: user?.email!,
          displayName: user?.displayName || '',
          photoURL: user?.photoURL || undefined,
          isNewUser
        };

        return googleUserData;
      })
    );
  }

  /**
   * Verifica se o usuário está logado
   */
  isAuthenticated(): Observable<boolean> {    
    return this.afAuth.authState.pipe(
      map(user => {
        const isAuth = !!user;
        return isAuth;
      })
    );
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser(): Observable<firebase.default.User | null> {
    return this.afAuth.authState as Observable<firebase.default.User | null>;
  }

  /**
   * Realiza logout
   */
  signOut(): Observable<void> {
    return from(this.afAuth.signOut());
  }

  /**
   * Obtém o token de autenticação
   */
  getAuthToken(): Observable<string | null> {
    return from(this.afAuth.currentUser).pipe(
      switchMap(user => {        
        if (user) {
          return from(user.getIdToken());
        } else {
          return of(null);
        }
      })
    );
  }
}
