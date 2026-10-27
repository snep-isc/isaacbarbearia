import { Component, signal, OnInit, NgZone } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

interface AccordionItem {
  id: string;
  title: string;
  isOpen: boolean;
  type: 'text' | 'list' | 'hours' | 'feedback' | 'partners' | 'team' | 'projects';
  icon: 'scissors' | 'star' | 'calendar' | 'clock' | 'map' | 'briefcase' | 'users' | 'image' | 'link';
  featured?: boolean;
  content?: string;
  listItems?: { name: string; price: string; available: boolean | string }[];
  testimonials?: { name: string; comment: string; rating: number; isNew?: boolean; email?: string; id?: string }[];
  partners?: { name: string; role: string; imageUrl: string }[];
  teamMembers?: { name: string; specialty: string; imageUrl: string }[];
  projectGallery?: { title: string; imageUrl: string; projectUrl: string; date: string; location: string; }[];
}

interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: 'info' | 'warning' | 'danger' | 'success';
  data: string;
}

interface Particle {
  left: string;
  animationDuration: string;
  animationDelay: string;
  opacity: number;
  size: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './app.component.html',
  styleUrls: [],
  styles: [`
    @keyframes pulse-soft {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.85;
        transform: scale(1.02);
      }
    }
    
    .animate-pulse-soft {
      animation: pulse-soft 3s ease-in-out infinite;
    }

    .loading-dots::after {
      content: '';
      animation: loading-dots 1.5s infinite;
    }

    @keyframes loading-dots {
      0% { content: ''; }
      25% { content: '.'; }
      50% { content: '..'; }
      75% { content: '...'; }
      100% { content: ''; }
    }
  `]
})
export class AppComponent implements OnInit {
  constructor(private ngZone: NgZone) {}

  private firebaseConfig = {
    apiKey: 'AIzaSyDE2tWDNCDrY6O20EWrDt-NkvZmCm_MR10',
    authDomain: 'isaacbarbearia-admin.firebaseapp.com',
    projectId: 'isaacbarbearia-admin',
    storageBucket: 'isaacbarbearia-admin.firebasestorage.app',
    messagingSenderId: '308982033120',
    appId: '1:308982033120:web:38b82c1a3ca9e933be7e85'
  };
  private app = initializeApp(this.firebaseConfig);
  private db = getFirestore(this.app);
  private auth = getAuth(this.app);
  
  // Auth State
  currentUser = signal<User | null>(null);
  isAuthLoading = signal(false);
  
  // Loading State
  isLoading = signal(true);
  loadingProgress = signal(0);
  private hasLoadingStarted = false; // Guard para só rodar uma vez
  
  // Avisos
  avisos = signal<Aviso[]>([]);
  avisoSelectedType = signal<'info' | 'warning' | 'danger' | 'success' | null>(null);
  
  // Agendamento
  whatsappLink = signal('https://wa.me/5585999999999');
  whatsappNumber = signal('(85) 99999-9999');
  telefoneLink = signal('tel:5585999999999');
  telefoneNumber = signal('(85) 99999-9999');
  agendamentoInfo = signal('O agendamento é feito preferencialmente via WhatsApp ou telefone.');
  agendamentoObservacao = signal('');
  
  // Serviços
  servicosObservacao = signal('');
  
  // Localização
  localizacaoEndereco = signal('Rua das Pedras, 123');
  localizacaoBairro = signal('Centro');
  localizacaoCidade = signal('Fortaleza - CE');
  localizacaoReferencia = signal('Próximo à praça principal');
  googleMapsLink = signal('https://share.google/Q4GvyJhu3aPv7HcgA');
  
  // Horários
  horariosSegSex = signal('08:00 às 18:30');
  horariosSabado = signal('14:30 às 18:30');
  horariosDomingo = signal('Fechado');
  horariosPausa = signal('12:00 às 15:00 de segunda a sexta');
  horariosObservacao = signal('');
  
  locationLink = signal('#');
  
  // Background Particles
  embers = signal<Particle[]>([]); // Rising from bottom
  sparks = signal<Particle[]>([]); // Falling from top

  // Review Form State
  showReviewForm = signal(false);
  newReviewMessage = signal('');
  newReviewRating = signal(5);

