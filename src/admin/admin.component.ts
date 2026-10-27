import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../services/firebase.service';
import { Router } from '@angular/router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  tabAtual = 'profissionais';
  usuarioLogado: any = null;

  profissionais: any[] = [];
  parceiros: any[] = [];
  participacoes: any[] = [];
  avaliacoes: any[] = [];

  novoProfissional = { nome: '', especialidade: '', telefone: '' };
  novoParceiro = { nome: '', descricao: '', desconto: '' };
  novaParticipacao = { titulo: '', descricao: '', data: '' };

  constructor(private firebaseService: FirebaseService, private router: Router) { }

  ngOnInit() {
    // Verificar se usuário está autenticado
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      // Keep this UI gate aligned with isAdmin() in firestore.rules.
      if (user?.email === 'admin@isaacbarbearia.com') {
        this.usuarioLogado = user;
        this.carregarDados();
      } else {
        this.usuarioLogado = null;
        this.profissionais = [];
        this.parceiros = [];
        this.participacoes = [];
        this.avaliacoes = [];
        // Se não está autenticado, redireciona para login
        this.router.navigate(['/admin/login']);
      }
    });
  }

  async carregarDados() {
    try {
      this.profissionais = await this.firebaseService.getProfissionais();
      this.parceiros = await this.firebaseService.getParceiros();
      this.participacoes = await this.firebaseService.getParticipacoes();
      this.avaliacoes = await this.firebaseService.getAvaliacoes();
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  async adicionarProfissional() {
    try {
      await this.firebaseService.addProfissional(this.novoProfissional);
      this.novoProfissional = { nome: '', especialidade: '', telefone: '' };
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar profissional:', error);
    }
  }

  async deletarProfissional(id: string) {
    try {
      await this.firebaseService.deleteProfissional(id);
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao deletar profissional:', error);
    }
  }

  async adicionarParceiro() {
    try {
      await this.firebaseService.addParceiro(this.novoParceiro);
      this.novoParceiro = { nome: '', descricao: '', desconto: '' };
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar parceiro:', error);
    }
  }

  async deletarParceiro(id: string) {
    try {
      await this.firebaseService.deleteParceiro(id);
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao deletar parceiro:', error);
    }
  }

  async adicionarParticipacao() {
    try {
      await this.firebaseService.addParticipacao(this.novaParticipacao);
      this.novaParticipacao = { titulo: '', descricao: '', data: '' };
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao adicionar participação:', error);
    }
  }

  async deletarParticipacao(id: string) {
    try {
      await this.firebaseService.deleteParticipacao(id);
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao deletar participação:', error);
    }
  }

  async deletarAvaliacao(id: string) {
    try {
      await this.firebaseService.deleteAvaliacao(id);
      this.carregarDados();
    } catch (error) {
      console.error('Erro ao deletar feedback:', error);
    }
  }

  async logout() {
    try {
      await this.firebaseService.logout();
      // Usar window.location para forçar recarga completa
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
