import { Injectable } from '@angular/core';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const environment = {
  firebase: {
    apiKey: "AIzaSyDE2tWDNCDrY6O20EWrDt-NkvZmCm_MR10",
    authDomain: "isaacbarbearia-admin.firebaseapp.com",
    projectId: "isaacbarbearia-admin",
    storageBucket: "isaacbarbearia-admin.firebasestorage.app",
    messagingSenderId: "308982033120",
    appId: "1:308982033120:web:38b82c1a3ca9e933be7e85"
  }
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private auth = getAuth(this.app);
  private firestore = getFirestore(this.app);

  constructor() { }

  // Autenticação
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          reject(null);
        }
      });
    });
  }

  // Profissionais
  async addProfissional(data: any) {
    return addDoc(collection(this.firestore, 'profissionais'), data);
  }

  async getProfissionais() {
    const snapshot = await getDocs(collection(this.firestore, 'profissionais'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateProfissional(id: string, data: any) {
    return updateDoc(doc(this.firestore, 'profissionais', id), data);
  }

  async deleteProfissional(id: string) {
    return deleteDoc(doc(this.firestore, 'profissionais', id));
  }

  // Parceiros
  async addParceiro(data: any) {
    return addDoc(collection(this.firestore, 'parceiros'), data);
  }

  async getParceiros() {
    const snapshot = await getDocs(collection(this.firestore, 'parceiros'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateParceiro(id: string, data: any) {
    return updateDoc(doc(this.firestore, 'parceiros', id), data);
  }

  async deleteParceiro(id: string) {
    return deleteDoc(doc(this.firestore, 'parceiros', id));
  }

  // Participação Comunitária
  async addParticipacao(data: any) {
    return addDoc(collection(this.firestore, 'participacoes'), data);
  }

  async getParticipacoes() {
    const snapshot = await getDocs(collection(this.firestore, 'participacoes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateParticipacao(id: string, data: any) {
    return updateDoc(doc(this.firestore, 'participacoes', id), data);
  }

  async deleteParticipacao(id: string) {
    return deleteDoc(doc(this.firestore, 'participacoes', id));
  }

  // Avaliações
  async addAvaliacao(uid: string, data: any) {
    return setDoc(doc(this.firestore, 'avaliacoes', uid), data);
  }

  async getAvaliacoes() {
    const snapshot = await getDocs(collection(this.firestore, 'avaliacoes'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteAvaliacao(id: string) {
    return deleteDoc(doc(this.firestore, 'avaliacoes', id));
  }
}