  // Accordion Data
  items = signal<AccordionItem[]>([
    {
      id: 'services',
      title: 'Nossos Serviços & Preços',
      isOpen: false,
      featured: true,
      type: 'list',
      icon: 'scissors',
      listItems: []
    },
    {
      id: 'team',
      title: 'Profissionais',
      isOpen: false,
      type: 'team',
      icon: 'users',
      teamMembers: []
    },
    {
      id: 'projects',
      title: 'Participação Comunitária',
      isOpen: false,
      type: 'projects',
      icon: 'image',
      projectGallery: []
    },
    {
      id: 'partnerships',
      title: 'Parcerias',
      isOpen: false,
      type: 'partners',
      icon: 'link',
      partners: []
    },
    {
      id: 'feedback',
      title: 'Feedback',
      isOpen: false,
      type: 'feedback',
      icon: 'star',
      testimonials: []
    },
    {
      id: 'avisos',
      title: 'Avisos',
      isOpen: false,
      type: 'text',
      icon: 'briefcase',
      content: ''
    },
    {
      id: 'booking',
      title: 'Agendamento',
      isOpen: false,
      type: 'text',
      icon: 'calendar',
      content: 'O agendamento é feito preferencialmente via WhatsApp ou telefone. Clique no ícone do WhatsApp acima ou ligue para (11) 99999-9999.'
    },
    {
      id: 'hours',
      title: 'Horários',
      isOpen: false,
      type: 'hours',
      icon: 'clock',
      content: 'Segunda a Sábado: 09:00 às 20:00\nDomingo: Fechado'
    },
    {
      id: 'location',
      title: 'Localização',
      isOpen: false,
      type: 'text',
      icon: 'map',
      content: 'Estamos na Rua das Pedras, 123 - Centro. Próximo à praça principal.'
    }
  ]);

  ngOnInit() {
    if (!this.hasLoadingStarted) {
      this.hasLoadingStarted = true;
      this.startLoading();
    }
    this.generateEmbers();
    this.generateSparks();
    
    // Monitor auth state
    onAuthStateChanged(this.auth, (user) => {
      this.ngZone.run(() => {
        this.currentUser.set(user);
      });
    });
  }

