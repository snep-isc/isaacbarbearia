// JavaScript, admin-security.js, browser ES modules, administrative rendering.
export const ADMIN_EMAIL = 'admin@isaacbarbearia.com';

export function isAdmin(user) {
  // UI gate only; Firestore rules remain the authorization boundary.
  return user?.email === ADMIN_EMAIL;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function safeHttpUrl(value) {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
      ? url.href : '';
  } catch {
    return '';
  }
}

export function escapeDisplayData(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [
    key, typeof value === 'number' || typeof value === 'boolean' ? value : escapeHtml(value)
  ]));
}

export function deleteButton(action, id, collection = '') {
  return `<button type="button" class="btn-delete" data-delete-action="${escapeHtml(action)}" data-document-id="${escapeHtml(id)}" data-collection="${escapeHtml(collection)}">Deletar</button>`;
}

export function renderReviews(list, docs, onDelete) {
  const fragment = document.createDocumentFragment();
  const seen = new Set();
  const colors = ['color-blue', 'color-green', 'color-purple', 'color-pink', 'color-yellow'];
  const allowedCollections = new Set(['avaliacoes', 'feedback', 'feedbacks', 'reviews', 'Reviews']);
  let count = 0;

  function element(tag, text, className = '') {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text ?? '');
    node.className = className;
    return node;
  }

  for (const doc of docs ?? []) {
    const collection = doc?.ref?.parent?.id || 'avaliacoes';
    const key = `${collection}:${doc.id}`;
    if (seen.has(key) || !allowedCollections.has(collection)) continue;
    seen.add(key);
    const data = doc.data();
    const name = String(data.cliente ?? data.customer ?? data.nome ?? data.name ?? 'Sem nome');
    const email = String(data.email ?? data.Email ?? data.emailAddress ?? '');
    const comment = data.comentario ?? data.comments ?? data.comment ?? 'Sem comentário';
    const rating = Number(data.estrelas ?? data.Stars ?? data.stars ?? data.rating ?? 0);
    const photo = safeHttpUrl(data.photoURL ?? data.photoUrl ?? data.foto ?? data.fotoUrl ?? data.avatar ?? data.image ?? data.imagem ?? data.profilePhoto);
    let date = String(data.data ?? data.date ?? data.Data ?? '');
    if (date.includes('T') && !Number.isNaN(Date.parse(date))) {
      date = new Date(date).toLocaleDateString('pt-BR');
    }
    const card = element('div', undefined, `card ${colors[count % colors.length]}`);
    const header = element('div', undefined, 'review-header');
    const info = element('div', undefined, 'review-info');
    const parts = (name.trim() || email).split(/\s+/).filter(Boolean);
    const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : (parts[0] || 'U').slice(0, 2);
    const avatar = photo ? element('img', undefined, 'review-avatar') : element('div', initials, 'review-initials');
    if (photo) {
      avatar.src = photo;
      avatar.alt = name;
      avatar.referrerPolicy = 'no-referrer';
    }
    info.append(element('h3', name, 'review-name'));
    if (email) info.append(element('small', email));
    header.append(avatar, info);
    const button = element('button', 'Deletar', 'btn-delete');
    button.type = 'button';
    button.addEventListener('click', () => onDelete(doc.id, collection));
    card.append(header,
      element('p', `Estrelas: ${Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : 0}/5`),
      element('p', comment), element('p', date || 'Sem data'), button);
    fragment.append(card);
    count++;
  }
  if (!count) fragment.append(element('p', 'Nenhuma avaliação ainda'));
  list.replaceChildren(fragment);
  return count;
}