  async startLoading() {
    // Versão SUPER SIMPLES: só espera 12 segundos e esconde
    this.isLoading.set(true);
    this.loadingProgress.set(0);
    
    // Animar progresso
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.83; // ~0.83% a cada 100ms = 100% em 12 segundos
      if (progress <= 100) {
        this.loadingProgress.set(progress);
      }
    }, 100);
    
    // Carregar dados em background
    this.loadDynamicData();
    
    // Esperar 12 segundos GARANTIDOS
    setTimeout(() => {
      clearInterval(interval);
      this.loadingProgress.set(100);
      
      // Esconder depois de mais 500ms
      setTimeout(() => {
        this.isLoading.set(false);
      }, 500);
    }, 12000);
  }

  async loadDynamicData() {
    try {
      const [profissionaisSnap, parceirosSnap, participacoesSnap, avaliacoesSnap, servicosSnap, agendamentoSnap, localizacaoSnap, horariosSnap, avisosSnap, servicosConfigSnap] = await Promise.all([
        getDocs(collection(this.db, 'profissionais')),
        getDocs(collection(this.db, 'parceiros')),
        getDocs(collection(this.db, 'participacoes')),
        getDocs(collection(this.db, 'avaliacoes')),
        getDocs(collection(this.db, 'servicos')),
        getDoc(doc(this.db, 'config', 'agendamento')),
        getDoc(doc(this.db, 'config', 'localizacao')),
        getDoc(doc(this.db, 'config', 'horarios')),
        getDocs(collection(this.db, 'avisos')),
        getDoc(doc(this.db, 'config', 'servicos'))
      ]);

      const teamMembers = profissionaisSnap.docs.map(doc => {
        const data = doc.data() as { nome?: string; especialidade?: string; imagem?: string };
        return {
          name: data.nome || 'Profissional',
          specialty: data.especialidade || 'Especialidade',
          imageUrl: data.imagem || `https://picsum.photos/seed/${encodeURIComponent(data.nome || doc.id)}/200/200`
        };
      });

      const listItems = servicosSnap.docs.map(doc => {
        const data = doc.data() as { nome?: string; realiza?: boolean | string; preco?: number };
        const price = data.realiza === true && data.preco && data.preco > 0 ? `R$ ${data.preco}` : '-';
        return {
          name: data.nome || 'Serviço',
          price,
          available: data.realiza // pode ser true, false ou 'soon'
        };
      });

      const partners = parceirosSnap.docs.map(doc => {
        const data = doc.data() as { nome?: string; imagem?: string };
        return {
          name: data.nome || 'Parceiro',
          role: '',
          imageUrl: data.imagem || `https://picsum.photos/seed/${encodeURIComponent(data.nome || doc.id)}/200/200`
        };
      });

      const projectGallery = participacoesSnap.docs.map(doc => {
        const data = doc.data() as { titulo?: string; descricao?: string; data?: string };
        return {
          title: data.titulo || 'Evento',
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.titulo || doc.id)}/300/300`,
          projectUrl: '#',
          date: data.data || 'Data a definir',
          location: data.descricao || 'Comunidade'
        };
      });

      const testimonials = avaliacoesSnap.docs.map(doc => {
        const data = doc.data() as {
          cliente?: string;
          comentario?: string;
          estrelas?: number;
          email?: string;
          photoURL?: string;
          photoUrl?: string;
          foto?: string;
          avatar?: string;
          image?: string;
        };
        return {
          id: doc.id,
          name: data.cliente || 'Cliente',
          comment: data.comentario || 'Ótimo atendimento!',
          rating: data.estrelas || 5,
          email: data.email || '',
          photoUrl: data.photoURL || data.photoUrl || data.foto || data.avatar || data.image || ''
        };
      });

      // Carregar dados de agendamento
      if (agendamentoSnap.exists()) {
        const agendamentoData = agendamentoSnap.data() as { whatsapp?: string; telefone?: string; info?: string; observacao?: string };
        
        if (agendamentoData.whatsapp) {
          const numeroWhats = agendamentoData.whatsapp.replace(/\D/g, '');
          this.whatsappLink.set(`https://wa.me/${numeroWhats}`);
          this.whatsappNumber.set(agendamentoData.whatsapp);
        }
        
        if (agendamentoData.telefone) {
          const numeroTel = agendamentoData.telefone.replace(/\D/g, '');
          this.telefoneLink.set(`tel:${numeroTel}`);
          this.telefoneNumber.set(agendamentoData.telefone);
        }
        
        if (agendamentoData.info) {
          this.agendamentoInfo.set(agendamentoData.info);
        }
        
        if (agendamentoData.observacao) {
          this.agendamentoObservacao.set(agendamentoData.observacao);
        }
      }

      // Carregar dados de serviços (observação)
      if (servicosConfigSnap.exists()) {
        const servicosData = servicosConfigSnap.data() as { observacao?: string };
        if (servicosData.observacao) {
          this.servicosObservacao.set(servicosData.observacao);
        }
      }

      // Carregar dados de localização
      if (localizacaoSnap.exists()) {
        const locData = localizacaoSnap.data() as { endereco?: string; bairro?: string; cidade?: string; referencia?: string; googleMapsLink?: string };
        
        if (locData.endereco) this.localizacaoEndereco.set(locData.endereco);
        if (locData.bairro) this.localizacaoBairro.set(locData.bairro);
        if (locData.cidade) this.localizacaoCidade.set(locData.cidade);
        if (locData.referencia) this.localizacaoReferencia.set(locData.referencia);
        
        // Link do Google Maps do Firestore
        if (locData.googleMapsLink) {
          this.googleMapsLink.set(locData.googleMapsLink);
        }
      }

      // Carregar dados de horários
      if (horariosSnap.exists()) {
        const horData = horariosSnap.data() as { segSex?: string; sabado?: string; domingo?: string; pausa?: string; observacao?: string };
        
        if (horData.segSex) this.horariosSegSex.set(horData.segSex);
        if (horData.sabado) this.horariosSabado.set(horData.sabado);
        if (horData.domingo) this.horariosDomingo.set(horData.domingo);
        if (horData.pausa) this.horariosPausa.set(horData.pausa);
        if (horData.observacao) this.horariosObservacao.set(horData.observacao);
      }

      if (teamMembers.length || partners.length || projectGallery.length || testimonials.length || listItems.length) {
        this.items.update(items => items.map(item => {
          if (item.id === 'services' && listItems.length) {
            return { ...item, listItems };
          }
          if (item.id === 'team' && teamMembers.length) {
            return { ...item, teamMembers };
          }
          if (item.id === 'partnerships' && partners.length) {
            return { ...item, partners };
          }
          if (item.id === 'projects' && projectGallery.length) {
            return { ...item, projectGallery };
          }
          if (item.id === 'feedback' && testimonials.length) {
            return { ...item, testimonials };
          }
          return item;
        }));
      } else {
        // Se não houver dados do Firebase, limpar os padrões
        this.items.update(items => items.map(item => {
          if (item.id === 'services') return { ...item, listItems: [] };
          if (item.id === 'team') return { ...item, teamMembers: [] };
          if (item.id === 'partnerships') return { ...item, partners: [] };
          if (item.id === 'projects') return { ...item, projectGallery: [] };
          if (item.id === 'feedback') return { ...item, testimonials: [] };
          return item;
        }));
      }

      // Carregar avisos
      const avisos = avisosSnap.docs.map(doc => {
        const data = doc.data() as { titulo?: string; conteudo?: string; tipo?: 'info' | 'warning' | 'danger' | 'success'; data?: string };
        return {
          id: doc.id,
          titulo: data.titulo || 'Aviso',
          conteudo: data.conteudo || '',
          tipo: data.tipo || 'info',
          data: data.data || new Date().toISOString()
        };
      });
      
      // Ordenar por data mais recente
      avisos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      this.avisos.set(avisos);
    } catch (error) {
      console.error('Erro ao carregar dados do Firebase:', error);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  getAvisosByType(type: 'info' | 'warning' | 'danger' | 'success' | null): Aviso[] {
    if (!type) return [];
    return this.avisos().filter(a => a.tipo === type);
  }

  countAvisosByType(type: 'info' | 'warning' | 'danger' | 'success'): number {
    return this.getAvisosByType(type).length;
  }

  generateEmbers() {
    const emberArray: Particle[] = [];
    const count = 25; 
    
    for (let i = 0; i < count; i++) {
      emberArray.push({
        left: Math.random() * 100 + '%',
        animationDuration: (Math.random() * 5 + 5) + 's',
        animationDelay: (Math.random() * 5) + 's',
        opacity: Math.random() * 0.5 + 0.2,
        size: (Math.random() * 3 + 2) + 'px'
      });
    }
    this.embers.set(emberArray);
  }

  generateSparks() {
    const sparkArray: Particle[] = [];
    const count = 20; // Falling sparks

    for (let i = 0; i < count; i++) {
      sparkArray.push({
        left: Math.random() * 100 + '%',
        animationDuration: (Math.random() * 3 + 3) + 's', // Faster than embers
        animationDelay: (Math.random() * 5) + 's',
        opacity: Math.random() * 0.7 + 0.3,
        size: (Math.random() * 2 + 1) + 'px' // Smaller, sharper
      });
    }
    this.sparks.set(sparkArray);
  }

  toggleItem(id: string) {
    this.items.update(items => 
      items.map(item => ({
        ...item,
        isOpen: item.id === id ? !item.isOpen : false 
      }))
    );
    
    // Se abrir a aba de avisos, resetar a sub-aba selecionada
    if (id === 'avisos') {
      this.avisoSelectedType.set(null);
    }
  }

  toggleAvisoType(type: 'info' | 'warning' | 'danger' | 'success') {
    // Se já está selecionado, fechar (null). Senão, abrir (type)
    if (this.avisoSelectedType() === type) {
      this.avisoSelectedType.set(null);
    } else {
      this.avisoSelectedType.set(type);
    }
  }

  toggleReviewForm() {
    this.showReviewForm.update(v => !v);
  }

  getInitials(name: string): string {
    const base = (name || '').trim();
    if (!base) return 'U';
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  setReviewRating(stars: number) {
    this.newReviewRating.set(stars);
  }

  async submitReview() {
    // Verificar se está logado
    if (!this.currentUser()) {
      alert('Por favor, faça login com o Google para deixar seu feedback!');
      return;
    }

    const user = this.currentUser();

    // O documento é identificado pelo UID autenticado.
    if (!user?.uid) {
      alert('Erro: não foi possível obter seus dados. Faça login novamente.');
      return;
    }

    const name = user.displayName || 'Usuário';
    const photoUrl = user.photoURL || '';
    const message = this.newReviewMessage().trim();
    const rating = this.newReviewRating();

    if (!message) {
      alert('Por favor, escreva seu comentário!');
      return;
    }

    try {
      // Um documento por UID: a regra do Firestore recusa duplicatas.
      const existente = await getDoc(doc(this.db, 'avaliacoes', user.uid));
      const jaAvaliou = existente.exists();

      if (jaAvaliou) {
        alert('Você já deixou um feedback! Obrigado pela sua opinião.');
        this.showReviewForm.set(false);
        return;
      }

      console.log('Salvando feedback:', { name, message, rating });
      
      // Salvar no Firestore, sem expor e-mail no documento público
      await setDoc(doc(this.db, 'avaliacoes', user.uid), {
        cliente: name,
        comentario: message,
        estrelas: rating,
        data: new Date().toLocaleDateString('pt-BR'),
        photoURL: photoUrl
      });

      console.log('Feedback salvo para o UID autenticado');

      // Atualizar estado local
      this.items.update(items => {
        return items.map(item => {
          if (item.id === 'feedback' && item.testimonials) {
            return {
              ...item,
              testimonials: [
                {
                  id: user.uid,
                  name: name,
                  email: '',
                  comment: message,
                  rating: rating,
                  photoUrl: photoUrl,
                  isNew: true
                },
                ...item.testimonials
              ]
            };
          }
          return item;
        });
      });

      // Reset Form
      this.newReviewMessage.set('');
      this.newReviewRating.set(5);
      this.showReviewForm.set(false);
      
      alert('Feedback enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar feedback:', error);
      alert('Erro ao salvar feedback. Verifique o console.');
    }
  }

  async signInWithGoogle() {
    this.isAuthLoading.set(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      alert('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login. Tente novamente.');
    } finally {
      this.isAuthLoading.set(false);
    }
  }

  // Alias para template
  signInGoogle = this.signInWithGoogle.bind(this);

  async signOutUser() {
    try {
      await signOut(this.auth);
      this.showReviewForm.set(false); // Fechar formulário ao sair
      alert('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  async deleteReview(review: any) {
    if (!confirm('Tem certeza que deseja apagar seu feedback?')) {
      return;
    }

    try {
      // Deletar do Firebase
      await deleteDoc(doc(this.db, 'avaliacoes', review.id));
      
      // Atualizar estado local
      this.items.update(items => {
        return items.map(item => {
          if (item.id === 'feedback' && item.testimonials) {
            return {
              ...item,
              testimonials: item.testimonials.filter(t => t.id !== review.id)
            };
          }
          return item;
        });
      });
      
      alert('Feedback apagado com sucesso!');
    } catch (error) {
      console.error('Erro ao apagar feedback:', error);
      alert('Erro ao apagar feedback. Tente novamente.');
    }
  }

  getFeedbackCount() {
    const feedbackItem = this.items().find(item => item.id === 'feedback');
    return feedbackItem?.testimonials?.length || 0;
  }

  getNewestFeedbackName() {
    const feedbackItem = this.items().find(item => item.id === 'feedback');
    const newest = feedbackItem?.testimonials?.find((t: any) => t.isNew);
    return newest?.name || '';
  }

  editReview(review: any) {
    // Preencher o formulário com os dados atuais
    this.newReviewMessage.set(review.comment);
    this.newReviewRating.set(review.rating);
    this.showReviewForm.set(true);
    
    // Deletar o feedback antigo
    this.deleteReview(review);
  }

  getUserFeedback() {
    // A avaliação própria é o documento com o UID do usuário como ID.
    const uid = this.currentUser()?.uid;
    if (!uid) return null;

    const feedbackItem = this.items().find(item => item.id === 'feedback');
    if (!feedbackItem?.testimonials) return null;

    return feedbackItem.testimonials.find(t => t.id === uid) || null;
  }

  // Métodos para filtrar serviços por categoria
  getServicesBy(services: any[], status: boolean | string): any[] {
    return services.filter(s => s.available === status);
  }

  hasServicesBy(services: any[], status: boolean | string): boolean {
    return services.some(s => s.available === status);
  }

  currentYear = 2024;
}